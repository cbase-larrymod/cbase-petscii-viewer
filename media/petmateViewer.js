(function () {
    const vscode = acquireVsCodeApi();
    const config = window.__PETMATE_CONFIG;

    // C64 character ROM — provided by charRom.js as window.__C64_CHARSET (Uint8Array, 4096 bytes):
    // bytes 0-2047 = uppercase/graphics charset, bytes 2048-4095 = lowercase charset.
    // Each screen code occupies 8 bytes (one byte per pixel row, MSB = leftmost pixel, 1 = foreground).
    const charsetData = window.__C64_CHARSET;

    // Screen-code values for MCI token characters, derived from the PETSCII->screen-code
    // formula (CGTerm kernal.c): £=28, @=0, :=58. These hold for both upper and lower
    // charsets since the formula doesn't depend on the active charset bank.
    const MCI_POUND_SC = 28;
    const MCI_AT_SC = 0;
    const MCI_COLON_SC = 58;

    // Screen codes that display a letter or digit glyph in either charset bank (only
    // which specific letter/case differs by bank, not whether the slot holds one at all).
    function isIdentSc(sc) {
        return (sc >= 1 && sc <= 27) || (sc >= 48 && sc <= 57) || (sc >= 65 && sc <= 90);
    }

    // Strip £<ident> and @:<body>: MCI tokens from a row of petmate cells, mirroring the
    // .seq decoder's stripMciFromRow but operating on screen codes instead of PETSCII bytes.
    function stripMciFromRow(row) {
        const result = [];
        let i = 0;
        while (i < row.length) {
            const sc = row[i].sc;
            if (sc === MCI_POUND_SC) {
                i++;
                while (i < row.length && isIdentSc(row[i].sc)) i++;
            } else if (sc === MCI_AT_SC && i + 1 < row.length && row[i + 1].sc === MCI_COLON_SC) {
                i += 2;
                while (i < row.length) {
                    const nsc = row[i].sc;
                    i++;
                    if (nsc === MCI_COLON_SC) break;
                }
            } else {
                result.push(row[i]);
                i++;
            }
        }
        return result;
    }

    // '#rrggbb' → [r, g, b] — provided by charRom.js
    const hexRgb = window.__hexRgb;

    const canvas = document.getElementById('content');
    const ctx = canvas.getContext('2d');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const charsetBtn = document.getElementById('charset-btn');

    const pageIndicator = document.getElementById('page-indicator');
    const dimensions = document.getElementById('dimensions');

    const swatchContainer = document.getElementById('swatches');

    let currentPalette = config.palette;
    const pages = config.pages;
    let pageIndex = 0;
    let showMci = config.showMci !== false;
    let currentLowercase = true;
    const bgOverride = {};       // pageIndex -> palette index, session-only
    const charsetOverride = {};  // pageIndex -> boolean, set when user manually toggles

    function activeBgIndex(page, idx) {
        return bgOverride[idx] !== undefined ? bgOverride[idx] : page.bgIndex;
    }

    function buildSwatches(paletteHexes, activeIndex) {
        swatchContainer.innerHTML = '';
        paletteHexes.forEach((hex, i) => {
            const div = document.createElement('div');
            div.className = 'swatch' + (i === activeIndex ? ' active' : '');
            div.style.backgroundColor = hex;
            div.title = 'Color ' + i;
            div.addEventListener('click', () => {
                bgOverride[pageIndex] = i;
                renderPage();
            });
            swatchContainer.appendChild(div);
        });
    }

    function renderPage() {
        const page = pages[pageIndex];
        pageIndicator.textContent = 'Page ' + (pageIndex + 1) + ' / ' + pages.length;
        prevBtn.disabled = pageIndex === 0;
        nextBtn.disabled = pageIndex === pages.length - 1;
        dimensions.textContent = page.width + '\u00D7' + page.height;

        // Apply the page's stored charset unless the user has manually overridden it this session.
        currentLowercase = charsetOverride[pageIndex] !== undefined
            ? charsetOverride[pageIndex]
            : page.lowercase;
        charsetBtn.textContent = currentLowercase ? 'Lowercase' : 'Uppercase';

        const W = page.width * 8;
        const H = page.height * 8;
        canvas.width = W;
        canvas.height = H;
        canvas.style.width = (page.width * 16) + 'px';
        canvas.style.height = (page.height * 16) + 'px';

        if (page.unsupportedCharset) {
            swatchContainer.innerHTML = '';
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#f55';
            ctx.font = '10px monospace';
            ctx.fillText('Unsupported charset: ' + page.unsupportedCharset, 4, 12);
            return;
        }

        const paletteRgb = currentPalette.map(hexRgb);
        const bgIndex = activeBgIndex(page, pageIndex);
        const bgRgb = paletteRgb[bgIndex];
        buildSwatches(currentPalette, bgIndex);

        const imgData = ctx.createImageData(W, H);
        const px = imgData.data;

        // Pre-fill with the page's C64 background color
        for (let i = 0; i < px.length; i += 4) {
            px[i] = bgRgb[0]; px[i + 1] = bgRgb[1]; px[i + 2] = bgRgb[2]; px[i + 3] = 255;
        }

        const rows = showMci ? page.cells : page.cells.map(stripMciFromRow);

        // Draw content characters. Petmate stores explicit screen codes (0-255) and a
        // per-cell color index directly — no PETSCII byte-to-screen-code conversion needed.
        // currentLowercase overrides the page's stored charset, mirroring what the C64 hardware
        // does when Shift+C= switches ROM banks while screen codes stay the same.
        for (let row = 0; row < rows.length; row++) {
            const rowCells = rows[row];
            for (let col = 0; col < rowCells.length; col++) {
                const cell = rowCells[col];
                const offset = (currentLowercase ? 2048 : 0) + cell.sc * 8;
                const fgRgb = paletteRgb[cell.f];

                for (let cy = 0; cy < 8; cy++) {
                    const byte = charsetData[offset + cy];
                    for (let cx = 0; cx < 8; cx++) {
                        const bit = (byte >> (7 - cx)) & 1;
                        if (!bit) continue; // bg already filled
                        const pi = ((row * 8 + cy) * W + col * 8 + cx) * 4;
                        px[pi] = fgRgb[0]; px[pi + 1] = fgRgb[1]; px[pi + 2] = fgRgb[2];
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    // Restores the page's *own* background rather than resetting to black, which is what the
    // .seq editor's ↺ does: a .petmate page carries a background of its own, and the swatches
    // only override it for the session. Black is a colour a page might legitimately store.
    document.getElementById('reset-bg-btn').addEventListener('click', () => {
        delete bgOverride[pageIndex];
        renderPage();
    });

    prevBtn.addEventListener('click', () => {
        if (pageIndex > 0) { pageIndex--; renderPage(); }
    });
    nextBtn.addEventListener('click', () => {
        if (pageIndex < pages.length - 1) { pageIndex++; renderPage(); }
    });
    charsetBtn.addEventListener('click', () => {
        currentLowercase = !currentLowercase;
        charsetOverride[pageIndex] = currentLowercase; // remember manual override for this page
        renderPage();
    });
    // ---- the View and palette dropdowns -------------------------------------------------
    // The same menus as the .seq editor's and Disk Commander's, built the same way. MCI was a
    // flat toolbar button that dimmed when off, which said nothing about what turned it on.
    //
    // Show CLS is listed here too and always dimmed: a .petmate file has no $93 boundaries to
    // mark. Both toggles appear in both editors so the menu's shape does not change between
    // them; `viewApplies` from the extension says which is live. See src/viewKeys.ts.
    const VIEW_KEY_LABELS = config.viewKeys || {};
    const VIEW_APPLIES = config.viewApplies || {};
    const PALETTES = config.palettes || [];
    const PALETTE_KEYS = config.paletteKeys || [];
    let currentPaletteName = config.paletteName;

    const VIEW_ITEMS = [
        { id: 'mci', label: 'MCI Commands', get: () => showMci, toggle: () => {
            showMci = !showMci;
            renderPage();
            // Same as toggleCharset: host persists state only, no render response needed.
            vscode.postMessage({ type: 'toggleMci' });
        } },
        { id: 'cls', label: 'Show CLS ($93)', get: () => false, toggle: () => {} },
    ];

    const el = (id) => document.getElementById(id);
    const hideViewMenu = () => { el('view-menu').hidden = true; };
    const hidePaletteMenu = () => { el('palette-menu').hidden = true; };

    /** One themed menu row: check gutter, label, and the shortcut on the right. */
    function menuRow(label, checked, shortcut, onPick, disabled) {
        const row = document.createElement('div');
        row.className = 'item' + (checked ? '' : ' off') + (disabled ? ' disabled' : '');
        const tick = document.createElement('span');
        tick.className = 'codicon codicon-check';
        row.appendChild(tick);
        row.appendChild(document.createTextNode(label));
        if (shortcut) {
            const hint = document.createElement('span');
            hint.className = 'shortcut';
            hint.textContent = shortcut;
            row.appendChild(hint);
        }
        if (!disabled) { row.addEventListener('click', onPick); }
        return row;
    }

    /** Drop a built menu below its button. */
    function openMenu(menu, btn) {
        const r = el(btn).getBoundingClientRect();
        menu.hidden = false;
        menu.style.left = r.left + 'px';
        menu.style.top = (r.bottom + 2) + 'px';
    }

    function applyViewItem(item) {
        item.toggle();
        hideViewMenu();
    }

    function showViewMenu() {
        const menu = el('view-menu');
        menu.innerHTML = '';
        for (const item of VIEW_ITEMS) {
            menu.appendChild(menuRow(item.label, item.get(), VIEW_KEY_LABELS[item.id],
                () => applyViewItem(item), VIEW_APPLIES[item.id] === false));
        }
        openMenu(menu, 'view-btn');
    }

    /** Select a palette by position. Out of range does nothing. */
    function applyPaletteIndex(index) {
        if (index < 0 || index >= PALETTES.length) { return; }
        vscode.postMessage({ type: 'setPalette', name: PALETTES[index].name });
        hidePaletteMenu();
    }

    function showPaletteMenu() {
        const menu = el('palette-menu');
        menu.innerHTML = '';
        PALETTES.forEach((p, i) => {
            menu.appendChild(menuRow(p.label, p.name === currentPaletteName, PALETTE_KEYS[i],
                () => applyPaletteIndex(i)));
        });
        openMenu(menu, 'palette-btn');
    }

    el('view-btn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        hidePaletteMenu();
        if (el('view-menu').hidden) { showViewMenu(); } else { hideViewMenu(); }
    });
    el('palette-btn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        hideViewMenu();
        if (el('palette-menu').hidden) { showPaletteMenu(); } else { hidePaletteMenu(); }
    });
    // Anywhere else dismisses both. mousedown rather than click, so a menu is gone before
    // whatever was clicked acts on the same press.
    document.addEventListener('mousedown', (ev) => {
        for (const id of ['view-menu', 'palette-menu']) {
            const menu = el(id);
            if (!menu.hidden && !menu.contains(ev.target)) { menu.hidden = true; }
        }
    }, true);

    /** A View shortcut, arriving as a command from the extension rather than as a keydown. */
    function applyViewToggleById(id) {
        // `applies` as well as existence: the key has to do what the greyed row does, nothing.
        if (VIEW_APPLIES[id] === false) { return; }
        const item = VIEW_ITEMS.find(i => i.id === id);
        if (item) { applyViewItem(item); }
    }

    window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.type === 'viewToggle') { applyViewToggleById(msg.id); }
        if (msg.type === 'setPaletteIndex') { applyPaletteIndex(msg.index); }
        if (msg.type === 'paletteChange') {
            currentPalette = msg.palette;
            if (msg.paletteName) { currentPaletteName = msg.paletteName; }
            renderPage();
        }
    });

    renderPage();
}());
