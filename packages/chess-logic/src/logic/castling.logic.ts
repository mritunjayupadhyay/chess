import { getLabel } from '../helpers/label.helper';
import { IGetAllPossibleMove } from '.';
import { ICastlingBox } from '../interfaces/castling.interface';
import { IPosition } from '../interfaces/position.interface';
import { kingMovementInCastling, pieceType } from '../constants';
import { allColorType, colorType } from "../constants";
import { ICastlingData } from "../interfaces/castling.interface";
import { IPiece } from '../interfaces/piece.interface';

export const castlingData: Record<colorType, ICastlingData> = {
    [allColorType.LIGHT_COLOR]: {
     isDone: false,
     isKingMoved: false,
     rook: [
         {
             isMoved: false,
             position: {
                 x: 0, y: 0
             }
         },
         {
             isMoved: false,
             position: {
                 x: 7, y: 0
             }
         }
     ]
    },
    [allColorType.DARK_COLOR]: {
     isDone: false,
     isKingMoved: false,
     rook: [
         {
             isMoved: false,
             position: {
                 x: 0, y: 7
             }
         },
         {
             isMoved: false,
             position: {
                 x: 7, y: 7
             }
         }
     ]
    }
 }

export const getUpdatedCastlingData = (castlingDataForOnePlayer: ICastlingData, piece: IPiece): ICastlingData => {
     let newCastlingData = {...castlingDataForOnePlayer };
     if (!(castlingDataForOnePlayer.isDone || castlingDataForOnePlayer.isKingMoved)) {
         if (piece.type === pieceType.ROOK) {
             const rook = castlingDataForOnePlayer.rook.map((item) => {
                 if (item.position.x === piece.position.x && item.position.y === piece.position.y) {
                     return {...item, isMoved: true }
                 }
                 return item
             })
             const isDone = rook.filter((item) => item.isMoved === false).length === 0;
             newCastlingData.isDone = isDone;
             newCastlingData.rook = rook;
         }
         if (piece.type === pieceType.KING) {
             newCastlingData.isKingMoved = true
         }
    }
    return newCastlingData;
}

export const getCastlingBox = (getPossibleMoveArgs: IGetAllPossibleMove, rookPosition: IPosition): { label: string, value: ICastlingBox | undefined} => {
    var value: ICastlingBox | undefined = undefined;

    const {
        allBoxes,
        piece
    } = getPossibleMoveArgs;

    const yIndex = piece.position.y;
    const isLeftRook: boolean = piece.position.x > rookPosition.x;
    const startIndex = isLeftRook ? rookPosition.x : piece.position.x;
    const lastIndex = isLeftRook ? piece.position.x : rookPosition.x;
    for (let i = startIndex + 1; i < lastIndex; i++) {
        const label = getLabel(i, yIndex);
        const box = allBoxes[label];
        if (!(box && box.piece === undefined)) {
            return { label: '', value: undefined}
        }
    }
    const kingNextPositionX = isLeftRook ? piece.position.x - kingMovementInCastling : piece.position.x + kingMovementInCastling
    const kingLabel = getLabel(piece.position.x, piece.position.y);
    const rookLabel = getLabel(rookPosition.x, rookPosition.y);
    value = {
        kingNextPosition: {
            x: kingNextPositionX,
            y: yIndex
        },
        rookNextPosition: {
            x: isLeftRook ? kingNextPositionX + 1 : kingNextPositionX - 1,
            y: yIndex
        },
        king: allBoxes[kingLabel],
        rook: allBoxes[rookLabel]
    }
    return { label: getLabel(kingNextPositionX, yIndex), value};
}
