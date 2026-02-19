import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import DirectoryView from "./DirectoryView";
import Register from "./Register";
import Login from "./Login";
import Callback from "./Callback";
import UsersPage from "./UsersPage";
import SharedWithMePage from "./SharedWithMePage";

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
  {
    path: "/users",
    element: <UsersPage />,
  },
  {
    path: "/shared",
    element: <SharedWithMePage />,
  },
  {
    path: "/callback",
    element: <Callback />,
  },
]);

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "<client_id>";
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
}

export default App;
