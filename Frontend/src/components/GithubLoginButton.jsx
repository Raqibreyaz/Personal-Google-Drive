import { useNavigate } from "react-router-dom";
import { Github } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const GithubLoginButton = ({
  children = "Continue with GitHub",
  disabled = false,
  className = "",
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const listenerAttached = useRef(false);

  const handleGithubLogin = useCallback(() => {
    if (disabled || loading) return;

    setLoading(true);

    const BACKEND_URI = import.meta.env.VITE_BACKEND_URI;
    const FRONTEND_URI = import.meta.env.VITE_FRONTEND_URI;

    // Open popup centered
    const width = 480;
    const height = 560;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      `${BACKEND_URI}/auth/github`,
      "github-oauth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    // Attach listener only once
    if (!listenerAttached.current) {
      listenerAttached.current = true;

      const onMessage = (event) => {
        console.log(event.data);
        console.log(event.origin);
        // Security: validate origin
        if (event.origin !== FRONTEND_URI) return;

        if (event.data?.message === "success") {
          navigate("/");
        }

        setLoading(false);
        window.removeEventListener("message", onMessage);
        listenerAttached.current = false;
      };

      window.addEventListener("message", onMessage);
    }
  }, [disabled, loading, navigate]);

  return (
    <button
      type="button"
      className="github-btn"
      onClick={handleGithubLogin}
      disabled={disabled || loading}
    >
      <Github size={18} className="github-icon" />

      {loading ? (
        <span className="github-loading">Redirecting...</span>
      ) : (
        <span>{children}</span>
      )}
    </button>
  );
};

export default GithubLoginButton;
