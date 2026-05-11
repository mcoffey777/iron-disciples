import { T } from "../theme";
import { BackButton } from "../components/UI";

export default function SchedulePage({ onBack }) {
  return (
    <div style={{ background: T.black, minHeight: "100vh", padding: 20, paddingBottom: 100 }}>
      <div style={{ height: 2, background: "linear-gradient(90deg," + T.red + "," + T.gold + "," + T.red + ")", opacity: 0.5, marginBottom: 16 }} />
      <BackButton label="Home" onBack={onBack} />
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
        <div style={{ fontSize: 18, color: T.silver, fontFamily: T.serif }}>Schedule</div>
        <div style={{ fontSize: 12, color: T.silverDim, marginTop: 8 }}>Coming in next build phase</div>
      </div>
    </div>
  );
}
