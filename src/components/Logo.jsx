function Logo({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6d5bf6" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect x="5" y="9" width="28" height="34" rx="7" fill="url(#logoGradient)" opacity="0.22" />
      <rect x="13" y="4" width="30" height="34" rx="7" fill="url(#logoGradient)" />
      <path
        d="M20 14h16M20 21h16M20 28h9"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M16.5 32.5l3.2 3.2L27 28"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Logo;
