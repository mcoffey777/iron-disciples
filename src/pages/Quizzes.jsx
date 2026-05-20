import { useState } from "react";
import { T } from "../theme";
import { useAuth } from "../AuthContext";
import { S, SectionHeader } from "../components/UI";
import { QUIZZES, QUIZ_ORDER } from "../quizData";

export default function QuizzesPage({ fb, scores, showToast, onBack }) {
  const { identity, setShowIdentityModal } = useAuth();
  const [view,        setView]        = useState("home");   // home | quiz | result | leaderboard
  const [activeQuiz,  setActiveQuiz]  = useState(null);     // quiz key
  const [qIndex,      setQIndex]      = useState(0);
  const [selected,    setSelected]    = useState(null);
  const [answered,    setAnswered]    = useState(false);
  const [score,       setScore]       = useState(0);
  const [answers,     setAnswers]     = useState([]);

  const allScores = scores || {};

  // Start a quiz
  const startQuiz = (key) => {
    if (!identity) { setShowIdentityModal(true); return; }
    setActiveQuiz(key);
    setQIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setAnswers([]);
    setView("quiz");
  };

  const quiz      = activeQuiz ? QUIZZES[activeQuiz] : null;
  const questions = quiz ? quiz.questions : [];
  const question  = questions[qIndex];

  // Answer a question
  const pickAnswer = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === question.correct;
    if (correct) setScore(s => s + 1);
    setAnswers(a => [...a, { picked: idx, correct }]);
  };

  // Next question or finish
  const nextQuestion = () => {
    if (qIndex < questions.length - 1) {
      setQIndex(i => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      // Finish — save score
      const finalScore = score;
      const pct = Math.round(finalScore / questions.length * 100);
      const entry = {
        player: identity.name,
        quiz: activeQuiz,
        score: finalScore,
        total: questions.length,
        pct,
        ts: Date.now(),
      };
      fb.saveQuizScore(entry);
      setView("result");
    }
  };

  // ── QUIZ VIEW ──
  if (view === "quiz" && quiz && question) {
    const progress = ((qIndex) / questions.length) * 100;
    return (
      <div style={Q.root}>
        <div style={Q.quizHeader}>
          <button style={Q.back} onClick={() => { if(confirm("Quit this quiz? Progress will be lost.")) setView("home"); }}>‹ Quit</button>
          <div style={{ flex:1, textAlign:"center" }}>
            <div style={Q.quizHeaderTitle}>{quiz.icon} {quiz.label}</div>
            <div style={Q.quizHeaderSub}>Question {qIndex + 1} of {questions.length}</div>
          </div>
          <div style={{ width:50, textAlign:"right", color:T.gold, fontWeight:"bold", fontFamily:T.serif }}>{score}✓</div>
        </div>
        <div style={{ height:2, background:`linear-gradient(90deg,${T.red},${T.gold},${T.red})`, opacity:0.5 }}/>

        {/* Progress bar */}
        <div style={Q.progressOuter}>
          <div style={{ ...Q.progressInner, width:`${progress}%`, background: quiz.color }}/>
        </div>

        <div style={Q.quizBody}>
          {/* Question */}
          <div style={{ ...Q.questionCard, borderColor: quiz.color+"55" }}>
            <div style={Q.questionLabel}>SITUATION</div>
            <div style={Q.questionText}>{question.q}</div>
          </div>

          {/* Options */}
          <div style={{ marginTop:16 }}>
            {question.options.map((opt, idx) => {
              let bg = T.dark2, border = T.border, icon = null;
              if (answered) {
                if (idx === question.correct) { bg = "rgba(46,125,50,0.25)"; border = T.greenLight; icon = "✓"; }
                else if (idx === selected)    { bg = "rgba(198,40,40,0.25)"; border = T.redLight;   icon = "✕"; }
              }
              return (
                <button key={idx} style={{ ...Q.option, background:bg, border:`1.5px solid ${border}` }}
                  onClick={() => pickAnswer(idx)} disabled={answered}>
                  <span style={{ ...Q.optionLetter, background: answered && idx===question.correct ? T.greenLight : answered && idx===selected ? T.redLight : T.dark4 }}>
                    {icon || String.fromCharCode(65 + idx)}
                  </span>
                  <span style={Q.optionText}>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {answered && (
            <div style={{ ...Q.explainCard, borderColor: selected===question.correct ? T.greenLight+"55" : T.gold+"55" }}>
              <div style={{ ...Q.explainLabel, color: selected===question.correct ? T.greenLight : T.gold }}>
                {selected === question.correct ? "✓ Correct!" : "Here's the play"}
              </div>
              <div style={Q.explainText}>{question.explain}</div>
            </div>
          )}
        </div>

        {/* Next button */}
        {answered && (
          <div style={Q.quizFooter}>
            <button style={{ ...S.btnPrimary, background:`linear-gradient(135deg,${quiz.color},#000)` }} onClick={nextQuestion}>
              {qIndex < questions.length - 1 ? "Next Question →" : "See Results →"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── RESULT VIEW ──
  if (view === "result" && quiz) {
    const pct = Math.round(score / questions.length * 100);
    const passed = pct >= 70;
    return (
      <div style={Q.root}>
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px", textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:16 }}>{passed ? "🏆" : "💪"}</div>
          <div style={{ fontSize:24, fontWeight:"bold", color:T.white, fontFamily:T.serif, marginBottom:8 }}>
            {passed ? "Great Job!" : "Keep Practicing!"}
          </div>
          <div style={{ fontSize:14, color:T.silverDim, marginBottom:24 }}>{quiz.icon} {quiz.label}</div>

          <div style={{ ...Q.scoreCircle, borderColor: passed ? T.greenLight : T.gold }}>
            <div style={{ fontSize:42, fontWeight:"bold", color: passed ? T.greenLight : T.gold, fontFamily:T.serif }}>{pct}%</div>
            <div style={{ fontSize:13, color:T.silverDim }}>{score} of {questions.length} correct</div>
          </div>

          <div style={{ fontSize:13, color:T.dimText, marginTop:24, lineHeight:1.6, maxWidth:300 }}>
            {passed
              ? "You know your baseball! Keep studying these situations so they're automatic on the field."
              : "Every great player studies the game. Review the explanations and try again — you'll get there!"}
          </div>

          <div style={{ width:"100%", maxWidth:320, marginTop:28, display:"flex", flexDirection:"column", gap:10 }}>
            <button style={S.btnPrimary} onClick={() => startQuiz(activeQuiz)}>Try Again</button>
            <button style={{ ...S.btnSecondary }} onClick={() => setView("leaderboard")}>View Leaderboard</button>
            <button style={{ ...S.btnSecondary }} onClick={() => setView("home")}>Back to Quizzes</button>
          </div>
        </div>
      </div>
    );
  }

  // ── LEADERBOARD VIEW ──
  if (view === "leaderboard") {
    // Build leaderboard — best score per player
    const byPlayer = {};
    Object.values(allScores).forEach(s => {
      if (!byPlayer[s.player]) byPlayer[s.player] = { player: s.player, totalPct: 0, count: 0, best: 0 };
      byPlayer[s.player].totalPct += s.pct;
      byPlayer[s.player].count += 1;
      byPlayer[s.player].best = Math.max(byPlayer[s.player].best, s.pct);
    });
    const board = Object.values(byPlayer)
      .map(p => ({ ...p, avg: Math.round(p.totalPct / p.count) }))
      .sort((a, b) => b.avg - a.avg);

    return (
      <div style={Q.root}>
        <div style={Q.header}>
          <button style={Q.back} onClick={() => setView("home")}>‹ Quizzes</button>
          <div style={Q.headerTitle}>🏆 Leaderboard</div>
          <div style={{ width:50 }}/>
        </div>
        <div style={{ height:2, background:`linear-gradient(90deg,${T.red},${T.gold},${T.red})`, opacity:0.5 }}/>

        <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
          {board.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:T.silverDim }}>
              <div style={{ fontSize:44, marginBottom:12 }}>🏆</div>
              <div style={{ fontSize:16, color:T.silver, fontFamily:T.serif }}>No scores yet</div>
              <div style={{ fontSize:13, marginTop:6 }}>Take a quiz to get on the board!</div>
            </div>
          )}
          {board.map((p, i) => (
            <div key={p.player} style={{ ...Q.lbRow, ...(p.player===identity?.name ? { border:`1px solid ${T.borderGold}`, background:"rgba(200,160,0,0.08)" } : {}) }}>
              <div style={{ ...Q.lbRank, background: i===0?"#c8a000":i===1?"#9e9e9e":i===2?"#8a5a2a":T.dark3 }}>
                {i < 3 ? ["🥇","🥈","🥉"][i] : i+1}
              </div>
              <div style={{ flex:1 }}>
                <div style={Q.lbName}>{p.player}{p.player===identity?.name ? " (You)" : ""}</div>
                <div style={Q.lbMeta}>{p.count} quiz{p.count!==1?"zes":""} taken · Best {p.best}%</div>
              </div>
              <div style={{ ...Q.lbScore, color: p.avg>=70 ? T.greenLight : T.gold }}>{p.avg}%</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── HOME VIEW ──
  const myScores = Object.values(allScores).filter(s => s.player === identity?.name);
  const bestFor = (key) => {
    const s = myScores.filter(x => x.quiz === key);
    return s.length ? Math.max(...s.map(x => x.pct)) : null;
  };

  return (
    <div style={Q.root}>
      <div style={Q.header}>
        <div style={Q.headerTitle}>🎯 Quizzes</div>
        <button style={Q.lbBtn} onClick={() => setView("leaderboard")}>🏆 Leaderboard</button>
      </div>
      <div style={{ height:2, background:`linear-gradient(90deg,${T.red},${T.gold},${T.red})`, opacity:0.5 }}/>

      <div style={{ flex:1, overflowY:"auto" }}>
        {/* Intro */}
        <div style={Q.intro}>
          <div style={Q.introTitle}>Situational Baseball</div>
          <div style={Q.introText}>
            Test your baseball IQ with real game scenarios. Pick a position and learn the smart play for every situation.
          </div>
          {!identity && (
            <button style={{ ...S.btnGold, marginTop:12 }} onClick={() => setShowIdentityModal(true)}>
              Enter Your Name to Start
            </button>
          )}
        </div>

        <SectionHeader label="Choose a Quiz" />

        <div style={{ padding:"0 12px 80px" }}>
          {QUIZ_ORDER.map(key => {
            const qz   = QUIZZES[key];
            const best = bestFor(key);
            return (
              <div key={key} style={{ ...Q.quizCard, borderColor: qz.color+"44" }}
                onClick={() => startQuiz(key)}>
                <div style={{ ...Q.quizIcon, background: qz.color+"22", border:`1px solid ${qz.color}55` }}>
                  {qz.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={Q.quizName}>{qz.label}</div>
                  <div style={Q.quizDesc}>{qz.desc}</div>
                  <div style={Q.quizMeta}>
                    {qz.questions.length} questions
                    {best !== null && (
                      <span style={{ color: best>=70 ? T.greenLight : T.gold, marginLeft:8 }}>
                        · Best: {best}%
                      </span>
                    )}
                  </div>
                </div>
                <div style={Q.quizArrow}>›</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const Q = {
  root:{ background:T.black, height:"100%", display:"flex", flexDirection:"column" },
  header:{ background:`linear-gradient(160deg,#1a1010,${T.black})`, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${T.border}`, flexShrink:0 },
  headerTitle:{ fontSize:22, fontWeight:"bold", color:T.white, fontFamily:T.serif },
  back:{ background:"none", border:"none", color:T.gold, fontSize:15, cursor:"pointer", fontFamily:T.serif, fontWeight:"bold", width:50, textAlign:"left", flexShrink:0 },
  lbBtn:{ background:"rgba(200,160,0,0.15)", border:`1px solid ${T.borderGold}`, borderRadius:16, color:T.goldLight, padding:"7px 12px", fontSize:11, cursor:"pointer", fontWeight:"bold", fontFamily:T.sans },

  intro:{ padding:"16px" },
  introTitle:{ fontSize:18, fontWeight:"bold", color:T.white, fontFamily:T.serif },
  introText:{ fontSize:13, color:T.dimText, marginTop:6, lineHeight:1.6 },

  quizCard:{ display:"flex", alignItems:"center", gap:12, background:T.dark2, border:"1px solid", borderRadius:16, padding:"14px", marginBottom:10, cursor:"pointer" },
  quizIcon:{ width:52, height:52, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 },
  quizName:{ fontSize:16, fontWeight:"bold", color:T.white, fontFamily:T.serif },
  quizDesc:{ fontSize:11, color:T.silverDim, marginTop:3, lineHeight:1.4 },
  quizMeta:{ fontSize:11, color:T.dimText, marginTop:5, fontWeight:"bold" },
  quizArrow:{ fontSize:22, color:T.dark4, flexShrink:0 },

  // Quiz in progress
  quizHeader:{ background:`linear-gradient(160deg,#1a1010,${T.black})`, padding:"14px 16px", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${T.border}`, flexShrink:0 },
  quizHeaderTitle:{ fontSize:14, fontWeight:"bold", color:T.white, fontFamily:T.serif },
  quizHeaderSub:{ fontSize:10, color:T.silverDim, marginTop:2 },
  progressOuter:{ height:5, background:T.dark2, flexShrink:0 },
  progressInner:{ height:"100%", transition:"width 0.3s" },
  quizBody:{ flex:1, overflowY:"auto", padding:"16px" },
  questionCard:{ background:T.dark2, border:"1.5px solid", borderRadius:16, padding:"16px" },
  questionLabel:{ fontSize:10, letterSpacing:2, color:T.gold, fontWeight:"bold", marginBottom:8 },
  questionText:{ fontSize:16, color:T.white, lineHeight:1.5, fontFamily:T.serif },
  option:{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"13px 14px", borderRadius:12, marginBottom:8, cursor:"pointer", textAlign:"left" },
  optionLetter:{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:"bold", color:T.white, flexShrink:0, fontFamily:T.serif },
  optionText:{ fontSize:14, color:T.white, lineHeight:1.4, fontFamily:T.sans },
  explainCard:{ background:T.dark2, border:"1.5px solid", borderRadius:14, padding:"14px", marginTop:14 },
  explainLabel:{ fontSize:13, fontWeight:"bold", marginBottom:6, fontFamily:T.serif },
  explainText:{ fontSize:13, color:T.dimText, lineHeight:1.6 },
  quizFooter:{ padding:"12px 16px", borderTop:`1px solid ${T.border}`, flexShrink:0 },

  // Result
  scoreCircle:{ width:160, height:160, borderRadius:"50%", border:"4px solid", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 },

  // Leaderboard
  lbRow:{ display:"flex", alignItems:"center", gap:12, background:T.dark2, borderRadius:12, padding:"12px 14px", marginBottom:8 },
  lbRank:{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:"bold", color:T.white, flexShrink:0, fontFamily:T.serif },
  lbName:{ fontSize:14, fontWeight:"bold", color:T.white, fontFamily:T.serif },
  lbMeta:{ fontSize:10, color:T.silverDim, marginTop:2 },
  lbScore:{ fontSize:20, fontWeight:"bold", fontFamily:T.serif, flexShrink:0 },
};
