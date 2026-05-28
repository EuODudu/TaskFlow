import { RARITY_STYLES, type ExtendedRarity } from "./rarity-frame";
import { getOfficeTheme } from "./office-themes";
import type { AvatarItem } from "@/lib/queries";

export const FURNITURE_SPRITES: Record<string, (color: string) => React.ReactNode> = {
  office_desk: (c) => (
    <g>
      <ellipse cx="32" cy="56" rx="24" ry="4" fill="#00000022" />
      <rect x="5" y="19" width="54" height="10" rx="3" fill={c} />
      <rect x="7" y="21" width="50" height="4" rx="2" fill="#ffffff32" />
      <rect x="10" y="27" width="6" height="31" rx="2" fill="#4b2e1a" />
      <rect x="48" y="27" width="6" height="31" rx="2" fill="#4b2e1a" />
      <rect x="22" y="27" width="20" height="5" rx="2.5" fill="#4b2e1a" />
      <rect x="21" y="33" width="22" height="3" rx="1.5" fill="#8b5a35" opacity="0.85" />
    </g>
  ),
  office_plant: (c) => (
    <g>
      <ellipse cx="32" cy="58" rx="16" ry="5" fill="#00000025" />
      <path d="M 18 54 L 22 38 L 42 38 L 46 54 Z" fill="#a16207" />
      <path d="M 20 54 L 23 40 L 41 40 L 44 54 Z" fill="#ca8a04" />
      <ellipse cx="32" cy="38" rx="13" ry="4" fill="#78350f" />
      <ellipse cx="32" cy="37" rx="11" ry="3" fill="#451a03" opacity="0.55" />
      <rect x="31" y="22" width="2" height="16" rx="1" fill="#65a30d" />
      <path d="M 32 34 Q 14 28 18 12 Q 28 22 32 34 Z" fill={c} />
      <path d="M 32 32 Q 50 24 46 10 Q 36 20 32 32 Z" fill={c} filter="brightness(1.12)" />
      <path d="M 32 28 Q 22 18 26 8 Q 30 16 32 28 Z" fill="#15803d" />
      <path d="M 32 30 Q 42 20 40 12 Q 34 18 32 30 Z" fill="#4ade80" opacity="0.9" />
      <ellipse
        cx="24"
        cy="16"
        rx="4"
        ry="6"
        fill={c}
        opacity="0.85"
        transform="rotate(-18 24 16)"
      />
      <ellipse cx="40" cy="14" rx="4" ry="5" fill="#86efac" transform="rotate(14 40 14)" />
      <ellipse cx="32" cy="37" rx="10" ry="2.5" fill="#ffffff22" />
    </g>
  ),
  office_monitor: (c) => (
    <g>
      <rect x="5" y="8" width="54" height="31" rx="5" fill="#0f172a" />
      <rect x="8" y="11" width="48" height="25" rx="3" fill="#111827" />
      <rect x="10" y="13" width="44" height="21" rx="2" fill={c} opacity="0.82" />
      <path
        d="M 12 26 Q 25 14 37 22 Q 46 28 54 16 L 54 34 L 10 34 Z"
        fill="#0f172a"
        opacity="0.42"
      />
      <rect x="29" y="39" width="6" height="8" rx="1.5" fill="#334155" />
      <rect x="22" y="46" width="20" height="4" rx="2" fill="#475569" />
      <circle cx="32" cy="47.8" r="0.8" fill="#94a3b8" />
    </g>
  ),
  office_laptop: (c) => (
    <g>
      <rect x="14" y="18" width="36" height="23" rx="3" fill="#1f2937" />
      <rect x="16" y="20" width="32" height="19" rx="2" fill="#0f172a" />
      <rect x="18" y="22" width="28" height="15" rx="1.5" fill={c} opacity="0.8" />
      <path d="M 8 41 L 56 41 L 60 50 Q 60 54 55 54 L 9 54 Q 4 54 4 50 Z" fill="#374151" />
      <rect x="26" y="49" width="12" height="2.3" rx="1.15" fill="#9ca3af" />
    </g>
  ),
  office_coffee: (c) => (
    <g>
      <ellipse cx="32" cy="50" rx="12" ry="4" fill="#0000001c" />
      <rect x="22" y="24" width="20" height="24" rx="5" fill={c} />
      <rect x="24" y="26" width="16" height="18" rx="4" fill="#f8fafc" opacity="0.38" />
      <path d="M 42 30 Q 49 31 49 36 Q 49 41 42 42" stroke={c} strokeWidth="3" fill="none" />
      <ellipse cx="32" cy="30" rx="7.5" ry="2.6" fill="#78350f" opacity="0.75" />
      <path
        d="M 28 16 Q 30 11 31 16 M 33 16 Q 35 11 36 16"
        stroke="#94a3b8"
        strokeWidth="1.2"
        fill="none"
        opacity="0.7"
      />
    </g>
  ),
  office_board: (c) => (
    <g>
      <rect x="4" y="8" width="56" height="40" rx="3" fill="#e2e8f0" />
      <rect x="6" y="10" width="52" height="36" rx="2" fill={c} />
      <line x1="12" y1="20" x2="52" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="12" y1="28" x2="44" y2="28" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="12" y1="36" x2="48" y2="36" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="12" y="16" width="8" height="8" rx="1" fill="#3b82f6" opacity="0.7" />
      <rect x="24" y="16" width="8" height="8" rx="1" fill="#ef4444" opacity="0.7" />
      <rect x="36" y="16" width="8" height="8" rx="1" fill="#10b981" opacity="0.7" />
      <rect x="26" y="46" width="12" height="8" rx="2" fill="#94a3b8" />
    </g>
  ),
  office_whiteboard: (c) => (
    <g>
      <rect x="4" y="6" width="56" height="42" rx="4" fill="#cbd5e1" />
      <rect x="7" y="9" width="50" height="36" rx="3" fill="#f8fafc" />
      <path
        d="M 13 34 Q 24 18 34 27 Q 43 35 52 16"
        stroke={c}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="13" y="15" width="11" height="8" rx="2" fill="#3b82f6" opacity="0.75" />
      <rect x="28" y="15" width="11" height="8" rx="2" fill="#10b981" opacity="0.75" />
      <rect x="43" y="15" width="8" height="8" rx="2" fill="#f59e0b" opacity="0.75" />
      <rect x="21" y="48" width="22" height="5" rx="2.5" fill="#94a3b8" />
    </g>
  ),
  office_keyboard: (c) => (
    <g>
      <ellipse cx="32" cy="47" rx="16" ry="3.5" fill="#00000018" />
      <rect x="12" y="30" width="40" height="13" rx="4" fill="#1f2937" />
      <rect x="14" y="32" width="36" height="9" rx="3" fill={c} opacity="0.42" />
      <path d="M 17 35 H 47 M 17 38 H 47" stroke="#cbd5e1" strokeWidth="1" opacity="0.55" />
    </g>
  ),
  office_mousepad: (c) => (
    <g>
      <ellipse cx="32" cy="43" rx="18" ry="8" fill={c} opacity="0.78" />
      <ellipse cx="32" cy="43" rx="12" ry="5" fill="#ffffff28" />
      <ellipse cx="40" cy="43" rx="3" ry="4" fill="#0f172a" opacity="0.66" />
    </g>
  ),
  office_desk_lamp: (c) => (
    <g>
      <ellipse cx="32" cy="53" rx="11" ry="3.5" fill="#0000001a" />
      <rect x="28" y="42" width="8" height="9" rx="2" fill="#334155" />
      <path d="M 32 42 L 26 28 L 30 26 L 36 40 Z" fill="#475569" />
      <path d="M 34 36 L 44 25 L 47 28 L 37 39 Z" fill="#475569" />
      <path d="M 44 23 L 54 18 L 57 25 L 46 30 Z" fill={c} />
      <circle cx="54" cy="22" r="7" fill="#fde68a" opacity="0.35" />
    </g>
  ),
  office_book_stack: (c) => (
    <g>
      <ellipse cx="32" cy="52" rx="13" ry="3.5" fill="#00000014" />
      <rect x="17" y="41" width="30" height="7" rx="2" fill="#1d4ed8" />
      <rect x="20" y="34" width="27" height="7" rx="2" fill={c} />
      <rect x="22" y="27" width="23" height="7" rx="2" fill="#ef4444" />
      <line x1="24" y1="30.5" x2="42" y2="30.5" stroke="#ffffff8a" strokeWidth="1" />
      <line x1="22" y1="37.5" x2="43" y2="37.5" stroke="#ffffff8a" strokeWidth="1" />
    </g>
  ),
  office_table_plant: (c) => (
    <g>
      <ellipse cx="32" cy="52" rx="11" ry="3.2" fill="#00000016" />
      <path d="M 24 50 L 27 39 L 37 39 L 40 50 Z" fill="#a16207" />
      <path d="M 32 39 Q 21 35 24 23 Q 29 29 32 39 Z" fill={c} />
      <path d="M 32 38 Q 43 33 40 21 Q 35 27 32 38 Z" fill="#4ade80" />
      <path d="M 32 35 Q 29 24 32 17 Q 35 24 32 35 Z" fill="#15803d" />
    </g>
  ),
  office_trophy: (c) => (
    <g>
      <path d="M 22 8 Q 22 36 32 40 Q 42 36 42 8 Z" fill={c} />
      <path d="M 14 12 Q 14 24 22 26 L 22 8 Z" fill={c} filter="brightness(0.9)" />
      <path d="M 50 12 Q 50 24 42 26 L 42 8 Z" fill={c} filter="brightness(0.9)" />
      <rect x="28" y="40" width="8" height="10" rx="2" fill="#b45309" />
      <rect x="20" y="48" width="24" height="6" rx="3" fill="#b45309" />
      <circle cx="32" cy="22" r="6" fill="#fbbf24" />
      <path d="M 29 20 L 32 16 L 35 20 L 31 23 Z" fill="#fff" opacity="0.6" />
    </g>
  ),
  office_gaming: (c) => (
    <g>
      <rect x="2" y="8" width="60" height="40" rx="6" fill="#1a1a2e" />
      <rect x="4" y="10" width="56" height="36" rx="5" fill="#0f172a" />
      <rect x="6" y="12" width="52" height="28" rx="4" fill={c} opacity="0.85" />
      <rect x="8" y="14" width="46" height="22" rx="3" fill="#0a0a1a" />
      <circle cx="20" cy="25" r="6" fill="#7c3aed" opacity="0.8" />
      <circle cx="44" cy="25" r="3" fill="#ef4444" />
      <circle cx="50" cy="21" r="3" fill="#3b82f6" />
      <circle cx="50" cy="31" r="3" fill="#10b981" />
      <circle cx="44" cy="25" r="3" fill="#f59e0b" transform="translate(12,0)" />
      <rect x="26" y="38" width="12" height="4" rx="2" fill="#334155" />
      <rect x="18" y="44" width="28" height="4" rx="2" fill="#334155" />
    </g>
  ),
  office_rocket: (c) => (
    <g transform="translate(16, 4)">
      <path d="M 16 50 Q 4 40 8 24 Q 16 4 16 4 Q 16 4 24 24 Q 28 40 16 50 Z" fill={c} />
      <path d="M 8 36 Q 4 44 2 52 L 10 46 Z" fill="#ef4444" />
      <path d="M 24 36 Q 28 44 30 52 L 22 46 Z" fill="#ef4444" />
      <circle cx="16" cy="22" r="6" fill="#e0f2fe" />
      <circle cx="16" cy="22" r="4" fill="#7dd3fc" />
      <path d="M 10 46 Q 14 52 16 58 Q 18 52 22 46" fill="#f97316" opacity="0.8" />
    </g>
  ),
  office_diamond: (c) => (
    <g>
      <path d="M 20 8 L 44 8 L 56 26 L 32 56 L 8 26 Z" fill={c} />
      <path d="M 20 8 L 32 26 L 44 8 Z" fill="#ffffff30" />
      <path d="M 8 26 L 32 26 L 32 56 Z" fill="#00000020" />
      <path d="M 56 26 L 32 26 L 32 56 Z" fill="#ffffff20" />
      <path d="M 32 26 L 44 8 L 56 26 Z" fill="#ffffff15" />
      <circle cx="32" cy="26" r="4" fill="white" opacity="0.5" />
    </g>
  ),
  office_sofa: (c) => (
    <g>
      <rect x="4" y="28" width="56" height="26" rx="6" fill={c} />
      <rect x="4" y="20" width="56" height="12" rx="6" fill={c} filter="brightness(1.1)" />
      <rect x="4" y="24" width="10" height="30" rx="5" fill={c} filter="brightness(0.9)" />
      <rect x="50" y="24" width="10" height="30" rx="5" fill={c} filter="brightness(0.9)" />
      <rect x="6" y="30" width="52" height="16" rx="4" fill="#ffffff15" />
      <rect x="4" y="50" width="56" height="6" rx="3" fill={c} filter="brightness(0.7)" />
    </g>
  ),
  office_bookshelf: (c) => (
    <g>
      <rect x="8" y="4" width="48" height="56" rx="3" fill="#92400e" />
      <rect x="10" y="6" width="44" height="52" rx="2" fill={c} />
      <rect x="10" y="18" width="44" height="2" fill="#92400e" opacity="0.5" />
      <rect x="10" y="34" width="44" height="2" fill="#92400e" opacity="0.5" />
      <rect x="10" y="50" width="44" height="2" fill="#92400e" opacity="0.5" />
      <rect x="12" y="8" width="6" height="10" rx="1" fill="#ef4444" />
      <rect x="19" y="8" width="5" height="10" rx="1" fill="#3b82f6" />
      <rect x="25" y="8" width="7" height="10" rx="1" fill="#10b981" />
      <rect x="33" y="8" width="4" height="10" rx="1" fill="#f59e0b" />
      <rect x="38" y="8" width="6" height="10" rx="1" fill="#8b5cf6" />
      <rect x="12" y="22" width="5" height="12" rx="1" fill="#ec4899" />
      <rect x="18" y="22" width="8" height="12" rx="1" fill="#0ea5e9" />
      <rect x="27" y="22" width="5" height="12" rx="1" fill="#84cc16" />
      <rect x="33" y="22" width="6" height="12" rx="1" fill="#f97316" />
    </g>
  ),
  office_chandelier: (c) => (
    <g>
      <line x1="32" y1="2" x2="32" y2="20" stroke="#94a3b8" strokeWidth="3" />
      <ellipse cx="32" cy="24" rx="14" ry="6" fill={c} />
      <circle cx="20" cy="32" r="5" fill={c} />
      <circle cx="32" cy="36" r="5" fill={c} />
      <circle cx="44" cy="32" r="5" fill={c} />
      <circle cx="20" cy="32" r="3" fill="#fef08a" opacity="0.9" />
      <circle cx="32" cy="36" r="3" fill="#fef08a" opacity="0.9" />
      <circle cx="44" cy="32" r="3" fill="#fef08a" opacity="0.9" />
      <circle cx="20" cy="32" r="4" fill="#fef08a" opacity="0.3" />
      <circle cx="32" cy="36" r="4" fill="#fef08a" opacity="0.3" />
      <circle cx="44" cy="32" r="4" fill="#fef08a" opacity="0.3" />
    </g>
  ),
  office_painting: (c) => (
    <g>
      <rect x="6" y="4" width="52" height="40" rx="2" fill="#92400e" />
      <rect x="8" y="6" width="48" height="36" rx="1" fill="white" />
      <rect x="10" y="8" width="44" height="32" rx="1" fill={c} opacity="0.15" />
      <path
        d="M 10 36 Q 18 20 28 28 Q 38 36 46 18 L 54 24 L 54 40 L 10 40 Z"
        fill={c}
        opacity="0.6"
      />
      <circle cx="22" cy="18" r="6" fill="#fef08a" opacity="0.6" />
      <rect x="28" y="44" width="8" height="8" rx="1" fill="#b45309" />
    </g>
  ),
  office_wall_window: (c) => (
    <g>
      <rect x="5" y="10" width="54" height="38" rx="8" fill="#dbeafe" />
      <rect x="8" y="13" width="48" height="32" rx="6" fill={c} opacity="0.28" />
      <path d="M 9 40 Q 20 26 31 34 Q 42 18 56 25 L 56 45 L 9 45 Z" fill="#ffffff" opacity="0.34" />
      <path d="M 10 16 L 54 16" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
      <path d="M 32 13 V 45" stroke="#1d4ed8" strokeWidth="2" opacity="0.45" />
      <path d="M 8 30 H 56" stroke="#1d4ed8" strokeWidth="2" opacity="0.35" />
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
      <path
        d="M 13 17 L 24 17"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
    </g>
  ),
  office_wall_clock: (c) => (
    <g>
      <circle cx="32" cy="30" r="22" fill="#f8fafc" />
      <circle cx="32" cy="30" r="19" fill="#ffffff" stroke={c} strokeWidth="3" />
      <circle cx="32" cy="30" r="3" fill={c} />
      <path
        d="M 32 16 V 29 L 44 29"
        stroke="#1e3a8a"
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
      <circle cx="32" cy="30" r="24" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.65" />
    </g>
  ),
  office_wall_art_triptych: (c) => (
    <g>
      <rect x="5" y="14" width="16" height="30" rx="4" fill="#111827" opacity="0.92" />
      <rect x="24" y="9" width="16" height="40" rx="4" fill="#111827" opacity="0.96" />
      <rect x="43" y="14" width="16" height="30" rx="4" fill="#111827" opacity="0.92" />
      <path d="M 8 38 Q 16 21 21 31 L 21 44 L 8 44 Z" fill={c} opacity="0.72" />
      <path d="M 27 42 Q 34 14 40 28 L 40 49 L 27 49 Z" fill={c} opacity="0.82" />
      <path d="M 46 35 Q 51 22 58 27 L 58 44 L 46 44 Z" fill={c} opacity="0.72" />
      <circle cx="15" cy="22" r="4" fill="#fde68a" opacity="0.85" />
      <circle cx="33" cy="20" r="5" fill="#f9a8d4" opacity="0.82" />
      <circle cx="52" cy="23" r="4" fill="#67e8f9" opacity="0.8" />
    </g>
  ),
  office_wall_shelf: (c) => (
    <g>
      <rect x="9" y="39" width="46" height="6" rx="3" fill="#92400e" />
      <rect x="12" y="43" width="40" height="4" rx="2" fill="#451a03" opacity="0.55" />
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
        stroke="#ffffff"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="15" cy="25" r="2" fill="#fde047" />
      <circle cx="49" cy="38" r="2" fill="#67e8f9" />
    </g>
  ),
  office_arcade: (c) => (
    <g>
      <rect x="10" y="4" width="44" height="56" rx="6" fill="#1a1a2e" />
      <rect x="14" y="8" width="36" height="28" rx="4" fill={c} opacity="0.8" />
      <rect x="16" y="10" width="32" height="24" rx="3" fill="#0f172a" />
      <rect x="18" y="12" width="28" height="18" rx="2" fill="#0a0a2e" />
      <circle cx="26" cy="40" r="6" fill="#374151" />
      <circle cx="26" cy="40" r="4" fill="#1f2937" />
      <circle cx="38" cy="38" r="3" fill="#ef4444" />
      <circle cx="44" cy="38" r="3" fill="#3b82f6" />
      <circle cx="38" cy="44" r="3" fill="#10b981" />
      <circle cx="44" cy="44" r="3" fill="#f59e0b" />
      <rect x="14" y="56" width="36" height="4" rx="2" fill="#374151" />
    </g>
  ),
  office_minibar: (c) => (
    <g>
      <rect x="14" y="10" width="36" height="46" rx="6" fill="#0f172a" />
      <rect x="18" y="14" width="28" height="38" rx="4" fill={c} opacity="0.78" />
      <line x1="18" y1="31" x2="46" y2="31" stroke="#e0f2fe" strokeWidth="2" opacity="0.65" />
      <rect x="23" y="19" width="6" height="10" rx="2" fill="#f97316" />
      <rect x="33" y="18" width="7" height="11" rx="2" fill="#22c55e" />
      <circle cx="26" cy="42" r="5" fill="#fef3c7" opacity="0.9" />
      <circle cx="39" cy="42" r="5" fill="#bfdbfe" opacity="0.9" />
      <rect x="44" y="29" width="2" height="8" rx="1" fill="#e2e8f0" />
    </g>
  ),
  office_rug: (c) => (
    <g>
      <ellipse cx="32" cy="34" rx="28" ry="18" fill={c} opacity="0.9" />
      <ellipse cx="32" cy="34" rx="20" ry="12" fill="#ffffff25" />
      <ellipse cx="32" cy="34" rx="10" ry="6" fill="#00000018" />
      <path d="M 10 34 H 54" stroke="#fef3c7" strokeWidth="2" opacity="0.7" />
      <path d="M 32 17 V 51" stroke="#fef3c7" strokeWidth="2" opacity="0.45" />
    </g>
  ),
  office_robot_helper: (c) => (
    <g>
      <rect x="18" y="18" width="28" height="28" rx="8" fill="#64748b" />
      <rect x="22" y="24" width="20" height="10" rx="4" fill="#0f172a" />
      <circle cx="28" cy="29" r="2.5" fill={c} />
      <circle cx="36" cy="29" r="2.5" fill={c} />
      <path
        d="M 28 39 Q 32 42 36 39"
        stroke="#0f172a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <line x1="32" y1="18" x2="32" y2="8" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="7" r="4" fill={c} />
      <path d="M 18 34 L 8 42" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <path d="M 46 34 L 56 42" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
      <rect x="22" y="46" width="8" height="8" rx="3" fill="#475569" />
      <rect x="34" y="46" width="8" height="8" rx="3" fill="#475569" />
    </g>
  ),
  office_hologram: (c) => (
    <g>
      <ellipse cx="32" cy="50" rx="24" ry="8" fill="#334155" />
      <ellipse cx="32" cy="48" rx="20" ry="6" fill={c} opacity="0.75" />
      <path d="M 18 45 L 32 10 L 46 45 Z" fill={c} opacity="0.16" />
      <path d="M 18 45 L 32 10 L 46 45" stroke={c} strokeWidth="2" fill="none" opacity="0.9" />
      <circle cx="32" cy="26" r="9" fill={c} opacity="0.35" />
      <path d="M 26 27 Q 32 20 38 27 Q 32 34 26 27 Z" fill="#f8fafc" opacity="0.85" />
      <circle cx="24" cy="38" r="2" fill="#f8fafc" opacity="0.8" />
      <circle cx="42" cy="36" r="2" fill="#f8fafc" opacity="0.8" />
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
        <rect
          x="4"
          y="6"
          width="56"
          height="52"
          rx="10"
          fill={theme.trim}
          opacity="0.95"
          filter={`url(#${item.slug}-soft-shadow)`}
        />
        <rect x="8" y="10" width="48" height="22" rx="5" fill={theme.accent} opacity="0.7" />
        <rect x="8" y="31" width="48" height="23" rx="5" fill={theme.glow} opacity="0.42" />
        <path
          d="M 8 36 L 56 31 L 56 54 L 8 54 Z"
          fill={`url(#${item.slug}-shine)`}
          opacity="0.55"
        />
        <rect x="14" y="15" width="14" height="10" rx="2" fill={theme.window} opacity="0.85" />
        <rect x="35" y="15" width="14" height="10" rx="2" fill={theme.window} opacity="0.65" />
        <circle cx="32" cy="43" r="7" fill={theme.accent} opacity="0.85" />
      </svg>
    );
  }

  const renderer = FURNITURE_SPRITES[item.slug] ?? FURNITURE_SPRITES["office_desk"];
  const svg = renderer ? renderer(color) : null;
  const filterId = `${item.slug}-premium-shadow`;
  const glossId = `${item.slug}-premium-gloss`;

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={glossId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
        <filter id={filterId} x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.26" />
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={color} floodOpacity="0.18" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        {svg ?? (
          <text x="8" y="48" fontSize="40" textAnchor="start">
            {item.icon}
          </text>
        )}
        <path
          d="M 8 10 Q 32 0 56 12 L 56 22 Q 32 12 8 22 Z"
          fill={`url(#${glossId})`}
          opacity="0.55"
        />
      </g>
    </svg>
  );
}
