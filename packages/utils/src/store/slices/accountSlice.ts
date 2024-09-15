import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Account } from "../../Account";
import { AccountState } from "../../types";

const initialState: AccountState = {
  account: null,
  isLocked: true,
  exchangeRatings: {},
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setAccount: (state, action: PayloadAction<Account>) => {
      state.account = action.payload;
      state.isLocked = false;
    },
    lockAccount: (state) => {
      state.isLocked = true;
    },
    unlockAccount: (state) => {
      state.isLocked = false;
    },
    clearAccount: (state) => {
      state.account = null;
      state.isLocked = true;
    },
    addExchangeRating: (
      state,
      action: PayloadAction<{
        exchangeId: string;
        pfiDid: string;
        rating: number;
      }>
    ) => {
      const { exchangeId, pfiDid, rating } = action.payload;
      if (!state.exchangeRatings) state.exchangeRatings = {};
      state.exchangeRatings[exchangeId] = { pfiDid, rating };
    },
  },
});

export const {
  setAccount,
  lockAccount,
  unlockAccount,
  clearAccount,
  addExchangeRating,
} = accountSlice.actions;
export default accountSlice.reducer;
