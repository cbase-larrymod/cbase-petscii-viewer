// Which of this extension's views has focus, for the View menu's keyboard shortcuts.
//
// Both editors need this — a `.seq` and a `.petmate` both carry a View menu — and only one of
// them can be the active tab at a time, so it is one piece of state rather than one per
// provider. Each provider registers its panel as it resolves it.

import * as vscode from 'vscode';

/**
 * The `when` clause on the View menu's keybindings. True only while one of this extension's
 * editors is the active tab, so Alt+Shift+M is taken here and nowhere else in VS Code.
 */
export const FOCUS_CONTEXT = 'cbasePetsciiFocused';

let activePanel: vscode.WebviewPanel | undefined;

function setFocus(panel: vscode.WebviewPanel | undefined): void {
    activePanel = panel;
    vscode.commands.executeCommand('setContext', FOCUS_CONTEXT, panel !== undefined);
}

/**
 * Follow one editor's focus. Called by each provider as it resolves a panel.
 *
 * The panel is dropped on dispose as well as on losing focus: a closed tab that stayed
 * "focused" would leave the shortcuts bound with nowhere to send them.
 */
export function trackViewFocus(panel: vscode.WebviewPanel): void {
    if (panel.active) { setFocus(panel); }
    panel.onDidChangeViewState(e => {
        if (e.webviewPanel.active) { setFocus(panel); }
        else if (activePanel === panel) { setFocus(undefined); }
    });
    panel.onDidDispose(() => {
        if (activePanel === panel) { setFocus(undefined); }
    });
}

/** The focused view's webview, or undefined when none has focus. See viewKeys.ts. */
export function focusedViewerWebview(): vscode.Webview | undefined {
    return activePanel?.webview;
}
