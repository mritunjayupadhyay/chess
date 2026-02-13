import { IPiece } from '../interfaces/piece.interface';
import { colorType, pieceType } from '../constants';
import { ICastlingData } from '../interfaces/castling.interface';

const pieceToFenChar: Record<string, string> = {
    [pieceType.KING]: 'k',
    [pieceType.QUEEN]: 'q',
    [pieceType.ROOK]: 'r',
    [pieceType.BISHOP]: 'b',
    [pieceType.KNIGHT]: 'n',
    [pieceType.PAWN]: 'p',
};

export function piecesToFen(
    pieces: IPiece[],
    activeColor: colorType,
    castlingData: Record<colorType, ICastlingData>,
): string {
    // Build 8x8 board: board[rank][file], rank 0 = rank 8 (top), rank 7 = rank 1 (bottom)
    const board: (string | null)[][] = Array.from({ length: 8 }, () =>
        Array.from({ length: 8 }, () => null),
    );

    for (const piece of pieces) {
        if (!piece.isAlive) continue;
        const file = piece.position.x; // 0=a .. 7=h
        const rank = piece.position.y; // 0=rank1 .. 7=rank8
        const fenChar = pieceToFenChar[piece.type];
        const char = piece.color === 'light' ? fenChar.toUpperCase() : fenChar;
        // FEN goes rank8 (y=7) first → row index 0
        board[7 - rank][file] = char;
    }

    // Build piece placement string
    const ranks: string[] = [];
    for (let r = 0; r < 8; r++) {
        let rankStr = '';
        let emptyCount = 0;
        for (let f = 0; f < 8; f++) {
            if (board[r][f]) {
                if (emptyCount > 0) {
                    rankStr += emptyCount;
                    emptyCount = 0;
                }
                rankStr += board[r][f];
            } else {
                emptyCount++;
            }
        }
        if (emptyCount > 0) {
            rankStr += emptyCount;
        }
        ranks.push(rankStr);
    }

    const piecePlacement = ranks.join('/');

    // Active color
    const activeColorFen = activeColor === 'light' ? 'w' : 'b';

    // Castling availability
    let castling = '';
    const lightCastling = castlingData['light'];
    if (!lightCastling.isDone && !lightCastling.isKingMoved) {
        // Kingside rook is at x=7
        const kingsideRook = lightCastling.rook.find(r => r.position.x === 7);
        if (kingsideRook && !kingsideRook.isMoved) castling += 'K';
        // Queenside rook is at x=0
        const queensideRook = lightCastling.rook.find(r => r.position.x === 0);
        if (queensideRook && !queensideRook.isMoved) castling += 'Q';
    }
    const darkCastling = castlingData['dark'];
    if (!darkCastling.isDone && !darkCastling.isKingMoved) {
        const kingsideRook = darkCastling.rook.find(r => r.position.x === 7);
        if (kingsideRook && !kingsideRook.isMoved) castling += 'k';
        const queensideRook = darkCastling.rook.find(r => r.position.x === 0);
        if (queensideRook && !queensideRook.isMoved) castling += 'q';
    }
    if (!castling) castling = '-';

    // En passant, halfmove, fullmove — not tracked internally
    return `${piecePlacement} ${activeColorFen} ${castling} - 0 1`;
}
