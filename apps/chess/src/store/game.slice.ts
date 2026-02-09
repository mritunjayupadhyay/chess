import { createSlice } from "@reduxjs/toolkit";
import { allColorType } from "../App.constant";

interface IInitialState {
    activeColor: string;
    winner: string | undefined;
    draw: boolean;
}

const initialState:IInitialState = {
    activeColor: allColorType.LIGHT_COLOR,
    winner: undefined,
    draw: false
}

function createReducers() {
    return {
        nextMove
    };

    function nextMove(state: IInitialState) {
        state.activeColor = state.activeColor === allColorType.LIGHT_COLOR ? allColorType.DARK_COLOR : allColorType.LIGHT_COLOR;
    }
}

const slice = createSlice({
    name: 'game',
    initialState,
    reducers: createReducers()
});

export const gameActions = {
    ...slice.actions };
export const gameReducer = slice.reducer;
