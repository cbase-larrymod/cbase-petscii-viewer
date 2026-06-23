# C\*Base PETSCII Viewer

Visual Studio Code extension for Commodore 64 PETSCII `.seq` and `.petmate` files.

**Version:** 0.4.0-beta
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
- Global settings persistence across all files
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

| Control                               | Description                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| Lowercase charset / Uppercase charset | Toggle charset; auto-detected from file on open            |
| MCI Commands                          | Show or hide inline MCI command tokens                     |
| Show CLS ($93)                        | Show a green dotted line at Clear Screen boundaries        |
| Palette selector                      | Switch between seven palette presets                       |
| Color swatches                        | Click a swatch to change the C64 background color          |
| ↺                                     | Reset column width to 40 (appears only when width ≠ 40)    |
| W×N                                   | Dimensions; click W to type a custom column count          |

Drag the right edge of the canvas to change column width (20–200).

### .petmate viewer

| Control                               | Description                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| ‹ / ›                                 | Navigate to previous / next page                           |
| Page X/N                              | Current page and total page count                          |
| Lowercase charset / Uppercase charset | Toggle charset; auto-detected from page JSON on navigation |
| MCI Commands                          | Show or hide inline MCI command tokens                     |
| Palette selector                      | Switch between seven palette presets                       |
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

## GitHub repository

Source code, issues, and releases:
[https://github.com/cbase-larrymod/cbase-petscii-viewer](https://github.com/cbase-larrymod/cbase-petscii-viewer)

---

**Last updated:** 2026-06-18
**License:** See [LICENSE.md](../LICENSE.md)
