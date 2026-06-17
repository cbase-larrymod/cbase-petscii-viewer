(function () {
    const vscode = acquireVsCodeApi();
    const config = window.__SEQ_CONFIG;

    // C64 character ROM — provided by charRom.js as window.__C64_CHARSET (Uint8Array, 4096 bytes):
    // bytes 0-2047 = uppercase/graphics charset, bytes 2048-4095 = lowercase charset.
    // Each screen code occupies 8 bytes (one byte per pixel row, MSB = leftmost pixel, 1 = foreground).
    const charsetData = window.__C64_CHARSET;

    // PETSCII byte → screen code (CGTerm kernal.c formula)
    const SCCONV = [128, 0, -64, -32, 64, -64, -128, -128];
    function toSc(b) {
        if (b === 0xFF) return 94;
        return (b + SCCONV[b >> 5]) & 0xFF;
    }

    // '#rrggbb' → [r, g, b] — provided by charRom.js
    const hexRgb = window.__hexRgb;

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
        // Build via DOM rather than innerHTML to avoid re-querying the element
        // by id to attach the listener after each render.
        const span = document.createElement('span');
        span.id = 'dim-cols';
        span.textContent = String(cols);
        span.addEventListener('click', startColsEdit);
        dimensionsEl.textContent = '';
        dimensionsEl.appendChild(span);
        dimensionsEl.appendChild(document.createTextNode('\xD7' + rows));
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
                updateDimensions(val, currentRows);
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
