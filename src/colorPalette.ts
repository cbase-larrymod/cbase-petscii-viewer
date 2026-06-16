export interface C64Color {
    hex: string;
}

export type PaletteName = 'petmate' | 'colodore' | 'pepto' | 'vice';

function pal(hexes: string[]): C64Color[] {
    return hexes.map(hex => ({ hex }));
}

export const PALETTES: Record<PaletteName, C64Color[]> = {
    petmate: pal([
        '#000000', '#ffffff', '#883932', '#67b6bd',
        '#8b3f96', '#55a049', '#40318d', '#bfce72',
        '#8b5429', '#574200', '#b86962', '#505050',
        '#787878', '#94e089', '#7869c4', '#9f9f9f',
    ]),
    colodore: pal([
        '#000000', '#ffffff', '#9f4e44', '#6abfc6',
        '#a057a3', '#5cab5e', '#50459b', '#c9d487',
        '#a1683c', '#6d5412', '#cb7e75', '#626262',
        '#898989', '#9ae29b', '#887ecb', '#adadad',
    ]),
    pepto: pal([
        '#000000', '#ffffff', '#68372b', '#70a4b2',
        '#6f3d86', '#588d43', '#352879', '#b8c76f',
        '#6f4f25', '#433900', '#9a6759', '#444444',
        '#6c6c6c', '#9ad284', '#6c5eb5', '#959595',
    ]),
    vice: pal([
        '#000000', '#ffffff', '#894036', '#7abfc7',
        '#8a46ae', '#6aaf6c', '#3f3f8f', '#d2d26e',
        '#a47530', '#6c4e15', '#c38b80', '#636363',
        '#8a8a8a', '#b3f1ae', '#8080d5', '#aeaeae',
    ]),
};

export const DEFAULT_PALETTE: PaletteName = 'petmate';
export const DEFAULT_BG_INDEX = 0;   // Black
export const DEFAULT_FG_INDEX = 14;  // Light blue (C64 BBS default)
