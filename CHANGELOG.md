# Changelog
All notable changes to this project will be documented in this file.

## [0.5.0-beta] - 2026-06-30

### Added

- **`cbase.decodeSeq` command API** — exposes SEQ decoding to other VS Code extensions without opening an editor tab. Accepts raw `.seq` bytes and an optional charset override; returns decoded character cell rows. Used by the C\*Base Disk Viewer to render SEQ files inline within the disk browser.
- **Reset background ↺ button** — always-visible icon next to the color swatches in the `.seq` viewer toolbar. Resets the background color to Black (index 0).

### Changed

- **Settings persist globally across all workspaces** — both the `.seq` and `.petmate` viewers now store their settings in VS Code `globalState` instead of `workspaceState`. Settings no longer reset when switching workspaces. State keys updated to `cbase-petscii-viewer.seqViewer` and `cbase-petscii-viewer.petmateViewer`.

---

## [0.4.0-beta] - 2026-06-23

### Added

- **`$88` (F7) line break** — C\*Base uses `$88` (the F7 key code) as a soft line break in message text. The `.seq` decoder now treats it identically to `$0D`/`$8D`: flush the current row, start a new row, reset reverse. Previously stripped silently.
- **Charset auto-detection in `.seq` files** — if `$8E` (uppercase) or `$0E` (lowercase) appears in the first 10 bytes of a `.seq` file, the viewer opens in that charset automatically. If no indicator is present, the file opens in lowercase. Persisted state no longer overrides file-level charset on open.
- **Per-page charset in `.petmate` files** — each Petmate page carries a `charset` field (`"upper"` or `"lower"`) in the JSON. The viewer now reads that field and applies the correct charset automatically when navigating to each page. Manual toggle overrides the auto-detected value for the current page within the session.

### Changed

- **Pepto (NTSC) palette removed** — Pepto (PAL) renamed to Pepto. Six palettes remain: CGTerm, Colodore, PALette, Pepto, Petmate, VICE.

---

## [0.3.1-beta] - 2026-06-17

### Changed

- **Color palettes rebuilt from authoritative sources** — seven palettes, each sourced directly from an official repository. CGTerm from `CGTerm-3.0/src/gfx.c`; Pepto (PAL) and Pepto (NTSC) from `VICE/pepto-pal.vpl` and `VICE/pepto-ntsc.vpl`; VICE internal palette (chip 6569R5, Tobias measurements) from `VICE/palette_6569R5_v1r.vpl`; PALette by PAL/Offence from `VICE/palette.vpl`; Colodore and Petmate from Petmate9 `src/utils/palette.ts`. CGTerm and Pepto (PAL) share identical values — CGTerm 3.0 uses Pepto (PAL) as its built-in palette.
- **Default palette** — CGTerm.
- **Palette display names** — driven by an explicit `PALETTE_LABELS` map so names like "Pepto (PAL)" and "PALette" render correctly.

---

## [0.2.1-beta] - 2026-06-17

### Changed

- **Shared character ROM** — C64 ROM blob and `hexRgb` helper moved to a single `charRom.js` script loaded by both viewers. Previously duplicated verbatim in `viewer.js` and `petmateViewer.js`.
- **Shared `getNonce()`** — extracted to `src/utils.ts`; was duplicated in both editor providers.
- **`PALETTE_NAMES` constant** — exported from `colorPalette.ts`; was duplicated as a local array in both providers.
- **Decode caching in `.seq` viewer** — PETSCII byte decoding is now cached per file. Toggling MCI visibility reuses the cached rows instead of re-decoding the full byte stream. Re-decode only happens when charset or column count changes.
- **DOM construction in dimensions display** — `updateDimensions` builds the column-count span via DOM API instead of `innerHTML`, avoiding a re-query-by-id on every render.

### Fixed

- **`petmateDecoder` error messages** — malformed `.petmate` files with out-of-range `screens` indices or missing `framebuf` arrays now throw descriptive errors instead of opaque `Cannot read properties of undefined` exceptions.

## [0.2.0-beta] - 2026-06-16

### Added

- **`.petmate` file viewer** — Petmate JSON screen files open directly in VS Code with multi-page navigation (‹ / › buttons, Page X/N counter).
- **Petmate: charset toggle** — switch between uppercase/graphics and lowercase charset (equivalent to C64 Shift+C=), same as `.seq` viewer.
- **Petmate: MCI command toggle** — detects and hides inline MCI tokens using screen-code equivalents; charset-independent.
- **Petmate: background color swatches** — 16 swatch buttons to override the per-page background color for the current session.
- **Petmate: palette selector** — same four palettes (Petmate, Colodore, Pepto, VICE) as the `.seq` viewer.
- **"C\*Base: Open .seq File..." command** — Command Palette entry opens a native file dialog pre-filtered to `*.seq` files.
- **Drag-to-resize column width** (`.seq`) — drag the right edge of the canvas to reflow PETSCII content at any width from 20 to 200 columns. Useful for reading MCI commands combined with text that span more than 40 characters.
- **↺ reset icon** — appears in the toolbar (left of the dimensions) when column width differs from 40; click to restore the default 40-column width.
- **Click-to-type column width** (`.seq`) — click the column number in the dimensions display to open an inline text input; type a value and press Enter to commit, Escape to cancel.

### Changed

- **Dimensions display** — column count is now interactive (underlined, clickable) in the `.seq` viewer.

## [0.1.0-beta.1] - 2026-06-14

### Added

- **C64 bitmap rendering** — embedded C64 character ROM (4096 bytes) renders every glyph as raw pixels via HTML5 Canvas `ImageData`. Zero anti-aliasing.
- **Charset toggle** — switch between uppercase/graphics and lowercase charset at runtime. Default: lowercase.
- **Four color palettes** — Petmate, Colodore, Pepto, VICE. Default: Petmate.
- **Background color selector** — 16 swatch buttons corresponding to the active palette. Click any swatch to change the C64 background color.
- **Reverse video support** — `$12` (RVS ON) and `$92` (RVS OFF) correctly swap foreground and background per character.
- **MCI command toggle** — hide or show inline MCI command tokens (`£`-commands and `@:`-commands). Default: visible.
- **CLS ($93) break indicator** — fluorescent green dotted line marks `$93` (Clear Screen) boundaries. Toggled via "Show CLS ($93)" button. Default: hidden.
- **VS Code theme integration** — surrounding area uses `--vscode-editor-background` from the active VS Code theme. Works with any dark or light theme.
- **Global settings persistence** — charset, palette, background color, MCI toggle, and CLS toggle are remembered across all `.seq` files in the workspace.
- **`$8D` (Shift+Return) row terminator** — many C64 BBS files use `$8D` instead of `$0D` as the line ending. Both are handled.
- **Row dimension display** — toolbar shows `40×N` where N is the total row count of the decoded file.

### Control codes handled

| Code                                                                                                                 | Meaning               | Action               |
| -------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------- |
| `$0D`, `$8D`                                                                                                         | Return / Shift+Return | Row break            |
| `$12`                                                                                                                | Reverse ON            | Toggle reverse video |
| `$92`                                                                                                                | Reverse OFF           | Toggle reverse video |
| `$93`                                                                                                                | Clear Screen          | CLS boundary marker  |
| `$90`, `$05`, `$1C`, `$9F`, `$9C`, `$1E`, `$1F`, `$9E`, `$81`, `$95`, `$96`, `$97`, `$98`, `$99`, `$9A`, `$9B`       | Color codes           | Set foreground color |
| `$00`, `$03`, `$0A`, `$08`, `$09`, `$0E`, `$0F`, `$11`, `$13`, `$17`, `$1D`, `$8E`, `$91`, `$94`, `$9D`, `$85`–`$8C` | Miscellaneous control | Stripped silently    |

---

## Keep a Changelog
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Types of changes
- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.
