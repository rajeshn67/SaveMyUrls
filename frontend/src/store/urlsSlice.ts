import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface URL {
  _id: string;
  title: string;
  url: string;
  description?: string;
  category: string;
  tags?: string[];
  isFavorite: boolean;
  isPinned: boolean;
  isSecret?: boolean;
  pinnedAt?: string;
  thumbnail?: string;
  domain: string;
  createdAt: string;
}

interface URLsState {
  urls: URL[];
  favorites: URL[];
  isLoading: boolean;
  error: string | null;
  filter: {
    category: string;
    search: string;
    showFavorites: boolean;
  };
}

const initialState: URLsState = {
  urls: [],
  favorites: [],
  isLoading: false,
  error: null,
  filter: {
    category: 'all',
    search: '',
    showFavorites: false,
  },
};

const urlsSlice = createSlice({
  name: 'urls',
  initialState,
  reducers: {
    setUrls: (state, action: PayloadAction<URL[]>) => {
      state.urls = action.payload;
      state.favorites = action.payload.filter((url) => url.isFavorite);
    },
    addUrl: (state, action: PayloadAction<URL>) => {
      state.urls.unshift(action.payload);
      if (action.payload.isFavorite) {
        state.favorites.unshift(action.payload);
      }
    },
    updateUrl: (state, action: PayloadAction<URL>) => {
      const index = state.urls.findIndex((url) => url._id === action.payload._id);
      if (index !== -1) {
        state.urls[index] = action.payload;
      }
      const favIndex = state.favorites.findIndex((url) => url._id === action.payload._id);
      if (action.payload.isFavorite && favIndex === -1) {
        state.favorites.unshift(action.payload);
      } else if (!action.payload.isFavorite && favIndex !== -1) {
        state.favorites.splice(favIndex, 1);
      }
    },
    deleteUrl: (state, action: PayloadAction<string>) => {
      state.urls = state.urls.filter((url) => url._id !== action.payload);
      state.favorites = state.favorites.filter((url) => url._id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilter: (state, action: PayloadAction<Partial<URLsState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    resetUrls: () => initialState,
  },
});

export const { setUrls, addUrl, updateUrl, deleteUrl, setLoading, setError, setFilter, resetUrls } =
  urlsSlice.actions;
export default urlsSlice.reducer;
