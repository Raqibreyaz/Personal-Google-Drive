import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import GoogleLoginButton from "./components/GoogleLoginButton";
import GithubLoginButton from "./components/GithubLoginButton";
import { sendRegisterOtp, registerWithOtp } from "./api/auth.js";
import useOtpTimer from "./hooks/useOtpTimer.js";
import { sanitizeText } from "./utils/sanitize.js";

const Register = () => {
  const navigate = useNavigate();
  const { secondsLeft, startTimer } = useOtpTimer();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpMsg, setOtpMsg] = useState("");

  const otpMutation = useMutation({
    mutationFn: () => sendRegisterOtp(formData.email),
    onSuccess: () => {
      setOtpMsg("OTP sent to your email!");
      setTimeout(() => setOtpMsg(""), 5000);
      startTimer();
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => registerWithOtp({ ...formData, name: sanitizeText(formData.name) }, otp),
    onSuccess: () => navigate("/app"),
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendOtp = () => {
    otpMutation.reset();
    registerMutation.reset();

    // Only email is needed to send OTP
    if (!formData.email) {
      alert("Email is required to send OTP.");
      return;
    }

    otpMutation.mutate();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // All fields required for final registration
    if (!formData.name || !formData.email || !formData.password || !otp) {
      alert("Name, Email, Password, and OTP are all required to register.");
      return;
    }

    otpMutation.reset();
    registerMutation.reset();
    registerMutation.mutate();
  };

  const serverError = otpMutation.error?.message || registerMutation.error?.message;
  const hasSendOtpError = Boolean(otpMutation.error);
  const hasRegisterError = Boolean(registerMutation.error);
  const baseInput = "w-full p-2 box-border border rounded";
  // Send OTP only needs email → only email turns red on OTP send error
  // Final register needs all fields → all turn red on register error
  const nameClass = `${baseInput} ${hasRegisterError ? "border-red-500" : "border-gray-300"}`;
  const emailClass = `${baseInput} ${(hasSendOtpError || hasRegisterError) ? "border-red-500" : "border-gray-300"}`;
  const passwordClass = `${baseInput} ${hasRegisterError ? "border-red-500" : "border-gray-300"}`;
  const otpClass = `flex-1 p-2 box-border border rounded ${hasRegisterError ? "border-red-500" : "border-gray-300"}`;

  return (
    <div className="max-w-[400px] mx-auto p-5">
      <h2 className="text-center mb-5">Register</h2>

      <form className="flex flex-col" onSubmit={handleSubmit}>
        {/* Name */}
        <div className="relative mb-4">
          <label className="block mb-1 font-bold">Name</label>
          <input
            className={nameClass}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
        </div>

        {/* Email */}
        <div className="relative mb-4">
          <label className="block mb-1 font-bold">Email</label>
          <input
            className={emailClass}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>

        {/* Password */}
        <div className="relative mb-4">
          <label className="block mb-1 font-bold">Password</label>
          <input
            className={passwordClass}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
        </div>

        {/* OTP + Send OTP (same row) */}
        <div className="relative mb-4">
          <label className="block mb-1 font-bold">OTP</label>
          <div className="flex gap-2">
            <input
              className={otpClass}
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP"
              maxLength={6}
              required
            />
            <button
              type="button"
              className="bg-gray-600 text-white border-none rounded py-2 px-3 cursor-pointer text-sm hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
              onClick={handleSendOtp}
              disabled={otpMutation.isPending || secondsLeft > 0}
            >
              {otpMutation.isPending
                ? "Sending..."
                : secondsLeft > 0
                  ? `Resend in ${secondsLeft}s`
                  : "Send OTP"}
            </button>
          </div>
          {otpMsg && <p className="text-green-600 text-[0.75rem] mt-1 font-medium">{otpMsg}</p>}
        </div>

        {/* Errors */}
        {serverError && <p className="text-red-500 text-[0.7rem] mt-0.5 mb-2 whitespace-nowrap">{serverError}</p>}

        {/* Verify & Register */}
        <button
          type="submit"
          className="bg-blue-600 text-white border-none rounded py-2.5 px-4 w-full cursor-pointer text-base hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Verifying..." : "Verify & Register"}
        </button>
      </form>

      <p className="text-center mt-2.5">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-700 no-underline font-medium hover:underline hover:text-blue-900">
          Login
        </Link>
      </p>

      {/* Divider */}
      <div className="flex items-center gap-3 my-3">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-gray-400 text-sm">or continue with</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      {/* OAuth buttons side-by-side */}
      <div className="flex justify-center items-center gap-2">
        <GoogleLoginButton />
        <GithubLoginButton />
      </div>
    </div>
  );
};

export default Register;
