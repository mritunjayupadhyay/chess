import { configureStore, Middleware } from '@reduxjs/toolkit';
import logger from 'redux-logger'
import { gameReducer } from './game.slice';
import { pieceReducer } from './piece.slice';
import { positionReducer } from './position.slice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            game: gameReducer,
            position: positionReducer,
            piece: pieceReducer,
        },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger as Middleware),
    });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
