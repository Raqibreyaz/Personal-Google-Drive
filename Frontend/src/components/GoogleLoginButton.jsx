import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../api/auth.js";

export default function GoogleLoginButton() {
  const navigate = useNavigate();
  return (
    <GoogleLogin
      onSuccess={async function ({ credential }) {
        const res = await loginWithGoogle(credential);
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
