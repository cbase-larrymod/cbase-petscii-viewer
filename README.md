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

---

## Usage

Open any `.seq` or `.petmate` file — the viewer activates automatically. Use the toolbar to toggle charset, palette and background color; for `.seq`, the **View** menu holds MCI visibility and the CLS markers, and the right edge of the canvas drags to change column width.

**Keyboard shortcuts** (`.seq` viewer): `Alt+Shift+M` toggles MCI commands, `Alt+Shift+L` the CLS markers, and `Alt+1` to `Alt+6` pick a colour palette. They match C\*Base Disk Commander's, which shows the same toggles over the same files. Both are contributed commands, so they can be rebound from **Keyboard Shortcuts**.

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
[Toolbar controls](docs/overview.md#toolbar-controls).

---

## Documentation

Full documentation is available on the [GitHub repository](https://github.com/cbase-larrymod/cbase-petscii-viewer) and the [C\*Base Reference Guide](https://cbasereferenceguide.github.io).

---

## License

See [LICENSE.md](LICENSE.md) for details.
