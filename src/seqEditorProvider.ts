import * as vscode from 'vscode';
import { decode, DecodedChar } from './petsciiDecoder';
import {
    C64Color, PaletteName, PALETTES, PALETTE_NAMES, PALETTE_LABELS,
    DEFAULT_BG_INDEX, DEFAULT_PALETTE,
} from './colorPalette';
import { getNonce } from './utils';

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

        const stateKey = 'seqViewer:settings';
        const state: ViewerState = this.context.workspaceState.get<ViewerState>(stateKey)
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
                    await this.context.workspaceState.update(stateKey, { ...state });
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
                    await this.context.workspaceState.update(stateKey, { ...state });
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
                    await this.context.workspaceState.update(stateKey, { ...state });
                    webviewPanel.webview.postMessage({ type: 'clsToggle', showCls: state.showCls });
                    break;

                case 'setBgColor':
                    state.bgIndex = msg.index as number;
                    await this.context.workspaceState.update(stateKey, { ...state });
                    break;

                case 'setPalette':
                    state.paletteName = msg.name as PaletteName;
                    await this.context.workspaceState.update(stateKey, { ...state });
                    palette = PALETTES[state.paletteName];
                    webviewPanel.webview.postMessage({
                        type: 'paletteChange',
                        palette: palette.map(c => c.hex),
                        bgHex: palette[state.bgIndex].hex,
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
        const bgHex = palette[state.bgIndex].hex;
        const { chars, clsBeforeRows, rowCount } = buildChars(decoded, state.showMci);

        const paletteOptions = PALETTE_NAMES
            .map(n => `<option value="${n}"${n === state.paletteName ? ' selected' : ''}>${PALETTE_LABELS[n as PaletteName]}</option>`)
            .join('');

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
        });

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
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
#charset-btn, #mci-btn, #cls-btn, #palette-select {
  font-family: monospace;
  font-size: 12px;
  background: #333;
  color: #ccc;
  border: 1px solid #555;
  cursor: pointer;
  border-radius: 3px;
}
#charset-btn, #mci-btn, #cls-btn { padding: 2px 8px; }
#palette-select { padding: 2px 4px; }
#charset-btn:hover, #mci-btn:hover, #cls-btn:hover, #palette-select:hover { background: #444; }
#mci-btn.mci-hidden { color: #888; border-color: #444; }
#cls-btn.cls-hidden { color: #888; border-color: #444; }
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
  <button id="charset-btn">${state.lowercase ? 'Lowercase charset' : 'Uppercase charset'}</button>
  <button id="mci-btn"${state.showMci ? '' : ' class="mci-hidden"'}>MCI Commands</button>
  <button id="cls-btn"${state.showCls ? '' : ' class="cls-hidden"'}>Show CLS ($93)</button>
  <select id="palette-select">${paletteOptions}</select>
  <div id="swatches"></div>
  <div id="dimensions-group">
    <button id="reset-cols-btn" title="Reset to 40 columns">&#x21BA;</button>
    <span id="dimensions">${cols}\xD7${rowCount}</span>
  </div>
</div>
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
