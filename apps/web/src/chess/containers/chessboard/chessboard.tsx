"use client";

import { useSelector } from "react-redux";
import { Box } from "../../components/box/box";
import { RootState } from "../../store";
import { pieceType } from "@myproject/chess-logic";
import { useEffect } from "react";
import Swal from "sweetalert2";
import { getOppositeColor } from "../../helpers/color.helper";

function ChessBoard(): React.JSX.Element {
    const boardBoxes = useSelector((state: RootState) => state.position.allPositions);
    const activePiece = useSelector((state: RootState) => state.position.activePiece);
    const visitingPieces = useSelector((state: RootState) => state.position.allPossibleVisitingBoxes);
    const killPieces = useSelector((state: RootState) => state.position.allPossibleKillBoxes);
    const castlingBoxes = useSelector((state: RootState) => state.position.castlingBoxes);
    const checked = useSelector((state: RootState) => state.piece.check);
    const checkmate = useSelector((state: RootState) => state.piece.checkmate);

    useEffect(()=>{
        if (checkmate !== undefined){
            const text = `${getOppositeColor(checkmate)} has own`
           Swal.fire({
            title: "Winner",
            text: text,
            icon: "success",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "New Game"
          }).then((result) => {
            if (result.isConfirmed) {
                window.location.reload();
            }
          });
        }
     },[checkmate]);

    const renderBoxes = () => {
        const boxesToRender = [];
        for (const boxKey in boardBoxes) {
            let item = boardBoxes[boxKey];
            let canKill = false;
            let canVisit = false;
            let active = false;
            let canCastle = false;
            let isChecked = false
            if ((item.position.x === activePiece?.position.x)
            && (item.position.y === activePiece?.position.y)) {
                active = true;
            }
            if (visitingPieces[boxKey] || castlingBoxes[boxKey]) {
                canVisit = true;
            }
            if (castlingBoxes[boxKey]) {
                canCastle = true;
            }
            if (killPieces[boxKey]) {
                canVisit = false;
                canKill = true;
            }
            if (checked === item.piece?.color && item.piece?.type === pieceType.KING) {
                isChecked = true;
            }
            boxesToRender.push(
                <Box
                key={boxKey}
                position={item.position}
                label={item.label}
                piece={item.piece}
                active={active}
                canKill={canKill}
                canVisit={canVisit}
                canCastle={canCastle}
                isChecked={isChecked}
                castlingData={castlingBoxes[boxKey]}
            />
            )
        }
       return boxesToRender;
    }
    return (
        <div className="relative w-full max-w-[800px] overflow-hidden mx-auto before:content-[''] before:block before:pt-[100%]">
            <div className="absolute inset-0 grid grid-rows-[repeat(8,1fr)] grid-cols-[repeat(8,1fr)]">
                {renderBoxes()}
            </div>
        </div>
    );
}

export { ChessBoard };
