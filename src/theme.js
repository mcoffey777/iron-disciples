// Iron Disciples — Design tokens
export const T = {
  // Colors
  black:     "#080808",
  dark:      "#111111",
  dark2:     "#1a1a1a",
  dark3:     "#242424",
  dark4:     "#2e2e2e",
  red:       "#c62828",
  redLight:  "#ef5350",
  redGlow:   "rgba(198,40,40,0.25)",
  gold:      "#c8a000",
  goldLight: "#f0c400",
  goldGlow:  "rgba(200,160,0,0.25)",
  silver:    "#9e9e9e",
  silverDim: "#666666",
  white:     "#ffffff",
  offWhite:  "#f0f0f0",
  dimText:   "rgba(255,255,255,0.55)",
  mutedText: "rgba(255,255,255,0.3)",
  border:    "rgba(255,255,255,0.08)",
  borderGold:"rgba(200,160,0,0.3)",
  borderRed: "rgba(198,40,40,0.35)",
  green:     "#2e7d32",
  greenLight:"#4CAF50",
  blue:      "#1565c0",
  blueLight: "#42a5f5",
  purple:    "#6a1b9a",
  teal:      "#00695c",
  amber:     "#e65c00",

  // Fonts
  serif:  "'Georgia', serif",
  sans:   "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  // Radii
  sm:   8,
  md:   12,
  lg:   18,
  xl:   24,
  pill: 999,

  // Shadows
  cardShadow: "0 2px 16px rgba(0,0,0,0.5)",
  goldShadow: "0 0 20px rgba(200,160,0,0.15)",
};

// Tile configs for home screen
export const TILES = [
  { id: "games",    icon: "⚾",  label: "Games",              sub: "Lineup · Field · Print",          color: T.red,    border: T.borderRed,  badge: null },
  { id: "schedule", icon: "📅",  label: "Schedule",           sub: "Games · Practices · Events",      color: T.blue,   border: "rgba(21,101,192,0.35)", badge: null },
  { id: "roster",   icon: "👥",  label: "Roster",             sub: "Players · Numbers · Positions",   color: T.green,  border: "rgba(46,125,50,0.35)",  badge: null },
  { id: "messages", icon: "💬",  label: "Messages",           sub: "Team chat · Polls · Live",        color: T.teal,   border: "rgba(0,105,92,0.35)",   badge: "new" },
  { id: "quizzes",  icon: "🎯",  label: "Quizzes",            sub: "Situational scenarios by position", color: T.amber, border: "rgba(230,92,0,0.35)", wide: true },
  { id: "beyond",   icon: "✝️",  label: "Beyond the Diamond", sub: "Honor God · Diligence · Grit",    color: T.purple, border: "rgba(106,27,154,0.35)", wide: true },
];

export const POSITIONS = ["P","C","1B","2B","3B","SS","LF","CF","RF"];
export const POS_LABELS = {
  P:"Pitcher", C:"Catcher", "1B":"First Base", "2B":"Second Base",
  "3B":"Third Base", SS:"Shortstop", LF:"Left Field", CF:"Center Field", RF:"Right Field"
};
export const POS_COLORS = {
  P:"#c62828", C:"#1565c0", "1B":"#2e7d32", "2B":"#e65c00",
  "3B":"#6a1b9a", SS:"#00695c", LF:"#c8a000", CF:"#4a2800", RF:"#0277bd"
};
export const ALL_POSITIONS = [...POSITIONS, "Bench"];
export const INNINGS = 6;
export const COACH_PASSWORD = "IronDisciples9U";
