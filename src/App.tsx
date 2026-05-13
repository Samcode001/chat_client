import HomePage from "./pages/HomePage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AddUser from "./pages/AddUser";
import { useEffect } from "react";
import { socketManager } from "./lib/socketInitiator";

function App() {
  // const [count, setCount] = useState(0)

  useEffect(() => {
    socketManager.connect();
  }, []);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/adduser" element={<AddUser />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
