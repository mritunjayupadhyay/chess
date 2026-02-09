import { checkIfOutside } from '../helpers/position.helper';
import { getLabel } from '../helpers/label.helper';
import { IGetAllPossibleMove } from ".";
import { IBoxPosition } from "../interfaces/position.interface";

const allMoves: {
    x: number,
    y: number,
    child: { x: number, y: number }[]
}[] = [
        {
            x: 0,
            y: 2,
            child: [
                { x: 1, y: 0 },
                { x: -1, y: 0 }
            ]
        },
        {
            x: 2,
            y: 0,
            child: [
                { x: 0, y: -1 },
                { x: 0, y: 1 }
            ]
        },
        {
            x: 0,
            y: -2,
            child: [
                { x: 1, y: 0 },
                { x: -1, y: 0 }
            ]
        },
        {
            x: -2,
            y: 0,
            child: [
                { x: 0, y: -1 },
                { x: 0, y: 1 }
            ]
        }
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
        const x = piece.position.x + move.x;
        const y = piece.position.y + move.y;
        for (let j = 0; j < move.child.length; j++) {
            let xChild = x + move.child[j].x;
            let yChild = y + move.child[j].y;
            if (checkIfOutside(xChild, yChild)) {
                continue;
            }
            const label = getLabel(xChild, yChild);
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
    }
    return {
        allPossibleVisitingBoxes,
        allPossibleKillBoxes
    }
}

export { getPossibleMove };
