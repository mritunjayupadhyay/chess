"use client";

import clsx from "clsx";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { allColorType, ICastlingBox, IPiece, IPosition } from "@myproject/chess-logic";
import { RootState } from "../../store";
import { gameActions } from "../../store/game.slice";
import { pieceActions } from "../../store/piece.slice";
import { positionActions } from "../../store/position.slice";
import { Piece } from "../piece/piece";

export interface IBoxProps {
    position: IPosition;
    label: string;
    piece?: IPiece;
    active: boolean;
    canKill: boolean;
    canVisit: boolean;
    canCastle: boolean;
    isChecked: Boolean
    castlingData?: ICastlingBox
}

function Box(props: IBoxProps): React.JSX.Element {
    const dispatch = useDispatch();
    const activePiece = useSelector((state: RootState) => state.position.activePiece);
    const allPositions = useSelector((state: RootState) => state.position.allPositions);
    const handleClick = () => {
        if (!activePiece) return;
        if (props.canCastle && props.castlingData) {
            const { king, rook, kingNextPosition, rookNextPosition } = props.castlingData;
            const castlingProps: ICastlingBox = {
                king,
                rook,
                kingNextPosition,
                rookNextPosition
            }
            if (king.piece !== undefined && rook.piece !== undefined) {
                dispatch(positionActions.moveInCastling(castlingProps));
                dispatch(pieceActions.changePosition({
                    position: kingNextPosition,
                    piece: king.piece,
                    allPositions
                }));
                dispatch(pieceActions.changePosition({
                    position: rookNextPosition, piece: rook.piece, allPositions
                }));
            }
            dispatch(gameActions.nextMove());
        } else {
            if (props.canVisit || props.canKill) {
                dispatch(positionActions.moveToVisitingBox(props.position));
                dispatch(pieceActions.changePosition({
                    position: props.position, piece: activePiece, allPositions,
                }));
                dispatch(gameActions.nextMove());
            } else {
                dispatch(positionActions.makePieceInActive())
            }
        }
    }
    let boxColor = ((props.position.x + props.position.y) % 2) === 0 ? allColorType.DARK_COLOR : allColorType.LIGHT_COLOR;
    let clickable = !!props.piece || props.canVisit || props.canKill;
    return (
        <div
            onClick={() => handleClick()}
            className={clsx(
                "relative",
                clickable ? "cursor-pointer" : "cursor-default",
                props.isChecked
                    ? "bg-red-500/90"
                    : props.active
                        ? "bg-yellow-500/50"
                        : boxColor === allColorType.LIGHT_COLOR
                            ? "bg-chess-light"
                            : "bg-chess-dark"
            )}
        >
            <label className="invisible">{props.label}</label>
            {props.piece ? <Piece {...props.piece} /> : null}
            {props.canVisit ? <div className="absolute inset-0 bg-green-500/50" /> : null}
            {props.canKill ? <div className="absolute inset-0 bg-red-500/50" /> : null}
        </div>
    )
}

export { Box };
