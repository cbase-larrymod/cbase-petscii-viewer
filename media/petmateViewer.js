(function () {
    const vscode = acquireVsCodeApi();
    const config = window.__PETMATE_CONFIG;

    // Same embedded C64 character ROM as viewer.js — 4096 bytes: bytes 0-2047 = uppercase/graphics
    // charset, bytes 2048-4095 = lowercase charset. 8 bytes per glyph, one byte per pixel row.
    const CHARSET_B64 = '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ZjwOAHxmZnx4bGYAPGZgPAZmPAB+GBgYGBgYAGZmZmZmZjwAZmZmZmY8GABjY2Nrf3djAGZmPBg8ZmYAZmZmPBgYGAB+BgwYMGB+ABgYGP//GBgYwMAwMMDAMDAYGBgYGBgYGDMzzMwzM8zMM5nMZjOZzGYAAAAAAAAAAPDw8PDw8PDwAAAAAP//////AAAAAAAAAAAAAAAAAAD/wMDAwMDAwMDMzDMzzMwzMwMDAwMDAwMDAAAAAMzMMzPMmTNmzJkzZgMDAwMDAwMDGBgYHx8YGBgAAAAADw8PDxgYGB8fAAAAAAAA+PgYGBgAAAAAAAD//wAAAB8fGBgYGBgY//8AAAAAAAD//xgYGBgYGPj4GBgYwMDAwMDAwMDg4ODg4ODg4AcHBwcHBwcH//8AAAAAAAD///8AAAAAAAAAAAAA////AQMGbHhwYAAAAAAA8PDw8A8PDw8AAAAAGBgY+PgAAADw8PDwAAAAAPDw8PAPDw8Pw5mRkZ+Zw////8P5wZnB//+fn4OZmYP////Dn5+fw///+fnBmZnB////w5mBn8P///Hnwefn5////8GZmcH5g/+fn4OZmZn//+f/x+fnw///+f/5+fn5w/+fn5OHk5n//8fn5+fnw////5mAgJSc////g5mZmZn////DmZmZw////4OZmYOfn///wZmZwfn5//+DmZ+fn////8Gfw/mD///ngefn5/H///+ZmZmZwf///5mZmcPn////nJSAwcn///+Zw+fDmf///5mZmcHzh///gfPnz4H/w8/Pz8/Pw//z7c+Dz50D/8Pz8/Pz88P//+fDgefn5+f/78+AgM/v////////////5+fn5///5/+ZmZn//////5mZAJkAmZn/58Gfw/mD5/+dmfPnz5m5/8OZw8eYmcD/+fPn///////z58/Pz+fz/8/n8/Pz58///5nDAMOZ////5+eB5+f/////////5+fP////gf///////////+fn///8+fPnz5//w5mRiZmZw//n58fn5+eB/8OZ+fPPn4H/w5n54/mZw//58eGZgPn5/4Gfg/n5mcP/w5mfg5mZw/+BmfPn5+fn/8OZmcOZmcP/w5mZwfmZw////+f//+f/////5///5+fP8efPn8/n8f///4H/gf///4/n8/nz54//w5n58+f/5/////8AAP///+fDmYGZmZn/g5mZg5mZg//DmZ+fn5nD/4eTmZmZk4f/gZ+fh5+fgf+Bn5+Hn5+f/8OZn5GZmcP/mZmZgZmZmf/D5+fn5+fD/+Hz8/Pzk8f/mZOHj4eTmf+fn5+fn5+B/5yIgJScnJz/mYmBgZGZmf/DmZmZmZnD/4OZmYOfn5//w5mZmZnD8f+DmZmDh5OZ/8OZn8P5mcP/gefn5+fn5/+ZmZmZmZnD/5mZmZmZw+f/nJyclICInP+ZmcPnw5mZ/5mZmcPn5+f/gfnz58+fgf/n5+cAAOfn5z8/z88/P8/P5+fn5+fn5+fMzDMzzMwzM8xmM5nMZjOZ//////////8PDw8PDw8PD/////8AAAAAAP//////////////////AD8/Pz8/Pz8/MzPMzDMzzMz8/Pz8/Pz8/P////8zM8zMM2bMmTNmzJn8/Pz8/Pz8/Ofn5+Dg5+fn//////Dw8PDn5+fg4P///////wcH5+fn////////AAD////g4Ofn5+fn5wAA////////AADn5+fn5+cHB+fn5z8/Pz8/Pz8/Hx8fHx8fHx/4+Pj4+Pj4+AAA////////AAAA/////////////wAAAP78+ZOHj5///////w8PDw/w8PDw/////+fn5wcH////Dw8PD/////8PDw8P8PDw8A==';
    const charsetData = Uint8Array.from(atob(CHARSET_B64), c => c.charCodeAt(0));

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

    // '#rrggbb' -> [r, g, b]
    function hexRgb(hex) {
        const n = parseInt(hex.slice(1), 16);
        return [(n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
    }

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
    let currentLowercase = config.lowercase !== false;
    const bgOverride = {}; // pageIndex -> palette index, session-only, not persisted

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
        charsetBtn.textContent = currentLowercase ? 'Lowercase charset' : 'Uppercase charset';
        renderPage();
        vscode.postMessage({ type: 'toggleCharset' });
    });
    mciBtn.addEventListener('click', () => {
        showMci = !showMci;
        mciBtn.className = showMci ? '' : 'mci-hidden';
        renderPage();
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
