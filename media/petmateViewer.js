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
    const mciBtn = document.getElementById('mci-btn');
    const pageIndicator = document.getElementById('page-indicator');
    const dimensions = document.getElementById('dimensions');
    const paletteSelect = document.getElementById('palette-select');
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
        charsetBtn.textContent = currentLowercase ? 'Lowercase charset' : 'Uppercase charset';

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
    mciBtn.addEventListener('click', () => {
        showMci = !showMci;
        mciBtn.className = showMci ? '' : 'mci-hidden';
        renderPage();
        // Same as toggleCharset: host persists state only, no render response needed.
        vscode.postMessage({ type: 'toggleMci' });
    });
    paletteSelect.addEventListener('change', (e) => {
        vscode.postMessage({ type: 'setPalette', name: e.target.value });
    });

    window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.type === 'paletteChange') {
            currentPalette = msg.palette;
            renderPage();
        }
    });

    renderPage();
}());
