# C\*Base PETSCII Viewer

Visual Studio Code extension for Commodore 64 PETSCII `.seq` and `.petmate` files.

**Version:** 0.6.0-beta
**Part of:** C\*Base Larry Mod v3.1

---

## What it does

Renders C64 BBS sequence files directly in VS Code. Uses the embedded C64 character ROM for bitmap output — no font installation required. Activates automatically when opening `.seq` or `.petmate` files.

---

## Features

- C64 bitmap rendering via embedded character ROM (zero anti-aliasing)
- Full 16-color palette with six presets: CGTerm, Colodore, PALette, Pepto, Petmate, VICE
- Charset auto-detection — `.seq` files open in the file-encoded charset; `.petmate` pages switch per page automatically
- MCI command display toggle (£-commands and @:-commands)
- CLS ($93) break indicator — fluorescent green dotted line (`.seq` only)
- VS Code theme-aware background (dark and light mode)
- Global settings persistence across all files and workspaces
- `.petmate` multi-page viewer with page navigation
- Drag-to-resize column width for `.seq` files (20–200 columns)
- "C\*Base: Open .seq File..." and "C\*Base: Open .petmate File..." Command Palette entries

---

## File types

- `.seq` — PETSCII sequence files from C64 BBS systems (C\*Base format)
- `.petmate` — Petmate JSON screen files with multi-page support

---

## Toolbar controls

### .seq viewer

Deliberately the same toolbar as [C\*Base Disk Commander](https://github.com/cbase-larrymod/cbase-disk-commander)'s: the two extensions show the same SEQ file with the same toggles above it.

| Control               | Description                                                                          |
| --------------------- | ------------------------------------------------------------------------------------ |
| Lowercase / Uppercase | Toggle charset; auto-detected from file on open                                      |
| View                  | Checkmark menu: **MCI Commands** (`Alt+Shift+M`) and **Show CLS ($93)** (`Alt+Shift+L`) |
| Palette               | Checkmark menu of the six presets, current one ticked; `Alt+1`–`Alt+6` select directly |
| Color swatches        | Click a swatch to change the C64 background color                                    |
| ↺ (after swatches)    | Reset background color to Black                                                      |
| ↺ (before dimensions) | Reset column width to 40 (appears only when width ≠ 40)                              |
| W×N                   | Dimensions; click W to type a custom column count                                    |

Drag the right edge of the canvas to change column width (20–200).

Alt+Shift rather than plain Alt because VS Code's menu bar claims `Alt+F` `E` `S` `V` `G` `R` `T` `H` before any keybinding is considered. Both are contributed commands and can be rebound from **Keyboard Shortcuts**.

### .petmate viewer

| Control                               | Description                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| ‹ / ›                                 | Navigate to previous / next page                           |
| Page X/N                              | Current page and total page count                          |
| Lowercase / Uppercase | Toggle charset; auto-detected from page JSON on navigation |
| View                  | Checkmark menu: **MCI Commands** (`Alt+Shift+M`). **Show CLS ($93)** is listed but dimmed — a `.petmate` file has no `$93` boundaries |
| Palette               | Checkmark menu of the six presets; `Alt+1`–`Alt+6` select directly |
| Color swatches                        | Click a swatch to override the page background color       |
| W×H                                   | Canvas dimensions                                          |

---

## Documentation

- **[Manual](manual.md)** - Comprehensive single-document reference

---

## Installation

Requires Visual Studio Code v1.105.0 or later. No font installation needed.

Three installation methods:
- Install pre-compiled extension (`.vsix` file)
- Build and install from source
- Development installation (F5 in VS Code)

See [README.md](../README.md) for detailed instructions.

---

## Disk Commander Integration

The [C\*Base Disk Commander](https://github.com/cbase-larrymod/cbase-disk-commander) extension
opens disk images and renders SEQ entries inline. It no longer calls this extension to do it —
it decodes SEQ itself, so opening a SEQ from a disk image works whether or not this extension is
installed.

`.petmate` is [Petmate](https://github.com/wbochar/petmate9)'s own screen format, not a
Commodore file type — it never appears on a C64 disk image. Only this extension opens one, and
Disk Commander has no reason to. That split is deliberate rather than a gap.

The two share the decoder rather than each having its own. `src/petsciiDecoder.ts` and
`src/petsciiMaps.ts` are byte-identical copies of the same files in both repositories, and a
test in each fails if they stop being identical. Which byte is a colour, which is stripped and
where a row breaks are decisions about the format; two extensions that disagreed about them
would render one file two different ways. Fix a decoding bug in either repository and copy the
file across — the test says so if you forget.

The `cbase.decodeSeq` command has been **removed**. It existed solely so Disk Commander could
render SEQ entries; now that Disk Commander decodes SEQ itself, nothing called it, and no other
extension ever used it.

The `.seq` toolbar is deliberately Disk Commander's, down to the shortcut letters — see
[Toolbar controls](#toolbar-controls).

---

## GitHub repository

Source code, issues, and releases:
[https://github.com/cbase-larrymod/cbase-petscii-viewer](https://github.com/cbase-larrymod/cbase-petscii-viewer)

---

**Last updated:** 2026-06-30
**License:** See [LICENSE.md](../LICENSE.md)
