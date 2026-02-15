import React, { useEffect } from "react";

export default function Callback() {
  const BACKEND_URI = import.meta.env.VITE_BACKEND_URI;
  useEffect(() => {
    if (window.name === "github-oauth") {
      (async function () {
        const res = await fetch(`${BACKEND_URI}/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          window.opener.postMessage({ message: "success" });
          window.close();
        }
      })();
    }
  }, []);
  return <div>Callback</div>;
}
