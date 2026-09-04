import * as vscode from 'vscode';
import { decode, DecodedChar } from './petsciiDecoder';
import {
    C64Color, PaletteName, PALETTES, PALETTE_NAMES, PALETTE_LABELS,
    DEFAULT_BG_INDEX, DEFAULT_PALETTE,
} from './colorPalette';
import { getNonce } from './utils';
import { viewKeyLabels, paletteKeyLabels } from './viewKeys';

/**
 * The `when` clause on the View menu's keybindings. True only while a SEQ view is the active
 * tab, so Alt+Shift+M is taken here and nowhere else in VS Code.
 */
const FOCUS_CONTEXT = 'cbasePetsciiFocused';

/** The focused SEQ view's panel, for a shortcut to post into. */
let activePanel: vscode.WebviewPanel | undefined;

function setFocus(panel: vscode.WebviewPanel | undefined): void {
    activePanel = panel;
    vscode.commands.executeCommand('setContext', FOCUS_CONTEXT, panel !== undefined);
}

/** The focused view's webview, or undefined when none has focus. See viewKeys.ts. */
export function focusedViewerWebview(): vscode.Webview | undefined {
    return activePanel?.webview;
}

interface ViewerState {
    lowercase: boolean;
    bgIndex: number;
    paletteName: PaletteName;
    showMci: boolean;
    showCls: boolean;
}

interface CharCell {
    cp: number;   // PUA or 0x0020 codePoint from DecodedChar
    r: boolean;   // reverse video
    f: number;    // palette fg index
}

export class SeqEditorProvider implements vscode.CustomReadonlyEditorProvider {
    public static readonly viewType = 'cbase.seqViewer';

    constructor(private readonly context: vscode.ExtensionContext) {}

    openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken
    ): vscode.CustomDocument {
        return { uri, dispose: () => {} };
    }

    async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = { enableScripts: true };

        // Which view the View-menu shortcuts act on, and whether they are bound at all.
        if (webviewPanel.active) { setFocus(webviewPanel); }
        webviewPanel.onDidChangeViewState(e => {
            if (e.webviewPanel.active) { setFocus(webviewPanel); }
            else if (activePanel === webviewPanel) { setFocus(undefined); }
        });
        webviewPanel.onDidDispose(() => {
            if (activePanel === webviewPanel) { setFocus(undefined); }
        });

        const stateKey = 'cbase-petscii-viewer.seqViewer';
        const state: ViewerState = this.context.globalState.get<ViewerState>(stateKey)
            ?? { lowercase: true, bgIndex: DEFAULT_BG_INDEX, paletteName: DEFAULT_PALETTE, showMci: true, showCls: false };

        if (!(state.paletteName in PALETTES)) {
            state.paletteName = DEFAULT_PALETTE;
        }
        if (state.bgIndex < 0 || state.bgIndex > 15) {
            state.bgIndex = DEFAULT_BG_INDEX;
        }
        if (state.showMci === undefined) { state.showMci = true; }
        if (state.showCls === undefined) { state.showCls = false; }

        const data = await vscode.workspace.fs.readFile(document.uri);

        // Charset always starts from the file's own indicator ($0E/$8E in first 10 bytes).
        // If no indicator is found, default to lowercase. Persisted state is not used for
        // initial charset — the file (or absence of an indicator) determines it.
        state.lowercase = detectCharset(data) ?? true;

        let palette = PALETTES[state.paletteName];
        let viewCols = 40; // not persisted — resets to 40 on each file open

        // Decode once up front; re-decode only when charset or column count changes.
        let decoded = decodeContent(data, state.lowercase, viewCols);

        webviewPanel.webview.html = this.buildWebviewHtml(
            webviewPanel.webview, decoded, state, palette, viewCols
        );

        const subscription = webviewPanel.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.type) {
                case 'toggleCharset':
                    state.lowercase = !state.lowercase;
                    decoded = decodeContent(data, state.lowercase, viewCols); // charset affects PUA codepoints
                    await this.context.globalState.update(stateKey, { ...state });
                    webviewPanel.webview.postMessage({
                        type: 'render',
                        chars: buildChars(decoded, state.showMci).chars,
                        cols: viewCols,
                        lowercase: state.lowercase,
                        showMci: state.showMci,
                        showCls: state.showCls,
                    });
                    break;

                case 'toggleMci':
                    state.showMci = !state.showMci;
                    await this.context.globalState.update(stateKey, { ...state });
                    webviewPanel.webview.postMessage({
                        type: 'render',
                        chars: buildChars(decoded, state.showMci).chars, // reuse cached rows, no re-decode
                        cols: viewCols,
                        lowercase: state.lowercase,
                        showMci: state.showMci,
                        showCls: state.showCls,
                    });
                    break;

                case 'toggleCls':
                    state.showCls = !state.showCls;
                    await this.context.globalState.update(stateKey, { ...state });
                    webviewPanel.webview.postMessage({ type: 'clsToggle', showCls: state.showCls });
                    break;

                case 'setBgColor':
                    state.bgIndex = msg.index as number;
                    await this.context.globalState.update(stateKey, { ...state });
                    break;

                case 'setPalette':
                    state.paletteName = msg.name as PaletteName;
                    await this.context.globalState.update(stateKey, { ...state });
                    palette = PALETTES[state.paletteName];
                    webviewPanel.webview.postMessage({
                        type: 'paletteChange',
                        palette: palette.map(c => c.hex),
                        bgHex: palette[state.bgIndex].hex,
                        // Which palette, not just its hexes: the picker used to be a <select>
                        // that held its own selection, and the menu's check mark has to be told.
                        paletteName: state.paletteName,
                    });
                    break;

                case 'setCols':
                    viewCols = Math.max(20, Math.min(200, msg.cols as number));
                    decoded = decodeContent(data, state.lowercase, viewCols); // cols affects row wrapping
                    webviewPanel.webview.postMessage({
                        type: 'render',
                        chars: buildChars(decoded, state.showMci).chars,
                        cols: viewCols,
                        lowercase: state.lowercase,
                        showMci: state.showMci,
                        showCls: state.showCls,
                    });
                    break;
            }
        });

        webviewPanel.onDidDispose(() => subscription.dispose());
    }

    private buildWebviewHtml(
        webview: vscode.Webview,
        decoded: { rows: DecodedChar[][]; clsBeforeRows: number[] },
        state: ViewerState,
        palette: C64Color[],
        cols: number
    ): string {
        const nonce = getNonce();
        const charRomUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'charRom.js')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'viewer.js')
        );
        // VS Code's own icon font, so the menus' check marks and chevrons are the same glyphs
        // at the same size as Disk Commander's. @vscode/codicons 0.0.46-24.
        const codiconUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'codicon.ttf')
        );
        const bgHex = palette[state.bgIndex].hex;
        const { chars, clsBeforeRows, rowCount } = buildChars(decoded, state.showMci);

        const paletteItems = PALETTE_NAMES.map(n => ({ name: n, label: PALETTE_LABELS[n as PaletteName] }));

        const config = JSON.stringify({
            palette: palette.map(c => c.hex),
            bgIndex: state.bgIndex,
            lowercase: state.lowercase,
            paletteName: state.paletteName,
            showMci: state.showMci,
            showCls: state.showCls,
            cols,
            chars,
            clsBeforeRows,
            // The menus draw these; viewKeys.ts decides them, so the page keeps no second copy
            // that could disagree with what package.json binds.
            viewKeys: viewKeyLabels(),
            palettes: paletteItems,
            paletteKeys: paletteKeyLabels(),
        });

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
<style>
@font-face {
  font-family: "codicon";
  src: url("${codiconUri}") format("truetype");
}
.codicon {
  font: normal normal normal 16px/1 "codicon";
  display: inline-block;
  text-rendering: auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  user-select: none;
}
.codicon-chevron-down::before { content: "\\eab4"; }
.codicon-check::before { content: "\\eab2"; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body { display: flex; flex-direction: column; background: #1a1a1a; }
#toolbar {
  flex-shrink: 0;
  background: #1a1a1a;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #333;
}
#charset-btn, #view-btn, #palette-btn {
  font-family: monospace;
  font-size: 12px;
  background: #333;
  color: #ccc;
  border: 1px solid #555;
  cursor: pointer;
  border-radius: 3px;
}
#charset-btn, #view-btn, #palette-btn { padding: 2px 8px; }
#charset-btn:hover, #view-btn:hover, #palette-btn:hover { background: #444; }
/* Both dropdown buttons, or the one left out renders its chevron at the base .codicon 16px,
   off the vertical centre and with no gap — which makes its box taller than the other's. */
#view-btn .codicon, #palette-btn .codicon { font-size: 13px; vertical-align: middle; margin-left: 2px; }

/* The View and palette dropdowns. Deliberately Disk Commander's, rule for rule: the same
   toggles above the same file should not look like two different controls in the two
   extensions. Both menus are styled by every rule here — they sit side by side in one toolbar,
   so a difference between them reads as a mistake. */
#view-menu, #palette-menu {
  position: absolute;
  z-index: 10;
  min-width: 160px;
  padding: 4px 0;
  background: var(--vscode-menu-background, #252526);
  color: var(--vscode-menu-foreground, #ccc);
  border: 1px solid var(--vscode-menu-border, #454545);
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  font-family: var(--vscode-font-family, sans-serif);
  font-size: 13px;
}
#view-menu[hidden], #palette-menu[hidden] { display: none; }
#view-menu .item, #palette-menu .item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px 3px 8px;
  cursor: pointer;
  white-space: nowrap;
}
#view-menu .item:hover, #palette-menu .item:hover {
  background: var(--vscode-menu-selectionBackground, #04395e);
  color: var(--vscode-menu-selectionForeground, #fff);
}
#view-menu .item .codicon, #palette-menu .item .codicon { font-size: 14px; width: 16px; flex-shrink: 0; }
#view-menu .item.off .codicon, #palette-menu .item.off .codicon { visibility: hidden; }
/* The shortcut sits hard right, pushed there by margin-left:auto so the labels stay
   left-aligned however wide the widest one is. Dimmed, as VS Code's own menus do. */
#view-menu .item .shortcut, #palette-menu .item .shortcut {
  margin-left: auto;
  padding-left: 20px;
  opacity: 0.7;
}
#view-menu .item:hover .shortcut, #palette-menu .item:hover .shortcut { opacity: 0.9; }
#swatches { display: flex; gap: 3px; }
.swatch {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
}
.swatch.active { border-color: #fff; }
#dimensions-group {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
#reset-cols-btn {
  font-size: 14px;
  background: none;
  color: #666;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  display: none;
}
#reset-cols-btn:hover { color: #ccc; }
#reset-bg-btn {
  font-size: 14px;
  background: none;
  color: #666;
  border: none;
  cursor: pointer;
  padding: 0 0 0 2px;
  line-height: 1;
}
#reset-bg-btn:hover { color: #ccc; }
#content-wrap {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  background-color: var(--vscode-editor-background, #1a1a1a);
}
#canvas-container {
  position: relative;
  display: inline-block;
  margin: 1em;
}
#content {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
#resize-handle {
  position: absolute;
  top: 0;
  right: -6px;
  bottom: 0;
  width: 12px;
  cursor: col-resize;
  z-index: 10;
}
#resize-handle::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255,255,255,0.12);
  transition: background 0.1s;
}
#resize-handle:hover::after, #resize-handle.dragging::after {
  background: rgba(255,255,255,0.5);
}
#dimensions {
  font-family: monospace;
  font-size: 12px;
  color: #666;
}
#dim-cols {
  cursor: pointer;
  text-decoration: underline dotted;
}
#dim-cols:hover { color: #ccc; }
</style>
</head>
<body>
<div id="toolbar">
  <button id="charset-btn">${state.lowercase ? 'Lowercase' : 'Uppercase'}</button>
  <button id="view-btn" title="Show or hide MCI commands and CLS breaks">View <span class="codicon codicon-chevron-down"></span></button>
  <button id="palette-btn" title="C64 colour palette">Palette <span class="codicon codicon-chevron-down"></span></button>
  <div id="swatches"></div>
  <button id="reset-bg-btn" title="Reset background to black">&#x21BA;</button>
  <div id="dimensions-group">
    <button id="reset-cols-btn" title="Reset to 40 columns">&#x21BA;</button>
    <span id="dimensions">${cols}\xD7${rowCount}</span>
  </div>
</div>
<div id="view-menu" hidden></div>
<div id="palette-menu" hidden></div>
<div id="content-wrap">
  <div id="canvas-container">
    <canvas id="content"></canvas>
    <div id="resize-handle"></div>
  </div>
</div>
<script nonce="${nonce}">window.__SEQ_CONFIG = ${config};</script>
<script nonce="${nonce}" src="${charRomUri}"></script>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

// Returns true for PETSCII bytes that can form a £-command identifier (letters and digits).
// Range excludes 0x5C (£ itself) so a £ never continues into another £ command.
function isMciIdentChar(b: number): boolean {
    return (b >= 0x30 && b <= 0x39) || // 0–9
           (b >= 0x41 && b <= 0x5B) || // A–Z (0x5C is £, excluded)
           (b >= 0x61 && b <= 0x7A);   // a–z
}

// Strip inline MCI commands from a single row of decoded chars.
//
// Two forms:
//   £<ident>   — PETSCII 0x5C followed by alphanumeric identifier chars
//   @:<body>:  — PETSCII 0x40 0x3A followed by arbitrary chars up to and including the closing 0x3A
//
// The low byte of every PUA code point equals the original PETSCII byte,
// so (ch.codePoint & 0xFF) gives the raw byte regardless of charset mode.
function stripMciFromRow(row: DecodedChar[]): DecodedChar[] {
    const result: DecodedChar[] = [];
    let i = 0;
    while (i < row.length) {
        const b = row[i].codePoint & 0xFF;
        if (b === 0x5C) {
            // £ command — skip £ and its identifier
            i++;
            while (i < row.length && isMciIdentChar(row[i].codePoint & 0xFF)) {
                i++;
            }
        } else if (b === 0x40 && i + 1 < row.length && (row[i + 1].codePoint & 0xFF) === 0x3A) {
            // @: command — skip @, :, body, and the closing :
            i += 2;
            while (i < row.length) {
                const nb = row[i].codePoint & 0xFF;
                i++;
                if (nb === 0x3A) break; // consumed closing colon
            }
        } else {
            result.push(row[i]);
            i++;
        }
    }
    return result;
}

// Decode raw bytes into rows. Call this when charset or column count changes.
function decodeContent(data: Uint8Array, lowercase: boolean, cols: number): { rows: DecodedChar[][]; clsBeforeRows: number[] } {
    return decode(data, lowercase, cols);
}

// Scan the first 10 bytes for a charset switch code.
// $0E → lowercase; $8E → uppercase. First match wins. Returns null if neither found.
function detectCharset(data: Uint8Array): boolean | null {
    const limit = Math.min(10, data.length);
    for (let i = 0; i < limit; i++) {
        if (data[i] === 0x0E) { return true; }
        if (data[i] === 0x8E) { return false; }
    }
    return null;
}

// Build char cells from already-decoded rows. Avoids re-decoding when only MCI visibility changes.
function buildChars(
    decoded: { rows: DecodedChar[][]; clsBeforeRows: number[] },
    showMci: boolean
): { chars: CharCell[][]; clsBeforeRows: number[]; rowCount: number } {
    const rows = showMci ? decoded.rows : decoded.rows.map(stripMciFromRow);
    const chars: CharCell[][] = rows.map(row =>
        row.map(ch => ({ cp: ch.codePoint, r: ch.reverse, f: ch.fgIndex }))
    );
    return { chars, clsBeforeRows: decoded.clsBeforeRows, rowCount: decoded.rows.length };
}
