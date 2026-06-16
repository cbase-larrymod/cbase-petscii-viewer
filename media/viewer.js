(function () {
    const vscode = acquireVsCodeApi();
    const config = window.__SEQ_CONFIG;

    // C64 character ROM — 4096 bytes: bytes 0-2047 = uppercase/graphics charset,
    // bytes 2048-4095 = lowercase charset. Each screen code occupies 8 bytes (one
    // byte per pixel row, MSB = leftmost pixel, 1 = foreground).
    const CHARSET_B64 = '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ZjwOAHxmZnx4bGYAPGZgPAZmPAB+GBgYGBgYAGZmZmZmZjwAZmZmZmY8GABjY2Nrf3djAGZmPBg8ZmYAZmZmPBgYGAB+BgwYMGB+ABgYGP//GBgYwMAwMMDAMDAYGBgYGBgYGDMzzMwzM8zMM5nMZjOZzGYAAAAAAAAAAPDw8PDw8PDwAAAAAP//////AAAAAAAAAAAAAAAAAAD/wMDAwMDAwMDMzDMzzMwzMwMDAwMDAwMDAAAAAMzMMzPMmTNmzJkzZgMDAwMDAwMDGBgYHx8YGBgAAAAADw8PDxgYGB8fAAAAAAAA+PgYGBgAAAAAAAD//wAAAB8fGBgYGBgY//8AAAAAAAD//xgYGBgYGPj4GBgYwMDAwMDAwMDg4ODg4ODg4AcHBwcHBwcH//8AAAAAAAD///8AAAAAAAAAAAAA////AQMGbHhwYAAAAAAA8PDw8A8PDw8AAAAAGBgY+PgAAADw8PDwAAAAAPDw8PAPDw8Pw5mRkZ+Zw////8P5wZnB//+fn4OZmYP////Dn5+fw///+fnBmZnB////w5mBn8P///Hnwefn5////8GZmcH5g/+fn4OZmZn//+f/x+fnw///+f/5+fn5w/+fn5OHk5n//8fn5+fnw////5mAgJSc////g5mZmZn////DmZmZw////4OZmYOfn///wZmZwfn5//+DmZ+fn////8Gfw/mD///ngefn5/H///+ZmZmZwf///5mZmcPn////nJSAwcn///+Zw+fDmf///5mZmcHzh///gfPnz4H/w8/Pz8/Pw//z7c+Dz50D/8Pz8/Pz88P//+fDgefn5+f/78+AgM/v////////////5+fn5///5/+ZmZn//////5mZAJkAmZn/58Gfw/mD5/+dmfPnz5m5/8OZw8eYmcD/+fPn///////z58/Pz+fz/8/n8/Pz58///5nDAMOZ////5+eB5+f/////////5+fP////gf///////////+fn///8+fPnz5//w5mRiZmZw//n58fn5+eB/8OZ+fPPn4H/w5n54/mZw//58eGZgPn5/4Gfg/n5mcP/w5mfg5mZw/+BmfPn5+fn/8OZmcOZmcP/w5mZwfmZw////+f//+f/////5///5+fP8efPn8/n8f///4H/gf///4/n8/nz54//w5n58+f/5/////8AAP///+fDmYGZmZn/g5mZg5mZg//DmZ+fn5nD/4eTmZmZk4f/gZ+fh5+fgf+Bn5+Hn5+f/8OZn5GZmcP/mZmZgZmZmf/D5+fn5+fD/+Hz8/Pzk8f/mZOHj4eTmf+fn5+fn5+B/5yIgJScnJz/mYmBgZGZmf/DmZmZmZnD/4OZmYOfn5//w5mZmZnD8f+DmZmDh5OZ/8OZn8P5mcP/gefn5+fn5/+ZmZmZmZnD/5mZmZmZw+f/nJyclICInP+ZmcPnw5mZ/5mZmcPn5+f/gfnz58+fgf/n5+cAAOfn5z8/z88/P8/P5+fn5+fn5+fMzDMzzMwzM8xmM5nMZjOZ//////////8PDw8PDw8PD/////8AAAAAAP//////////////////AD8/Pz8/Pz8/MzPMzDMzzMz8/Pz8/Pz8/P////8zM8zMM2bMmTNmzJn8/Pz8/Pz8/Ofn5+Dg5+fn//////Dw8PDn5+fg4P///////wcH5+fn////////AAD////g4Ofn5+fn5wAA////////AADn5+fn5+cHB+fn5z8/Pz8/Pz8/Hx8fHx8fHx/4+Pj4+Pj4+AAA////////AAAA/////////////wAAAP78+ZOHj5///////w8PDw/w8PDw/////+fn5wcH////Dw8PD/////8PDw8P8PDw8A==';
    const charsetData = Uint8Array.from(atob(CHARSET_B64), c => c.charCodeAt(0));

    // PETSCII byte → screen code (CGTerm kernal.c formula)
    const SCCONV = [128, 0, -64, -32, 64, -64, -128, -128];
    function toSc(b) {
        if (b === 0xFF) return 94;
        return (b + SCCONV[b >> 5]) & 0xFF;
    }

    // '#rrggbb' → [r, g, b]
    function hexRgb(hex) {
        const n = parseInt(hex.slice(1), 16);
        return [(n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
    }

    const swatchContainer = document.getElementById('swatches');
    const canvas = document.getElementById('content');
    const ctx = canvas.getContext('2d');
    const resizeHandle = document.getElementById('resize-handle');
    const resetColsBtn = document.getElementById('reset-cols-btn');
    const dimensionsEl = document.getElementById('dimensions');

    let currentChars = config.chars;
    let currentPalette = config.palette;
    let currentBgIndex = config.bgIndex;
    let currentClsBeforeRows = config.clsBeforeRows;
    let currentShowCls = config.showCls;
    let currentCols = config.cols || 40;
    let currentRows = 0;
    let editingCols = false;

    function updateDimensions(cols, rows) {
        currentRows = rows;
        if (editingCols) return;
        resetColsBtn.style.display = cols !== 40 ? 'inline-block' : 'none';
        dimensionsEl.innerHTML =
            '<span id="dim-cols">' + cols + '</span>×' + rows;
        document.getElementById('dim-cols').addEventListener('click', startColsEdit);
    }

    function startColsEdit() {
        if (editingCols) return;
        editingCols = true;
        let committed = false;

        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.value = String(currentCols);
        input.style.cssText =
            'width:4ch;font-family:monospace;font-size:12px;color:#ccc;' +
            'background:#333;border:1px solid #555;border-radius:3px;' +
            'padding:0 2px;margin-right:1px;outline:none;';

        const suffix = document.createElement('span');
        suffix.textContent = '×' + currentRows;
        dimensionsEl.innerHTML = '';
        dimensionsEl.appendChild(input);
        dimensionsEl.appendChild(suffix);
        input.focus();
        input.select();

        function commit() {
            committed = true;
            editingCols = false;
            const val = parseInt(input.value, 10);
            if (!isNaN(val) && val >= 20 && val <= 200) {
                dimensionsEl.textContent = val + '×' + currentRows;
                vscode.postMessage({ type: 'setCols', cols: val });
            } else {
                updateDimensions(currentCols, currentRows);
            }
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            else if (e.key === 'Escape') {
                committed = true;
                editingCols = false;
                updateDimensions(currentCols, currentRows);
            }
        });
        input.addEventListener('blur', () => {
            if (!committed) { editingCols = false; updateDimensions(currentCols, currentRows); }
        });
    }

    function rerender() {
        const rows = currentChars;
        const clsRows = (currentShowCls && currentClsBeforeRows.length > 0) ? currentClsBeforeRows : [];

        const ROWS = rows.length;
        if (ROWS === 0) { canvas.width = 0; canvas.height = 0; return; }

        const W = currentCols * 8;

        canvas.width = W;
        canvas.height = ROWS * 8;
        canvas.style.width = (currentCols * 16) + 'px';
        canvas.style.height = (ROWS * 16) + 'px';
        updateDimensions(currentCols, ROWS);

        const bgHex = currentPalette[currentBgIndex];
        const bgRgb = hexRgb(bgHex);
        const paletteRgb = currentPalette.map(hexRgb);

        const imgData = ctx.createImageData(W, ROWS * 8);
        const px = imgData.data;

        // Pre-fill with C64 background color
        for (let i = 0; i < px.length; i += 4) {
            px[i] = bgRgb[0]; px[i + 1] = bgRgb[1]; px[i + 2] = bgRgb[2]; px[i + 3] = 255;
        }

        // Draw content characters
        for (let row = 0; row < ROWS; row++) {
            const rowChars = rows[row];
            for (let col = 0; col < rowChars.length; col++) {
                const ch = rowChars[col];
                const b = ch.cp & 0xFF;
                const sc = toSc(b);
                const lowercase = (ch.cp >> 8) === 0xE1; // 0xE1xx = lowercase, 0xE0xx = uppercase
                const offset = (lowercase ? 2048 : 0) + sc * 8;
                const fgRgb = paletteRgb[ch.f];
                const drawFg = ch.r ? bgRgb : fgRgb;
                const drawBg = ch.r ? fgRgb : bgRgb;

                for (let cy = 0; cy < 8; cy++) {
                    const byte = charsetData[offset + cy];
                    for (let cx = 0; cx < 8; cx++) {
                        const bit = (byte >> (7 - cx)) & 1;
                        if (!ch.r && !bit) continue; // bg already filled
                        const color = bit ? drawFg : drawBg;
                        const pi = ((row * 8 + cy) * W + col * 8 + cx) * 4;
                        px[pi] = color[0]; px[pi + 1] = color[1]; px[pi + 2] = color[2];
                    }
                }
            }
        }

        // Draw CLS break line (fluorescent green, 2-on 2-off dashes)
        if (clsRows.length > 0) {
            const LINE = [57, 255, 20];
            for (const rowIdx of clsRows) {
                if (rowIdx <= 0 || rowIdx >= ROWS) continue;
                const lineY = rowIdx * 8;
                for (let lx = 0; lx < W; lx++) {
                    if (lx % 4 < 2) {
                        const pi = (lineY * W + lx) * 4;
                        px[pi] = LINE[0]; px[pi + 1] = LINE[1]; px[pi + 2] = LINE[2]; px[pi + 3] = 255;
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    function buildSwatches(paletteHexes, activeBgIndex) {
        swatchContainer.innerHTML = '';
        paletteHexes.forEach((hex, i) => {
            const div = document.createElement('div');
            div.className = 'swatch' + (i === activeBgIndex ? ' active' : '');
            div.style.backgroundColor = hex;
            div.title = 'Color ' + i;
            div.addEventListener('click', () => {
                document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
                div.classList.add('active');
                currentBgIndex = i;
                rerender();
                vscode.postMessage({ type: 'setBgColor', index: i });
            });
            swatchContainer.appendChild(div);
        });
    }

    buildSwatches(currentPalette, currentBgIndex);
    rerender();

    document.getElementById('charset-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'toggleCharset' });
    });

    document.getElementById('mci-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'toggleMci' });
    });

    document.getElementById('cls-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'toggleCls' });
    });

    document.getElementById('palette-select').addEventListener('change', (e) => {
        vscode.postMessage({ type: 'setPalette', name: e.target.value });
    });

    // Drag-to-resize handle — drags the right edge of the canvas to change column count.
    // Each character cell is 16px wide on screen (2x scale), so column delta = round(ΔX / 16).
    let dragStartX = 0;
    let dragStartCols = 40;

    resizeHandle.addEventListener('mousedown', (e) => {
        dragStartX = e.clientX;
        dragStartCols = currentCols;
        resizeHandle.classList.add('dragging');
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!resizeHandle.classList.contains('dragging')) return;
        const newCols = Math.max(20, Math.min(200, dragStartCols + Math.round((e.clientX - dragStartX) / 16)));
        if (newCols !== currentCols) {
            currentCols = newCols;
            vscode.postMessage({ type: 'setCols', cols: currentCols });
        }
    });

    document.addEventListener('mouseup', () => {
        resizeHandle.classList.remove('dragging');
    });

    resetColsBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'setCols', cols: 40 });
    });

    window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.type === 'render') {
            document.getElementById('charset-btn').textContent =
                msg.lowercase ? 'Lowercase charset' : 'Uppercase charset';
            document.getElementById('mci-btn').className = msg.showMci ? '' : 'mci-hidden';
            currentChars = msg.chars;
            currentCols = msg.cols || currentCols;
            currentShowCls = msg.showCls !== false;
            rerender();
        }
        if (msg.type === 'paletteChange') {
            currentPalette = msg.palette;
            buildSwatches(msg.palette, currentBgIndex);
            rerender();
        }
        if (msg.type === 'clsToggle') {
            currentShowCls = msg.showCls;
            document.getElementById('cls-btn').className = msg.showCls ? '' : 'cls-hidden';
            rerender();
        }
    });
}());
