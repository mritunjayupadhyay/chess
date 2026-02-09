import { colorType, pieceType } from '../constants';
import { IPosition } from './position.interface';

export interface IPiece {
    position: IPosition;
    color: colorType;
    type: pieceType;
    isAlive: boolean;
    points: number;
}
