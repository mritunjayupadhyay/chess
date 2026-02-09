import styled from "styled-components";

export interface IPieceStyledProps {
    $url: string;
}

export const PieceStyled = styled("div")<IPieceStyledProps>`
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background-image: url(${props => props.$url});
    background-size: 60%;
    background-repeat: no-repeat;
    background-position: center;
`;
