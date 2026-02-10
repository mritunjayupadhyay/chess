"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { pieceType } from "@myproject/chess-logic";
import type { IColor } from "@myproject/chess-logic";
import { RootState } from "../../store";
import { getImageUrl } from "../../helpers/piece.helper";

function FallenPieces(props: IColor): React.JSX.Element {
    const imageUrl = getImageUrl(pieceType.KING, props.color);
    const selectPieces = useMemo(() => createSelector(
        (state: RootState) => state.piece.pieces,
        (pieces) => pieces.filter((item) => item.color === props.color && item.isAlive === false)
    ), [props.color]);
    const selectOpponentPieces = useMemo(() => createSelector(
        (state: RootState) => state.piece.pieces,
        (pieces) => pieces.filter((item) => item.color !== props.color && item.isAlive === false)
    ), [props.color]);
    const pieces = useSelector(selectPieces);
    const opponentPieces = useSelector(selectOpponentPieces);
    const ourPoint = pieces.reduce((sum, item) => sum + item.points, 0);
    const opponentPoint = opponentPieces.reduce((sum, item) => sum + item.points, 0)
    const point = opponentPoint - ourPoint;
    const renderAllPieces = () => {
        return opponentPieces.map((item, i) => {
            const pieceUrl = getImageUrl(item.type, item.color);
            return (
                <img key={`${item.type}${item.points}${item.color}${i}`} className="h-5 w-auto px-px" src={pieceUrl} />
            );
        })
    }
    return (
        <div className="grid grid-cols-[50px_1fr] h-10 my-2.5">
            <div className="w-10 bg-gray-500 flex justify-center items-center">
                <img className="max-w-[80%]" src={imageUrl} />
            </div>
            <div className="px-1.5 flex flex-col">
                <div className="flex-1 text-left text-sm">Player {props.color}</div>
                <div className="flex-1 flex justify-start items-center">
                    {renderAllPieces()}
                    {point > 0 ? <div className="text-[13px] pl-[3px] tracking-wide">{point}+</div> : null}
                </div>
            </div>
        </div>
    )
}

export { FallenPieces };
