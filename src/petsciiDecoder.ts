import { petsciiCodePoint } from './petsciiMaps';
import { DEFAULT_FG_INDEX } from './colorPalette';

export interface DecodedChar {
    codePoint: number;
    reverse: boolean;
    fgIndex: number;  // palette index 0–15
}

// PETSCII color control codes → palette index
const COLOR_CODES = new Map<number, number>([
    [0x90, 0],  // Black
    [0x05, 1],  // White
    [0x1C, 2],  // Red
    [0x9F, 3],  // Cyan
    [0x9C, 4],  // Purple
    [0x1E, 5],  // Green
    [0x1F, 6],  // Blue
    [0x9E, 7],  // Yellow
    [0x81, 8],  // Orange
    [0x95, 9],  // Brown
    [0x96, 10], // Light red
    [0x97, 11], // Dark grey
    [0x98, 12], // Grey
    [0x99, 13], // Light green
    [0x9A, 14], // Light blue
    [0x9B, 15], // Light grey
]);

// Non-color control codes to strip silently
const STRIP = new Set<number>([
    0x00,           // NUL
    0x03,           // RUN/STOP
    0x0A,           // LF (unused in PETSCII)
    0x08, 0x09,     // Disable/enable C=-Shift
    0x85, 0x86, 0x87, 0x88, 0x89, 0x8A, 0x8B, 0x8C, // F1–F8
    0x0E,           // Switch to lowercase charset (whole-file mode)
    0x0F,           // Unused
    0x11, 0x91,     // Cursor down/up
    0x13,           // Home
    0x17,           // Cursor right (variant)
    0x1D, 0x9D,     // Cursor right/left
    0x8E,           // Switch to uppercase/graphics charset
    0x94,           // Insert
    // 0x93 (Clear screen) is handled explicitly — tracked as a CLS boundary
]);

const PLACEHOLDER = 0x00B7; // · for unhandled control codes

export function decode(data: Uint8Array, lowercase: boolean, cols: number = 40): { rows: DecodedChar[][]; clsBeforeRows: number[] } {
    const rows: DecodedChar[][] = [];
    const clsBeforeRows: number[] = [];
    let row: DecodedChar[] = [];
    let reverse = false;
    let fgIndex = DEFAULT_FG_INDEX;
    let lastWasAutoWrap = false;
    let pendingCls = false;

    function pushRow() {
        if (pendingCls) { clsBeforeRows.push(rows.length); pendingCls = false; }
        rows.push(row);
        row = [];
    }

    function push(codePoint: number) {
        row.push({ codePoint, reverse, fgIndex });
        if (row.length === cols) {
            pushRow();
            lastWasAutoWrap = true;
        } else {
            lastWasAutoWrap = false;
        }
    }

    for (const byte of data) {
        if (byte === 0x0D || byte === 0x8D) {
            // $8D (Shift+Return) is used as the sole row terminator in many SEQ files.
            // Skip push when CR immediately follows an auto-wrap to avoid a
            // spurious blank row; still push for intentional blank lines.
            if (row.length > 0 || !lastWasAutoWrap) {
                pushRow();
            }
            reverse = false;
            lastWasAutoWrap = false;
        } else if (byte === 0x93) {
            // Clear screen — flush any partial row, then mark the next row as a CLS boundary.
            if (row.length > 0) {
                pushRow();
                lastWasAutoWrap = false;
            }
            pendingCls = true;
        } else if (byte === 0x12) {
            reverse = true;
        } else if (byte === 0x92) {
            reverse = false;
        } else if (COLOR_CODES.has(byte)) {
            fgIndex = COLOR_CODES.get(byte)!;
        } else if (STRIP.has(byte)) {
            // intentionally ignored
        } else if (isControlCode(byte)) {
            push(PLACEHOLDER);
        } else if (byte === 0x20) {
            push(0x0020);
        } else {
            push(petsciiCodePoint(byte, lowercase));
        }
    }

    if (row.length > 0) {
        pushRow();
    }

    return { rows, clsBeforeRows };
}

function isControlCode(byte: number): boolean {
    return byte < 0x20 || (byte >= 0x80 && byte <= 0x9F);
}
