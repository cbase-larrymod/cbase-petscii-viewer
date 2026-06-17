import * as vscode from 'vscode';
import { decode, PetmatePage } from './petmateDecoder';
import {
    C64Color, PaletteName, PALETTES, PALETTE_NAMES, DEFAULT_PALETTE,
} from './colorPalette';
import { getNonce } from './utils';

interface ViewerState {
    paletteName: PaletteName;
    showMci: boolean;
    lowercase: boolean;
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

        const stateKey = 'petmateViewer:settings';
        const state: ViewerState = this.context.workspaceState.get<ViewerState>(stateKey)
            ?? { paletteName: DEFAULT_PALETTE, showMci: true, lowercase: true };

        if (!(state.paletteName in PALETTES)) {
            state.paletteName = DEFAULT_PALETTE;
        }
        if (state.showMci === undefined) { state.showMci = true; }
        if (state.lowercase === undefined) { state.lowercase = true; }

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
                    await this.context.workspaceState.update(stateKey, { ...state });
                    palette = PALETTES[state.paletteName];
                    webviewPanel.webview.postMessage({
                        type: 'paletteChange',
                        palette: palette.map(c => c.hex),
                    });
                    break;

                case 'toggleCharset':
                    state.lowercase = !state.lowercase;
                    await this.context.workspaceState.update(stateKey, { ...state });
                    // The webview renders the charset toggle locally (petmateViewer.js re-renders
                    // itself), so no 'render' message is needed here. This handler only persists
                    // state so that it is restored correctly if the panel is ever rebuilt.
                    break;

                case 'toggleMci':
                    state.showMci = !state.showMci;
                    await this.context.workspaceState.update(stateKey, { ...state });
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
<style>body { background: #1a1a1a; color: #f55; font-family: monospace; padding: 2em; }</style>
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

        const paletteOptions = PALETTE_NAMES
            .map(n => `<option value="${n}"${n === state.paletteName ? ' selected' : ''}>${n.charAt(0).toUpperCase() + n.slice(1)}</option>`)
            .join('');

        const config = JSON.stringify({
            palette: palette.map(c => c.hex),
            paletteName: state.paletteName,
            showMci: state.showMci,
            lowercase: state.lowercase,
            pages,
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
#prev-btn, #next-btn, #charset-btn, #mci-btn, #palette-select {
  font-family: monospace;
  font-size: 12px;
  background: #333;
  color: #ccc;
  border: 1px solid #555;
  cursor: pointer;
  border-radius: 3px;
}
#prev-btn, #next-btn, #charset-btn, #mci-btn { padding: 2px 8px; }
#palette-select { padding: 2px 4px; }
#prev-btn:hover, #next-btn:hover, #charset-btn:hover, #mci-btn:hover, #palette-select:hover { background: #444; }
#prev-btn:disabled, #next-btn:disabled { color: #555; border-color: #444; cursor: default; }
#prev-btn:disabled:hover, #next-btn:disabled:hover { background: #333; }
#mci-btn.mci-hidden { color: #888; border-color: #444; }
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
  <button id="charset-btn">${state.lowercase ? 'Lowercase charset' : 'Uppercase charset'}</button>
  <button id="mci-btn"${state.showMci ? '' : ' class="mci-hidden"'}>MCI Commands</button>
  <select id="palette-select">${paletteOptions}</select>
  <div id="swatches"></div>
  <span id="dimensions"></span>
</div>
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
