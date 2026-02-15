import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

export default function GoogleLoginButton() {
  const BACKEND_URI =
    import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";
  const navigate = useNavigate();
  return (
    <GoogleLogin
      onSuccess={async function ({ credential }) {
        const res = await fetch(`${BACKEND_URI}/user/login/google`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: credential }),
        });
        if (res.ok) navigate("/");
      }}
      onError={function () {
        alert("Some Error Occured!");
      }}
      text="continue_with"
      useOneTap
    />
  );
}
