export interface C64Color {
    hex: string;
}

export type PaletteName = 'cgterm' | 'colodore' | 'palette' | 'peptopal' | 'peptontsc' | 'petmate' | 'vice';

function pal(hexes: string[]): C64Color[] {
    return hexes.map(hex => ({ hex }));
}

export const PALETTES: Record<PaletteName, C64Color[]> = {
    // Source: github.com/unbreached/CGTerm-3.0/src/gfx.c — identical to Pepto (PAL)
    cgterm: pal([
        '#000000', '#ffffff', '#68372b', '#70a4b2',
        '#6f3d86', '#588d43', '#352879', '#b8c76f',
        '#6f4f25', '#433900', '#9a6759', '#444444',
        '#6c6c6c', '#9ad284', '#6c5eb5', '#959595',
    ]),
    // Source: github.com/wbochar/petmate9/src/utils/palette.ts
    colodore: pal([
        '#000000', '#ffffff', '#813338', '#75cec8',
        '#8e3c97', '#56ac4d', '#2e2c9b', '#edf171',
        '#8e5029', '#553800', '#c46c71', '#4a4a4a',
        '#7b7b7b', '#a9ff9f', '#706deb', '#b2b2b2',
    ]),
    // Source: github.com/VICE-Team/svn-mirror/vice/data/C64/palette.vpl — PAL/Offence
    palette: pal([
        '#000000', '#d5d5d5', '#72352c', '#659fa6',
        '#733a91', '#568d35', '#2e237d', '#aeb75e',
        '#774f1e', '#4b3c00', '#9c635a', '#474747',
        '#6b6b6b', '#8fc271', '#675db6', '#8f8f8f',
    ]),
    // Source: github.com/VICE-Team/svn-mirror//vice/data/C64/pepto-pal.vpl
    peptopal: pal([
        '#000000', '#ffffff', '#68372b', '#70a4b2',
        '#6f3d86', '#588d43', '#352879', '#b8c76f',
        '#6f4f25', '#433900', '#9a6759', '#444444',
        '#6c6c6c', '#9ad284', '#6c5eb5', '#959595',
    ]),
    // Source: github.com/VICE-Team/svn-mirror//vice/data/C64/pepto-ntsc.vpl
    peptontsc: pal([
        '#000000', '#ffffff', '#67372b', '#70a3b1',
        '#6f3d86', '#588c42', '#342879', '#b7c66e',
        '#6f4e25', '#423800', '#996659', '#434343',
        '#6b6b6b', '#9ad183', '#6b5eb5', '#959595',
    ]),
    // Source: github.com/wbochar/petmate9/src/utils/palette.ts — default 'petmate' palette
    petmate: pal([
        '#000000', '#ffffff', '#924a40', '#84c5cc',
        '#9351b6', '#72b14b', '#483aa4', '#d5df7c',
        '#99692d', '#675201', '#c08178', '#606060',
        '#8a8a8a', '#b2ec91', '#867ade', '#aeaeae',
    ]),
    // Source: github.com/VICE-Team/svn-mirror/vice/data/C64/palette_6569R5_v1r.vpl (Tobias, chip 6569R5 — VICE "Internal" default for PAL)
    vice: pal([
        '#000000', '#ffffff', '#8d3043', '#66c0ad',
        '#90359f', '#49a64b', '#3829ad', '#c7d555',
        '#8e5117', '#533d00', '#be6275', '#4e4e4e',
        '#767676', '#8ce88e', '#7162e6', '#a3a3a3',
    ]),
};

export const PALETTE_NAMES: PaletteName[] = ['cgterm', 'colodore', 'palette', 'peptopal', 'peptontsc', 'petmate', 'vice'];

export const PALETTE_LABELS: Record<PaletteName, string> = {
    cgterm:    'CGTerm',
    colodore:  'Colodore',
    palette:   'PALette',
    petmate:   'Petmate',
    peptopal:  'Pepto (PAL)',
    peptontsc: 'Pepto (NTSC)',
    vice:      'VICE',
};

export const DEFAULT_PALETTE: PaletteName = 'cgterm';
export const DEFAULT_BG_INDEX = 0;
export const DEFAULT_FG_INDEX = 14;
