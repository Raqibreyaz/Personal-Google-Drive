import React from "react";

export default function ProfileImage({ src }) {
  return <img className="rounded-full w-8" src={src} alt={"profile"} />;
}
