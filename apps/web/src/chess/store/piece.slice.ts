import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { pieceData } from './initialData/piece.data';
import {
    colorType,
    IPiece,
    ICastlingData,
    IBoxPosition,
    IPosition,
    castlingData,
    getUpdatedCastlingData,
} from '@myproject/chess-logic';
import { getCheckAndCheckmate, getUpdatePiecesAfterMovement } from '../helpers/piece.helper';

export interface IInitialState {
    activeColor: string;
    check: colorType | undefined;
    checkmate: colorType | undefined;
    pieces: IPiece[],
    castlingData: Record<colorType, ICastlingData>
}

interface IChangePositionProps {
    allPositions: Record<string, IBoxPosition>,
    position: IPosition
    piece: IPiece
}

const initialState:IInitialState = {
    activeColor: 'light',
    check: undefined,
    checkmate: undefined,
    pieces: pieceData,
    castlingData: castlingData
}

function createReducers() {
    return {
        changePosition,
    };

    function changePosition(state: IInitialState, action: PayloadAction<IChangePositionProps>) {
        const {piece, allPositions, position: newPosition} = action.payload;
        const stateCopy = {...state};

        const pieces = getUpdatePiecesAfterMovement(stateCopy.pieces, piece, newPosition)
        const newCastlingData = getUpdatedCastlingData(stateCopy.castlingData[piece.color], piece)
        const { check, checkmate } = getCheckAndCheckmate(pieces, allPositions, piece, newPosition, piece.color)

        state.pieces = pieces;
        state.castlingData[piece.color] = newCastlingData
        state.check = check;
        state.checkmate = checkmate
    }
}

const slice = createSlice({
    name: 'piece',
    initialState,
    reducers: createReducers()
});

export const pieceActions = {
    ...slice.actions };
export const pieceReducer = slice.reducer;
