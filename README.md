# C\*Base PETSCII Viewer

Visual Studio Code extension for Commodore 64 PETSCII `.seq` and `.petmate` files.

Part of the **C\*Base Larry Mod v3.1** development package.

---

## Features

- C64 bitmap rendering via embedded character ROM — no font installation required
- Full 16-color C64 palette with six presets: CGTerm, Colodore, PALette, Pepto, Petmate, VICE
- Charset auto-detection — `.seq` files open in the charset encoded in the file; `.petmate` pages switch charset automatically per page
- MCI command display toggle (`£`-commands and `@:`-commands)
- CLS (`$93`) break indicator
- VS Code theme-aware background
- Settings persist globally across all files and workspaces
- `.petmate` multi-page viewer with page navigation
- Drag-to-resize column width for `.seq` files (20–200 columns)
- "C\*Base: Open .seq File..." Command Palette entry
- `cbase.decodeSeq` command API — lets other extensions decode `.seq` bytes without opening an editor tab

---

## Usage

Open any `.seq` or `.petmate` file — the viewer activates automatically. Use the toolbar to toggle charset, palette, background color, MCI visibility, and (for `.seq`) CLS markers and column width.

To open files via Command Palette: `Ctrl+Shift+P` → **C\*Base: Open .seq File...** or **C\*Base: Open .petmate File...**

---

## Requirements

Visual Studio Code v1.105.0 or later.

---

## Installation

Download `cbase-petscii-viewer-0.4.0-beta.vsix` from the [repository](https://github.com/cbase-larrymod/cbase-petscii-viewer), then:

**Extensions panel:** `···` → Install from VSIX

**Command line:**
```bash
code --install-extension cbase-petscii-viewer-0.4.0-beta.vsix
```

---

## Disk Viewer Integration

C\*Base PETSCII Viewer exposes a `cbase.decodeSeq` command that the [C\*Base Disk Viewer](https://github.com/cbase-larrymod/cbase-disk-viewer) uses to render SEQ files inline within the disk browser.

When a SEQ file inside a `.d64` disk image is opened, the disk viewer calls `cbase.decodeSeq` with the raw file bytes. The PETSCII viewer decodes the bytes and returns rendered character cell data; the disk viewer displays it in its own panel without opening a separate editor tab.

See `docs/manual.md` for the full API reference.

---

## Documentation

Full documentation is available on the [GitHub repository](https://github.com/cbase-larrymod/cbase-petscii-viewer) and the [C\*Base Reference Guide](https://cbasereferenceguide.github.io).

---

## License

See [LICENSE.md](LICENSE.md) for details.
