import { RARITY_STYLES, type ExtendedRarity } from "./rarity-frame";
import { getOfficeTheme } from "./office-themes";
import type { AvatarItem } from "@/lib/queries";

type Sprite = (color: string) => React.ReactNode;

const ink = "#1f2937";
const softInk = "#334155";
const cream = "#fff7ed";
const light = "#ffffff";
const wood = "#9a5b2f";
const darkWood = "#5b341d";
const metal = "#64748b";

function shadow(rx = 22, ry = 5, cx = 32, cy = 56, opacity = 0.2) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#020617" opacity={opacity} />;
}

function topFace(d: string, fill: string, opacity = 1) {
  return <path d={d} fill={fill} opacity={opacity} />;
}

function softGloss(d = "M 12 18 Q 32 8 52 20", opacity = 0.24) {
  return (
    <path
      d={d}
      stroke={light}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      opacity={opacity}
    />
  );
}

function sparkles(color: string) {
  return (
    <g opacity="0.8">
      <circle cx="13" cy="18" r="1.5" fill={color} />
      <circle cx="51" cy="21" r="1.2" fill={color} />
      <circle cx="46" cy="48" r="1.3" fill={light} />
    </g>
  );
}

function books(x = 14, y = 18) {
  return (
    <g>
      <rect x={x} y={y + 18} width="32" height="5" rx="1.5" fill="#2563eb" />
      <rect x={x + 2} y={y + 12} width="28" height="6" rx="1.5" fill="#f97316" />
      <rect x={x + 5} y={y + 6} width="25" height="6" rx="1.5" fill="#22c55e" />
      <line
        x1={x + 8}
        y1={y + 9}
        x2={x + 26}
        y2={y + 9}
        stroke={light}
        strokeWidth="1"
        opacity="0.45"
      />
      <line
        x1={x + 5}
        y1={y + 15}
        x2={x + 27}
        y2={y + 15}
        stroke={light}
        strokeWidth="1"
        opacity="0.45"
      />
    </g>
  );
}

function leafyPlant(base: string, scale = 1) {
  return (
    <g transform={`translate(${32 - 32 * scale} ${52 - 52 * scale}) scale(${scale})`}>
      <path d="M 22 52 L 26 39 L 38 39 L 42 52 Z" fill="#b86b2f" />
      <ellipse cx="32" cy="39" rx="8" ry="3" fill="#6b3f1f" opacity="0.55" />
      <path d="M 32 40 Q 18 34 22 18 Q 30 27 32 40 Z" fill={base} />
      <path d="M 32 38 Q 48 30 43 15 Q 36 25 32 38 Z" fill="#4ade80" />
      <path d="M 32 35 Q 27 21 32 10 Q 37 21 32 35 Z" fill="#15803d" />
      <ellipse cx="25" cy="22" rx="4" ry="7" fill="#86efac" transform="rotate(-24 25 22)" />
      <ellipse cx="41" cy="21" rx="4" ry="7" fill={base} transform="rotate(25 41 21)" />
    </g>
  );
}

function screenGlow(color: string, x = 10, y = 13, w = 44, h = 21) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={color} opacity="0.78" />
      <path
        d={`M ${x + 3} ${y + h - 6} Q ${x + w * 0.38} ${y + 3} ${x + w * 0.66} ${y + 9} Q ${x + w * 0.86} ${y + 14} ${x + w - 2} ${y + 4} L ${x + w - 2} ${y + h - 1} L ${x + 2} ${y + h - 1} Z`}
        fill="#020617"
        opacity="0.32"
      />
      <rect x={x + 4} y={y + 3} width={w * 0.34} height="2" rx="1" fill={light} opacity="0.42" />
    </g>
  );
}

export const FURNITURE_SPRITES: Record<string, Sprite> = {
  office_desk: (c) => (
    <g>
      {shadow(26, 5, 32, 57, 0.22)}
      {topFace("M 8 25 L 28 16 H 57 L 43 28 H 8 Z", c)}
      <path d="M 8 25 H 43 L 43 35 H 8 Z" fill={darkWood} opacity="0.88" />
      <path d="M 43 28 L 57 16 V 26 L 43 35 Z" fill="#7a4524" />
      <rect x="13" y="34" width="6" height="22" rx="2" fill={darkWood} />
      <rect x="36" y="34" width="6" height="22" rx="2" fill={darkWood} />
      <path d="M 21 37 H 34 V 48 H 21 Z" fill="#7a4524" opacity="0.9" />
      {softGloss("M 14 24 L 29 19 H 51", 0.28)}
    </g>
  ),
  office_plant: (c) => (
    <g>
      {shadow(15, 4, 32, 57, 0.2)}
      {leafyPlant(c, 1)}
    </g>
  ),
  office_monitor: (c) => (
    <g>
      {shadow(20, 4, 32, 54, 0.18)}
      <path d="M 7 11 L 55 8 L 57 38 L 9 40 Z" fill="#0f172a" />
      <path d="M 11 14 L 52 12 L 53 35 L 12 36 Z" fill="#111827" />
      {screenGlow(c, 13, 15, 38, 18)}
      <path d="M 29 39 H 36 L 38 48 H 27 Z" fill={softInk} />
      <path d="M 21 48 H 44 L 48 52 H 17 Z" fill={metal} />
    </g>
  ),
  office_laptop: (c) => (
    <g>
      {shadow(22, 4, 32, 54, 0.16)}
      <path d="M 16 17 L 49 14 L 51 40 L 18 42 Z" fill="#1f2937" />
      <path d="M 19 20 L 47 18 L 48 37 L 20 38 Z" fill="#0f172a" />
      {screenGlow(c, 21, 21, 24, 14)}
      <path d="M 8 42 H 55 L 61 50 Q 57 54 10 53 Q 4 52 8 42 Z" fill="#475569" />
      <path d="M 22 45 H 42 L 39 48 H 25 Z" fill="#94a3b8" opacity="0.75" />
    </g>
  ),
  office_coffee: (c) => (
    <g>
      {shadow(11, 3, 32, 53, 0.14)}
      <path d="M 22 28 Q 32 24 43 28 L 40 48 Q 32 52 24 48 Z" fill={c} />
      <ellipse cx="32" cy="28" rx="10.5" ry="3.3" fill="#78350f" opacity="0.75" />
      <path d="M 42 33 Q 51 34 50 40 Q 49 46 40 44" stroke={c} strokeWidth="3" fill="none" />
      <path
        d="M 27 18 Q 30 12 32 18 M 35 18 Q 38 12 40 18"
        stroke="#cbd5e1"
        strokeWidth="1.4"
        fill="none"
        opacity="0.72"
      />
      <path d="M 25 31 Q 31 34 39 31" stroke={light} strokeWidth="1.5" opacity="0.25" />
    </g>
  ),
  office_board: (c) => (
    <g>
      <path d="M 6 10 H 58 V 45 H 6 Z" fill="#e2e8f0" />
      <path d="M 9 13 H 55 V 41 H 9 Z" fill={c} opacity="0.88" />
      <rect x="13" y="18" width="10" height="8" rx="2" fill="#3b82f6" opacity="0.75" />
      <rect x="26" y="18" width="10" height="8" rx="2" fill="#f97316" opacity="0.75" />
      <rect x="39" y="18" width="10" height="8" rx="2" fill="#22c55e" opacity="0.75" />
      <path
        d="M 14 32 H 50 M 14 36 H 42"
        stroke="#f8fafc"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.72"
      />
      <rect x="25" y="45" width="14" height="6" rx="2" fill={metal} />
    </g>
  ),
  office_whiteboard: (c) => (
    <g>
      <rect x="5" y="8" width="54" height="39" rx="5" fill="#cbd5e1" />
      <rect x="8" y="11" width="48" height="33" rx="4" fill="#f8fafc" />
      <path
        d="M 13 34 Q 24 19 34 27 Q 43 35 52 16"
        stroke={c}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="13" y="15" width="11" height="7" rx="2" fill="#3b82f6" opacity="0.72" />
      <rect x="28" y="15" width="11" height="7" rx="2" fill="#10b981" opacity="0.72" />
      <rect x="43" y="15" width="8" height="7" rx="2" fill="#f59e0b" opacity="0.72" />
      <rect x="21" y="48" width="22" height="5" rx="2.5" fill={metal} />
    </g>
  ),
  office_keyboard: (c) => (
    <g>
      {shadow(16, 3, 32, 48, 0.12)}
      <path d="M 12 31 L 51 28 L 54 41 L 15 44 Z" fill="#1f2937" />
      <path d="M 16 33 L 48 31 L 50 38 L 18 40 Z" fill={c} opacity="0.42" />
      <path d="M 19 35 H 47 M 20 38 H 48" stroke="#e2e8f0" strokeWidth="1" opacity="0.55" />
    </g>
  ),
  office_mousepad: (c) => (
    <g>
      <path d="M 12 39 Q 27 28 50 33 Q 55 41 43 47 Q 24 51 12 39 Z" fill={c} opacity="0.78" />
      <path d="M 22 39 Q 32 34 43 37" stroke={light} strokeWidth="2" opacity="0.24" />
      <ellipse cx="43" cy="39" rx="3.6" ry="4.8" fill="#0f172a" opacity="0.65" />
    </g>
  ),
  office_desk_lamp: (c) => (
    <g>
      {shadow(12, 3, 32, 54, 0.14)}
      <path d="M 24 52 H 40 L 37 45 H 27 Z" fill={softInk} />
      <path d="M 32 45 L 25 30 L 29 28 L 37 43 Z" fill={metal} />
      <path d="M 36 38 L 47 26 L 50 30 L 39 42 Z" fill={metal} />
      <path d="M 45 22 L 57 18 L 59 27 L 47 31 Z" fill={c} />
      <ellipse cx="53" cy="25" rx="11" ry="8" fill="#fde68a" opacity="0.28" />
    </g>
  ),
  office_book_stack: (c) => (
    <g>
      {shadow(13, 3, 32, 53, 0.12)}
      {books(17, 19)}
      <rect x="21" y="31" width="27" height="6" rx="1.5" fill={c} opacity="0.95" />
    </g>
  ),
  office_table_plant: (c) => (
    <g>
      {shadow(10, 3, 32, 53, 0.12)}
      {leafyPlant(c, 0.72)}
    </g>
  ),
  office_trophy: (c) => (
    <g>
      {shadow(14, 4, 32, 56, 0.18)}
      <path d="M 22 9 Q 22 34 32 39 Q 42 34 42 9 Z" fill={c} />
      <path d="M 14 13 Q 14 25 22 27 L 22 11 Z" fill="#b45309" opacity="0.75" />
      <path d="M 50 13 Q 50 25 42 27 L 42 11 Z" fill="#b45309" opacity="0.75" />
      <rect x="28" y="39" width="8" height="10" rx="2" fill={darkWood} />
      <path d="M 20 49 H 44 L 48 55 H 16 Z" fill={darkWood} />
      <circle cx="32" cy="23" r="6" fill="#fef3c7" opacity="0.8" />
      {sparkles("#fde047")}
    </g>
  ),
  office_gaming: (c) => (
    <g>
      {shadow(27, 5, 32, 57, 0.24)}
      <path d="M 6 13 L 58 10 L 59 43 L 7 46 Z" fill="#111827" />
      <path d="M 10 16 L 54 14 L 55 38 L 11 40 Z" fill="#020617" />
      {screenGlow(c, 13, 17, 38, 17)}
      <circle cx="22" cy="28" r="5" fill="#7c3aed" opacity="0.8" />
      <circle cx="45" cy="26" r="2.5" fill="#ef4444" />
      <circle cx="50" cy="31" r="2.5" fill="#22c55e" />
      <path d="M 26 43 H 39 L 42 50 H 23 Z" fill={softInk} />
    </g>
  ),
  office_rocket: (c) => (
    <g>
      {shadow(13, 4, 32, 57, 0.14)}
      <path d="M 32 6 Q 47 26 39 47 Q 35 54 32 56 Q 29 54 25 47 Q 17 26 32 6 Z" fill={c} />
      <path d="M 25 40 Q 16 46 13 56 L 26 50 Z" fill="#ef4444" />
      <path d="M 39 40 Q 48 46 51 56 L 38 50 Z" fill="#ef4444" />
      <circle cx="32" cy="25" r="7" fill="#e0f2fe" />
      <circle cx="32" cy="25" r="4" fill="#7dd3fc" />
      <path d="M 27 50 Q 31 56 32 62 Q 34 56 38 50" fill="#f97316" opacity="0.82" />
    </g>
  ),
  office_diamond: (c) => (
    <g>
      {shadow(17, 4, 32, 58, 0.13)}
      <path d="M 20 8 L 44 8 L 56 26 L 32 56 L 8 26 Z" fill={c} />
      <path d="M 20 8 L 32 26 L 44 8 Z" fill={light} opacity="0.32" />
      <path d="M 8 26 H 32 L 32 56 Z" fill="#020617" opacity="0.18" />
      <path d="M 56 26 H 32 L 32 56 Z" fill={light} opacity="0.18" />
      {sparkles(light)}
    </g>
  ),
  office_sofa: (c) => (
    <g>
      {shadow(28, 5, 32, 57, 0.24)}
      <path d="M 8 29 Q 14 20 25 22 H 47 Q 57 23 58 34 V 50 H 8 Z" fill={c} />
      <path d="M 9 28 H 56 V 38 H 9 Z" fill={light} opacity="0.13" />
      <path d="M 8 37 H 58 V 51 Q 47 55 32 55 Q 17 55 8 51 Z" fill={c} />
      <rect x="7" y="34" width="10" height="19" rx="5" fill="#00000020" />
      <rect x="47" y="34" width="10" height="19" rx="5" fill="#00000020" />
      <path d="M 20 33 H 32 V 49 H 17 V 37 Q 17 33 20 33 Z" fill={light} opacity="0.12" />
      <path d="M 34 33 H 46 Q 49 33 49 37 V 49 H 34 Z" fill={light} opacity="0.12" />
    </g>
  ),
  office_bookshelf: (c) => (
    <g>
      {shadow(20, 5, 32, 58, 0.2)}
      <path d="M 10 8 L 54 5 V 57 H 10 Z" fill={darkWood} />
      <path d="M 14 11 H 51 V 54 H 14 Z" fill={c} opacity="0.92" />
      <path
        d="M 14 23 H 51 M 14 37 H 51 M 14 50 H 51"
        stroke={darkWood}
        strokeWidth="2"
        opacity="0.55"
      />
      {books(16, 2)}
      {books(15, 17)}
      <rect x="40" y="40" width="7" height="10" rx="1" fill="#8b5cf6" />
    </g>
  ),
  office_chandelier: (c) => (
    <g>
      <line x1="32" y1="2" x2="32" y2="18" stroke={metal} strokeWidth="3" />
      <path d="M 17 23 Q 32 14 47 23 Q 41 30 32 31 Q 23 30 17 23 Z" fill={c} />
      <circle cx="21" cy="33" r="5" fill="#fef3c7" opacity="0.9" />
      <circle cx="32" cy="37" r="5" fill="#fef3c7" opacity="0.9" />
      <circle cx="43" cy="33" r="5" fill="#fef3c7" opacity="0.9" />
      <ellipse cx="32" cy="38" rx="25" ry="12" fill="#fde68a" opacity="0.16" />
    </g>
  ),
  office_painting: (c) => (
    <g>
      <rect x="6" y="6" width="52" height="39" rx="4" fill={darkWood} />
      <rect x="9" y="9" width="46" height="33" rx="3" fill={cream} />
      <path d="M 10 36 Q 18 22 28 29 Q 38 36 46 18 L 55 25 V 42 H 10 Z" fill={c} opacity="0.58" />
      <circle cx="22" cy="18" r="6" fill="#fef08a" opacity="0.7" />
      <rect x="28" y="45" width="8" height="7" rx="2" fill={darkWood} />
    </g>
  ),
  office_wall_window: (c) => (
    <g>
      <rect x="5" y="10" width="54" height="38" rx="8" fill="#dbeafe" />
      <rect x="9" y="14" width="46" height="30" rx="6" fill={c} opacity="0.26" />
      <path d="M 9 39 Q 20 26 31 34 Q 42 18 56 25 V 45 H 9 Z" fill={light} opacity="0.34" />
      <path d="M 32 14 V 44 M 9 30 H 55" stroke="#1d4ed8" strokeWidth="2" opacity="0.35" />
      <rect
        x="5"
        y="10"
        width="54"
        height="38"
        rx="8"
        fill="none"
        stroke="#1e40af"
        strokeWidth="2"
        opacity="0.55"
      />
      {softGloss("M 13 17 H 25", 0.7)}
    </g>
  ),
  office_wall_clock: (c) => (
    <g>
      <circle cx="32" cy="30" r="23" fill={light} opacity="0.92" />
      <circle cx="32" cy="30" r="19" fill={cream} stroke={c} strokeWidth="3" />
      <circle cx="32" cy="30" r="3" fill={c} />
      <path
        d="M 32 17 V 29 L 43 29"
        stroke={ink}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 32 8 V 12 M 32 48 V 52 M 10 30 H 14 M 50 30 H 54"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </g>
  ),
  office_wall_art_triptych: (c) => (
    <g>
      <rect x="5" y="14" width="16" height="30" rx="4" fill="#111827" />
      <rect x="24" y="9" width="16" height="40" rx="4" fill="#111827" />
      <rect x="43" y="14" width="16" height="30" rx="4" fill="#111827" />
      <path d="M 8 38 Q 16 21 21 31 V 44 H 8 Z" fill={c} opacity="0.72" />
      <path d="M 27 42 Q 34 14 40 28 V 49 H 27 Z" fill={c} opacity="0.82" />
      <path d="M 46 35 Q 51 22 58 27 V 44 H 46 Z" fill={c} opacity="0.72" />
      {sparkles("#fde68a")}
    </g>
  ),
  office_wall_shelf: (c) => (
    <g>
      <path d="M 8 39 H 55 L 51 46 H 12 Z" fill={darkWood} />
      <rect x="14" y="20" width="8" height="19" rx="2" fill="#ef4444" />
      <rect x="23" y="16" width="7" height="23" rx="2" fill="#3b82f6" />
      <rect x="31" y="23" width="8" height="16" rx="2" fill="#22c55e" />
      <path d="M 44 39 L 47 27 L 56 27 L 59 39 Z" fill="#ca8a04" />
      <path d="M 51 28 Q 43 22 46 15 Q 51 20 51 28 Z" fill={c} />
      <path d="M 51 28 Q 59 21 57 15 Q 52 20 51 28 Z" fill="#86efac" />
    </g>
  ),
  office_wall_neon_sign: (c) => (
    <g>
      <rect x="7" y="16" width="50" height="30" rx="9" fill="#0f172a" />
      <rect
        x="10"
        y="19"
        width="44"
        height="24"
        rx="7"
        fill="#020617"
        stroke={c}
        strokeWidth="2"
        opacity="0.95"
      />
      <path
        d="M 18 32 H 28 L 32 25 L 36 38 L 41 29 H 47"
        stroke={c}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 18 32 H 28 L 32 25 L 36 38 L 41 29 H 47"
        stroke={light}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.75"
      />
      <ellipse cx="32" cy="32" rx="26" ry="14" fill={c} opacity="0.12" />
    </g>
  ),
  office_arcade: (c) => (
    <g>
      {shadow(18, 5, 32, 58, 0.22)}
      <path d="M 12 7 H 52 L 55 57 H 9 Z" fill="#1a1a2e" />
      <path d="M 16 11 H 48 V 35 H 16 Z" fill={c} opacity="0.78" />
      <rect x="18" y="13" width="28" height="18" rx="2" fill="#0a0a2e" />
      <circle cx="26" cy="42" r="5" fill={softInk} />
      <circle cx="39" cy="40" r="3" fill="#ef4444" />
      <circle cx="45" cy="40" r="3" fill="#3b82f6" />
      <circle cx="39" cy="47" r="3" fill="#10b981" />
      <circle cx="45" cy="47" r="3" fill="#f59e0b" />
    </g>
  ),
  office_minibar: (c) => (
    <g>
      {shadow(17, 5, 32, 58, 0.2)}
      <path d="M 16 10 H 49 L 53 55 H 13 Z" fill="#0f172a" />
      <path d="M 20 15 H 46 V 51 H 18 Z" fill={c} opacity="0.75" />
      <line x1="19" y1="31" x2="49" y2="31" stroke="#e0f2fe" strokeWidth="2" opacity="0.65" />
      <rect x="24" y="19" width="6" height="10" rx="2" fill="#f97316" />
      <rect x="34" y="18" width="7" height="11" rx="2" fill="#22c55e" />
      <circle cx="27" cy="42" r="5" fill="#fef3c7" opacity="0.9" />
      <circle cx="40" cy="42" r="5" fill="#bfdbfe" opacity="0.9" />
    </g>
  ),
  office_rug: (c) => (
    <g>
      <path d="M 7 35 Q 32 15 57 35 Q 50 54 32 55 Q 14 54 7 35 Z" fill={c} opacity="0.88" />
      <path d="M 17 36 Q 32 25 47 36 Q 43 46 32 47 Q 21 46 17 36 Z" fill={light} opacity="0.2" />
      <path d="M 11 36 H 53 M 32 20 V 54" stroke="#fef3c7" strokeWidth="2" opacity="0.48" />
    </g>
  ),
  office_robot_helper: (c) => (
    <g>
      {shadow(16, 4, 32, 57, 0.19)}
      <rect x="18" y="19" width="28" height="27" rx="9" fill={metal} />
      <rect x="22" y="25" width="20" height="10" rx="4" fill="#0f172a" />
      <circle cx="28" cy="30" r="2.5" fill={c} />
      <circle cx="36" cy="30" r="2.5" fill={c} />
      <path
        d="M 28 40 Q 32 43 36 40"
        stroke="#0f172a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <line x1="32" y1="19" x2="32" y2="8" stroke={metal} strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="7" r="4" fill={c} />
      <path
        d="M 19 35 L 9 43 M 45 35 L 55 43"
        stroke={metal}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect x="22" y="46" width="8" height="8" rx="3" fill="#475569" />
      <rect x="34" y="46" width="8" height="8" rx="3" fill="#475569" />
    </g>
  ),
  office_hologram: (c) => (
    <g>
      {shadow(24, 6, 32, 54, 0.2)}
      <ellipse cx="32" cy="48" rx="22" ry="7" fill={softInk} />
      <ellipse cx="32" cy="46" rx="18" ry="5" fill={c} opacity="0.75" />
      <path d="M 18 45 L 32 10 L 46 45 Z" fill={c} opacity="0.16" />
      <path d="M 18 45 L 32 10 L 46 45" stroke={c} strokeWidth="2" fill="none" opacity="0.9" />
      <circle cx="32" cy="26" r="9" fill={c} opacity="0.35" />
      <path d="M 26 27 Q 32 20 38 27 Q 32 34 26 27 Z" fill="#f8fafc" opacity="0.85" />
    </g>
  ),
  office_chair_gamer: (c) => (
    <g>
      {shadow(15, 4, 32, 57, 0.18)}
      <path d="M 20 50 L 24 27 Q 32 19 40 27 L 44 50 Z" fill={c} />
      <path d="M 24 30 Q 32 26 40 30 V 45 Q 32 49 24 45 Z" fill={light} opacity="0.12" />
      <rect x="18" y="46" width="28" height="7" rx="3.5" fill="#1e1b4b" />
      <rect x="28" y="18" width="8" height="12" rx="3" fill={c} opacity="0.85" />
      <circle cx="22" cy="41" r="3" fill="#22d3ee" opacity="0.9" />
      <circle cx="42" cy="41" r="3" fill="#a855f7" opacity="0.9" />
    </g>
  ),
  office_bed_loft: (c) => (
    <g>
      {shadow(27, 5, 32, 57, 0.22)}
      <path d="M 8 36 H 56 V 51 H 8 Z" fill={darkWood} />
      <path d="M 10 23 L 54 20 V 39 H 10 Z" fill={c} opacity="0.92" />
      <path d="M 13 26 H 51 V 34 H 13 Z" fill={light} opacity="0.48" />
      <rect x="8" y="14" width="6" height="38" rx="2" fill={softInk} />
      <rect x="50" y="14" width="6" height="38" rx="2" fill={softInk} />
      <path d="M 14 40 H 50" stroke="#cbd5e1" strokeWidth="2" opacity="0.45" />
    </g>
  ),
  office_bookshelf_tall: (c) => (
    <g>
      {shadow(15, 5, 32, 59, 0.18)}
      <path d="M 20 8 L 44 6 V 58 H 20 Z" fill={c} />
      <path d="M 23 11 H 42 V 55 H 23 Z" fill={darkWood} opacity="0.25" />
      <path d="M 22 23 H 43 M 22 37 H 43" stroke={darkWood} strokeWidth="2" opacity="0.55" />
      <rect x="24" y="13" width="6" height="9" rx="1" fill="#dc2626" opacity="0.85" />
      <rect x="32" y="27" width="8" height="7" rx="1" fill="#2563eb" opacity="0.85" />
      <rect x="25" y="42" width="7" height="9" rx="1" fill="#16a34a" opacity="0.85" />
    </g>
  ),
  office_rgb_strip: (c) => (
    <g>
      <rect x="6" y="28" width="52" height="8" rx="4" fill="#0f172a" />
      <rect x="8" y="30" width="48" height="4" rx="2" fill={c} opacity="0.95" />
      <ellipse cx="32" cy="32" rx="30" ry="12" fill={c} opacity="0.14" />
      <circle cx="14" cy="32" r="2" fill="#22d3ee" />
      <circle cx="26" cy="32" r="2" fill="#a855f7" />
      <circle cx="38" cy="32" r="2" fill="#f472b6" />
      <circle cx="50" cy="32" r="2" fill="#4ade80" />
    </g>
  ),
  office_floor_lamp: (c) => (
    <g>
      {shadow(11, 3, 32, 57, 0.16)}
      <line x1="32" y1="56" x2="32" y2="25" stroke={metal} strokeWidth="3" />
      <path d="M 18 25 Q 32 9 46 25 Z" fill={c} opacity="0.86" />
      <ellipse cx="32" cy="27" rx="18" ry="9" fill="#fef3c7" opacity="0.24" />
      <ellipse cx="32" cy="56" rx="10" ry="3" fill={metal} />
    </g>
  ),
  office_wall_sconce: (c) => (
    <g>
      <rect x="24" y="20" width="16" height="24" rx="4" fill="#e2e8f0" />
      <circle cx="32" cy="29" r="8" fill={c} opacity="0.9" />
      <ellipse cx="32" cy="29" rx="16" ry="11" fill="#fef9c3" opacity="0.2" />
      <path d="M 27 39 H 37" stroke={metal} strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  office_flooring_wood: (c) => (
    <g>
      <path d="M 5 24 L 58 18 V 46 L 7 52 Z" fill={c} opacity="0.85" />
      <path
        d="M 7 31 L 58 25 M 7 39 L 58 33 M 7 47 L 58 41"
        stroke={darkWood}
        strokeWidth="1"
        opacity="0.48"
      />
      <path d="M 21 22 L 20 50 M 44 20 L 43 47" stroke={darkWood} strokeWidth="1" opacity="0.32" />
    </g>
  ),
  office_flooring_marble: (c) => (
    <g>
      <path d="M 5 24 L 58 18 V 46 L 7 52 Z" fill={c} opacity="0.92" />
      <path
        d="M 8 27 Q 20 35 32 27 Q 44 19 56 31"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <path d="M 15 46 Q 29 38 46 44" stroke={light} strokeWidth="1" fill="none" opacity="0.5" />
    </g>
  ),
  office_flooring_carpet: (c) => (
    <g>
      <path d="M 5 27 Q 31 16 59 29 V 44 Q 34 57 6 45 Z" fill={c} opacity="0.88" />
      <path d="M 13 31 Q 32 24 51 32 V 40 Q 34 48 13 40 Z" fill={light} opacity="0.15" />
    </g>
  ),
  office_wallpaper_brick: (c) => (
    <g>
      <rect x="4" y="16" width="56" height="32" rx="2" fill={c} opacity="0.88" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={6 + col * 14 + (row % 2) * 7}
            y={18 + row * 10}
            width="12"
            height="8"
            rx="1"
            fill="#7f1d1d"
            opacity="0.32"
          />
        )),
      )}
    </g>
  ),
  office_wallpaper_neon: (c) => (
    <g>
      <rect x="4" y="16" width="56" height="32" rx="2" fill="#0f172a" />
      <path
        d="M 8 20 H 56 M 8 32 H 56 M 8 44 H 56 M 20 16 V 48 M 44 16 V 48"
        stroke={c}
        strokeWidth="1"
        opacity="0.62"
      />
      <ellipse cx="32" cy="32" rx="28" ry="17" fill={c} opacity="0.1" />
    </g>
  ),
  office_wallpaper_plants: (c) => (
    <g>
      <rect x="4" y="16" width="56" height="32" rx="2" fill="#14532d" opacity="0.85" />
      <circle cx="16" cy="28" r="8" fill={c} opacity="0.78" />
      <circle cx="48" cy="26" r="10" fill="#22c55e" opacity="0.72" />
      <circle cx="32" cy="38" r="7" fill="#86efac" opacity="0.78" />
      <path
        d="M 10 44 Q 22 32 32 44 Q 43 29 56 41"
        stroke={light}
        strokeWidth="1.4"
        opacity="0.2"
        fill="none"
      />
    </g>
  ),
  office_tech_speaker: (c) => (
    <g>
      {shadow(13, 3, 32, 53, 0.13)}
      <path d="M 19 18 L 46 16 V 50 H 18 Z" fill="#1f2937" />
      <circle cx="32" cy="30" r="8" fill={c} opacity="0.85" />
      <circle cx="32" cy="30" r="4" fill="#0f172a" />
      <rect x="23" y="42" width="19" height="4" rx="2" fill="#475569" />
    </g>
  ),
  office_gamer_headset: (c) => (
    <g>
      <path
        d="M 14 33 Q 32 13 50 33"
        stroke={c}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="10" y="31" width="12" height="16" rx="5" fill={c} opacity="0.9" />
      <rect x="42" y="31" width="12" height="16" rx="5" fill={c} opacity="0.9" />
      <rect x="28" y="39" width="8" height="6" rx="2" fill="#1e1b4b" />
      <ellipse cx="32" cy="38" rx="22" ry="13" fill={c} opacity="0.08" />
    </g>
  ),
  office_cozy_blanket: (c) => (
    <g>
      {shadow(20, 4, 32, 52, 0.12)}
      <path d="M 10 31 Q 31 24 54 31 V 45 Q 33 53 10 45 Z" fill={c} opacity="0.88" />
      <path d="M 12 35 Q 32 43 52 35" stroke={light} strokeWidth="2" fill="none" opacity="0.3" />
      <path d="M 17 32 V 47 M 47 32 V 45" stroke="#020617" strokeWidth="1" opacity="0.1" />
    </g>
  ),
  office_nature_bonsai: (c) => (
    <g>
      {shadow(12, 3, 32, 55, 0.13)}
      <path d="M 24 52 H 40 L 37 40 H 27 Z" fill="#92400e" />
      <ellipse cx="32" cy="40" rx="8" ry="3" fill="#78350f" />
      <path
        d="M 32 39 C 30 31 41 29 42 20"
        stroke="#78350f"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="29" cy="29" rx="13" ry="9" fill={c} />
      <ellipse cx="40" cy="23" rx="10" ry="7" fill="#86efac" opacity="0.86" />
    </g>
  ),
};

function getFurnitureColor(item: AvatarItem, rarity: ExtendedRarity) {
  const data = item as AvatarItem & { color_hint?: string | null };
  return data.color_hint ?? RARITY_STYLES[rarity]?.color ?? "#94a3b8";
}

export function FurnitureSVG({ item, size = 60 }: { item: AvatarItem; size?: number }) {
  const rarity = (item.rarity ?? "common") as ExtendedRarity;
  const color = getFurnitureColor(item, rarity);

  if (item.category === "office_theme") {
    const theme = getOfficeTheme(item.slug);
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`${item.slug}-shine`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
            <stop offset="100%" stopColor={theme.accent} stopOpacity="0.25" />
          </linearGradient>
          <filter id={`${item.slug}-soft-shadow`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.28" />
          </filter>
        </defs>
        <path
          d="M 7 13 L 57 8 V 53 Q 32 61 7 52 Z"
          fill={theme.trim}
          opacity="0.95"
          filter={`url(#${item.slug}-soft-shadow)`}
        />
        <path d="M 11 15 L 54 12 V 31 L 11 34 Z" fill={theme.accent} opacity="0.72" />
        <path d="M 11 34 L 54 31 V 51 Q 32 57 11 50 Z" fill={theme.glow} opacity="0.42" />
        <path
          d="M 11 37 L 54 31 V 51 Q 32 57 11 50 Z"
          fill={`url(#${item.slug}-shine)`}
          opacity="0.55"
        />
        <rect x="15" y="18" width="13" height="9" rx="2" fill={theme.window} opacity="0.85" />
        <rect x="36" y="17" width="13" height="9" rx="2" fill={theme.window} opacity="0.65" />
        <circle cx="32" cy="44" r="7" fill={theme.accent} opacity="0.85" />
      </svg>
    );
  }

  const renderer = FURNITURE_SPRITES[item.slug] ?? FURNITURE_SPRITES.office_desk;
  const filterId = `${item.slug}-dream-shadow`;
  const glowId = `${item.slug}-dream-glow`;

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ overflow: "visible" }}>
      <defs>
        <filter id={filterId} x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="6" stdDeviation="3.5" floodColor="#020617" floodOpacity="0.24" />
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={color} floodOpacity="0.16" />
        </filter>
        <radialGradient id={glowId} cx="35%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="55%" stopColor={color} stopOpacity="0.04" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.08" />
        </radialGradient>
      </defs>
      <g filter={`url(#${filterId})`}>
        {renderer(color)}
        <path
          d="M 8 10 Q 32 0 56 12 L 56 22 Q 32 12 8 22 Z"
          fill={`url(#${glowId})`}
          opacity="0.52"
        />
      </g>
    </svg>
  );
}
