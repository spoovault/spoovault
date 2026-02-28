import { useState } from "react";

const SpooVaultFallback = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="sv-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2a0a12" />
        <stop offset="60%" stopColor="#1a0711" />
        <stop offset="100%" stopColor="#14050f" />
      </linearGradient>
      <linearGradient id="sv-ribbon" x1="14%" y1="6%" x2="84%" y2="92%">
        <stop offset="0%" stopColor="#FF9C96" />
        <stop offset="52%" stopColor="#EF4A4F" />
        <stop offset="100%" stopColor="#B5172E" />
      </linearGradient>
      <radialGradient id="sv-core" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#FF7A5B" />
        <stop offset="100%" stopColor="#C71E32" />
      </radialGradient>
    </defs>
    <rect x="2" y="2" width="124" height="124" rx="28" fill="url(#sv-bg)" />
    <path
      fill="url(#sv-ribbon)"
      d="M97 28H55c-10.5 0-19 8.5-19 19s8.5 19 19 19h18c5 0 9 4 9 9s-4 9-9 9H31v16h42c13.8 0 25-11.2 25-25S86.8 50 73 50H55c-1.7 0-3-1.3-3-3s1.3-3 3-3h40z"
    />
    <circle cx="64" cy="64" r="13" fill="url(#sv-core)" />
    <path fill="#FFEAD5" d="M60.6 58.4c1.3-2.2 4.4-2.2 5.7 0l4.9 8.5c1.3 2.2-.3 5.1-2.8 5.1H58.5c-2.6 0-4.2-2.8-2.8-5.1z" />
  </svg>
);

const BrandLogo = ({ className = "w-6 h-6", alt = "SpooVault logo" }: { className?: string; alt?: string }) => {
  const [src, setSrc] = useState("/spoovault-logo.png");
  const [useFallback, setUseFallback] = useState(false);

  if (!useFallback) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} object-contain`}
        decoding="async"
        onError={() => {
          if (src !== "/spoovault-logo.svg") {
            setSrc("/spoovault-logo.svg");
            return;
          }
          setUseFallback(true);
        }}
      />
    );
  }

  return <SpooVaultFallback className={className} />;
};

export default BrandLogo;
