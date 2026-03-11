import { useState, useCallback, useRef } from "react";

/**
 * Custom hook to eliminate repetitive try/catch + loading/error boilerplate.
 *
 * Usage:
 *   const { execute, loading, error, errorCode, setError } = useApiCall();
 *
 *   const handleSendOtp = () => execute(
 *     () => sendLoginOtp(email, password),   // API call (must return a promise)
 *     (data) => setOtpSent(true),            // onSuccess — receives parsed data
 *   );
 *
 * `execute` handles setLoading, setError, try/catch, and finally automatically.
 * `errorCode` gives programmatic access to the backend's error code (e.g. "DIR_NOT_FOUND").
 */
export default function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const inFlight = useRef(false);

  const execute = useCallback(async (apiFn, onSuccess) => {
    if (inFlight.current) return; // prevent duplicate in-flight requests
    inFlight.current = true;
    setLoading(true);
    setError("");
    setErrorCode("");
    try {
      const data = await apiFn();
      inFlight.current = false;
      if (onSuccess) onSuccess(data);
    } catch (err) {
      inFlight.current = false;
      setError(err.message || "Something went wrong");
      setErrorCode(err.errorCode || "");
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error, errorCode, setError };
}
