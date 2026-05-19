import { useState } from "react";
import { T } from "./theme";
import { useAuth } from "./AuthContext";

// ── Bottom Sheet Modal ────────────────────────────────────────────────
export function Modal({ onClose, title, children, light = false }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.sheet, background: light ? "#faf6ee" : T.dark2 }} onClick={e => e.stopPropagation()}>
        {title && (
          <div style={{ ...S.sheetTitle, color: light ? "#1a1a1a" : T.white, borderBottom: `1px solid ${light ? "#e0d5c0" : T.border}` }}>
            {title}
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Coach Password Modal ──────────────────────────────────────────────
export function PasswordModal() {
  const { loginCoach, showPasswordModal, setShowPasswordModal } = useAuth();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  if (!showPasswordModal) return null;

  const attempt = () => {
    if (loginCoach(pw)) { setPw(""); setErr(false); setShowPasswordModal(false); }
    else { setErr(true); setPw(""); }
  };

  return (
    <div style={S.overlay} onClick={() => setShowPasswordModal(false)}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={S.sheetTitle}>🔒 Coach Login</div>
        <div style={{ padding: "16px 20px" }}>
          <div style={S.label}>Enter coach password</div>
          <input style={{ ...S.input, borderColor: err ? T.red : T.dark4, marginTop: 6 }}
            type="password" placeholder="Password" value={pw}
            onChange={e => { setPw(e.target.value); setErr(false); }}
            onKeyDown={e => e.key === "Enter" && attempt()} autoFocus />
          {err && <div style={{ color: T.redLight, fontSize: 12, marginTop: 6 }}>Incorrect password</div>}
          <div style={{ fontSize: 11, color: T.dimText, marginTop: 8, lineHeight: 1.5 }}>
            Coaches can edit lineups, manage the team, post messages and polls.
          </div>
        </div>
        <div style={{ padding: "0 20px" }}>
          <button style={S.btnPrimary} onClick={attempt}>Login as Coach</button>
        </div>
        <button style={S.btnClose} onClick={() => setShowPasswordModal(false)}>Cancel</button>
      </div>
    </div>
  );
}

// ── Identity Modal (parent/player name) ──────────────────────────────
export function IdentityModal() {
  const { showIdentityModal, setShowIdentityModal, saveIdentity } = useAuth();
  const [name, setName] = useState("");
  const [playerName, setPlayerName] = useState("");

  if (!showIdentityModal) return null;

  const save = () => {
    if (!name.trim()) return;
    saveIdentity(name.trim(), playerName.trim());
  };

  return (
    <div style={S.overlay}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={S.sheetTitle}>👋 Welcome!</div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 13, color: T.dimText, marginBottom: 16, lineHeight: 1.6 }}>
            Enter your name so the team knows who you are in messages and quizzes.
          </div>
          <div style={S.formField}>
            <div style={S.label}>Your name</div>
            <input style={{ ...S.input, marginTop: 6 }} placeholder="e.g. Mike Smith"
              value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div style={S.formField}>
            <div style={S.label}>Your player's name (optional)</div>
            <input style={{ ...S.input, marginTop: 6 }} placeholder="e.g. Jake Smith"
              value={playerName} onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && save()} />
          </div>
        </div>
        <div style={{ padding: "0 20px" }}>
          <button style={{ ...S.btnPrimary, opacity: name.trim() ? 1 : 0.4 }} onClick={save}>
            Join the Team
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────
export function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={S.toast}>{message}</div>
  );
}

// ── Section header ────────────────────────────────────────────────────
export function SectionHeader({ label }) {
  return <div style={S.sectionLabel}>{label}</div>;
}

// ── Gold divider ──────────────────────────────────────────────────────
export function GoldDivider() {
  return <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, margin: "0 16px", opacity: 0.3 }} />;
}

// ── Back button ───────────────────────────────────────────────────────
export function BackButton({ label = "Back", onBack }) {
  return (
    <button style={S.backBtn} onClick={onBack}>
      ‹ {label}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={S.emptyState}>
      <div style={S.emptyIcon}>{icon}</div>
      <div style={S.emptyTitle}>{title}</div>
      {sub && <div style={S.emptySub}>{sub}</div>}
      {action && <button style={S.btnPrimary} onClick={onAction}>{action}</button>}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────
export const S = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "flex-end", zIndex: 200, backdropFilter: "blur(4px)" },
  sheet: { background: T.dark2, borderRadius: "22px 22px 0 0", width: "100%", maxHeight: "80dvh", display: "flex", flexDirection: "column", border: `1px solid ${T.border}`, paddingBottom: "max(24px, env(safe-area-inset-bottom))" },
  sheetTitle: { fontSize: 16, fontWeight: "bold", color: T.white, padding: "20px 20px 16px", fontFamily: T.serif, borderBottom: `1px solid ${T.border}` },
  label: { fontSize: 11, color: T.dimText, letterSpacing: 1, textTransform: "uppercase" },
  input: { width: "100%", background: T.dark3, border: `1px solid ${T.dark4}`, borderRadius: 10, padding: "11px 14px", color: T.white, fontSize: 14, fontFamily: T.sans, outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", background: T.dark3, border: `1px solid ${T.dark4}`, borderRadius: 10, padding: "11px 14px", color: T.white, fontSize: 14, fontFamily: T.sans, outline: "none", boxSizing: "border-box", resize: "none" },
  formField: { marginBottom: 14 },
  btnPrimary: { width: "100%", padding: 14, background: `linear-gradient(135deg, ${T.red}, #8a1010)`, border: "none", borderRadius: 12, color: T.white, fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: T.serif, letterSpacing: 0.5 },
  btnGold: { width: "100%", padding: 14, background: `linear-gradient(135deg, ${T.gold}, #8a6a00)`, border: "none", borderRadius: 12, color: T.white, fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: T.serif },
  btnSecondary: { width: "100%", padding: 12, background: T.dark3, border: `1px solid ${T.dark4}`, borderRadius: 12, color: T.dimText, fontSize: 13, cursor: "pointer", fontFamily: T.sans },
  btnClose: { margin: "10px 20px 0", padding: 13, background: "none", border: `1px solid ${T.dark4}`, borderRadius: 12, color: T.silverDim, fontSize: 14, cursor: "pointer", fontFamily: T.sans, width: "calc(100% - 40px)", display: "block" },
  backBtn: { background: "none", border: "none", color: T.gold, fontSize: 15, cursor: "pointer", fontFamily: T.serif, fontWeight: "bold", padding: "4px 0" },
  sectionLabel: { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: T.silverDim, padding: "14px 16px 6px" },
  emptyState: { textAlign: "center", padding: "60px 24px 40px" },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: T.silver, fontFamily: T.serif, marginBottom: 8 },
  emptySub: { fontSize: 13, color: T.silverDim, marginBottom: 24, lineHeight: 1.6 },
  toast: { position: "fixed", bottom: "max(90px, calc(80px + env(safe-area-inset-bottom)))", left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg, ${T.red}, #8a1010)`, color: T.white, padding: "9px 22px", borderRadius: 22, fontSize: 13, zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" },
  toggleRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  toggle: { padding: "7px 14px", background: T.dark3, border: `1px solid ${T.dark4}`, borderRadius: 20, color: T.silver, fontSize: 12, cursor: "pointer", fontFamily: T.sans },
  toggleActive: { background: T.red, border: `1px solid ${T.red}`, color: T.white },
};
