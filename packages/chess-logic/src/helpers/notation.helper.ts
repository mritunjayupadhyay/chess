import { pieceType } from '../constants';
import { HorizontalKeys, VerticalKeys } from '../constants';
import { IPosition } from '../interfaces/position.interface';

export interface INotationInput {
    pieceType: pieceType;
    from: IPosition;
    to: IPosition;
    captured?: pieceType;
    isCheck?: boolean;
    isCheckmate?: boolean;
    isCastlingKingside?: boolean;
    isCastlingQueenside?: boolean;
}

const pieceSymbol: Partial<Record<pieceType, string>> = {
    [pieceType.KING]: 'K',
    [pieceType.QUEEN]: 'Q',
    [pieceType.ROOK]: 'R',
    [pieceType.BISHOP]: 'B',
    [pieceType.KNIGHT]: 'N',
};

function squareLabel(pos: IPosition): string {
    return `${HorizontalKeys[pos.x]}${VerticalKeys[pos.y]}`;
}

export function toAlgebraicNotation(input: INotationInput): string {
    if (input.isCastlingKingside) {
        return 'O-O' + suffix(input);
    }
    if (input.isCastlingQueenside) {
        return 'O-O-O' + suffix(input);
    }

    const target = squareLabel(input.to);
    const captures = input.captured ? 'x' : '';

    if (input.pieceType === pieceType.PAWN) {
        const filePrefix = input.captured ? HorizontalKeys[input.from.x] : '';
        return `${filePrefix}${captures}${target}${suffix(input)}`;
    }

    const symbol = pieceSymbol[input.pieceType] || '';
    return `${symbol}${captures}${target}${suffix(input)}`;
}

function suffix(input: INotationInput): string {
    if (input.isCheckmate) return '#';
    if (input.isCheck) return '+';
    return '';
}
