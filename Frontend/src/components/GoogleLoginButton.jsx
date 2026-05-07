import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../api/auth.js";

export default function GoogleLoginButton() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center [&>div]:w-full">
      <GoogleLogin
        onSuccess={async function ({ credential }) {
          try {
            await loginWithGoogle(credential);
            navigate("/app");
          } catch (err) {
            alert(err.message || "Google login failed");
          }
        }}
        onError={function () {
          alert("Some Error Occured!");
        }}
        text="continue_with"
        size="large"
        theme="filled_blue"
        useOneTap
      />
    </div>
  );
}
