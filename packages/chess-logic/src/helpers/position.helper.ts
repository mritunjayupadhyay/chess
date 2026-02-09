import { HorizontalKeys, VerticalKeys } from "../constants";

export const checkIfOutside = (x: number, y: number): boolean => {
    if ((x > HorizontalKeys.length - 1)
    || (x < 0)
    || (y > VerticalKeys.length - 1)
    || (y < 0)) {
        return true;
    }
    return false;
}
