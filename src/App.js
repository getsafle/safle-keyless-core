import { useEffect, useState } from "react";
import "./App.css";
import ConnectionManager from "./utils/ConnectionManager";

const connectionManager = new ConnectionManager(); // !* initialization of ConnectionManager
function App() {
  const [connect, setConnect] = useState(false);
  useEffect(() => {
    (async () => {
      await connectionManager.initializeConnection();
      await connectionManager.initializeConnectionManager();
      const res = await connectionManager.getAccounts();
      if (res?.loginSuccess) {
        setConnect(res.loginSuccess);
      }
    })();
  }, []);

  const dashboardRenderer = () => {
   return null
  };

  return <div className="container">{connect ? dashboardRenderer : null}</div>;
}

export default App;
