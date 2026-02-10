"use client";

import { allColorType } from "@myproject/chess-logic";
import { FallenPieces } from "../components/fallen-pieces/fallen_pieces";
import { ChessBoard } from "../containers/chessboard/chessboard";

function GamePage(): React.JSX.Element {
    return (
        <div className="flex flex-col w-full min-h-screen justify-center">
            <div className="relative w-full max-w-[600px] overflow-hidden mx-auto">
                <div>
                    <FallenPieces color={allColorType.DARK_COLOR} />
                </div>
                <ChessBoard />
                <div>
                    <FallenPieces color={allColorType.LIGHT_COLOR} />
                </div>
            </div>
        </div>
    );
}

export { GamePage };
