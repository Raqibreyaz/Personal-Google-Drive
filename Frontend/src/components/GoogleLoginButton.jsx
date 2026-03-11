import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../api/auth.js";

export default function GoogleLoginButton() {
  const navigate = useNavigate();
  return (
    <GoogleLogin
      onSuccess={async function ({ credential }) {
        try {
          await loginWithGoogle(credential);
          navigate("/");
        } catch (err) {
          alert(err.message || "Google login failed");
        }
      }}
      onError={function () {
        alert("Some Error Occured!");
      }}
      text="continue_with"
      useOneTap
    />
  );
}
