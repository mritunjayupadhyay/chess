import { allBoxAsObj } from './initialData/position.data';
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
    IPiece,
    IBoxPosition,
    IPosition,
    ICastlingBox,
    getLabel,
    getPossibleMove,
    IGetAllPossibleMove,
    getCastlingBox,
} from '@myproject/chess-logic';
import { filterInvalidBoxesToMove, IFilterInvalidBoxesToMove } from '../helpers/position.helper';

export interface IGetCastingPayloadProps {
    piece: IPiece,
    rooks: IPosition[]
}

interface IMakePieceActiveProps {
    piece: IPiece,
    pieces: IPiece[],
}

export interface IInitialState {
    activePiece: IPiece | undefined;
    allPositions: Record<string, IBoxPosition>;
    allPossibleVisitingBoxes: Record<string, IBoxPosition>;
    allPossibleKillBoxes: Record<string, IBoxPosition>;
    castlingBoxes: Record<string, ICastlingBox>
}

const initialState:IInitialState = {
    activePiece: undefined,
    allPositions: allBoxAsObj,
    allPossibleVisitingBoxes: {},
    allPossibleKillBoxes: {},
    castlingBoxes: {}
}

function createReducers() {
    return {
        moveInCastling,
        moveToVisitingBox,
        makePieceInActive,
        makePieceActive,
        getKingCastlingBoxes
    };

    function moveInCastling(state: IInitialState, action: PayloadAction<ICastlingBox>) {
        const { king, rook, kingNextPosition, rookNextPosition } = action.payload;
        if (king !== undefined && rook !== undefined) {
            const newKingPiece = { ...king, position: kingNextPosition };
            const newRookPiece = { ...rook, position: rookNextPosition };
            const kingLabel = getLabel(king.position.x, king.position.y);
            const rookLabel = getLabel(rook.position.x, rook.position.y);
            const newKingLabel = getLabel(kingNextPosition.x, kingNextPosition.y);
            const newRookLabel = getLabel(rookNextPosition.x, rookNextPosition.y);
            state.allPositions[newKingLabel] = newKingPiece;
            state.allPositions[newRookLabel] = newRookPiece;
            state.allPositions[kingLabel].piece = undefined;
            state.allPositions[rookLabel].piece = undefined;
            state.activePiece = undefined;
            state.allPossibleKillBoxes = {};
            state.allPossibleVisitingBoxes = {};
            state.castlingBoxes = {}
        }
    }

    function moveToVisitingBox(state: IInitialState, action: PayloadAction<IPosition>) {
        const newPosition = {...action.payload};
        const label = getLabel(newPosition.x, newPosition.y);
        if (state.activePiece !== undefined) {
            const newActivePiece  = {...state.activePiece, position: newPosition};
            const activePieceLabel = getLabel(state.activePiece?.position.x, state.activePiece.position.y);
            state.allPositions[label].piece = newActivePiece;
            state.allPositions[activePieceLabel].piece = undefined;
            state.activePiece = undefined;
            state.allPossibleKillBoxes = {};
            state.allPossibleVisitingBoxes = {};
            state.castlingBoxes = {}
        }
    }

    function makePieceInActive(state: IInitialState) {
        state.activePiece = undefined;
        state.allPossibleKillBoxes = {};
        state.allPossibleVisitingBoxes = {};
        state.castlingBoxes = {}
    }

    function makePieceActive(state: IInitialState, action: PayloadAction<IMakePieceActiveProps>) {
        const { piece, pieces } = action.payload;
        const allBoxesCloned = {...state.allPositions};
        const getPossibleMoveArgs: IGetAllPossibleMove = {
            allBoxes: allBoxesCloned,
            piece
        }
        const { allPossibleKillBoxes, allPossibleVisitingBoxes } = getPossibleMove(getPossibleMoveArgs);
        state.activePiece = piece;
        const args:IFilterInvalidBoxesToMove = {
            piece,
            pieces,
            allPositions: allBoxesCloned,
            color: piece.color,
            boxes: {}
        }
        state.allPossibleKillBoxes = filterInvalidBoxesToMove({...args, boxes: allPossibleKillBoxes});
        state.allPossibleVisitingBoxes = filterInvalidBoxesToMove({...args, boxes: allPossibleVisitingBoxes});
    }

    function getKingCastlingBoxes(state: IInitialState, action: PayloadAction<IGetCastingPayloadProps>) {
        const { piece, rooks } = action.payload;
        const allBoxesCloned = {...state.allPositions};
        const getPossibleMoveArgs: IGetAllPossibleMove = {
            allBoxes: allBoxesCloned,
            piece
        }
        for (let i = 0; i < rooks.length; i++) {
            const rookPosition = rooks[i];
            const { label, value} = getCastlingBox(getPossibleMoveArgs, rookPosition);
            if (value !== undefined) {
                state.castlingBoxes[label] = value;
            }
        }
    }
}

const slice = createSlice({
    name: 'position',
    initialState,
    reducers: createReducers()
});

export const positionActions = {
    ...slice.actions };
export const positionReducer = slice.reducer;
