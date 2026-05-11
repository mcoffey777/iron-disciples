import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue, set, push, remove, update } from "firebase/database";
import { AuthProvider, useAuth } from "./AuthContext";
import { PasswordModal, IdentityModal, Toast } from "./components/UI";
import NavBar from "./components/NavBar";
import HomeScreen from "./pages/Home";
import MoreScreen from "./pages/More";
import GamesPage from "./pages/Games";
import SchedulePage from "./pages/Schedule";
import RosterPage from "./pages/Roster";
import MessagesPage from "./pages/Messages";
import QuizzesPage from "./pages/Quizzes";
import BeyondPage from "./pages/Beyond";

function AppInner() {
  const { isCoach } = useAuth();
  const [tab, setTab] = useState("home");
  const [page, setPage] = useState(null);
  const [pageProps, setPageProps] = useState({});
  const [games, setGames] = useState([]);
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [syncStatus, setSyncStatus] = useState("connecting");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const navigateTo = (pageId, props = {}) => { setPage(pageId); setPageProps(props); };
  const navigateTab = (tabId) => {
    const pageMap = { messages: "messages", quizzes: "quizzes", beyond: "beyond" };
    if (pageMap[tabId]) { setPage(pageMap[tabId]); setPageProps({}); return; }
    setPage(null); setTab(tabId);
  };
  const goBack = () => setPage(null);

  useEffect(() => {
    const unsubs = [];
    const err = () => setSyncStatus("offline");
    const listen = (path, setter, transform = v => v) => {
      const u = onValue(ref(db, path), snap => {
        const val = snap.val();
        setter(val ? transform(val) : []);
        setSyncStatus("live");
        setLoading(false);
      }, err);
      unsubs.push(u);
    };
    listen("id_games",    setGames,    v => Object.values(v).sort((a,b)=>(a.date||"").localeCompare(b.date||"")));
    listen("id_events",   setEvents,   v => Object.values(v).sort((a,b)=>(a.date||"").localeCompare(b.date||"")));
    listen("id_players",  setPlayers,  v => Array.isArray(v) ? v : Object.values(v));
    listen("id_messages", setMessages, v => Object.values(v).sort((a,b)=>a.ts-b.ts));
    setTimeout(() => { setLoading(false); setSyncStatus("live"); }, 4000);
    return () => unsubs.forEach(u => u());
  }, []);

  useEffect(() => {
    if (!loading && players.length === 0) {
      const defaults = Array.from({ length: 11 }, (_, i) => ({
        id: `player_${i+1}`, name: `Player ${i+1}`, number: i+1, position: "TBD", parentName: "", parentPhone: ""
      }));
      set(ref(db, "id_players"), defaults);
    }
  }, [loading, players.length]);

  const fb = {
    setGame:       g   => set(ref(db, `id_games/${g.id}`), g),
    deleteGame:    id  => remove(ref(db, `id_games/${id}`)),
    setEvent:      e   => set(ref(db, `id_events/${e.id}`), e),
    deleteEvent:   id  => remove(ref(db, `id_events/${id}`)),
    setPlayers:    p   => set(ref(db, "id_players"), p),
    setPlayer:     (idx, data) => { const u=[...players]; u[idx]={...u[idx],...data}; set(ref(db,"id_players"),u); },
    sendMessage:   msg => push(ref(db, "id_messages"), { ...msg, ts: Date.now() }),
    updateMessage: (id, data) => update(ref(db, `id_messages/${id}`), data),
    deleteMessage: id  => remove(ref(db, `id_messages/${id}`)),
  };

  const completedGames = games.filter(g => g.result);
  const totalW = completedGames.filter(g => g.result === "W").length;
  const totalL = completedGames.filter(g => g.result === "L").length;
  const totalT = completedGames.filter(g => g.result === "T").length;

  if (loading) return (
    <div style={{ background:"#080808",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",fontFamily:"Georgia,serif" }}>
      <div style={{ width:48,height:48,border:"3px solid #1a1a1a",borderTop:"3px solid #c8a000",borderRadius:"50%",animation:"spin 0.8s linear infinite",marginBottom:20 }}/>
      <div style={{ fontSize:12,color:"#444",letterSpacing:2 }}>LOADING...</div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  const shared = { games,events,players,messages,fb,showToast,syncStatus,isCoach,onNavigate:navigateTo,onBack:goBack,totalW,totalL,totalT };

  if (page==="games")    return <><GamesPage    {...shared} {...pageProps}/><PasswordModal/><IdentityModal/><Toast message={toast}/></>;
  if (page==="schedule") return <><SchedulePage {...shared} {...pageProps}/><PasswordModal/><IdentityModal/><Toast message={toast}/></>;
  if (page==="roster")   return <><RosterPage   {...shared} {...pageProps}/><PasswordModal/><IdentityModal/><Toast message={toast}/></>;
  if (page==="messages") return <><MessagesPage {...shared} {...pageProps}/><PasswordModal/><IdentityModal/><Toast message={toast}/></>;
  if (page==="quizzes")  return <><QuizzesPage  {...shared} {...pageProps}/><PasswordModal/><IdentityModal/><Toast message={toast}/></>;
  if (page==="beyond")   return <><BeyondPage   {...shared} {...pageProps}/><PasswordModal/><IdentityModal/><Toast message={toast}/></>;

  return (
    <div style={{ background:"#080808",maxWidth:430,margin:"0 auto",minHeight:"100vh" }}>
      <style>{"*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}body{margin:0;background:#080808;}::-webkit-scrollbar{display:none;}button:active{opacity:0.75;transform:scale(0.97);}input[type='date'],input[type='time']{color-scheme:dark;}"}</style>
      {tab==="home"     && <HomeScreen onNavigate={navigateTo} games={games} events={events} messages={messages} totalW={totalW} totalL={totalL} totalT={totalT} syncStatus={syncStatus} isCoach={isCoach}/>}
      {tab==="games"    && <GamesPage    {...shared}/>}
      {tab==="schedule" && <SchedulePage {...shared}/>}
      {tab==="roster"   && <RosterPage   {...shared}/>}
      {tab==="more"     && <MoreScreen   onNavigate={navigateTo}/>}
      <NavBar active={page||tab} onNavigate={navigateTab}/>
      <PasswordModal/><IdentityModal/><Toast message={toast}/>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner/></AuthProvider>;
}
