import * as vscode from 'vscode';
import { SeqEditorProvider } from './seqEditorProvider';
import { PetmateEditorProvider } from './petmateEditorProvider';
import { decode } from './petsciiDecoder';

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
        vscode.commands.registerCommand('cbase.openPetmateFile', openPetmateFile),
        vscode.commands.registerCommand('cbase.decodeSeq', decodeSeq)
    );
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

// Called by other extensions (e.g. cbase-disk-viewer) to decode raw C64 SEQ file bytes
// into renderable char cell data without opening a new editor tab.
// args: { data: number[] }
// returns: { chars: Array<Array<{cp:number, r:boolean, f:number}>>, lowercase: boolean }
// lowercase: if provided, overrides the charset auto-detection in the file header.
// Used when the user manually toggles the charset in a host extension.
function decodeSeq(args: { data: number[]; lowercase?: boolean }): {
    chars: Array<Array<{ cp: number; r: boolean; f: number }>>;
    lowercase: boolean;
} {
    const data = new Uint8Array(args.data);
    const lowercase = args.lowercase !== undefined ? args.lowercase : (detectCharset(data) ?? true);
    const { rows } = decode(data, lowercase, 40);
    const chars = rows.map(row => row.map(ch => ({ cp: ch.codePoint, r: ch.reverse, f: ch.fgIndex })));
    return { chars, lowercase };
}

function detectCharset(data: Uint8Array): boolean | null {
    const limit = Math.min(10, data.length);
    for (let i = 0; i < limit; i++) {
        if (data[i] === 0x0E) { return true; }
        if (data[i] === 0x8E) { return false; }
    }
    return null;
}

export function deactivate(): void {}
