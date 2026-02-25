import { useNavigate } from "react-router-dom";
import { Github } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const GithubLoginButton = ({
  children = "Continue with GitHub",
  disabled = false,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const listenerAttached = useRef(false);

  const handleGithubLogin = useCallback(() => {
    if (disabled || loading) return;
    setLoading(true);

    const BACKEND_URI = import.meta.env.VITE_BACKEND_URI;
    const FRONTEND_URI = import.meta.env.VITE_FRONTEND_URI;

    const width = 480;
    const height = 560;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      `${BACKEND_URI}/auth/github`,
      "github-oauth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!listenerAttached.current) {
      listenerAttached.current = true;
      const onMessage = (event) => {
        if (event.origin !== FRONTEND_URI) return;
        if (event.data?.message === "success") navigate("/");
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
      className="w-full flex items-center justify-center gap-2 py-2.5 px-2 border border-gray-300 rounded-[0.3rem] bg-white text-gray-800 text-sm font-semibold cursor-pointer shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:border-gray-800 focus-visible:ring-2 focus-visible:ring-gray-800/25 disabled:opacity-60 disabled:cursor-not-allowed"
      onClick={handleGithubLogin}
      disabled={disabled || loading}
    >
      <Github size={18} className="shrink-0" />
      {loading ? (
        <span className="opacity-80 animate-[pulse-opacity_1s_infinite_ease-in-out]">Redirecting...</span>
      ) : (
        <span>{children}</span>
      )}
    </button>
  );
};

export default GithubLoginButton;
