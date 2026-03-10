import { useState, useCallback } from "react";

/**
 * Custom hook to eliminate repetitive try/catch + loading/error boilerplate.
 *
 * Usage:
 *   const { execute, loading, error, setError } = useApiCall();
 *
 *   const handleSendOtp = () => execute(
 *     () => sendLoginOtp(email, password),   // API call (must return a promise)
 *     (data) => setOtpSent(true),            // onSuccess — receives parsed data
 *   );
 *
 * `execute` handles setLoading, setError, try/catch, and finally automatically.
 */
export default function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const execute = useCallback(async (apiFn, onSuccess) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFn();
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error, setError };
}
