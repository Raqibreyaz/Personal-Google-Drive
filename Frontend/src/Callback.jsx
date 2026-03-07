import React, { useEffect } from "react";

export default function Callback() {
  useEffect(() => {
    if (window.name === "github-oauth") {
      (async function () {
        window.opener.postMessage({ message: "success" });
        window.close();
      })();
    }
  }, []);
  return <div>Callback</div>;
}
