import {
    colorType,
    IPiece,
    IBoxPosition,
    IPosition,
    getLabel,
    checkIfOutside,
} from '@myproject/chess-logic';
import { checkKingInDanger, getUpdatePiecesAfterMovement } from './piece.helper';

export { checkIfOutside } from '@myproject/chess-logic';

export const getUpdatedPositionAfterMove = (allPositions: Record<string, IBoxPosition>, movedPiece: IPiece, newPosition: IPosition):Record<string, IBoxPosition>  => {
    const allPositionsAfterMove = {...allPositions}
    const label = getLabel(newPosition.x, newPosition.y);
    const activePieceWithNewPosition  = {...movedPiece, position: newPosition};
    const activePieceExistingLabel = getLabel(movedPiece.position.x, movedPiece.position.y);
    allPositionsAfterMove[label] = {...allPositionsAfterMove[label], piece: activePieceWithNewPosition};
    allPositionsAfterMove[activePieceExistingLabel] = {...allPositionsAfterMove[activePieceExistingLabel], piece: undefined};
    return allPositionsAfterMove;
}

export interface IFilterInvalidBoxesToMove {
    pieces: IPiece[],
    piece: IPiece,
    allPositions: Record<string, IBoxPosition>,
    color: colorType,
    boxes: Record<string, IBoxPosition>
}

export const filterInvalidBoxesToMove = (args: IFilterInvalidBoxesToMove): Record<string, IBoxPosition> => {
    const {
        piece, pieces, allPositions, color, boxes
    } = args;
    const validBoxes: Record<string, IBoxPosition> = {}
    for (const [key, value] of Object.entries(boxes)) {
        const updatedPieces = getUpdatePiecesAfterMovement(pieces, piece, value.position)
        const allPositionsAfterMove = getUpdatedPositionAfterMove(allPositions, piece, value.position)

        if (checkKingInDanger(updatedPieces, allPositionsAfterMove, color) === false) {
            validBoxes[key] = value;
        }
    }
    return validBoxes;
}
