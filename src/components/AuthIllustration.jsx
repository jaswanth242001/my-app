function AuthIllustration() {
  return (
    <svg
      viewBox="0 0 420 460"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="illuA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#6d5bf6" />
        </linearGradient>
        <linearGradient id="illuB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ec4899" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="illuC" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#6d5bf6" />
        </linearGradient>
      </defs>

      <circle cx="210" cy="230" r="190" fill="rgba(109,91,246,0.08)" />

      <g transform="rotate(-8 210 260)">
        <rect x="70" y="220" width="220" height="150" rx="18" fill="url(#illuC)" opacity="0.85" />
      </g>

      <g transform="rotate(6 210 240)">
        <rect x="90" y="150" width="240" height="170" rx="20" fill="#fff" stroke="#ece9fb" strokeWidth="2" />
        <rect x="114" y="182" width="150" height="10" rx="5" fill="url(#illuA)" />
        <rect x="114" y="206" width="192" height="8" rx="4" fill="#eceafc" />
        <rect x="114" y="224" width="192" height="8" rx="4" fill="#eceafc" />
        <rect x="114" y="242" width="130" height="8" rx="4" fill="#eceafc" />
        <circle cx="126" cy="292" r="12" fill="url(#illuB)" />
        <path
          d="M120 292l4.5 4.5L133 287"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="146" y="286" width="120" height="8" rx="4" fill="#f3f1fd" />
      </g>

      <g transform="rotate(-14 340 150)">
        <rect x="300" y="110" width="90" height="90" rx="20" fill="url(#illuB)" opacity="0.9" />
      </g>
      <g transform="rotate(18 60 130)">
        <rect x="30" y="95" width="70" height="70" rx="18" fill="url(#illuA)" opacity="0.85" />
      </g>

      <circle cx="345" cy="330" r="10" fill="#f9a8d4" />
      <circle cx="60" cy="330" r="7" fill="#c4b5fd" />
      <circle cx="200" cy="70" r="6" fill="#67e8f9" />
    </svg>
  );
}

export default AuthIllustration;
