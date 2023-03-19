import React from "react";
import Simulator from "./routes/Simulator";
import Wallets from "./routes/Wallets";
import Settings from "./routes/Settings";
const routes = {
  "/": () => <Simulator />,
  "/wallets": () => <Wallets />,
  "/settings": () => <Settings />
};
export default routes;
