import HomePageScreen from "@kapital/ui/src/screens/HomeScreen";
import LandingPageScreen from "@kapital/ui/src/screens/LandingPage";
import UnlockScreen from "@kapital/ui/src/screens/UnlockScreen";
import { RootState } from "@kapital/utils/src/types";
import React from "react";
import { useSelector } from "react-redux";

const App: React.FC = () => {
  const { account, isLocked } = useSelector(
    (state: RootState) => state.account
  );

  if (!account) {
    return <LandingPageScreen />;
  }

  if (isLocked) {
    return <UnlockScreen />;
  }

  return <HomePageScreen />;
};

export default App;
