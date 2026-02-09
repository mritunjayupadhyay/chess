import { IPiece } from './piece.interface';

export interface IPosition {
    x: number;
    y: number;
}

export interface IBoxPosition {
    label: string;
    position: IPosition;
    piece?: IPiece
}
