"use client";

import { IPiece } from '@myproject/chess-logic';
import { getImageUrl } from '../../helpers/piece.helper';

function Piece(props: IPiece): React.JSX.Element {
    const url = getImageUrl(props.type, props.color);
    return (
        <div
            className="absolute inset-0 bg-[length:60%] bg-no-repeat bg-center"
            style={{ backgroundImage: `url(${url})` }}
        />
    );
}

export { Piece };
