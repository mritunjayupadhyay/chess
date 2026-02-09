import styled from "styled-components";

export const ChessBoardStyled = styled.div`
    position: relative;
    width: 100%;
    max-width: 800px;
    overflow: hidden;
    margin: 0 auto;
    &:before {
        content: "";
    display: block;
    padding-top: 100%;
    }
`;

export const ChessBoardContent = styled.div`
    position:  absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    display: grid;
        grid-template-rows: repeat(8, 1fr);
        grid-template-columns: repeat(8, 1fr);
`
