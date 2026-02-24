import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import GoogleLoginButton from "./components/GoogleLoginButton";
import GithubLoginButton from "./components/GithubLoginButton";

const Register = () => {
  const BASE_URL = import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    if (serverError) setServerError("");
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // STEP 1: SEND OTP (validates user doesn't exist on the backend)
  const handleSendOtp = async () => {
    setLoading(true);
    setServerError("");

    try {
      const res = await fetch(`${BASE_URL}/auth/register/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
        credentials: "include",
      });
      const data = await res.json();

      if (data.error) {
        setServerError(data.error);
        return;
      }

      setOtpSent(true);
    } catch (err) {
      console.error(err);
      setServerError("Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP + REGISTER (single request — backend verifyOtp middleware handles it)
  const handleVerifyOtpAndRegister = async () => {
    setLoading(true);
    setServerError("");

    try {
      const response = await fetch(`${BASE_URL}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, otp }),
        credentials: "include",
      });
      const data = await response.json();

      if (data.error) {
        setServerError(data.error);
        return;
      }

      // OTP VERIFIED → REGISTRATION COMPLETE
      navigate("/");
    } catch (err) {
      console.error(err);
      setServerError("Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!otpSent) {
      handleSendOtp();
    } else {
      handleVerifyOtpAndRegister();
    }
  };

  const hasError = Boolean(serverError);

  return (
    <div className="container">
      <h2 className="heading">Register with OTP</h2>

      <form className="form" onSubmit={handleSubmit}>
        {/* NAME */}
        <div className="form-group">
          <label className="label">Name</label>
          <input
            className={`input ${hasError ? "input-error" : ""}`}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
            disabled={otpSent}
          />
        </div>

        {/* EMAIL */}
        <div className="form-group">
          <label className="label">Email</label>
          <input
            className={`input ${hasError ? "input-error" : ""}`}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            disabled={otpSent}
          />
        </div>

        {/* PASSWORD */}
        <div className="form-group">
          <label className="label">Password</label>
          <input
            className={`input ${hasError ? "input-error" : ""}`}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            disabled={otpSent}
          />
        </div>

        {/* OTP FIELD APPEARS AFTER OTP SENT */}
        {otpSent && (
          <div className="form-group">
            <label className="label">Enter OTP</label>
            <input
              className={`input ${hasError ? "input-error" : ""}`}
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="4-digit OTP"
              maxLength={4}
              required
            />
          </div>
        )}

        {/* ERROR MESSAGE */}
        {serverError && <p className="error-msg">{serverError}</p>}

        {/* BUTTON */}
        <button type="submit" className="submit-button" disabled={loading}>
          {!otpSent
            ? loading
              ? "Sending OTP..."
              : "Send OTP"
            : loading
              ? "Verifying..."
              : "Verify & Register"}
        </button>

        {/* RESEND OTP */}
        {otpSent && (
          <button
            type="button"
            className="secondary-button"
            onClick={handleSendOtp}
            disabled={loading}
          >
            Resend OTP
          </button>
        )}
      </form>

      <p className="link-text">
        Already have an account? <Link to="/login">Login</Link>
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div>Or</div>
        <div className="center-align">
          <GoogleLoginButton />
          <GithubLoginButton />
        </div>
      </div>
    </div>
  );
};

export default Register;
