import { configureStore, Middleware } from '@reduxjs/toolkit';
import logger from 'redux-logger'
import { gameReducer } from './game.slice';
import { pieceReducer } from './piece.slice';
import { positionReducer } from './position.slice';

export const store = configureStore({
    reducer: {
        game: gameReducer,
        position: positionReducer,
        piece: pieceReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger as Middleware),
});

export type RootState = ReturnType<typeof store.getState>
