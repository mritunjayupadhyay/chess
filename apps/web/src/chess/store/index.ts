import { configureStore, Middleware } from '@reduxjs/toolkit';
import logger from 'redux-logger'
import { gameReducer } from './game.slice';
import { pieceReducer } from './piece.slice';
import { positionReducer } from './position.slice';
import { multiplayerReducer } from './multiplayer.slice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            game: gameReducer,
            position: positionReducer,
            piece: pieceReducer,
            multiplayer: multiplayerReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({ serializableCheck: false }).concat(logger as Middleware),
    });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
