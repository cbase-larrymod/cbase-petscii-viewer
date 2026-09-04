import * as vscode from 'vscode';
import { decode, PetmatePage } from './petmateDecoder';
import {
    C64Color, PaletteName, PALETTES, PALETTE_NAMES, PALETTE_LABELS, DEFAULT_PALETTE,
} from './colorPalette';
import { getNonce } from './utils';
import { viewKeyLabels, paletteKeyLabels, viewAppliesMap } from './viewKeys';
import { trackViewFocus } from './viewFocus';

interface ViewerState {
    paletteName: PaletteName;
    showMci: boolean;
}

export class PetmateEditorProvider implements vscode.CustomReadonlyEditorProvider {
    public static readonly viewType = 'cbase.petmateViewer';

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
        trackViewFocus(webviewPanel);

        const stateKey = 'cbase-petscii-viewer.petmateViewer';
        const state: ViewerState = this.context.globalState.get<ViewerState>(stateKey)
            ?? { paletteName: DEFAULT_PALETTE, showMci: true };

        if (!(state.paletteName in PALETTES)) {
            state.paletteName = DEFAULT_PALETTE;
        }
        if (state.showMci === undefined) { state.showMci = true; }

        const data = await vscode.workspace.fs.readFile(document.uri);
        const text = new TextDecoder('utf-8').decode(data);

        let pages: PetmatePage[];
        try {
            pages = decode(text);
        } catch (err) {
            webviewPanel.webview.html = this.buildErrorHtml(err instanceof Error ? err.message : String(err));
            return;
        }

        let palette = PALETTES[state.paletteName];

        webviewPanel.webview.html = this.buildWebviewHtml(webviewPanel.webview, pages, state, palette);

        const subscription = webviewPanel.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.type) {
                case 'setPalette':
                    state.paletteName = msg.name as PaletteName;
                    await this.context.globalState.update(stateKey, { ...state });
                    palette = PALETTES[state.paletteName];
                    webviewPanel.webview.postMessage({
                        type: 'paletteChange',
                        palette: palette.map(c => c.hex),
                        // Which palette, not just its hexes: the picker used to be a <select>
                        // that held its own selection, and the menu's check mark must be told.
                        paletteName: state.paletteName,
                    });
                    break;

                case 'toggleMci':
                    state.showMci = !state.showMci;
                    await this.context.globalState.update(stateKey, { ...state });
                    // Same as toggleCharset: the webview handles this locally; we only persist.
                    break;
            }
        });

        webviewPanel.onDidDispose(() => subscription.dispose());
    }

    private buildErrorHtml(message: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<style>
body { background: #1a1a1a; color: #f55; font-family: monospace; padding: 2em; }</style>
</head>
<body>Failed to parse .petmate file: ${escapeHtml(message)}</body>
</html>`;
    }

    private buildWebviewHtml(
        webview: vscode.Webview,
        pages: PetmatePage[],
        state: ViewerState,
        palette: C64Color[]
    ): string {
        const nonce = getNonce();
        const charRomUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'charRom.js')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'petmateViewer.js')
        );
        // VS Code's own icon font, so the menus' check marks and chevrons are the same glyphs
        // as the .seq editor's and Disk Commander's. @vscode/codicons 0.0.46-24.
        const codiconUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'codicon.ttf')
        );

        const paletteItems = PALETTE_NAMES.map(n => ({ name: n, label: PALETTE_LABELS[n as PaletteName] }));

        const config = JSON.stringify({
            palette: palette.map(c => c.hex),
            paletteName: state.paletteName,
            showMci: state.showMci,
            pages,
            // The menus draw these; viewKeys.ts decides them, so the page keeps no second copy
            // that could disagree with what package.json binds. `viewApplies` marks CLS inert:
            // a .petmate file has no $93 boundaries to mark.
            viewKeys: viewKeyLabels(),
            viewApplies: viewAppliesMap('petmate'),
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
#prev-btn, #next-btn, #charset-btn, #view-btn, #palette-btn {
  font-family: monospace;
  font-size: 12px;
  background: #333;
  color: #ccc;
  border: 1px solid #555;
  cursor: pointer;
  border-radius: 3px;
}
#prev-btn, #next-btn, #charset-btn, #view-btn, #palette-btn { padding: 2px 8px; }
#prev-btn:hover, #next-btn:hover, #charset-btn:hover, #view-btn:hover, #palette-btn:hover { background: #444; }
#prev-btn:disabled, #next-btn:disabled { color: #555; border-color: #444; cursor: default; }
#prev-btn:disabled:hover, #next-btn:disabled:hover { background: #333; }
/* Both dropdown buttons, or the one left out renders its chevron at the base .codicon 16px,
   off the vertical centre and with no gap — which makes its box taller than the other's. */
#view-btn .codicon, #palette-btn .codicon { font-size: 13px; vertical-align: middle; margin-left: 2px; }

/* The View and palette dropdowns, rule for rule as in the .seq editor and Disk Commander. */
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
#view-menu .item.disabled, #palette-menu .item.disabled { opacity: 0.4; cursor: default; }
#view-menu .item.disabled:hover, #palette-menu .item.disabled:hover { background: none; color: var(--vscode-menu-foreground, #ccc); }
#view-menu .item .codicon, #palette-menu .item .codicon { font-size: 14px; width: 16px; flex-shrink: 0; }
#view-menu .item.off .codicon, #palette-menu .item.off .codicon { visibility: hidden; }
#view-menu .item .shortcut, #palette-menu .item .shortcut {
  margin-left: auto;
  padding-left: 20px;
  opacity: 0.7;
}
#view-menu .item:hover .shortcut, #palette-menu .item:hover .shortcut { opacity: 0.9; }
#page-indicator {
  font-family: monospace;
  font-size: 12px;
  color: #ccc;
}
#swatches { display: flex; gap: 3px; }
.swatch {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
}
.swatch.active { border-color: #fff; }
#content-wrap {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  background-color: var(--vscode-editor-background, #1a1a1a);
}
#content {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  margin: 1em;
}
#dimensions {
  font-family: monospace;
  font-size: 12px;
  color: #666;
  margin-left: auto;
}
</style>
</head>
<body>
<div id="toolbar">
  <button id="prev-btn">&#8249;</button>
  <span id="page-indicator"></span>
  <button id="next-btn">&#8250;</button>
  <button id="charset-btn">Lowercase</button>
  <button id="view-btn" title="Show or hide MCI commands">View <span class="codicon codicon-chevron-down"></span></button>
  <button id="palette-btn" title="C64 colour palette">Palette <span class="codicon codicon-chevron-down"></span></button>
  <div id="swatches"></div>
  <span id="dimensions"></span>
</div>
<div id="view-menu" hidden></div>
<div id="palette-menu" hidden></div>
<div id="content-wrap">
  <canvas id="content"></canvas>
</div>
<script nonce="${nonce}">window.__PETMATE_CONFIG = ${config};</script>
<script nonce="${nonce}" src="${charRomUri}"></script>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function escapeHtml(s: string): string {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return s.replace(/[&<>"']/g, c => map[c]);
}
