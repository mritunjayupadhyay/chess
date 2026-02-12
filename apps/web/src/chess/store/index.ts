import { configureStore, Middleware } from '@reduxjs/toolkit';
import logger from 'redux-logger'
import { multiplayerReducer } from './multiplayer.slice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            multiplayer: multiplayerReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({ serializableCheck: false }).concat(logger as Middleware),
    });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
