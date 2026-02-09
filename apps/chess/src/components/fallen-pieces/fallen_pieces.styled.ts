import styled from "styled-components";
import type { IColor } from "@myproject/chess-logic";

export const FallenPieceStyled = styled("div")<IColor>`
    display: grid;
    grid-template-columns: 50px 1fr;
    height: 40px;
    margin: 10px 0;
`;

export const ProfilePicContainer = styled("div")<IColor>`
    width: 40px;
    background-color: grey;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const ProfilePic = styled("img")`
    max-width: 80%
`;

export const NameAndPiecesContainer = styled("div")`
    padding: 0 5px;
    display: flex;
    flex-direction: column;
`;

export const NameContainer = styled("div")`
    flex: 1;
    text-align: left;
    font-size: 14px;
`;

export const PieceListContainer = styled("div")`
    flex: 1;
    display: flex;
    justify-content: flex-start;
    flex-direction: row;
    align-items: center;
`;

export const EachPiece = styled("img")`
     height: 20px;
     width: auto;
     padding: 0 1px;
`;

export const NumberContainer = styled("div")`
    font-size: 13px;
    padding-left: 3px;
    letter-spacing: 1px;
`;
