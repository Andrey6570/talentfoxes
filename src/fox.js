import { COLORS, mood } from "./domain.js";
import { esc } from "./util.js";

export function fox(k, cls, label) {
  const c = COLORS.find(x => x.id === k.pet.color) || COLORS[0], m = mood(k), eq = k.pet.equipped, has = id => eq.includes(id);
  const eyes = m === "happy"
    ? '<path d="M70 90 Q80 78 90 90" fill="none" stroke="#2b2233" stroke-width="5" stroke-linecap="round"/><path d="M110 90 Q120 78 130 90" fill="none" stroke="#2b2233" stroke-width="5" stroke-linecap="round"/>'
    : '<circle cx="80" cy="90" r="7" fill="#2b2233"/><circle cx="120" cy="90" r="7" fill="#2b2233"/><circle cx="82.5" cy="87" r="2.4" fill="#fff"/><circle cx="122.5" cy="87" r="2.4" fill="#fff"/>';
  const brows = m === "sad" ? '<path d="M68 78 L90 84" stroke="#2b2233" stroke-width="4" stroke-linecap="round"/><path d="M132 78 L110 84" stroke="#2b2233" stroke-width="4" stroke-linecap="round"/>' : "";
  const mouth = m === "sad" ? '<path d="M92 120 Q100 112 108 120" fill="none" stroke="#2b2233" stroke-width="4" stroke-linecap="round"/>' : '<path d="M90 112 Q100 126 110 112" fill="none" stroke="#2b2233" stroke-width="4" stroke-linecap="round"/>';
  const blush = m === "happy" ? '<circle cx="64" cy="106" r="8" fill="#FF6FA5" opacity=".45"/><circle cx="136" cy="106" r="8" fill="#FF6FA5" opacity=".45"/>' : "";
  return `<svg class="${cls}" ${cls === "pet" ? 'id="pet"' : ""} viewBox="0 0 200 210" role="img" aria-label="${esc(label)}">
    <ellipse cx="100" cy="200" rx="58" ry="7" fill="#000" opacity=".1"/>
    <path d="M138 160 C196 164 204 108 172 86 C176 118 156 130 128 134 Z" fill="${c.main}"/><path d="M172 86 C186 98 194 116 190 134 C180 120 176 104 172 86 Z" fill="#fff" opacity=".9"/>
    <ellipse cx="100" cy="152" rx="46" ry="42" fill="${c.main}"/><ellipse cx="100" cy="162" rx="28" ry="28" fill="#FFF3E0"/>
    <ellipse cx="78" cy="192" rx="15" ry="9" fill="${c.dark}"/><ellipse cx="122" cy="192" rx="15" ry="9" fill="${c.dark}"/>
    <path d="M54 72 L50 20 L92 52 Z" fill="${c.main}"/><path d="M60 62 L58 34 L80 52 Z" fill="${c.dark}"/>
    <path d="M146 72 L150 20 L108 52 Z" fill="${c.main}"/><path d="M140 62 L142 34 L120 52 Z" fill="${c.dark}"/>
    <ellipse cx="100" cy="92" rx="54" ry="45" fill="${c.main}"/><ellipse cx="76" cy="110" rx="28" ry="21" fill="#FFF3E0"/><ellipse cx="124" cy="110" rx="28" ry="21" fill="#FFF3E0"/>
    ${blush}${eyes}${brows}<ellipse cx="100" cy="102" rx="7" ry="5" fill="#2b2233"/>${mouth}
    ${has("scarf") ? '<path d="M60 132 Q100 156 140 132 L136 148 Q100 168 64 148 Z" fill="#E11D48"/><path d="M118 150 L132 180 L116 176 Z" fill="#BE123C"/>' : ""}
    ${has("glasses") ? '<g fill="rgba(255,255,255,.3)" stroke="#2b2233" stroke-width="3.5"><circle cx="80" cy="90" r="15"/><circle cx="120" cy="90" r="15"/><path d="M95 90 L105 90" fill="none"/></g>' : ""}
    ${has("phones") ? '<path d="M48 90 C46 20 154 20 152 90" fill="none" stroke="#2b2233" stroke-width="7"/><rect x="40" y="80" width="16" height="30" rx="7" fill="#4F46E5"/><rect x="144" y="80" width="16" height="30" rx="7" fill="#4F46E5"/>' : ""}
    ${has("bow") ? '<g fill="#FF4F8B"><path d="M138 54 L114 40 L114 68 Z"/><path d="M138 54 L162 40 L162 68 Z"/><circle cx="138" cy="54" r="7" fill="#D6336C"/></g>' : ""}
    ${has("party") ? '<path d="M100 2 L76 54 L124 54 Z" fill="#7C5CFF"/><path d="M92 22 L108 22 M86 38 L114 38" stroke="#FFD43B" stroke-width="5"/><circle cx="100" cy="4" r="7" fill="#FFD43B"/>' : ""}
    ${has("crown") ? '<path d="M68 56 L72 26 L88 42 L100 18 L112 42 L128 26 L132 56 Z" fill="#FFC83D" stroke="#B7791F" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="30" r="4" fill="#E11D48"/>' : ""}
  </svg>`;
}
