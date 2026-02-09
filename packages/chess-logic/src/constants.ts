import { IPosition } from './interfaces/position.interface';

export const HorizontalKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const VerticalKeys = ['1', '2', '3', '4', '5', '6', '7', '8'];

export type colorType = 'light' | 'dark';

export const kingMovementInCastling = 2;

export enum pieceType {
    PAWN = "PAWN",
    KNIGHT = "KNIGHT",
    BISHOP = "BISHOP",
    ROOK = "ROOK",
    QUEEN = "QUEEN",
    KING = "KING"
}

export enum piecePoint {
    PAWN = 1,
    KNIGHT = 3,
    BISHOP = 3,
    ROOK = 5,
    QUEEN = 9,
    KING = 1000
}

export const LightColor: colorType = 'light';
export const DarkColor: colorType = 'dark';

export enum allColorType {
    LIGHT_COLOR = "light",
    DARK_COLOR = "dark"
}

export const LIGHT_KING_INITIAL_POSITION: IPosition = {
    x: 4,
    y: 0
};
export const LIGHT_LEFT_ROOK_INITIAL_POSITION: IPosition = {
    x: 0,
    y: 0
}
export const LIGHT_RIGHT_ROOK_INITIAL_POSITION: IPosition = {
    x: 7,
    y: 0
}

export const DARK_KING_INITIAL_POSITION: IPosition = {
    x: 4,
    y: 7
};
export const DARK_LEFT_ROOK_INITIAL_POSITION: IPosition = {
    x: 0,
    y: 0
}
export const DARK_RIGHT_ROOK_INITIAL_POSITION: IPosition = {
    x: 7,
    y: 0
}
