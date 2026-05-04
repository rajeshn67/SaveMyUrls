import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { URL } from './urlsSlice';

interface VaultState {
  vaultLinks: URL[];
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: VaultState = {
  vaultLinks: [],
  isUnlocked: false,
  isLoading: false,
  error: null,
};

const vaultSlice = createSlice({
  name: 'vault',
  initialState,
  reducers: {
    unlockVault: (state, action: PayloadAction<URL[]>) => {
      state.vaultLinks = action.payload;
      state.isUnlocked = true;
      state.error = null;
    },
    lockVault: (state) => {
      state.vaultLinks = [];
      state.isUnlocked = false;
      state.error = null;
      state.isLoading = false;
    },
    addVaultLink: (state, action: PayloadAction<URL>) => {
      state.vaultLinks.unshift(action.payload);
    },
    deleteVaultLink: (state, action: PayloadAction<string>) => {
      state.vaultLinks = state.vaultLinks.filter((url) => url._id !== action.payload);
    },
    setVaultLinks: (state, action: PayloadAction<URL[]>) => {
      state.vaultLinks = action.payload;
    },
    setVaultLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setVaultError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  unlockVault,
  lockVault,
  addVaultLink,
  deleteVaultLink,
  setVaultLinks,
  setVaultLoading,
  setVaultError,
} = vaultSlice.actions;
export default vaultSlice.reducer;
