import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import GoogleLoginButton from "./components/GoogleLoginButton";
import GithubLoginButton from "./components/GithubLoginButton";
import { sendLoginOtp, loginWithOtp } from "./api/auth.js";
import useApiCall from "./hooks/useApiCall.js";
import useOtpTimer from "./hooks/useOtpTimer.js";

const Login = () => {
  const navigate = useNavigate();
  const { execute, loading, error: serverError, setError: setServerError } = useApiCall();
  const { secondsLeft, startTimer } = useOtpTimer();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (e) => {
    if (serverError) setServerError("");
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendOtp = () => execute(
    () => sendLoginOtp(formData.email, formData.password),
    () => { setOtpSent(true); startTimer(); },
  );

  const handleVerifyOtpAndLogin = () => execute(
    () => loginWithOtp(formData.email, otp),
    () => navigate("/"),
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otpSent) handleSendOtp();
    else handleVerifyOtpAndLogin();
  };

  const hasError = Boolean(serverError);

  return (
    <div className="max-w-[400px] mx-auto p-5">
      <h2 className="text-center mb-5">Login with OTP</h2>

      <form className="flex flex-col" onSubmit={handleSubmit}>
        <div className="relative mb-5">
          <label className="block mb-1 font-bold">Email</label>
          <input
            className={`w-full p-2 box-border border rounded ${hasError ? "border-red-500" : "border-gray-300"}`}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={otpSent}
          />
        </div>

        <div className="relative mb-5">
          <label className="block mb-1 font-bold">Password</label>
          <input
            className={`w-full p-2 box-border border rounded ${hasError ? "border-red-500" : "border-gray-300"}`}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={otpSent}
          />
        </div>

        {otpSent && (
          <div className="relative mb-5">
            <label className="block mb-1 font-bold">Enter OTP</label>
            <input
              className={`w-full p-2 box-border border rounded ${hasError ? "border-red-500" : "border-gray-300"}`}
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP"
              required
            />
          </div>
        )}

        {serverError && <p className="text-red-500 text-[0.7rem] mt-0.5 whitespace-nowrap">{serverError}</p>}

        <button
          type="submit"
          className="bg-blue-600 text-white border-none rounded py-2.5 px-4 w-full cursor-pointer text-base hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading || (!otpSent && secondsLeft > 0)}
        >
          {!otpSent
            ? loading ? "Sending OTP..." : secondsLeft > 0 ? `Send OTP in ${secondsLeft}s` : "Send OTP"
            : loading ? "Verifying..." : "Verify & Login"}
        </button>

        {otpSent && (
          <button
            type="button"
            className="bg-gray-300 text-gray-700 border-none rounded py-2 px-4 cursor-pointer hover:bg-gray-400 mt-2 disabled:bg-gray-200 disabled:cursor-not-allowed"
            onClick={handleSendOtp}
            disabled={loading || secondsLeft > 0}
          >
            {secondsLeft > 0 ? `Resend OTP in ${secondsLeft}s` : "Resend OTP"}
          </button>
        )}
      </form>

      <p className="text-center mt-2.5">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-700 no-underline font-medium hover:underline hover:text-blue-900">
          Register
        </Link>
      </p>
      <p className="text-center mt-1 mb-4 text-sm">
        Forgot password?{" "}
        <Link to="/update-password" className="text-blue-700 no-underline font-medium hover:underline hover:text-blue-900">
          Update it here
        </Link>
      </p>
      <div className="flex flex-col items-center">
        <div>Or</div>
        <div className="flex justify-center items-center gap-0.5">
          <GoogleLoginButton />
          <GithubLoginButton />
        </div>
      </div>
    </div>
  );
};

export default Login;
