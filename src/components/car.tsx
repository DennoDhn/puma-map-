import { useId } from 'react';
export function Car({ className = '' }: { className?: string }) {
  const id = useId();
  return (
    <svg
      className={className}
      viewBox="0 0 800 330"
      role="img"
      aria-label="Eigene grafische Interpretation eines kompakten Sportcoupés"
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.3" y2="1">
          <stop stopColor="#717d83" />
          <stop offset=".23" stopColor="#35434c" />
          <stop offset=".6" stopColor="#172029" />
          <stop offset="1" stopColor="#070b10" />
        </linearGradient>
        <linearGradient id={`${id}-glass`}>
          <stop stopColor="#121e2a" />
          <stop offset=".5" stopColor="#3c525d" />
          <stop offset="1" stopColor="#0a131c" />
        </linearGradient>
        <linearGradient id={`${id}-line`}>
          <stop stopColor="#c8ff28" stopOpacity="0" />
          <stop offset=".5" stopColor="#c8ff28" />
          <stop offset="1" stopColor="#c8ff28" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-wheel`}>
          <stop stopColor="#5f6975" />
          <stop offset=".22" stopColor="#10151e" />
          <stop offset=".7" stopColor="#78838a" />
          <stop offset=".74" stopColor="#0a0c10" />
          <stop offset="1" stopColor="#020305" />
        </radialGradient>
      </defs>
      <ellipse cx="410" cy="277" rx="326" ry="20" fill="#000" opacity=".7" />
      <path
        d="M64 231 Q65 205 95 192 L216 163 Q279 91 364 87 Q441 81 500 144 L565 163 Q668 171 720 202 L743 233 L731 258 L679 263 Q675 200 622 198 Q566 196 558 262 L251 267 Q242 202 188 204 Q137 206 130 262 L83 252Z"
        fill={`url(#${id}-body)`}
        stroke="#6e8088"
        strokeWidth="1.5"
      />
      <path
        d="M244 161 Q301 101 364 100 Q430 98 478 145 L492 161Z"
        fill={`url(#${id}-glass)`}
        stroke="#81939b"
      />
      <path
        d="M379 101 L393 161 M251 167 L491 167 L507 231 Q412 246 267 241Z"
        stroke="#75838a"
        strokeWidth="1"
        opacity=".6"
        fill="none"
      />
      <path
        d="M92 197 Q202 184 266 174 Q502 163 680 197"
        stroke="#b5ced2"
        opacity=".55"
        fill="none"
      />
      <path d="M84 215 L119 209 L131 223 L85 233Z" fill="#f0faff" />
      <path d="M700 206 L723 217 L728 229 L703 226Z" fill="#cc3b57" />
      <path d="M281 252 L539 250" stroke={`url(#${id}-line)`} strokeWidth="3" />
      <path d="M465 178 L487 178" stroke="#acb6bd" strokeWidth="3" />
      <g fill={`url(#${id}-wheel)`} stroke="#333e48" strokeWidth="3">
        <circle cx="189" cy="252" r="47" />
        <circle cx="620" cy="249" r="47" />
      </g>
      <g fill="none" stroke="#a6b2ba" strokeWidth="3">
        <circle cx="189" cy="252" r="29" />
        <circle cx="620" cy="249" r="29" />
        <path d="M189 223V281 M160 252H218 M168 231L210 273 M168 273L210 231 M620 220V278 M591 249H649 M599 228L641 270 M599 270L641 228" />
      </g>
      <g fill="#c8ff28">
        <circle cx="189" cy="252" r="6" />
        <circle cx="620" cy="249" r="6" />
      </g>
    </svg>
  );
}
