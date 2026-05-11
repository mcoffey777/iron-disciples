import { T } from "../theme";

const NAV_ITEMS = [
  { id: "home",     icon: "🏠", label: "Home" },
  { id: "games",    icon: "⚾", label: "Games" },
  { id: "schedule", icon: "📅", label: "Schedule" },
  { id: "roster",   icon: "👥", label: "Roster" },
  { id: "more",     icon: "⋯",  label: "More" },
];

export default function NavBar({ active, onNavigate }) {
  return (
    <div style={styles.nav}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} style={styles.navItem} onClick={() => onNavigate(item.id)}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ ...styles.navLabel, color: active === item.id ? T.gold : T.silverDim }}>
            {item.label}
          </span>
          {active === item.id && <div style={styles.navDot} />}
        </button>
      ))}
    </div>
  );
}

const styles = {
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(10,10,10,0.97)", borderTop: `0.5px solid ${T.border}`, padding: "7px 0 20px", display: "flex", justifyContent: "space-around", zIndex: 100, backdropFilter: "blur(20px)" },
  navItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" },
  navLabel: { fontSize: 9, fontFamily: "-apple-system, sans-serif", letterSpacing: 0.3 },
  navDot: { width: 3, height: 3, borderRadius: "50%", background: T.gold, marginTop: 1 },
};
