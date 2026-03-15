import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { sendUpdatePasswordOtp, updateUserPassword } from "./api/auth.js";
import useOtpTimer from "./hooks/useOtpTimer.js";

const UpdatePassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpMsg, setOtpMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [customError, setCustomError] = useState("");

  const { secondsLeft, startTimer } = useOtpTimer();

  const otpMutation = useMutation({
    mutationFn: () => sendUpdatePasswordOtp(email),
    onSuccess: () => {
      setOtpMsg("OTP sent to your email!");
      setTimeout(() => setOtpMsg(""), 5000);
      startTimer();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateUserPassword(email, otp, newPassword),
    onSuccess: () => setSuccessMsg("Password updated successfully!"),
  });

  const handleSendOtp = () => {
    if (!email) { setCustomError("Please enter your email first."); return; }
    setCustomError("");
    otpMutation.mutate();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const serverError = otpMutation.error?.message || updateMutation.error?.message || customError;
  const otpLoading = otpMutation.isPending;
  const submitLoading = updateMutation.isPending;
  const hasError = Boolean(serverError);

  return (
    <div className="max-w-[400px] mx-auto p-5">
      <h2 className="text-center mb-5">Update Password</h2>

      <form className="flex flex-col" onSubmit={handleSubmit}>
        {/* Email + Send OTP */}
        <div className="relative mb-5">
          <label className="block mb-1 font-bold">Email</label>
          <div className="flex gap-2">
            <input
              className={`flex-1 p-2 box-border border rounded ${hasError ? "border-red-500" : "border-gray-300"}`}
              type="email"
              value={email}
              onChange={(e) => { 
                setCustomError("");
                otpMutation.reset();
                updateMutation.reset();
                setEmail(e.target.value); 
              }}
              placeholder="Enter your email"
              required
            />
            <button
              type="button"
              className="bg-gray-600 text-white border-none rounded py-2 px-3 cursor-pointer text-sm hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
              onClick={handleSendOtp}
              disabled={otpLoading || secondsLeft > 0}
            >
              {otpLoading ? "Sending..." : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Send OTP"}
            </button>
          </div>
          {otpMsg && <p className="text-green-600 text-[0.75rem] mt-1 font-medium">{otpMsg}</p>}
        </div>

        {/* OTP */}
        <div className="relative mb-5">
          <label className="block mb-1 font-bold">OTP</label>
          <input
            className={`w-full p-2 box-border border rounded ${hasError ? "border-red-500" : "border-gray-300"}`}
            type="text"
            value={otp}
            onChange={(e) => { 
                setCustomError("");
                otpMutation.reset();
                updateMutation.reset();
                setOtp(e.target.value); 
            }}
            placeholder="6-digit OTP"
            required
          />
        </div>

        {/* New Password */}
        <div className="relative mb-5">
          <label className="block mb-1 font-bold">New Password</label>
          <input
            className={`w-full p-2 box-border border rounded ${hasError ? "border-red-500" : "border-gray-300"}`}
            type="password"
            value={newPassword}
            onChange={(e) => { 
                setCustomError("");
                otpMutation.reset();
                updateMutation.reset();
                setNewPassword(e.target.value); 
            }}
            placeholder="6-10 characters"
            minLength={6}
            maxLength={10}
            required
          />
        </div>

        {serverError && <p className="text-red-500 text-[0.8rem] mb-2">{serverError}</p>}
        {successMsg && <p className="text-green-600 text-[0.8rem] mb-2 font-bold">{successMsg}</p>}

        <button
          type="submit"
          className="bg-blue-600 text-white border-none rounded py-2.5 px-4 w-full cursor-pointer text-base hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={submitLoading}
        >
          {submitLoading ? "Updating..." : "Update Password"}
        </button>
      </form>

      <p className="text-center mt-4">
        <Link to="/login" className="text-blue-700 no-underline font-medium hover:underline hover:text-blue-900">
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default UpdatePassword;
