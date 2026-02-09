import { IGetAllPossibleMove } from ".";
import { getLabel } from "../helpers/label.helper";
import { IBoxPosition } from "../interfaces/position.interface";
import { checkIfOutside } from '../helpers/position.helper';

const allMoves: {
    x: number,
    y: number
}[] = [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: -1 },
        { x: -1, y: -1 },
        { x: -1, y: 0 },
        { x: -1, y: 1 },
    ]

const getPossibleMove = (getPossibleMoveArgs: IGetAllPossibleMove)
    : {
        allPossibleVisitingBoxes: Record<string, IBoxPosition>,
        allPossibleKillBoxes: Record<string, IBoxPosition>
    } => {
    let allPossibleVisitingBoxes: Record<string, IBoxPosition> = {},
        allPossibleKillBoxes: Record<string, IBoxPosition> = {};

    const {
        allBoxes,
        piece
    } = getPossibleMoveArgs;
    for (let i = 0; i < allMoves.length; i++) {
        const move = allMoves[i];
        const xPosition = piece.position.x + move.x;
        const yPosition = piece.position.y + move.y;
        if (checkIfOutside(xPosition, yPosition)) {
            continue;
        }
        const label = getLabel(xPosition, yPosition);
        const box = allBoxes[label];
        if (box) {
            if (box.piece) {
                if (box.piece.color !== piece.color) {
                    allPossibleKillBoxes[label] = box;
                }
            } else {
                allPossibleVisitingBoxes[label] = box;
            }
        }
    }

    return {
        allPossibleVisitingBoxes,
        allPossibleKillBoxes
    }
}

export { getPossibleMove };
