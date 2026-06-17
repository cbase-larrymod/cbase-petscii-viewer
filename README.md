# C\*Base PETSCII Viewer

Visual Studio Code extension for Commodore 64 PETSCII `.seq` and `.petmate` files.

Part of the C*Base Larry Mod v3.1 development package.

---

## Features

- C64 bitmap rendering via embedded character ROM — no font installation required
- Full 16-color C64 palette with four presets: Petmate, Colodore, Pepto, VICE
- Uppercase/graphics and lowercase charset toggle
- MCI command display toggle (`£`-commands and `@:`-commands)
- CLS (`$93`) break indicator
- VS Code theme-aware background
- Settings persist globally across all files
- `.petmate` multi-page viewer with page navigation
- Drag-to-resize column width for `.seq` files (20–200 columns)
- "C\*Base: Open .seq File..." Command Palette entry

---

## Usage

Open any `.seq` or `.petmate` file — the viewer activates automatically. Use the toolbar to toggle charset, palette, background color, MCI visibility, and (for `.seq`) CLS markers and column width.

To open files via Command Palette: `Ctrl+Shift+P` → **C\*Base: Open .seq File...** or **C\*Base: Open .petmate File...**

---

## Requirements

Visual Studio Code v1.105.0 or later.

---

## Installation

Download `cbase-petscii-viewer-0.2.1-beta.vsix` from the [repository](https://github.com/cbase-larrymod/cbase-petscii-viewer), then:

**Extensions panel:** `···` → Install from VSIX

**Command line:**
```bash
code --install-extension cbase-petscii-viewer-0.2.1-beta.vsix
```

---

## Documentation

Full documentation is available on the [GitHub repository](https://github.com/cbase-larrymod/cbase-petscii-viewer) and the [C\*Base Reference Guide](https://cbasereferenceguide.github.io).

---

## License

See [LICENSE.md](LICENSE.md) for details.
