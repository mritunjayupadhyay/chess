// Re-export everything from the shared chess-logic package
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
} from '@myproject/chess-logic';
export type { colorType } from '@myproject/chess-logic';
