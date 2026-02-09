import { IBoxPosition, IPosition } from './position.interface';

export interface ICastlingBox {
    rook: IBoxPosition,
    king: IBoxPosition,
    kingNextPosition: IPosition,
    rookNextPosition: IPosition
}

export interface IPieceMoved {
    isMoved: boolean,
    position: IPosition
}

export interface ICastlingData {
    isDone: boolean,
    isKingMoved: boolean,
    rook: IPieceMoved[]
}
