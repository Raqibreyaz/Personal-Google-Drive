import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import GoogleLoginButton from "./components/GoogleLoginButton";
import GithubLoginButton from "./components/GithubLoginButton";

const Login = () => {
  const BASE_URL = import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    if (serverError) setServerError("");
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setServerError("");
    try {
      const response = await fetch(`${BASE_URL}/auth/login/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
        credentials: "include",
      });
      const data = await response.json();
      if (data.error) { setServerError(data.error); return; }
      setOtpSent(true);
    } catch (err) {
      setServerError("Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndLogin = async () => {
    setLoading(true);
    setServerError("");
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
        credentials: "include",
      });
      const data = await response.json();
      if (data.error) { setServerError(data.error); return; }
      navigate("/");
    } catch (err) {
      setServerError("OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

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
              placeholder="4-digit OTP"
              required
            />
          </div>
        )}

        {serverError && <p className="text-red-500 text-[0.7rem] mt-0.5 whitespace-nowrap">{serverError}</p>}

        <button
          type="submit"
          className="bg-blue-600 text-white border-none rounded py-2.5 px-4 w-full cursor-pointer text-base hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {!otpSent
            ? loading ? "Sending OTP..." : "Send OTP"
            : loading ? "Verifying..." : "Verify & Login"}
        </button>

        {otpSent && (
          <button
            type="button"
            className="bg-gray-300 text-gray-700 border-none rounded py-2 px-4 cursor-pointer hover:bg-gray-400 mt-2"
            onClick={handleSendOtp}
            disabled={loading}
          >
            Resend OTP
          </button>
        )}
      </form>

      <p className="text-center mt-2.5">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-700 no-underline font-medium hover:underline hover:text-blue-900">
          Register
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
