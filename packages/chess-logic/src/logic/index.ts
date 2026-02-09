import { IPiece } from '../interfaces/piece.interface';
import { IBoxPosition } from '../interfaces/position.interface';
import * as pawnLogic from './pawn.logic';
import * as knightLogic from './knight.logic';
import * as bishopLogic from './bishop.logic';
import * as rookLogic from './rook.logic';
import * as kingLogic from './kings.logic';

import { pieceType } from '../constants';

export interface IGetAllPossibleMove {
    allBoxes: Record<string, IBoxPosition>;
    piece: IPiece;
}

const getPossibleMove = (getPossibleMoveArgs: IGetAllPossibleMove)
    : {
        allPossibleVisitingBoxes: Record<string, IBoxPosition>,
        allPossibleKillBoxes: Record<string, IBoxPosition>
    } => {
    let allPossibleVisitingBoxes: Record<string, IBoxPosition> = {},
        allPossibleKillBoxes: Record<string, IBoxPosition> = {};
    switch (getPossibleMoveArgs.piece.type) {
        case pieceType.PAWN:
            return pawnLogic.getPossibleMove(getPossibleMoveArgs);
        case pieceType.KNIGHT:
            return knightLogic.getPossibleMove(getPossibleMoveArgs);
        case pieceType.BISHOP:
            return bishopLogic.getPossibleMove(getPossibleMoveArgs);
        case pieceType.ROOK:
            return rookLogic.getPossibleMove(getPossibleMoveArgs);
        case pieceType.QUEEN:
            const bishopBoxes = bishopLogic.getPossibleMove(getPossibleMoveArgs);
            const rookBoxes = rookLogic.getPossibleMove(getPossibleMoveArgs);
            return {
                allPossibleKillBoxes: { ...bishopBoxes.allPossibleKillBoxes, ...rookBoxes.allPossibleKillBoxes },
                allPossibleVisitingBoxes: { ...bishopBoxes.allPossibleVisitingBoxes, ...rookBoxes.allPossibleVisitingBoxes }
            }
        case pieceType.KING:
            return kingLogic.getPossibleMove(getPossibleMoveArgs);
        default:
            return {
                allPossibleVisitingBoxes,
                allPossibleKillBoxes
            }
    }
}

const checkIfPostionMatch = (allPossibleKillBoxes: Record<string, IBoxPosition>, position: { x: number, y: number}):Boolean => {
    for (const value of Object.values(allPossibleKillBoxes)) {
        if (value.position.x === position.x && value.position.y === position.y) {
            return true;
        }
    }
    return false;
}

const isInDanger = (pieces: IPiece[], allPositions: Record<string, IBoxPosition>, position: { x: number, y: number}): Boolean => {
    for (let i = 0; i < pieces.length; i++) {
        const getPossibleMoveArgs: IGetAllPossibleMove = {
            allBoxes: allPositions,
            piece: pieces[i]
        }
        const { allPossibleKillBoxes, allPossibleVisitingBoxes } = getPossibleMove(getPossibleMoveArgs);
        const moves = pieces[i].type === pieceType.PAWN ? { ...allPossibleKillBoxes } : { ...allPossibleKillBoxes, ...allPossibleVisitingBoxes}
        if (checkIfPostionMatch(moves, position)) {
            return true;
        }
    }
    return false;
}

export { getPossibleMove, isInDanger};
