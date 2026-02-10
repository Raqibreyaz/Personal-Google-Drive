import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const BASE_URL = "http://localhost:8080";
  const navigate = useNavigate();

  // FORM STATE
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");

  // FLOW STATE
  const [otpSent, setOtpSent] = useState(false);
  const [tempToken, setTempToken] = useState("");

  // UI STATE
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    if (serverError) setServerError("");

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // STEP 1: SEND OTP
  const handleSendOtp = async () => {
    setLoading(true);
    setServerError("");

    try {
      const response = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (data.error) {
        setServerError(data.error);
        return;
      }

      setOtpSent(true);
      setTempToken(data.tempToken);
    } catch (err) {
      console.error(err);
      setServerError("Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP + LOGIN
  const handleVerifyOtpAndLogin = async () => {
    setLoading(true);
    setServerError("");

    try {
      let response = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp,
          email: formData.email,
        }),
        credentials: "include",
      });

      let data = await response.json();

      if (data.error) {
        setServerError(data.error);
        return;
      }

      response = await fetch(`${BASE_URL}/user/login`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        method: "POST",
        credentials: "include",
      });
      data = await response.json();

      if (data.error) {
        setServerError(data.error);
        return;
      }

      // OTP VERIFIED → LOGIN COMPLETE
      navigate("/");
    } catch (err) {
      console.error(err);
      setServerError("OTP verification failed.", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!otpSent) {
      handleSendOtp();
    } else {
      handleVerifyOtpAndLogin();
    }
  };

  const hasError = Boolean(serverError);

  return (
    <div className="container">
      <h2 className="heading">Login with OTP</h2>

      <form className="form" onSubmit={handleSubmit}>
        {/* EMAIL */}
        <div className="form-group">
          <label className="label">Email</label>
          <input
            className={`input ${hasError ? "input-error" : ""}`}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={otpSent} // Lock email after OTP sent
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
            required
            disabled={otpSent} // Lock password after OTP sent
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
              placeholder="6-digit OTP"
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
              : "Verify & Login"}
        </button>

        {/* OPTIONAL UX: RESEND OTP */}
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
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;
