import { T, TILES } from "../theme";
import { useAuth } from "../AuthContext";
import { SectionHeader, GoldDivider } from "../components/UI";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatEventDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const evt = new Date(dateStr + "T12:00:00");
  const diff = Math.round((evt - today) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `${diff} days`;
}

function eventTypePill(type) {
  const map = {
    game:       { label: "⚾ Game",       color: T.red,    bg: T.redGlow },
    practice:   { label: "🏃 Practice",   color: T.blueLight, bg: "rgba(21,101,192,0.2)" },
    tournament: { label: "🏆 Tournament", color: T.goldLight, bg: T.goldGlow },
    event:      { label: "📌 Event",      color: T.greenLight, bg: "rgba(46,125,50,0.2)" },
  };
  const t = map[type] || map.event;
  return (
    <span style={{ background: t.bg, color: t.color, border: `1px solid ${t.color}40`, borderRadius: 6, padding: "2px 8px", fontSize: 9, fontWeight: "bold", fontFamily: T.sans }}>
      {t.label}
    </span>
  );
}

function NextEventBanner({ events, games, onNavigate }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const allItems = [
    ...games.map(g => ({ ...g, _type: "game", _date: g.date })),
    ...events.map(e => ({ ...e, _type: e.eventType || "event", _date: e.date })),
  ]
    .filter(i => {
      if (!i._date) return false;
      const d = new Date(i._date + "T12:00:00");
      return d >= today;
    })
    .sort((a, b) => a._date.localeCompare(b._date));

  if (allItems.length === 0) return null;

  const [first, second] = allItems;

  return (
    <div style={{ padding: "8px 12px 0" }}>
      {/* Primary event */}
      <div style={styles.nextCard} onClick={() => first._type === "game" ? onNavigate("games") : onNavigate("schedule")}>
        <div style={styles.nextTop}>
          <div style={styles.nextEyebrow}>⚡ Up next</div>
          {daysUntil(first._date) && (
            <div style={styles.nextBadge}>{daysUntil(first._date)}</div>
          )}
        </div>
        <div style={styles.nextTitle}>{first.opponent || first.title || "Practice"}</div>
        <div style={styles.nextMeta}>
          {formatEventDate(first._date)}
          {first.time ? ` · ${first.time}` : ""}
          {first.location ? ` · ${first.location}` : ""}
        </div>
        <div style={{ marginTop: 6 }}>{eventTypePill(first._type)}</div>
      </div>

      {/* Secondary event peek */}
      {second && (
        <div style={styles.secondCard} onClick={() => second._type === "game" ? onNavigate("games") : onNavigate("schedule")}>
          <div style={{ fontSize: 12 }}>{second._type === "game" ? "⚾" : second._type === "practice" ? "🏃" : "📌"}</div>
          <div style={{ flex: 1 }}>
            <div style={styles.secondTitle}>{second.opponent || second.title || "Practice"}</div>
            <div style={styles.secondMeta}>{formatEventDate(second._date)}{second.time ? ` · ${second.time}` : ""}</div>
          </div>
          {eventTypePill(second._type)}
        </div>
      )}
    </div>
  );
}

export default function HomeScreen({ onNavigate, games = [], events = [], messages = [], totalW = 0, totalL = 0, syncStatus = "connecting", isCoach = false }) {
  const { setShowPasswordModal, logoutCoach } = useAuth();
  const unreadMessages = messages.filter(m => !m._read).length;

  const tilesWithBadge = TILES.map(tile => {
    if (tile.id === "messages" && unreadMessages > 0) return { ...tile, badge: unreadMessages };
    return tile;
  });

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoBox}>
          <img src="/irondisciples.jpg" alt="Iron Disciples"
            style={{ width: 46, height: 46, objectFit: "contain", borderRadius: 10 }}
            onError={e => { e.target.style.display = "none"; e.target.parentNode.innerHTML = "⚔️"; }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.teamName}>Iron Disciples</div>
          <div style={styles.teamSub}>9U · Team Hub</div>
          <div style={styles.record}>
            <span style={{ color: T.greenLight }}>{totalW}W</span>
            <span style={{ color: T.silverDim }}> – </span>
            <span style={{ color: T.redLight }}>{totalL}L</span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: syncStatus === "live" ? T.greenLight : syncStatus === "offline" ? T.red : T.amber }} />
          {isCoach
            ? <button style={styles.coachBtn} onClick={logoutCoach}>🔓 Coach</button>
            : <button style={styles.loginBtn} onClick={() => setShowPasswordModal(true)}>🔒 Login</button>
          }
        </div>
      </div>

      {/* Gold accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${T.red}, ${T.gold}, ${T.red})`, opacity: 0.6 }} />

      {/* Next event */}
      <NextEventBanner events={events} games={games} onNavigate={onNavigate} />

      {/* Tiles */}
      <SectionHeader label="Team hub" />

      <div style={styles.tileGrid}>
        {tilesWithBadge.map(tile => (
          <div key={tile.id}
            style={{
              ...styles.tile,
              ...(tile.wide ? styles.tileWide : {}),
              background: `linear-gradient(135deg, ${tile.color}22 0%, ${tile.color}0a 100%)`,
              border: `1px solid ${tile.border}`,
            }}
            onClick={() => onNavigate(tile.id)}>
            {tile.wide ? (
              <div style={styles.tileWideInner}>
                <div style={styles.tileIcon}>{tile.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={styles.tileLabel}>{tile.label}</div>
                  <div style={styles.tileSub}>{tile.sub}</div>
                </div>
                <div style={styles.tileArrow}>›</div>
              </div>
            ) : (
              <>
                <div>
                  <div style={styles.tileIcon}>{tile.icon}</div>
                  <div style={styles.tileLabel}>{tile.label}</div>
                  <div style={styles.tileSub}>{tile.sub}</div>
                </div>
                {tile.badge && (
                  <div style={styles.tileBadge}>{tile.badge}</div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Footer space for nav bar */}
      <div style={{ height: 20 }} />
    </div>
  );
}

const styles = {
  root: { background: T.black, minHeight: "100vh", paddingBottom: 80 },
  header: { background: `linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)`, padding: "14px 14px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.borderRed}` },
  logoBox: { width: 52, height: 52, borderRadius: 14, background: T.dark2, border: `1.5px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", fontSize: 24 },
  teamName: { fontSize: 16, fontWeight: "bold", color: T.white, fontFamily: T.serif, letterSpacing: 0.5 },
  teamSub: { fontSize: 9, color: T.mutedText, letterSpacing: 2, textTransform: "uppercase", marginTop: 1 },
  record: { fontSize: 14, fontWeight: "bold", marginTop: 3, fontFamily: T.serif },
  headerRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 },
  coachBtn: { background: "rgba(76,175,80,0.15)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: 10, color: T.greenLight, padding: "3px 9px", fontSize: 10, cursor: "pointer", fontFamily: T.sans },
  loginBtn: { background: T.redGlow, border: `1px solid ${T.borderRed}`, borderRadius: 10, color: T.silverDim, padding: "3px 9px", fontSize: 10, cursor: "pointer", fontFamily: T.sans },
  nextCard: { background: `linear-gradient(135deg, #1a0808, #100404)`, border: `1px solid ${T.borderRed}`, borderRadius: 16, padding: "11px 14px", marginBottom: 6, cursor: "pointer" },
  nextTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  nextEyebrow: { fontSize: 9, color: T.mutedText, letterSpacing: 2, textTransform: "uppercase", fontFamily: T.sans },
  nextBadge: { background: T.redGlow, border: `1px solid ${T.borderRed}`, borderRadius: 7, padding: "2px 8px", fontSize: 9, color: T.redLight, fontWeight: "bold", fontFamily: T.sans },
  nextTitle: { fontSize: 15, fontWeight: "bold", color: T.white, fontFamily: T.serif },
  nextMeta: { fontSize: 9, color: T.dimText, marginTop: 2, fontFamily: T.sans },
  secondCard: { display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 12, padding: "8px 13px", cursor: "pointer" },
  secondTitle: { fontSize: 11, fontWeight: "bold", color: T.white, fontFamily: T.sans },
  secondMeta: { fontSize: 9, color: T.mutedText, fontFamily: T.sans, marginTop: 1 },
  tileGrid: { padding: "0 10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  tile: { borderRadius: 18, padding: "13px 13px 11px", position: "relative", overflow: "hidden", cursor: "pointer", minHeight: 100, display: "flex", flexDirection: "column", justifyContent: "space-between" },
  tileWide: { gridColumn: "span 2", minHeight: 64, padding: "13px 16px" },
  tileWideInner: { display: "flex", alignItems: "center", gap: 12, width: "100%" },
  tileIcon: { fontSize: 22, lineHeight: 1, marginBottom: 6 },
  tileLabel: { fontSize: 12, fontWeight: "bold", color: T.white, fontFamily: T.sans, letterSpacing: 0.2 },
  tileSub: { fontSize: 9, color: T.dimText, marginTop: 2, fontFamily: T.sans, lineHeight: 1.35 },
  tileArrow: { fontSize: 18, color: T.mutedText, flexShrink: 0 },
  tileBadge: { position: "absolute", top: 9, right: 9, background: T.red, borderRadius: 9, padding: "2px 6px", fontSize: 9, color: T.white, fontWeight: "bold", fontFamily: T.sans },
};
