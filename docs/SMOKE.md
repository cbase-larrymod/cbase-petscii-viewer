# Smoke checklist

Manual pass before packaging a release, and after any change to the toolbar or the webview.

**Why this exists.** `npm test` here checks the keymap and the toolbar's shape by reading the
source: that the letters match C\*Base Disk Commander's, that `package.json` binds what the
table says, that nothing is bound without a `when` clause, and that both dropdowns are styled
by the same CSS rules. None of it executes the extension. What a contributed keybinding
actually does when VS Code's menu bar wants the same chord is invisible to every test in this
repository — and that is exactly where the shortcuts went wrong twice before landing. Ten
minutes here is worth more than any amount of static analysis.

Run against the dev host (`F5`), not an installed `.vsix`, unless you are specifically testing
the packaged build.

> Empty `[ ]` boxes mean "needs doing now". A `[PASS]` records what was verified and on which
> build, and does *not* describe the current one.

---

## 1. It loads at all

- [ ] Open a `.seq` file from the Explorer — it renders, in colour, in the C64 font.
- [ ] Open a `.petmate` file — it renders, and the page navigation works.
- [ ] **C\*Base: Open .seq File…** from the Command Palette opens the same view.

## 2. Toolbar — `.seq`

- [ ] The charset button reads **Lowercase** or **Uppercase** — not "Lowercase charset".
- [ ] **View** opens a checkmark dropdown holding **MCI Commands** and **Show CLS ($93)**, each
      with its shortcut on the right.
- [ ] **Palette** opens a checkmark dropdown of the six presets with the current one ticked, and
      `Alt+1`…`Alt+6` against the rows. It is a menu, not a list box.
- [ ] The **View** and **Palette** buttons are the same height, with identically sized chevrons.
- [ ] The check marks and chevrons render as icons, not as empty boxes or missing glyphs. The
      codicon font is loaded from the extension and needs `font-src` in the page's CSP, so this
      is the check that catches it being wrong.
- [ ] Open **View**, then click **Palette** — the first menu closes. Then the reverse order.
      Both directions close the other menu.
- [ ] Clicking anywhere else closes an open menu.

## 3. The toggles do what they say

- [ ] **MCI Commands** off — `£`-tokens and `@:…:` tokens disappear and the remaining
      characters reflow to fill the row. On again — they come back.
- [ ] **Show CLS ($93)** on — a green dotted line appears at each Clear Screen boundary.
- [ ] A file with a `$93` **part-way through a line**: the line sits below the text the clear
      follows, not above it.
- [ ] **Lowercase / Uppercase** re-renders the glyphs and the button label follows.

## 4. Keyboard shortcuts

The part no test here can reach.

- [ ] `Alt+Shift+M` toggles MCI, `Alt+Shift+L` toggles the CLS markers. Each matches what
      clicking the menu row does, and the check mark follows.
- [ ] `Alt+1`…`Alt+6` switch palette. The button keeps reading `Palette`; the tick moves.
- [ ] **No VS Code menu opens** on any of them. Watch the menu bar, not just the canvas: a
      binding on `Alt+T` or `Alt+S` toggles *and* opens the Terminal or Selection menu, because
      the mnemonic is resolved before any keybinding and Shift does not change that match. It is
      why the letters are what they are.
- [ ] With a plain text file focused, all of these keys do what VS Code normally does. The
      `when` clause is what keeps them local.

## 5. The removed command

- [ ] `cbase.decodeSeq` no longer appears in the Command Palette.
- [ ] With **this extension disabled**, opening a SEQ entry from a disk image in Disk Commander
      still works. (It decodes SEQ itself; the command it used to call is gone.)

## 6. Agreement with C\*Base Disk Commander

- [ ] Open the same `.seq` file in both extensions — from the Explorer here, and from inside a
      disk image there. The toolbars look the same and the same keys do the same things.
- [ ] The rendering matches: same colours, same reverse-video, same row breaks, same CLS
      positions. The decoder is shared by copy, and this is what would catch the copies having
      drifted in a way the byte-comparison test somehow did not.

## 7. Preferences persist

- [ ] Change palette, charset, MCI and CLS; close the file and reopen — all as you left them.
- [ ] Column width: drag the canvas edge, reopen — the width persists, and **↺** resets to 40.

## 8. `.petmate`

- [ ] Page navigation still works, and the charset button reads **Lowercase** / **Uppercase**.
- [ ] **View** and **Palette** are the same dropdowns as in the `.seq` editor.
- [ ] **Show CLS ($93)** is listed but **dimmed** — a `.petmate` file has no `$93` boundaries.
      Clicking it does nothing, and `Alt+Shift+L` does nothing.
- [ ] `Alt+Shift+M` toggles MCI, and `Alt+1`…`Alt+6` switch palette, exactly as in `.seq`.

---

## Focused pass — after a decoder change

The decoder is byte-identical to Disk Commander's copy. `npm test` there compares the files;
neither test executes them against a real file.

- [ ] Copy the changed file to the other repository, and run `npm test` in both.
- [ ] Open several `.seq` files with known content — colour codes, reverse-video runs, `$93`,
      `$8D` and `$88` row terminators, and a file that wraps at exactly 40 columns.
- [ ] Cross-check one against VICE or another C64 emulator. This is the only check that says
      the decoder is *right* rather than merely unchanged.
