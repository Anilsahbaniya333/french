"use client";

import { useState } from "react";

interface Props {
  size?: number;
  imgClassName?: string;
  /** Tailwind classes applied to the text fallback wrapper */
  textClassName?: string;
  /** Whether the fallback text should use light colours (e.g. on dark bg) */
  light?: boolean;
}

export default function LogoImage({
  size = 48,
  imgClassName = "object-contain",
  textClassName,
  light = false,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={textClassName ?? "flex items-center"}>
        <span className={`text-xl font-black tracking-tight ${light ? "text-white" : "text-slate-800"}`}>
          Mappele
        </span>
        <span className="text-xl font-black text-amber-500">.</span>
        <span className={`text-xl font-black tracking-tight ${light ? "text-white" : "text-slate-800"}`}>
          French
        </span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.jfif"
      alt="Mappele Academy"
      width={size}
      height={size}
      className={imgClassName}
      onError={() => setFailed(true)}
    />
  );
}
