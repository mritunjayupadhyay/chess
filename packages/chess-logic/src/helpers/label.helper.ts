import { HorizontalKeys, VerticalKeys } from "../constants"

export const getLabel = (i: number, j: number) => {
    return `${HorizontalKeys[i]}${VerticalKeys[j]}`
}
