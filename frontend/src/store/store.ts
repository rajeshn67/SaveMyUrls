import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import urlsReducer from './urlsSlice';
import vaultReducer from './vaultSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    urls: urlsReducer,
    vault: vaultReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
