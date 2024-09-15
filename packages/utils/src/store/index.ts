import { configureStore } from "@reduxjs/toolkit";
import { RootState } from "../types";
import accountReducer from "./slices/accountSlice";

const store = configureStore<RootState>({
  reducer: {
    account: accountReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export default store;
