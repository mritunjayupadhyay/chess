import { useMemo } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { pieceType } from "@myproject/chess-logic";
import type { IColor } from "@myproject/chess-logic";
import { RootState } from "../../store";
import { getImageUrl } from "../../helpers/piece.helper";
import { EachPiece, FallenPieceStyled, NameAndPiecesContainer, NameContainer, NumberContainer, PieceListContainer, ProfilePic, ProfilePicContainer } from "./fallen_pieces.styled";

function FallenPieces(props: IColor) {
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
                <EachPiece key={`${item.type}${item.points}${item.color}${i}`} src={pieceUrl}/>
            );
        })
    }
    return (
        <FallenPieceStyled color={props.color}>
            <ProfilePicContainer color={props.color}>
                <ProfilePic src={imageUrl} />
            </ProfilePicContainer>
            <NameAndPiecesContainer>
                <NameContainer>Player {props.color}</NameContainer>
                <PieceListContainer>
                    {renderAllPieces()}
                    {point > 0 ? <NumberContainer>{point}+</NumberContainer> : null}
                </PieceListContainer>
            </NameAndPiecesContainer>
        </FallenPieceStyled>
    )
}

export { FallenPieces };
