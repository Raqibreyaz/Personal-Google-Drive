import React, { useEffect } from "react";
import { getMe } from "./api/auth.js";

export default function Callback() {
  useEffect(() => {
    if (window.name === "github-oauth") {
      (async function () {
        const res = await getMe();
        if (res.ok) {
          window.opener.postMessage({ message: "success" });
          window.close();
        }
      })();
    }
  }, []);
  return <div>Callback</div>;
}
