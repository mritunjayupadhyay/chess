"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { pieceType } from "@myproject/chess-logic";
import type { colorType } from "@myproject/chess-logic";
import { RootState } from "../../store";
import { getImageUrl } from "../../helpers/piece.helper";

interface FallenPiecesProps {
    color: colorType;
    playerName: string;
}

function FallenPieces({ color, playerName }: FallenPiecesProps): React.JSX.Element {
    const imageUrl = getImageUrl(pieceType.KING, color);
    const selectCapturedByPlayer = useMemo(() => createSelector(
        (state: RootState) => state.multiplayer.gameState?.pieces ?? [],
        (pieces) => pieces.filter((item) => item.color !== color && item.isAlive === false)
    ), [color]);
    const selectCapturedFromPlayer = useMemo(() => createSelector(
        (state: RootState) => state.multiplayer.gameState?.pieces ?? [],
        (pieces) => pieces.filter((item) => item.color === color && item.isAlive === false)
    ), [color]);
    const capturedByPlayer = useSelector(selectCapturedByPlayer);
    const capturedFromPlayer = useSelector(selectCapturedFromPlayer);
    const capturedPoints = capturedByPlayer.reduce((sum, item) => sum + item.points, 0);
    const lostPoints = capturedFromPlayer.reduce((sum, item) => sum + item.points, 0);
    const pointAdvantage = capturedPoints - lostPoints;
    const renderCapturedPieces = () => {
        return capturedByPlayer.map((item, i) => {
            const pieceUrl = getImageUrl(item.type, item.color);
            return (
                <img key={`${item.type}${item.points}${item.color}${i}`} className="h-5 w-auto px-px" src={pieceUrl} />
            );
        });
    };
    return (
        <div className="grid grid-cols-[50px_1fr] h-10 my-2.5">
            <div className="w-10 bg-gray-500 flex justify-center items-center">
                <img className="max-w-[80%]" src={imageUrl} />
            </div>
            <div className="px-1.5 flex flex-col">
                <div className="flex-1 text-left text-sm">{playerName}</div>
                <div className="flex-1 flex justify-start items-center">
                    {renderCapturedPieces()}
                    {pointAdvantage > 0 ? <div className="text-[13px] pl-[3px] tracking-wide">{pointAdvantage}+</div> : null}
                </div>
            </div>
        </div>
    );
}

export { FallenPieces };
