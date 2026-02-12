"use client";

import clsx from "clsx";
import { allColorType, ICastlingBox, IPiece, IPosition } from "@myproject/chess-logic";
import { Piece as PieceDisplay } from "../piece/MultiplayerPiece";

export interface IMultiplayerBoxProps {
    position: IPosition;
    label: string;
    piece?: IPiece;
    active: boolean;
    canKill: boolean;
    canVisit: boolean;
    canCastle: boolean;
    isChecked: boolean;
    castlingData?: ICastlingBox;
    onPieceClick: (piece: IPiece) => void;
    onSquareClick: (position: IPosition, canCastle: boolean, castlingData?: ICastlingBox) => void;
}

function MultiplayerBox(props: IMultiplayerBoxProps): React.JSX.Element {
    const handleClick = () => {
        if (props.canVisit || props.canKill || props.canCastle) {
            props.onSquareClick(props.position, props.canCastle, props.castlingData);
        } else if (props.piece) {
            props.onPieceClick(props.piece);
        }
    };

    const boxColor = ((props.position.x + props.position.y) % 2) === 0
        ? allColorType.DARK_COLOR
        : allColorType.LIGHT_COLOR;
    const clickable = !!props.piece || props.canVisit || props.canKill;

    return (
        <div
            onClick={handleClick}
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
            {props.piece ? <PieceDisplay {...props.piece} /> : null}
            {props.canVisit ? <div className="absolute inset-0 bg-green-500/50" /> : null}
            {props.canKill ? <div className="absolute inset-0 bg-red-500/50" /> : null}
        </div>
    );
}

export { MultiplayerBox };
