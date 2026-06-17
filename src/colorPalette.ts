export interface C64Color {
    hex: string;
}

export type PaletteName = 'petmate' | 'colodore' | 'pepto' | 'peptontsc' | 'vice' | 'palgeneric' | 'deekay' | 'cgterm' | 'community' | 'ptoing';

function pal(hexes: string[]): C64Color[] {
    return hexes.map(hex => ({ hex }));
}

export const PALETTES: Record<PaletteName, C64Color[]> = {
    // Source: Petmate9 src/utils/palette.ts
    petmate: pal([
        '#000000', '#ffffff', '#924a40', '#84c5cc',
        '#9351b6', '#72b14b', '#483aa4', '#d5df7c',
        '#99692d', '#675201', '#c08178', '#606060',
        '#8a8a8a', '#b2ec91', '#867ade', '#aeaeae',
    ]),
    // Source: Petmate9 src/utils/palette.ts
    colodore: pal([
        '#000000', '#ffffff', '#813338', '#75cec8',
        '#8e3c97', '#56ac4d', '#2e2c9b', '#edf171',
        '#8e5029', '#553800', '#c46c71', '#4a4a4a',
        '#7b7b7b', '#a9ff9f', '#706deb', '#b2b2b2',
    ]),
    // Source: pepto.de/projects/colorvic/2001/ and VICE pepto-pal.vpl (identical)
    pepto: pal([
        '#000000', '#ffffff', '#68372b', '#70a4b2',
        '#6f3d86', '#588d43', '#352879', '#b8c76f',
        '#6f4f25', '#433900', '#9a6759', '#444444',
        '#6c6c6c', '#9ad284', '#6c5eb5', '#959595',
    ]),
    // Source: VICE pepto-ntsc.vpl
    peptontsc: pal([
        '#000000', '#ffffff', '#67372b', '#70a3b1',
        '#6f3d86', '#588c42', '#342879', '#b7c66e',
        '#6f4e25', '#423800', '#996759', '#434343',
        '#6b6b6b', '#9ad183', '#6b5eb5', '#959595',
    ]),
    // Source: Petmate9 src/utils/palette.ts
    vice: pal([
        '#000000', '#ffffff', '#b96a54', '#acf3fe',
        '#be73f8', '#9ae35b', '#695af1', '#fffd84',
        '#c5913c', '#8c7817', '#f3ab98', '#818181',
        '#b6b6b6', '#dcfea3', '#b1a0fc', '#e0e0e0',
    ]),
    // Source: new-palettes.md — generic mathematical baseline
    palgeneric: pal([
        '#000000', '#ffffff', '#800000', '#00ffff',
        '#ff00ff', '#00ff00', '#0000ff', '#ffff00',
        '#ff8000', '#804000', '#ff8080', '#404040',
        '#808080', '#80ff80', '#8080ff', '#c0c0c0',
    ]),
    // Source: new-palettes.md — artistic variant by DeeKay
    deekay: pal([
        '#000000', '#ffffff', '#960000', '#64f0f0',
        '#c850c8', '#00c864', '#0000b4', '#f0e65a',
        '#e68c46', '#5a3c00', '#ff6464', '#3c3c3c',
        '#8c8c8c', '#78ff78', '#50a0ff', '#d2d2d2',
    ]),
    // Source: new-palettes.md — CGTerm 3.0 terminal-optimized mapping
    cgterm: pal([
        '#000000', '#ffffff', '#880000', '#50dcdc',
        '#aa3caa', '#00aa55', '#0000aa', '#eeee77',
        '#dd8855', '#664400', '#ff7878', '#444444',
        '#888888', '#aaff78', '#78aaff', '#cccccc',
    ]),
    // Source: VICE community-colors.vpl — Retrofan et al.
    community: pal([
        '#000000', '#ffffff', '#af2a29', '#62d8cc',
        '#b03fb6', '#4ac64a', '#3739c4', '#e4ed4e',
        '#b6591c', '#683808', '#ea746c', '#4d4d4d',
        '#848484', '#a6fa9e', '#707ce6', '#b6b6b5',
    ]),
    // Source: VICE ptoing.vpl — Ptoing
    ptoing: pal([
        '#000000', '#ffffff', '#8c3e34', '#7abfc7',
        '#8d47b3', '#68a941', '#3e31a2', '#d0dc71',
        '#905f25', '#574200', '#bb776d', '#545454',
        '#808080', '#acea88', '#7c70da', '#ababab',
    ]),
};

export const PALETTE_NAMES: PaletteName[] = ['cgterm', 'colodore', 'community', 'deekay', 'palgeneric', 'pepto', 'peptontsc', 'petmate', 'ptoing', 'vice'];

export const PALETTE_LABELS: Record<PaletteName, string> = {
    cgterm:     'CGTerm',
    colodore:   'Colodore',
    community:  'Community',
    deekay:     'DeeKay',
    palgeneric: 'PALette',
    pepto:      'Pepto (PAL)',
    peptontsc:  'Pepto (NTSC)',
    petmate:    'Petmate',
    ptoing:     'Ptoing',
    vice:       'VICE',
};

export const DEFAULT_PALETTE: PaletteName = 'cgterm';
export const DEFAULT_BG_INDEX = 0;   // Black
export const DEFAULT_FG_INDEX = 14;  // Light blue (C64 BBS default)
