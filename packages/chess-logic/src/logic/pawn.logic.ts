import { allColorType, HorizontalKeys } from '../constants';
import { IGetAllPossibleMove } from ".";
import { getLabel } from "../helpers/label.helper";
import { IBoxPosition } from "../interfaces/position.interface";

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

    for (let i = 1; i <= 2; i++) {
        if (i === 2) {
            if ((piece.color === allColorType.LIGHT_COLOR && piece.position.y !== 1)
            || (piece.color === allColorType.DARK_COLOR && piece.position.y !== 6)) {
                break;
            }
        }
        const steps = piece.color === allColorType.LIGHT_COLOR ? i : -i;
        const label = getLabel(piece.position.x, piece.position.y + steps);
        const box = allBoxes[label];
        if (box.piece) {
            break;
        }
        allPossibleVisitingBoxes[label] = box;
    }

    const leftRightArr = [1, -1]
    for (let i = 0; i <= leftRightArr.length; i++) {
        const leftRight = leftRightArr[i];
        if ((piece.position.x + leftRight > HorizontalKeys.length - 1)
        || piece.position.x + leftRight < 0) {
            continue;
        }
        const steps = piece.color === allColorType.LIGHT_COLOR ? 1 : -1;
        const label = getLabel(piece.position.x + leftRight, piece.position.y + steps);
        const box = allBoxes[label];
        if (box && box.piece !== undefined && box.piece.color !== piece.color) {
            allPossibleKillBoxes[label] = box;
        }
    }

    return {
        allPossibleVisitingBoxes,
        allPossibleKillBoxes
    }
}

export { getPossibleMove };
