import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import DirectoryView from "./DirectoryView";
import Register from "./Register";
import Login from "./Login";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DirectoryView />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/directory/:dirId",
    element: <DirectoryView />,
  },
]);

function App() {
  return (
    <GoogleOAuthProvider clientId="<client_id>">
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
}

export default App;
