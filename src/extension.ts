import * as vscode from 'vscode';
import { SeqEditorProvider } from './seqEditorProvider';
import { PetmateEditorProvider } from './petmateEditorProvider';
import { registerViewKeyCommands } from './viewKeys';
import { focusedViewerWebview } from './viewFocus';

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            SeqEditorProvider.viewType,
            new SeqEditorProvider(context),
            { webviewOptions: { retainContextWhenHidden: true } }
        ),
        vscode.window.registerCustomEditorProvider(
            PetmateEditorProvider.viewType,
            new PetmateEditorProvider(context),
            { webviewOptions: { retainContextWhenHidden: true } }
        ),
        vscode.commands.registerCommand('cbase.openSeqFile', openSeqFile),
        vscode.commands.registerCommand('cbase.openPetmateFile', openPetmateFile)
    );

    // The View menu's Alt+Shift shortcuts. Contributed keybindings rather than keys handled in
    // the page: a webview forwards every keydown to the workbench unconditionally, and
    // preventDefault there does not stop it — see viewKeys.ts.
    registerViewKeyCommands(context, focusedViewerWebview);
}

async function openSeqFile(): Promise<void> {
    const uris = await vscode.window.showOpenDialog({
        filters: { 'PETSCII Sequence': ['seq'] },
        canSelectMany: false
    });
    if (uris && uris.length > 0) {
        await vscode.commands.executeCommand('vscode.openWith', uris[0], SeqEditorProvider.viewType);
    }
}

async function openPetmateFile(): Promise<void> {
    const uris = await vscode.window.showOpenDialog({
        filters: { 'Petmate Screen': ['petmate'] },
        canSelectMany: false
    });
    if (uris && uris.length > 0) {
        await vscode.commands.executeCommand('vscode.openWith', uris[0], PetmateEditorProvider.viewType);
    }
}

export function deactivate(): void {}
