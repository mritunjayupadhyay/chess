import { allColorType, colorType } from "@myproject/chess-logic";

export const getOppositeColor = (color: colorType): colorType => color === allColorType.DARK_COLOR ? allColorType.LIGHT_COLOR : allColorType.DARK_COLOR;
