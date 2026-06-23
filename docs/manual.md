# C\*Base PETSCII Viewer - Complete Manual

Visual Studio Code extension for Commodore 64 PETSCII `.seq` and `.petmate` files.

**Version:** 0.4.0-beta
**Part of:** C\*Base Larry Mod v3.1

---

## Table of Contents

- [C\*Base PETSCII Viewer - Complete Manual](#cbase-petscii-viewer---complete-manual)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Getting Started](#getting-started)
    - [Installation](#installation)
      - [Prerequisites](#prerequisites)
      - [Method 1: Install pre-compiled extension](#method-1-install-pre-compiled-extension)
      - [Method 2: Build and install from source](#method-2-build-and-install-from-source)
      - [Method 3: Development installation](#method-3-development-installation)
      - [Verification](#verification)
    - [Quick Start](#quick-start)
  - [Toolbar Reference — .seq Viewer](#toolbar-reference--seq-viewer)
    - [Charset Toggle](#charset-toggle)
    - [MCI Commands](#mci-commands)
    - [Show CLS ($93)](#show-cls-93)
    - [Palette Selector](#palette-selector)
    - [Background Color Swatches](#background-color-swatches)
    - [Column Width Controls](#column-width-controls)
  - [Toolbar Reference — .petmate Viewer](#toolbar-reference--petmate-viewer)
    - [Page Navigation](#page-navigation)
    - [Charset Toggle](#charset-toggle-1)
    - [MCI Commands](#mci-commands-1)
    - [Palette Selector](#palette-selector-1)
    - [Background Color Swatches](#background-color-swatches-1)
  - [Advanced Topics](#advanced-topics)
    - [How Rendering Works](#how-rendering-works)
    - [Settings Persistence](#settings-persistence)
    - [Development \& Testing](#development--testing)
      - [Project Structure](#project-structure)
      - [Testing](#testing)
      - [Building](#building)
  - [Reference](#reference)
    - [PETSCII Control Codes](#petscii-control-codes)
      - [Row terminators](#row-terminators)
      - [Color codes](#color-codes)
      - [Special codes](#special-codes)
      - [Stripped codes (silently ignored)](#stripped-codes-silently-ignored)
    - [Color Palettes](#color-palettes)
    - [MCI Command Syntax](#mci-command-syntax)
    - [Row Terminator Variants](#row-terminator-variants)
  - [Resources](#resources)

---

## Overview

C\*Base PETSCII Viewer renders Commodore 64 BBS sequence files in Visual Studio Code. It uses the embedded C64 character ROM for bitmap output — the same glyphs you would see on a real C64 screen, without anti-aliasing or font substitution.

**File types:**
- `.seq` — PETSCII sequence files from C64 BBS systems, specifically the C\*Base format
- `.petmate` — Petmate JSON screen files with multi-page support

**Features:**
- C64 bitmap rendering via embedded character ROM
- Full 16-color C64 palette, six palette presets
- Uppercase/graphics and lowercase charset toggle
- MCI command display toggle
- CLS ($93) break indicator (`.seq` only)
- Variable column width with drag-to-resize (`.seq` only)
- VS Code theme-aware background
- Global settings persistence

---

## Getting Started

### Installation

#### Prerequisites

**Required:**
- Visual Studio Code v1.105.0 or later

**Optional (for building from source):**
- Node.js v18.0 or later
- TypeScript compiler (`npm install -g typescript`)
- vsce (`npm install -g @vscode/vsce`)

#### Method 1: Install pre-compiled extension

```bash
git clone https://github.com/cbase-larrymod/cbase-petscii-viewer.git
cd cbase-petscii-viewer
```

**Install via VS Code UI:**

1. Open Extensions panel (`Ctrl+Shift+X` or `Cmd+Shift+X`)
2. Click the `⋯` menu (top-right of the panel)
3. Select **Install from VSIX**
4. Navigate to `cbase-petscii-viewer-0.4.0-beta.vsix`
5. Click **Install**

**Install via command line:**

```bash
code --install-extension cbase-petscii-viewer-0.4.0-beta.vsix
```

#### Method 2: Build and install from source

```bash
git clone https://github.com/cbase-larrymod/cbase-petscii-viewer.git
cd cbase-petscii-viewer
npm install
npm run package
```

The package command creates `dist/cbase-petscii-viewer-0.4.0-beta.vsix`. Install using Method 1.

#### Method 3: Development installation

```bash
git clone https://github.com/cbase-larrymod/cbase-petscii-viewer.git
cd cbase-petscii-viewer
npm install
code .
```

Press `F5` to launch the extension development host.

#### Verification

Open any `.seq` or `.petmate` file. The viewer activates automatically and renders the content. The toolbar appears at the top of the editor panel.

### Quick Start

Open a `.seq` file from the C\*Base BBS asset directory. The viewer displays the file immediately using default settings:

- **Charset** — auto-detected from `$0E`/`$8E` in the first 10 bytes; defaults to lowercase when no indicator is present
- **MCI Commands visible** — inline command tokens are displayed
- **CLS indicator off** — `$93` boundaries are not marked
- **CGTerm palette** — default C64 color palette
- **Black background** — C64 default background color
- **40-column width** — default row width

For `.petmate` files, the charset is read from each page's stored `charset` field and applied automatically when navigating between pages.

Adjust any setting using the toolbar. Palette, background color, MCI visibility, and CLS toggle are saved globally.

You can also open files directly from the Command Palette: `Ctrl+Shift+P` → **C\*Base: Open .seq File...** or **C\*Base: Open .petmate File...**

---

## Toolbar Reference — .seq Viewer

### Charset Toggle

**Button:** `Lowercase charset` / `Uppercase charset`

Switches between the two C64 character sets:

- **Lowercase charset** — lowercase letters, uppercase available via Shift
- **Uppercase charset** — uppercase letters and graphics/symbol characters

C64 BBS files commonly use the lowercase charset for mixed-case text display. The uppercase/graphics charset is used for PETSCII art that relies on block graphics characters.

### MCI Commands

**Button:** `MCI Commands` (dimmed when hidden)

Shows or hides MCI (Multi-Character Interface) command tokens embedded in the sequence. MCI commands are inline directives used by C\*Base BBS to control terminal behavior.

Two MCI command forms are recognized:

| Form       | Syntax                                  | Example       |
| ---------- | --------------------------------------- | ------------- |
| £-command  | `£` followed by alphanumeric identifier | `£ALIAS`      |
| @:-command | `@:` followed by body and closing `:`   | `@:menuitem:` |

When visible, MCI tokens appear as their raw PETSCII characters. When hidden, the tokens are removed from the display and the remaining characters reflow to fill the row.

### Show CLS ($93)

**Button:** `Show CLS ($93)` (dimmed when hidden)

Marks `$93` (Clear Screen) boundaries in the file with a fluorescent green dotted line spanning the full canvas width. The line appears at the top of the first row after each `$93` byte.

Use this to identify where the screen is cleared during BBS output. Many C\*Base screens contain a single `$93` separating introductory content from the main display.

When hidden, the `$93` byte is decoded silently and has no visual effect.

### Palette Selector

**Dropdown:** `CGTerm` / `Colodore` / `PALette` / `Pepto` / `Petmate` / `VICE`

Selects the color palette used to render all 16 C64 colors. Each palette is a different calibration of the C64's color output:

| Palette      | Program    | Source                                                               | Description                                                                  |
| :----------- | :--------- | :------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| CGTerm       | CGTerm-3.0 | github.com/unbreached/CGTerm-3.0/src/gfx.c                           | Default. Built-in palette from CGTerm 3.0 — identical to Pepto.              |
| Colodore     | Petmate9   | github.com/wbochar/petmate9/src/utils/palette.ts                     | Analog simulation model by Philip "Pepto" Timmermann.                        |
| PALette      | VICE       | github.com/VICE-Team/svn-mirror/vice/data/C64/palette.vpl            | Palette by PAL/Offence.                                                      |
| Pepto        | VICE       | github.com/VICE-Team/svn-mirror//vice/data/C64/pepto-pal.vpl         | PAL calibration by Philip "Pepto" Timmermann. Authoritative measured values. |
| Petmate      | Petmate9   | github.com/wbochar/petmate9/src/utils/palette.ts                     | Colors from the Petmate C64 tool.                                            |
| VICE         | VICE       | github.com/VICE-Team/svn-mirror/vice/data/C64/palette_6569R5_v1r.vpl | VICE internal palette — chip 6569R5 (Tobias measurements).                   |

### Background Color Swatches

**16 colored squares** next to the palette selector.

Click any swatch to set that color as the C64 background. The active swatch is highlighted with a white border. The background color applies to the entire canvas; characters are drawn on top of it.

The default background is Black (color index 0). The default foreground is Light Blue (color index 14), matching the C\*Base BBS terminal default.

### Column Width Controls

The right side of the toolbar shows the canvas dimensions (e.g., `40×120`).

**Drag to resize:** Drag the vertical handle on the right edge of the canvas to change the column count. The PETSCII stream is re-decoded and reflowed in real time. Useful for reading MCI commands that combine with text across more than 40 characters. Range: 20–200 columns.

**Click to type:** Click the column number (underlined) to open an inline text field. Type a value and press Enter to commit, or Escape to cancel.

**Reset icon (↺):** Appears to the left of the dimensions when the column width differs from 40. Click it to restore the default 40-column width.

---

## Toolbar Reference — .petmate Viewer

### Page Navigation

**Buttons:** `‹` (previous) / `›` (next)  
**Indicator:** `Page X/N`

Navigate between pages in the `.petmate` file. Buttons are disabled when already at the first or last page.

### Charset Toggle

**Button:** `Lowercase charset` / `Uppercase charset`

Switches the active glyph bank (equivalent to pressing Shift+C= on a C64). The file stores screen codes which are charset-independent; toggling selects which ROM bank to render them from.

This overrides the charset stored in the file and applies to the current session only — it is not saved per-page.

### MCI Commands

**Button:** `MCI Commands` (dimmed when hidden)

Shows or hides MCI command tokens. Detection is based on screen-code equivalents and is charset-independent.

### Palette Selector

Same six palettes as the `.seq` viewer.

### Background Color Swatches

Click any swatch to override the background color for the current page. The override applies to the current session only; the file's stored background color is not changed.

---

## Advanced Topics

### How Rendering Works

The viewer does not use a font. Instead, it reads glyph bitmaps directly from an embedded copy of the C64 character ROM (4096 bytes).

**ROM layout:**
- Bytes 0–2047: Uppercase/graphics charset — 256 glyphs × 8 bytes each
- Bytes 2048–4095: Lowercase charset — 256 glyphs × 8 bytes each

**Per glyph:** 8 bytes, one byte per pixel row. Each byte is 8 pixels wide. Bit 7 is the leftmost pixel. A `1` bit is foreground; a `0` bit is background.

**PETSCII → screen code conversion (`.seq` only):**

PETSCII byte values do not map directly to ROM positions. The conversion formula (from CGTerm/C64 kernal):

```
screen_code = (byte + SCCONV[byte >> 5]) & 0xFF
SCCONV = [128, 0, -64, -32, 64, -64, -128, -128]
Special case: byte $FF → screen code 94
```

**Petmate screen codes (`.petmate`):** Already ROM indices (0–255); no conversion needed.

**Canvas:**
- Width: column count × 8 pixels, scaled 2× via CSS `image-rendering: pixelated`
- Height: N rows × 8 pixels × 2 (CSS scale)
- Each character cell: 8×8 pixels in the `ImageData`, 16×16 on screen

### Settings Persistence

Settings are stored in VS Code workspace state. `.seq` and `.petmate` viewers maintain separate setting keys. Settings apply globally within the workspace — there is no per-file setting.

**`.seq` persisted settings:**

| Setting                | Default   | Notes                                                         |
| ---------------------- | --------- | ------------------------------------------------------------- |
| Palette                | CGTerm    |                                                               |
| Background color index | 0 (Black) |                                                               |
| MCI Commands visible   | Yes       |                                                               |
| Show CLS ($93)         | No        |                                                               |

Charset is **not** persisted — it is determined fresh on each file open from the file's `$0E`/`$8E` indicator, or defaults to lowercase when no indicator is present. Column width is also **not** persisted — it resets to 40 on each open.

**`.petmate` persisted settings:**

| Setting              | Default | Notes                                       |
| -------------------- | ------- | ------------------------------------------- |
| Palette              | CGTerm  |                                             |
| MCI Commands visible | Yes     |                                             |

Charset is **not** persisted — each page applies its own charset from the JSON `charset` field when navigated to. Background color overrides are session-only and not persisted.

### Development & Testing

#### Project Structure

```
cbase-petscii-viewer/
├── docs/
│   ├── manual.md                   # This file
│   └── overview.md                 # Quick summary
├── media/
│   ├── viewer.js                   # .seq webview renderer (canvas + ImageData)
│   └── petmateViewer.js            # .petmate webview renderer
├── src/
│   ├── extension.ts                # Extension entry point
│   ├── seqEditorProvider.ts        # CustomReadonlyEditorProvider for .seq
│   ├── petmateEditorProvider.ts    # CustomReadonlyEditorProvider for .petmate
│   ├── petsciiDecoder.ts           # PETSCII → DecodedChar[] row decoder
│   ├── petmateDecoder.ts           # Petmate JSON → PetmatePage[] decoder
│   ├── petsciiMaps.ts              # PETSCII byte → Unicode codepoint maps
│   └── colorPalette.ts             # C64 color palette definitions
├── package.json
└── tsconfig.json
```

#### Testing

1. Open the repository in VS Code
2. Run `npm install`
3. Press `F5` (Start Debugging)
4. A new VS Code window opens with the extension loaded
5. Open any `.seq` file from `cbase-3.1/assets/bbs/seq/` or `.petmate` files from `tmp/`

Cross-check rendering against VICE emulator output for ground truth.

#### Building

```bash
npm run compile                 # compile TypeScript → out/
npm run package                 # compile + create dist/cbase-petscii-viewer-0.4.0-beta.vsix
```

---

## Reference

### PETSCII Control Codes

#### Row terminators

| Code  | Meaning      | Behavior                                           |
| ----- | ------------ | -------------------------------------------------- |
| `$0D` | Return       | Flush row, start new row                           |
| `$8D` | Shift+Return | Flush row, start new row (common in C64 BBS files) |
| `$88` | F7           | Flush row, start new row (C*Base soft line break)  |

When any row terminator immediately follows an auto-wrap (a row that reached the column limit and wrapped automatically), the terminator is ignored to prevent a spurious blank row.

`$88` (F7) is used by C*Base as a soft line break in message text — the BBS inserts it at word boundaries to wrap long lines before sending them to the terminal.

#### Color codes

| Code  | Color       | Palette index |
| ----- | ----------- | ------------- |
| `$90` | Black       | 0             |
| `$05` | White       | 1             |
| `$1C` | Red         | 2             |
| `$9F` | Cyan        | 3             |
| `$9C` | Purple      | 4             |
| `$1E` | Green       | 5             |
| `$1F` | Blue        | 6             |
| `$9E` | Yellow      | 7             |
| `$81` | Orange      | 8             |
| `$95` | Brown       | 9             |
| `$96` | Light red   | 10            |
| `$97` | Dark grey   | 11            |
| `$98` | Grey        | 12            |
| `$99` | Light green | 13            |
| `$9A` | Light blue  | 14            |
| `$9B` | Light grey  | 15            |

Color codes change the foreground color for all subsequent characters until another color code is encountered. The initial default foreground is Light Blue (index 14).

#### Special codes

| Code  | Meaning      | Behavior                                                      |
| ----- | ------------ | ------------------------------------------------------------- |
| `$12` | Reverse ON   | Characters drawn with fg/bg swapped                           |
| `$92` | Reverse OFF  | Normal character drawing resumes                              |
| `$93` | Clear Screen | CLS boundary; optional green line when "Show CLS ($93)" is on |

#### Stripped codes (silently ignored)

`$00` NUL, `$03` RUN/STOP, `$0A` LF, `$08`/`$09` C=-Shift disable/enable, `$0E` lowercase charset switch, `$0F` unused, `$11`/`$91` cursor down/up, `$13` Home, `$17` cursor right variant, `$1D`/`$9D` cursor right/left, `$8E` uppercase charset switch, `$85`–`$87` F1–F3, `$89`–`$8C` F5–F8, `$94` Insert.

Any other byte in the control code range (`< $20` or `$80`–`$9F`) not listed above is rendered as a placeholder middle-dot character (`·`).

### Color Palettes

All palettes define the same 16 C64 colors in the same order. Only the hex values differ.

**Color names (index order):**
Black, White, Red, Cyan, Purple, Green, Blue, Yellow, Orange, Brown, Light red, Dark grey, Grey, Light green, Light blue, Light grey.

### MCI Command Syntax

MCI commands are inline tokens recognized when "MCI Commands" is visible.

**£-command:**
```
£<identifier>
```
`£` (PETSCII `$5C`) followed by one or more alphanumeric characters (A–Z, a–z, 0–9). The identifier continues until a non-alphanumeric byte is encountered.

Examples: `£ALIAS`, `£LOCATION`, `£Q1`

**@:-command:**
```
@:<body>:
```
`@` (`$40`) followed immediately by `:` (`$3A`), then arbitrary characters up to and including a closing `:`.

Example: `@:menuitem:`

When "MCI Commands" is hidden, both forms are stripped from the row before rendering and the remaining characters reflow.

### Row Terminator Variants

C64 BBS files use different byte combinations as row terminators depending on the software that generated them:

| Terminator | Notes                                        |
| ---------- | -------------------------------------------- |
| `$0D` only | Standard PETSCII return                      |
| `$8D` only | Shift+Return; common in C64 BBS screen files |
| `$0D $0D`  | Explicit blank line                          |

Both `$0D` and `$8D` are handled identically. A file may use either or mix both.

---

## Resources

- [GitHub repository](https://github.com/cbase-larrymod/cbase-petscii-viewer)
- [BPP+ Preprocessor](https://cbasereferenceguide.github.io/development/bpp-plus-preprocessor/)
- [BPP+ Syntax Highlighting](https://github.com/cbase-larrymod/bpp-plus-syntax-highlighter)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [C64 PETSCII reference](https://sta.c64.org/cbm64pet.html)

---

**Last updated:** 2026-06-23
**Version:** 0.4.0-beta
**License:** See [LICENSE.md](../LICENSE.md)
