export interface PetmateCell {
    sc: number;   // C64 screen code (0-255), direct index into the embedded ROM
    f: number;    // palette color index 0-15
}

export interface PetmatePage {
    name?: string;
    width: number;
    height: number;
    lowercase: boolean;          // charset === 'lower'
    bgIndex: number;
    cells: PetmateCell[][];
    unsupportedCharset?: string; // set when charset isn't 'upper'/'lower'; cells is empty
}

interface PetmatePixelJson {
    code: number;
    color: number;
}

interface PetmateFramebufJson {
    width: number;
    height: number;
    backgroundColor: number;
    charset: string;
    name?: string;
    framebuf: PetmatePixelJson[][];
}

interface PetmateWorkspaceJson {
    version: number;
    screens: number[];
    framebufs: PetmateFramebufJson[];
}

// Scoped to the two built-in C64 charsets ('upper', 'lower') that match our embedded
// character ROM. Other platforms' charsets (c128vdc, vic20*, c16*, petGfx/petBiz) and
// custom embedded fonts are out of scope — C*Base is C64-only.
export function decode(jsonText: string): PetmatePage[] {
    const ws: PetmateWorkspaceJson = JSON.parse(jsonText);
    const screens = ws.screens ?? [];

    return screens.map(idx => {
        const fb = ws.framebufs[idx];

        if (fb.charset !== 'upper' && fb.charset !== 'lower') {
            return {
                name: fb.name,
                width: fb.width,
                height: fb.height,
                lowercase: false,
                bgIndex: fb.backgroundColor,
                cells: [],
                unsupportedCharset: fb.charset,
            };
        }

        return {
            name: fb.name,
            width: fb.width,
            height: fb.height,
            lowercase: fb.charset === 'lower',
            bgIndex: fb.backgroundColor,
            cells: fb.framebuf.map(row => row.map(px => ({ sc: px.code, f: px.color }))),
        };
    });
}
