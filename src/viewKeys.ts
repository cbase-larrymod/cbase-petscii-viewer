// The View menu's keyboard shortcuts.
//
// Deliberately the same shape, and the same letters, as C*Base Disk Commander's src/viewKeys.ts.
// The two extensions show the same SEQ file with the same toggles above it, so MCI meaning one
// key here and another there would be worse than having no shortcut at all. The ids and letters
// shared with it are asserted in test/viewKeys.test.js against that repo when it is checked out
// beside this one.
//
// Two constraints shape the keys, both found by trying them in Disk Commander rather than by
// reading docs.
//
// A contributed keybinding does not take Alt+letter from VS Code's menu bar. The mnemonic is
// resolved before any binding is consulted, so both ran: Alt+T toggled a column *and* dropped
// the Terminal menu open. Adding Shift does not fix that either — the mnemonic match ignores
// Shift — so the letters themselves have to stay off F E S V G R T H, which is
// MENUBAR_MNEMONICS below.
//
// The Shift stays even so. It is not what makes these safe, but it keeps them out of the way of
// plain Alt+letter generally, which is where a future VS Code menu would land.
//
// The palettes stay on plain Alt+1..Alt+6: digits are not mnemonics, so they never collided.

import * as vscode from 'vscode';

/** A View toggle: the id the menu tags its item with, and the letter that reaches it. */
export interface ViewKey {
    id: string;
    letter: string;
}

/**
 * The toggles, and the letter each answers to. Pressed with Alt+Shift.
 *
 * Both of these also exist in Disk Commander's menu, on these same letters. Neither is the
 * word's first letter by accident: M is MCI's own initial, and CLS takes L because C belongs to
 * the Characters toggle in the other extension — a letter that is free here but not there is
 * still not free, because the two menus have to agree.
 */
export const VIEW_KEYS: ViewKey[] = [
    { id: 'mci', letter: 'm' },   // MCI Commands
    { id: 'cls', letter: 'l' },   // cLs — C is Characters in Disk Commander's menu
];

/**
 * The letters VS Code's menu bar claims: File, Edit, Selection, View, Go, Run, Terminal, Help.
 * None of the toggles may use one, and Shift is not a way round it — see the note above.
 */
export const MENUBAR_MNEMONICS = ['f', 'e', 's', 'v', 'g', 'r', 't', 'h'];

/**
 * Whether a toggle does anything in a given editor.
 *
 * Both editors list both toggles, so the View menu's shape does not change between them, but a
 * `.petmate` file has no `$93` boundaries to mark — CLS is inert there. An inert row is drawn
 * dimmed, takes no click, and ignores its shortcut, exactly as in Disk Commander, where the
 * same rule keeps the menu from offering toggles that do nothing.
 *
 * @param id      The toggle's id.
 * @param editor  Which editor is asking.
 */
export function viewToggleApplies(id: string, editor: 'seq' | 'petmate'): boolean {
    if (id === 'cls') { return editor === 'seq'; }
    return true;
}

/** id -> whether it applies, for one editor. Sent into that editor's page. */
export function viewAppliesMap(editor: 'seq' | 'petmate'): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    for (const k of VIEW_KEYS) { out[k.id] = viewToggleApplies(k.id, editor); }
    return out;
}

/** How many palettes Alt+digit reaches. The picker lists six; see colorPalette.ts. */
export const PALETTE_KEY_COUNT = 6;

const PREFIX = 'cbase-petscii-viewer';

/** The command a toggle's key runs. */
export function viewCommandId(id: string): string {
    return `${PREFIX}.view.${id}`;
}

/** The command the palette at position `n` (1-based) is reached by. */
export function paletteCommandId(n: number): string {
    return `${PREFIX}.palette.${n}`;
}

/** The keybinding a toggle is bound to: `alt+shift+m`. The Shift is load-bearing; see above. */
export function viewKeyChord(letter: string): string {
    return `alt+shift+${letter}`;
}

/** `Alt+Shift+M` — what the menu draws against the item, for the chord above. */
export function accelLabel(letter: string): string {
    return `Alt+Shift+${letter.toUpperCase()}`;
}

/** id -> "Alt+Shift+M", for the menu. Sent into the webview so it keeps no copy of its own. */
export function viewKeyLabels(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const k of VIEW_KEYS) { out[k.id] = accelLabel(k.letter); }
    return out;
}

/** ["Alt+1", …] by palette position, for the palette menu to draw against its rows. */
export function paletteKeyLabels(): string[] {
    return Array.from({ length: PALETTE_KEY_COUNT }, (_, i) => `Alt+${i + 1}`);
}

/**
 * The focused viewer's webview, or undefined when no SEQ view has focus.
 *
 * Passed in by the caller rather than imported, so this file stays a table and its plumbing
 * rather than reaching into the editor provider.
 */
export type FocusedWebview = () => vscode.Webview | undefined;

/**
 * Register the command behind every shortcut. Called once at activation.
 *
 * Each forwards to the focused view and does nothing when none has focus — which the `when`
 * clause already prevents, but a command is also reachable from a user's own keybinding.
 */
export function registerViewKeyCommands(
    context: vscode.ExtensionContext,
    focused: FocusedWebview,
): void {
    const post = (message: unknown) => {
        const webview = focused();
        if (webview) { webview.postMessage(message); }
    };
    for (const { id } of VIEW_KEYS) {
        context.subscriptions.push(
            vscode.commands.registerCommand(viewCommandId(id), () => {
                post({ type: 'viewToggle', id });
            })
        );
    }
    for (let n = 1; n <= PALETTE_KEY_COUNT; n++) {
        context.subscriptions.push(
            vscode.commands.registerCommand(paletteCommandId(n), () => {
                // 1-based in the keybinding, 0-based in the picker.
                post({ type: 'setPaletteIndex', index: n - 1 });
            })
        );
    }
}
