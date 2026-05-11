import { T } from "../theme";
import { SectionHeader } from "../components/UI";

export default function MoreScreen({ onNavigate }) {
  const items = [
    { id: "messages", icon: "💬", label: "Messages", sub: "Team chat · Polls · Announcements", color: T.teal, border: "rgba(0,105,92,0.35)" },
    { id: "quizzes",  icon: "🎯", label: "Quizzes",  sub: "Situational scenarios by position", color: T.amber, border: "rgba(230,92,0,0.35)" },
    { id: "beyond",   icon: "✝️",  label: "Beyond the Diamond", sub: "Honor God · Diligence · Grit", color: "#6a1b9a", border: "rgba(106,27,154,0.35)" },
  ];
  return (
    <div style={{ background: T.black, minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ padding: "16px 16px 14px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 24, fontWeight: "bold", color: T.white, fontFamily: T.serif }}>More</div>
      </div>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${T.red}, ${T.gold}, ${T.red})`, opacity: 0.4 }} />
      <SectionHeader label="Features" />
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: `linear-gradient(135deg, ${item.color}22, ${item.color}0a)`, border: `1px solid ${item.border}`, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
            onClick={() => onNavigate(item.id)}>
            <div style={{ fontSize: 26, flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: "bold", color: T.white, fontFamily: T.serif }}>{item.label}</div>
              <div style={{ fontSize: 11, color: T.dimText, marginTop: 3, fontFamily: T.sans }}>{item.sub}</div>
            </div>
            <div style={{ fontSize: 20, color: T.mutedText }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}
