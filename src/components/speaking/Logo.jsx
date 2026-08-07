export default function Logo({ className = "h-12 w-12" }) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="RISE logo">
      <defs>
        <radialGradient id="riseGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#E8B54A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#E8B54A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="riseRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCE2A0" />
          <stop offset="45%" stopColor="#E8B54A" />
          <stop offset="100%" stopColor="#9C6B1F" />
        </linearGradient>
        <linearGradient id="riseBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1c1f27" />
          <stop offset="100%" stopColor="#0c0d10" />
        </linearGradient>
        <linearGradient id="risePageLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCE2A0" />
          <stop offset="100%" stopColor="#D69A2E" />
        </linearGradient>
        <linearGradient id="risePageRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5D28A" />
          <stop offset="100%" stopColor="#B87F22" />
        </linearGradient>
        <linearGradient id="riseRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C23B52" />
          <stop offset="50%" stopColor="#8E1F35" />
          <stop offset="100%" stopColor="#6E1728" />
        </linearGradient>
        <filter id="riseSoftShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>
      <circle cx="100" cy="100" r="98" fill="url(#riseGlow)" />
      <circle cx="100" cy="100" r="92" fill="url(#riseBgGrad)" stroke="url(#riseRingGrad)" strokeWidth="5" filter="url(#riseSoftShadow)" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#E8B54A" strokeWidth="1" strokeDasharray="1,6" opacity="0.55" />
      <circle cx="100" cy="100" r="72" fill="none" stroke="url(#riseRingGrad)" strokeWidth="1.5" strokeDasharray="4,5" opacity="0.75" />
      <g stroke="url(#riseRingGrad)" strokeWidth="3.5" strokeLinecap="round">
        <line x1="100" y1="16" x2="100" y2="34" />
        <line x1="100" y1="166" x2="100" y2="184" />
        <line x1="16" y1="100" x2="34" y2="100" />
        <line x1="166" y1="100" x2="184" y2="100" />
      </g>
      <g stroke="url(#riseRingGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <line x1="42" y1="42" x2="52" y2="52" />
        <line x1="158" y1="42" x2="148" y2="52" />
        <line x1="42" y1="158" x2="52" y2="148" />
        <line x1="158" y1="158" x2="148" y2="148" />
      </g>
      <path d="M100,52 C79,52 63,68 63,88 C63,110 85,128 100,142 C115,128 137,110 137,88 C137,68 121,52 100,52 Z" fill="#05060a" opacity="0.5" filter="url(#riseSoftShadow)" transform="translate(2,3)" />
      <path d="M100,52 C79,52 63,68 63,88 C63,110 85,128 100,142 C115,128 137,110 137,88 C137,68 121,52 100,52 Z" fill="url(#riseBgGrad)" stroke="url(#riseRingGrad)" strokeWidth="2.5" />
      <circle cx="100" cy="85" r="33" fill="#0a0b0e" stroke="url(#riseRingGrad)" strokeWidth="2" opacity="0.95" />
      <path d="M100,68 C90,64 80,66 74,70 L74,102 C80,98 90,97 100,101 Z" fill="url(#risePageLeft)" />
      <path d="M100,68 C110,64 120,66 126,70 L126,102 C120,98 110,97 100,101 Z" fill="url(#risePageRight)" />
      <path d="M73,70 C79,66 88,65 96,68" stroke="#FCE2A0" strokeWidth="1.5" opacity="0.6" fill="none" strokeLinecap="round" />
      <path d="M96,63 L104,63 L104,112 L100,105 L96,112 Z" fill="url(#riseRibbonGrad)" />
      <path d="M96,63 L104,63 L104,70 L96,70 Z" fill="#000" opacity="0.15" />
    </svg>
  );
}