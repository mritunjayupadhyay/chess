// Constants
export {
    HorizontalKeys,
    VerticalKeys,
    kingMovementInCastling,
    pieceType,
    piecePoint,
    LightColor,
    DarkColor,
    allColorType,
    LIGHT_KING_INITIAL_POSITION,
    LIGHT_LEFT_ROOK_INITIAL_POSITION,
    LIGHT_RIGHT_ROOK_INITIAL_POSITION,
    DARK_KING_INITIAL_POSITION,
    DARK_LEFT_ROOK_INITIAL_POSITION,
    DARK_RIGHT_ROOK_INITIAL_POSITION,
} from './constants';
export type { colorType } from './constants';

// Interfaces
export type { IPosition, IBoxPosition } from './interfaces/position.interface';
export type { IPiece } from './interfaces/piece.interface';
export type { ICastlingBox, IPieceMoved, ICastlingData } from './interfaces/castling.interface';
export type { IColor } from './interfaces/color.interface';
export type { IPositionAndPiece } from './interfaces';

// Helpers
export { getLabel } from './helpers/label.helper';
export { checkIfOutside } from './helpers/position.helper';

// Logic
export { getPossibleMove, isInDanger } from './logic';
export type { IGetAllPossibleMove } from './logic';
export { castlingData, getUpdatedCastlingData, getCastlingBox } from './logic/castling.logic';
