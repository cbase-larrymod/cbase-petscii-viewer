# Changelog
All notable changes to this project will be documented in this file.

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
