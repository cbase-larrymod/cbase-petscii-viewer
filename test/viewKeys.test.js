// The View menu's keyboard shortcuts, and whether they still agree with Disk Commander's.
//
// The two extensions show the same SEQ file with the same toggles above it. MCI meaning one key
// here and another there would be worse than having no shortcut at all, and nothing at build
// time notices — they are separate repositories with separate package.json files. So the
// agreement is checked here against the sibling checkout when there is one, and reported as
// skipped when there is not, rather than passing silently and meaning nothing.
//
// The rest is the same guard Disk Commander keeps over its own keymap: no shortcut may take a
// letter VS Code's menu bar claims (a contributed binding does not win against a mnemonic — it
// merely also runs, and Shift does not change that), package.json must bind what the table
// says, and the two dropdowns must be styled by the same rules.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// viewKeys.ts registers commands, so it imports vscode at module scope. Only the table and the
// id helpers are read here; nothing that touches the stubbed surface is called.
require('./vscodeStub').install();
const VK = require(path.join(ROOT, 'out', 'viewKeys.js'));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const WHEN = 'cbasePetsciiFocused';
const keybindingFor = c => pkg.contributes.keybindings.find(k => k.command === c);
const commandDeclared = c => pkg.contributes.commands.some(x => x.command === c);

// ── the table, and what package.json says ───────────────────────

test('no two toggles claim the same letter', () => {
    const seen = new Map();
    for (const { id, letter } of VK.VIEW_KEYS) {
        assert.ok(!seen.has(letter), `${id} and ${seen.get(letter)} both claim Alt+Shift+${letter.toUpperCase()}`);
        seen.set(letter, id);
    }
});

test('no toggle uses a letter the VS Code menu bar claims', () => {
    // A contributed keybinding does not take Alt+letter from the menu bar: the mnemonic is
    // resolved first, so both run. Adding Shift does not help — the match ignores it. Only the
    // letter does, which is why this is asserted rather than left as a comment.
    for (const { id, letter } of VK.VIEW_KEYS) {
        assert.ok(!VK.MENUBAR_MNEMONICS.includes(letter),
            `${id} is on Alt+Shift+${letter.toUpperCase()}, and Alt+${letter.toUpperCase()} opens a VS Code menu`);
    }
});

test('every toggle has a command and is bound to the chord the table names', () => {
    for (const { id, letter } of VK.VIEW_KEYS) {
        const command = VK.viewCommandId(id);
        assert.ok(commandDeclared(command), `${command} is bound but never declared`);
        const kb = keybindingFor(command);
        assert.ok(kb, `${id} has no keybinding`);
        assert.strictEqual(kb.key, VK.viewKeyChord(letter));
        assert.ok(kb.key.startsWith('alt+shift+'), `${id} lost its Shift`);
    }
});

test('every palette position has a command and a keybinding', () => {
    for (let n = 1; n <= VK.PALETTE_KEY_COUNT; n++) {
        const command = VK.paletteCommandId(n);
        assert.ok(commandDeclared(command), `${command} is bound but never declared`);
        assert.strictEqual(keybindingFor(command).key, 'alt+' + n);
    }
});

test('nothing is bound without a when clause', () => {
    // Ungated, these would take their keys everywhere in VS Code, not just over a SEQ view.
    const ours = [
        ...VK.VIEW_KEYS.map(k => VK.viewCommandId(k.id)),
        ...Array.from({ length: VK.PALETTE_KEY_COUNT }, (_, i) => VK.paletteCommandId(i + 1)),
    ];
    for (const command of ours) {
        assert.strictEqual(keybindingFor(command).when, WHEN, `${command} is not gated on the focus context`);
    }
});

test('the label the menu draws matches the chord that is bound', () => {
    const labels = VK.viewKeyLabels();
    for (const { id, letter } of VK.VIEW_KEYS) {
        assert.strictEqual(labels[id], 'Alt+Shift+' + letter.toUpperCase());
    }
    VK.paletteKeyLabels().forEach((label, i) => {
        assert.strictEqual(label, 'Alt+' + (i + 1));
        assert.strictEqual(keybindingFor(VK.paletteCommandId(i + 1)).key, 'alt+' + (i + 1));
    });
});

test('the shortcuts are kept out of the command palette', () => {
    const hidden = new Map((pkg.contributes.menus.commandPalette || []).map(m => [m.command, m.when]));
    for (const { id } of VK.VIEW_KEYS) {
        assert.strictEqual(hidden.get(VK.viewCommandId(id)), 'false', `${id} still shows in the palette`);
    }
});

// ── the toolbar matches Disk Commander's ────────────────────────

const PROVIDER = fs.readFileSync(path.join(ROOT, 'src', 'seqEditorProvider.ts'), 'utf8');

test('the charset button is labelled Lowercase / Uppercase', () => {
    // It read "Lowercase charset" / "Uppercase charset"; Disk Commander's says just the word.
    assert.ok(!PROVIDER.includes('Lowercase charset'), 'the charset button still says "charset"');
    assert.ok(!fs.readFileSync(path.join(ROOT, 'media', 'viewer.js'), 'utf8').includes('Lowercase charset'),
        'the page still relabels it back to "Lowercase charset" on render');
});

test('MCI and CLS are menu items, not toolbar buttons', () => {
    for (const gone of ['mci-btn', 'cls-btn', 'palette-select']) {
        assert.ok(!PROVIDER.includes(gone), `#${gone} is back in the toolbar`);
    }
    for (const wanted of ['id="view-btn"', 'id="palette-btn"', 'id="view-menu"', 'id="palette-menu"']) {
        assert.ok(PROVIDER.includes(wanted), `the toolbar has no ${wanted}`);
    }
});

/**
 * Assert every CSS rule dressing `#a` dresses `#b` identically.
 *
 * Compared selector part by part, because the obvious way to add the second id — swapping "#a"
 * for "#a, #b" throughout — silently yields "#a .item, #b .item:hover", which applies a hover
 * style to #a unconditionally. A substring check would pass that.
 */
function assertStyledAlike(a, b, minimum) {
    const css = PROVIDER.slice(PROVIDER.indexOf('<style>'), PROVIDER.indexOf('</style>'))
        .replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m => m[1].trim());
    let checked = 0;
    for (const selector of rules) {
        const parts = selector.split(',').map(s => s.trim());
        for (const part of parts) {
            if (!part.includes(a)) { continue; }
            const twin = part.replace(a, b);
            assert.ok(parts.includes(twin), `"${part}" has no matching "${twin}" — ${b} would not get this rule`);
            checked++;
        }
    }
    assert.ok(checked >= minimum, `only ${checked} ${a} selectors found; the CSS regex has rotted`);
}

test('the two dropdowns, and their buttons, are styled by the same rules', () => {
    assertStyledAlike('#view-menu', '#palette-menu', 6);
    assertStyledAlike('#view-btn', '#palette-btn', 3);
});

// ── and agrees with Disk Commander ──────────────────────────────

const COMMANDER = path.resolve(ROOT, '..', 'cbase-disk-commander');

test("the shared toggles use Disk Commander's letters", () => {
    const theirKeys = path.join(COMMANDER, 'out', 'viewKeys.js');
    if (!fs.existsSync(theirKeys)) {
        console.log('       (skipped: no built cbase-disk-commander checkout beside this one)');
        return;
    }
    // Requiring their module pulls in vscode; only the table is needed, so it is read as source.
    const src = fs.readFileSync(path.join(COMMANDER, 'src', 'viewKeys.ts'), 'utf8');
    const theirs = new Map(
        [...src.matchAll(/\{ id: '(\w+)', letter: '(\w)' \}/g)].map(m => [m[1], m[2]]));
    assert.ok(theirs.size > 0, 'could not read Disk Commander\'s table — the regex has rotted');

    for (const { id, letter } of VK.VIEW_KEYS) {
        assert.ok(theirs.has(id), `Disk Commander has no '${id}' toggle; one of the two renamed it`);
        assert.strictEqual(letter, theirs.get(id),
            `'${id}' is Alt+Shift+${letter.toUpperCase()} here and Alt+Shift+${theirs.get(id).toUpperCase()} there`);
    }
});

test('the palette digits reach the same number of palettes in both', () => {
    const src = path.join(COMMANDER, 'src', 'viewKeys.ts');
    if (!fs.existsSync(src)) {
        console.log('       (skipped: no cbase-disk-commander checkout beside this one)');
        return;
    }
    const m = /PALETTE_KEY_COUNT = (\d+)/.exec(fs.readFileSync(src, 'utf8'));
    assert.ok(m, 'could not read Disk Commander\'s palette count');
    assert.strictEqual(VK.PALETTE_KEY_COUNT, Number(m[1]),
        'Alt+6 selects a different palette in the two extensions');
});

// ── runner ──────────────────────────────────────────────────────

let failed = 0;
for (const t of tests) {
    try { t.fn(); }
    catch (err) { failed++; console.error(`  FAIL ${t.name}\n        ${String(err.message).split('\n').join('\n        ')}`); }
}
if (failed === 0) { console.log(`PASS viewKeys: ${tests.length} assertions over the View menu's shortcuts.`); }
else { console.error(`FAIL viewKeys: ${failed} of ${tests.length} failed.`); }
process.exit(failed === 0 ? 0 : 1);
