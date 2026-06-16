// Packs a PETSCII byte and its active charset into a single codepoint value:
//   0xE0xx — uppercase/graphics charset, byte value xx
//   0xE1xx — lowercase charset, byte value xx
//
// Values are in Unicode's Private Use Area to avoid collision with real codepoints.
// Decoded in viewer.js as: byte = cp & 0xFF, lowercase = (cp >> 8) === 0xE1.

export function petsciiCodePoint(byte: number, lowercase: boolean): number {
    return (lowercase ? 0xE100 : 0xE000) | (byte & 0xFF);
}
