"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { MultiplayerBox } from "../../components/box/MultiplayerBox";
import {
    pieceType,
    allColorType,
    IPiece,
    IPosition,
    IBoxPosition,
    ICastlingBox,
    IGetAllPossibleMove,
    getPossibleMove,
    getCastlingBox,
} from "@myproject/chess-logic";
import { filterInvalidBoxesToMove } from "../../helpers/position.helper";
import Swal from "sweetalert2";

interface MultiplayerChessBoardProps {
    makeMove: (roomId: string, piecePosition: IPosition, targetPosition: IPosition) => void;
    makeCastlingMove: (roomId: string, kingPosition: IPosition, rookPosition: IPosition) => void;
    resign: () => void;
}

function MultiplayerChessBoard({ makeMove, makeCastlingMove, resign }: MultiplayerChessBoardProps): React.JSX.Element {
    const gameState = useSelector((state: RootState) => state.multiplayer.gameState);
    const myColor = useSelector((state: RootState) => state.multiplayer.myColor);
    const currentRoom = useSelector((state: RootState) => state.multiplayer.currentRoom);
    const gameOver = useSelector((state: RootState) => state.multiplayer.gameOver);

    const [activePiece, setActivePiece] = useState<IPiece | undefined>(undefined);
    const [possibleVisitBoxes, setPossibleVisitBoxes] = useState<Record<string, IBoxPosition>>({});
    const [possibleKillBoxes, setPossibleKillBoxes] = useState<Record<string, IBoxPosition>>({});
    const [castlingBoxes, setCastlingBoxes] = useState<Record<string, ICastlingBox>>({});

    // Reset highlights when gameState changes (after a move is made)
    useEffect(() => {
        setActivePiece(undefined);
        setPossibleVisitBoxes({});
        setPossibleKillBoxes({});
        setCastlingBoxes({});
    }, [gameState]);

    // Show game over modal
    useEffect(() => {
        if (gameOver) {
            const isWinner = gameOver.winner === myColor;
            const reasonText = gameOver.reason === 'checkmate' ? 'Checkmate'
                : gameOver.reason === 'resign' ? 'Resignation'
                : 'Disconnection';

            Swal.fire({
                title: isWinner ? "You Win!" : "You Lose!",
                text: `Game over by ${reasonText}`,
                icon: isWinner ? "success" : "error",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "Back to Lobby",
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.reload();
                }
            });
        }
    }, [gameOver, myColor]);

    const handlePieceClick = useCallback((piece: IPiece) => {
        if (!gameState || !myColor) return;

        // Only allow clicking own pieces when it's your turn
        if (piece.color !== myColor || gameState.activeColor !== myColor) {
            return;
        }

        const allBoxesCloned = { ...gameState.allPositions };
        const getPossibleMoveArgs: IGetAllPossibleMove = {
            allBoxes: allBoxesCloned,
            piece,
        };
        const { allPossibleKillBoxes, allPossibleVisitingBoxes } = getPossibleMove(getPossibleMoveArgs);

        // Filter moves that leave own king in check
        const pieces = gameState.pieces;
        const validKillBoxes = filterInvalidBoxesToMove({
            piece, pieces, allPositions: allBoxesCloned, color: piece.color, boxes: allPossibleKillBoxes,
        });
        const validVisitBoxes = filterInvalidBoxesToMove({
            piece, pieces, allPositions: allBoxesCloned, color: piece.color, boxes: allPossibleVisitingBoxes,
        });

        setActivePiece(piece);
        setPossibleKillBoxes(validKillBoxes);
        setPossibleVisitBoxes(validVisitBoxes);

        // Handle castling
        const newCastlingBoxes: Record<string, ICastlingBox> = {};
        if (piece.type === pieceType.KING) {
            const castlingData = gameState.castlingData[piece.color];
            if (!castlingData.isDone && !castlingData.isKingMoved) {
                const rooks = castlingData.rook.filter(r => !r.isMoved).map(r => r.position);
                for (const rookPos of rooks) {
                    const { label, value } = getCastlingBox(getPossibleMoveArgs, rookPos);
                    if (value) {
                        newCastlingBoxes[label] = value;
                    }
                }
            }
        }
        setCastlingBoxes(newCastlingBoxes);
    }, [gameState, myColor]);

    const handleSquareClick = useCallback((position: IPosition, canCastle: boolean, castlingData?: ICastlingBox) => {
        if (!activePiece || !currentRoom || !gameState || !myColor) return;
        if (gameState.activeColor !== myColor) return;

        if (canCastle && castlingData) {
            // Castling move
            makeCastlingMove(
                currentRoom.roomId,
                activePiece.position,
                castlingData.rook.position,
            );
        } else {
            // Normal move
            makeMove(
                currentRoom.roomId,
                activePiece.position,
                position,
            );
        }
    }, [activePiece, currentRoom, gameState, myColor, makeMove, makeCastlingMove]);

    if (!gameState || !myColor) return <div />;

    const isMyTurn = gameState.activeColor === myColor;
    const isDarkPlayer = myColor === allColorType.DARK_COLOR;

    const renderBoxes = () => {
        const boxesToRender = [];
        const keys = Object.keys(gameState.allPositions);
        const orderedKeys = isDarkPlayer ? [...keys].reverse() : keys;

        for (const boxKey of orderedKeys) {
            const item = gameState.allPositions[boxKey];
            let canKill = false;
            let canVisit = false;
            let active = false;
            let canCastle = false;
            let isChecked = false;

            if (activePiece &&
                item.position.x === activePiece.position.x &&
                item.position.y === activePiece.position.y) {
                active = true;
            }
            if (possibleVisitBoxes[boxKey] || castlingBoxes[boxKey]) {
                canVisit = true;
            }
            if (castlingBoxes[boxKey]) {
                canCastle = true;
            }
            if (possibleKillBoxes[boxKey]) {
                canVisit = false;
                canKill = true;
            }
            if (gameState.check === item.piece?.color && item.piece?.type === pieceType.KING) {
                isChecked = true;
            }

            boxesToRender.push(
                <MultiplayerBox
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
                    onPieceClick={handlePieceClick}
                    onSquareClick={handleSquareClick}
                />
            );
        }
        return boxesToRender;
    };

    return (
        <div className="flex flex-col w-full min-h-screen justify-center items-center">
            <div className="relative w-full max-w-[600px] overflow-hidden mx-auto">
                {/* Turn indicator */}
                <div className="mb-3 text-center">
                    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
                        isMyTurn
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                    }`}>
                        {isMyTurn ? "Your turn" : "Opponent's turn"}
                    </span>
                    <span className="ml-3 text-sm text-gray-500">
                        Playing as {myColor}
                    </span>
                </div>

                {/* Chess board */}
                <div className="relative w-full max-w-[600px] overflow-hidden mx-auto before:content-[''] before:block before:pt-[100%]">
                    <div className="absolute inset-0 grid grid-rows-[repeat(8,1fr)] grid-cols-[repeat(8,1fr)]">
                        {renderBoxes()}
                    </div>
                </div>

                {/* Resign button */}
                <div className="mt-3 text-center">
                    <button
                        onClick={resign}
                        className="py-1.5 px-4 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                    >
                        Resign
                    </button>
                </div>
            </div>
        </div>
    );
}

export { MultiplayerChessBoard };
