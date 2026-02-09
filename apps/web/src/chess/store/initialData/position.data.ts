import {
    HorizontalKeys,
    VerticalKeys,
    IPosition,
    IBoxPosition,
    getLabel,
} from '@myproject/chess-logic';
import { pieceData } from "./piece.data";

const allBoxAsObj: Record<string, IBoxPosition> = {};

for (let j = VerticalKeys.length - 1; j >= 0; j--) {
    for (let i = 0; i < HorizontalKeys.length; i++) {
        const position: IPosition = { x: i, y: j };
        const label = getLabel(i, j);
        const boxPosition: IBoxPosition = {
            label,
            position: position
        }
        allBoxAsObj[label] = boxPosition;
    }
}

for (let k = 0; k < pieceData.length; k++) {
    const position: IPosition = pieceData[k].position;
    const label = getLabel(position.x, position.y)
    const boxPosition = allBoxAsObj[label];
    if (boxPosition !== undefined && boxPosition?.label === label) {
        const newBoxPosition: IBoxPosition = {...boxPosition, piece: pieceData[k]}
        allBoxAsObj[label] = newBoxPosition;
    }
}

export { allBoxAsObj }
