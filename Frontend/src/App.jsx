import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import DirectoryView from "./DirectoryView";
import Register from "./Register";
import Login from "./Login";
import Callback from "./Callback";
import UsersPage from "./UsersPage";
import SharedWithMePage from "./SharedWithMePage";
import UpdatePassword from "./UpdatePassword";
import Plans from "./Plans";
import Dashboard from "./Dashboard";
import LandingPage from "./LandingPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
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
    path: "/callback",
    element: <Callback />,
  },
  {
    path: "/update-password",
    element: <UpdatePassword />,
  },
  {
    path: "/plans",
    element: <Plans />,
  },
  {
    path: "/app",
    element: <DirectoryView />,
  },
  {
    path: "/app/directory/:dirId",
    element: <DirectoryView />,
  },
  {
    path: "/app/users",
    element: <UsersPage />,
  },
  {
    path: "/app/shared",
    element: <SharedWithMePage />,
  },
  {
    path: "/app/dashboard",
    element: <Dashboard />,
  },
]);

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "<client_id>";
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GoogleOAuthProvider clientId={clientId}>
          <RouterProvider router={router} />
        </GoogleOAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
