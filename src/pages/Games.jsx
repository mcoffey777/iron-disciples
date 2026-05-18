import { useState } from "react";
import { T, POSITIONS, POS_COLORS, POS_LABELS, ALL_POSITIONS, INNINGS } from "../theme";
import { useAuth } from "../AuthContext";
import { S, SectionHeader, EmptyState } from "../components/UI";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtShort = d => { if(!d) return ""; const [y,m,dd]=d.split("-"); return `${MONTHS[parseInt(m)-1]} ${parseInt(dd)}`; };
const fmtFull  = d => { if(!d) return ""; const [y,m,dd]=d.split("-"); return `${MONTHS[parseInt(m)-1]} ${parseInt(dd)}, ${y}`; };
const rColor = r => r==="W"?"#4CAF50":r==="L"?"#ef5350":r==="T"?"#f0c400":"#555";
const rBg    = r => r==="W"?"rgba(76,175,80,0.15)":r==="L"?"rgba(229,57,53,0.15)":r==="T"?"rgba(240,196,0,0.15)":"rgba(255,255,255,0.04)";
const emptyLineup = () => [...POSITIONS,"Bench"].reduce((a,p)=>({...a,[p]:null}),{});
const FIELD_COORDS = { CF:{x:50,y:10},LF:{x:18,y:22},RF:{x:82,y:22},SS:{x:33,y:42},"2B":{x:57,y:36},"3B":{x:22,y:56},"1B":{x:76,y:56},P:{x:50,y:54},C:{x:50,y:74} };

function GameForm({form,onChange,showResult,title,onSave,onDelete,onCancel}) {
  return (
    <div style={S.sheet} onClick={e=>e.stopPropagation()}>
      <div style={S.sheetTitle}>{title}</div>
      <div style={{overflowY:"auto",flex:1,padding:"12px 20px"}}>
        <div style={S.formField}>
          <div style={S.label}>Opponent</div>
          <input style={{...S.input,marginTop:6}} placeholder="Team name" value={form.opponent||""} onChange={e=>onChange(v=>({...v,opponent:e.target.value}))}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <div style={{...S.formField,flex:2}}><div style={S.label}>Date</div><input style={{...S.input,marginTop:6}} type="date" value={form.date||""} onChange={e=>onChange(v=>({...v,date:e.target.value}))}/></div>
          <div style={{...S.formField,flex:1}}><div style={S.label}>Time</div><input style={{...S.input,marginTop:6}} type="time" value={form.time||""} onChange={e=>onChange(v=>({...v,time:e.target.value}))}/></div>
        </div>
        <div style={S.formField}>
          <div style={S.label}>Location</div>
          <div style={{...S.toggleRow,marginTop:6}}>
            {["Home","Away","Neutral"].map(loc=>(
              <button key={loc} style={{...S.toggle,...(form.location===loc?S.toggleActive:{})}} onClick={()=>onChange(v=>({...v,location:loc}))}>{loc}</button>
            ))}
          </div>
        </div>
        {showResult&&<>
          <div style={S.formField}>
            <div style={S.label}>Result</div>
            <div style={{...S.toggleRow,marginTop:6}}>
              {[null,"W","L","T"].map(r=>(
                <button key={String(r)} style={{...S.toggle,...(form.result===r?{background:r==="W"?"#2e7d32":r==="L"?"#c62828":r==="T"?"#c8a000":"#444",color:"#fff",border:"1px solid transparent"}:{})}} onClick={()=>onChange(v=>({...v,result:r}))}>
                  {r===null?"Upcoming":r==="W"?"✅ Win":r==="L"?"❌ Loss":"🤝 Tie"}
                </button>
              ))}
            </div>
          </div>
          {form.result&&<div style={{display:"flex",gap:8}}>
            <div style={{...S.formField,flex:1}}><div style={S.label}>Our Runs</div><input style={{...S.input,marginTop:6}} type="number" min="0" placeholder="0" value={form.runsFor||""} onChange={e=>onChange(v=>({...v,runsFor:e.target.value}))}/></div>
            <div style={{...S.formField,flex:1}}><div style={S.label}>{form.opponent||"Opp."} Runs</div><input style={{...S.input,marginTop:6}} type="number" min="0" placeholder="0" value={form.runsAgainst||""} onChange={e=>onChange(v=>({...v,runsAgainst:e.target.value}))}/></div>
          </div>}
        </>}
        <div style={S.formField}><div style={S.label}>Notes</div><textarea style={{...S.textarea,marginTop:6,height:72}} placeholder="Field, weather, notes..." value={form.notes||""} onChange={e=>onChange(v=>({...v,notes:e.target.value}))}/></div>
      </div>
      <div style={{padding:"8px 20px 0",display:"flex",gap:8}}>
        <button style={S.btnPrimary} onClick={onSave}>{title==="New Game"?"Create Game":"Save Changes"}</button>
        {onDelete&&<button style={{...S.btnSecondary,color:T.redLight,border:`1px solid ${T.borderRed}`}} onClick={onDelete}>Delete</button>}
      </div>
      <button style={S.btnClose} onClick={onCancel}>Cancel</button>
    </div>
  );
}

export default function GamesPage({games, allEvents, players, fb, showToast, isCoach, onBack, onNavigate}) {
  const {requireCoach} = useAuth();
  const [openId,setOpenId]           = useState(null);
  const [gameTab,setGameTab]         = useState("lineup");
  const [inning,setInning]           = useState(0);
  const [fieldInn,setFieldInn]       = useState(0);
  const [newModal,setNewModal]       = useState(false);
  const [newForm,setNewForm]         = useState({});
  const [editModal,setEditModal]     = useState(null);
  const [assignModal,setAssignModal] = useState(null);
  const [delConfirm,setDelConfirm]   = useState(null);

  const names = (players||[]).map(p=>p.name||p);
  const g = games.find(x=>x.id===openId)||null;
  const lineup = g?.lineup || Array.from({length:INNINGS},emptyLineup);

  const handleCreate = () => requireCoach(()=>{
    const last = games.length>0?games[games.length-1]:null;
    const newG = {
      id:`game_${Date.now()}`,date:"",time:"",opponent:"",location:"",result:null,runsFor:"",runsAgainst:"",notes:"",
      lineup:last?.lineup?last.lineup.map(r=>({...r})):Array.from({length:INNINGS},emptyLineup),
      ...newForm,
    };
    fb.setGame(newG);
    setNewModal(false);setNewForm({});
    setOpenId(newG.id);setGameTab("lineup");setInning(0);
    showToast("Game created! Lineup carried over ✅");
  });

  const saveEdits = () => requireCoach(()=>{ fb.setGame(editModal); setEditModal(null); showToast("Saved!"); });
  const deleteGame = () => requireCoach(()=>{ fb.deleteGame(delConfirm); setDelConfirm(null);setEditModal(null);setOpenId(null); showToast("Deleted"); });

  const updateLineup = (inn,pos,player) => requireCoach(()=>{
    if(!g) return;
    const lu = g.lineup.map(r=>({...r}));
    Object.keys(lu[inn]).forEach(p=>{if(lu[inn][p]===player)lu[inn][p]=null;});
    lu[inn][pos]=player;
    fb.setGame({...g,lineup:lu});
    setAssignModal(null);showToast(`${player} → ${pos}`);
  });

  const removePos = (inn,pos) => requireCoach(()=>{
    if(!g) return;
    const lu=g.lineup.map(r=>({...r}));lu[inn][pos]=null;fb.setGame({...g,lineup:lu});
  });

  const copyInn = (from,to) => requireCoach(()=>{
    if(!g) return;
    const lu=g.lineup.map(r=>({...r}));lu[to]={...lu[from]};fb.setGame({...g,lineup:lu});
    showToast(`Inning ${from+1} → Inning ${to+1}`);
  });

  const unassigned = (inn) => { const a=new Set(Object.values(lineup[inn]||{}).filter(Boolean)); return names.filter(p=>!a.has(p)); };
  const playerPos  = (inn,p) => Object.entries(lineup[inn]||{}).find(([,v])=>v===p)?.[0]||null;

  // ── GAME DETAIL ───────────────────────────────────────────────────
  if(openId&&g) return (
    <div style={P.root}>
      <div style={P.gHeader}>
        <button style={P.back} onClick={()=>setOpenId(null)}>‹ Games</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={P.gTitle}>{g.opponent||"Untitled"}</div>
          <div style={P.gMeta}>{fmtShort(g.date)}{g.time?` · ${g.time}`:""}{g.location?` · ${g.location}`:""}</div>
        </div>
        <div style={{...P.badge,background:rBg(g.result),color:rColor(g.result)}}>{g.result||"—"}</div>
      </div>
      <div style={{height:2,background:`linear-gradient(90deg,${T.red},${T.gold},${T.red})`,opacity:0.5}}/>

      <div style={P.subNav}>
        {[["lineup","⚾ Lineup"],["field","🏟 Field"],["print","🖨 Print"]].map(([id,lbl])=>(
          <button key={id} style={{...P.subBtn,...(gameTab===id?P.subActive:{})}} onClick={()=>setGameTab(id)}>{lbl}</button>
        ))}
        <button style={P.editBtn} onClick={()=>requireCoach(()=>setEditModal({...g}))}>✏️</button>
      </div>

      {/* LINEUP */}
      {gameTab==="lineup"&&(
        <div style={{paddingBottom:100}}>
          <div style={P.scoreBar}>
            <span style={P.sTeam}>Iron Disciples</span>
            <span style={P.sNum}>{g.runsFor||0} – {g.runsAgainst||0}</span>
            <span style={P.sTeam}>{g.opponent||"Opp."}</span>
          </div>
          <div style={P.innTabs}>
            {Array.from({length:INNINGS},(_,i)=>(
              <button key={i} style={{...P.innTab,...(inning===i?P.innActive:{})}} onClick={()=>setInning(i)}>
                <span style={{fontSize:8,opacity:0.7}}>INN</span><span style={{fontSize:20,fontWeight:"bold",lineHeight:1}}>{i+1}</span>
              </button>
            ))}
          </div>
          {inning>0&&<div style={P.copyBar}>
            <span style={P.copyLbl}>Copy from:</span>
            {Array.from({length:inning},(_,i)=><button key={i} style={P.copyBtn} onClick={()=>copyInn(i,inning)}>Inn {i+1}</button>)}
          </div>}
          <SectionHeader label="Positions"/>
          <div style={P.posGrid}>
            {POSITIONS.map(pos=>{
              const player=lineup[inning]?.[pos];
              return (
                <div key={pos} style={P.posCard} onClick={()=>requireCoach(()=>setAssignModal({pos,inning,mode:"pos"}))}>
                  <div style={{...P.posBadge,background:POS_COLORS[pos]}}>{pos}</div>
                  <div style={P.posName}>{player||<span style={P.posEmpty}>{isCoach?"Tap":"—"}</span>}</div>
                  {player&&isCoach&&<button style={P.posX} onClick={e=>{e.stopPropagation();removePos(inning,pos);}}>✕</button>}
                </div>
              );
            })}
          </div>
          <SectionHeader label="Bench"/>
          <div style={P.benchRow}>
            {unassigned(inning).length===0
              ?<span style={{color:T.greenLight,fontSize:13}}>All players assigned! ✅</span>
              :unassigned(inning).map(p=><div key={p} style={P.chip} onClick={()=>requireCoach(()=>setAssignModal({pos:"pick",player:p,inning,mode:"player"}))}><span style={P.chipDot}/>{p}</div>)
            }
          </div>
          <SectionHeader label="Full Game Lineup"/>
          <div style={{overflowX:"auto",padding:"0 12px 20px"}}>
            <table style={{borderCollapse:"collapse",fontSize:11,fontFamily:T.sans,minWidth:"100%"}}>
              <thead><tr>
                <th style={P.th}>Player</th>
                {Array.from({length:INNINGS},(_,i)=><th key={i} style={P.th}>I{i+1}</th>)}
              </tr></thead>
              <tbody>
                {names.map((p,pi)=>(
                  <tr key={pi}>
                    <td style={P.tdName}>{p.split(" ").slice(-1)[0]}</td>
                    {Array.from({length:INNINGS},(_,ii)=>{
                      const pos=playerPos(ii,p);
                      return <td key={ii} style={{...P.td,background:pos?POS_COLORS[pos]+"33":"transparent",color:pos?T.white:T.silverDim}}>{pos||"—"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FIELD */}
      {gameTab==="field"&&(
        <div style={{paddingBottom:100}}>
          <div style={P.innTabs}>
            {Array.from({length:INNINGS},(_,i)=>(
              <button key={i} style={{...P.innTab,...(fieldInn===i?P.innActive:{})}} onClick={()=>setFieldInn(i)}>
                <span style={{fontSize:8,opacity:0.7}}>INN</span><span style={{fontSize:20,fontWeight:"bold",lineHeight:1}}>{i+1}</span>
              </button>
            ))}
          </div>
          <div style={{padding:"10px 12px 0",background:`linear-gradient(180deg,#091506,${T.black})`}}>
            <svg viewBox="0 0 100 92" style={{width:"100%",display:"block",borderRadius:16,border:"1px solid #1e3014",boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}} xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="gg2" cx="50%" cy="55%" r="65%"><stop offset="0%" stopColor="#3a6b24"/><stop offset="100%" stopColor="#1c3d0f"/></radialGradient>
                <radialGradient id="dg2" cx="50%" cy="55%" r="65%"><stop offset="0%" stopColor="#2e5a1b"/><stop offset="100%" stopColor="#162e0a"/></radialGradient>
                <radialGradient id="ig2" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="#d4a96a"/><stop offset="100%" stopColor="#a07840"/></radialGradient>
                <filter id="gl2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <clipPath id="fc2"><ellipse cx="50" cy="46" rx="47" ry="43"/></clipPath>
              </defs>
              <ellipse cx="50" cy="46" rx="47" ry="43" fill="url(#gg2)"/>
              {[0,1,2,3,4,5].map(i=><ellipse key={i} cx="50" cy="48" rx={10+i*7} ry={9+i*6.5} fill={i%2===0?"url(#gg2)":"url(#dg2)"} clipPath="url(#fc2)"/>)}
              <line x1="50" y1="80" x2="4" y2="4" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2,1.5"/>
              <line x1="50" y1="80" x2="96" y2="4" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2,1.5"/>
              <ellipse cx="50" cy="46" rx="45" ry="41" fill="none" stroke="#c8a060" strokeWidth="3" opacity="0.35"/>
              <polygon points="50,34 74,57 50,80 26,57" fill="url(#ig2)" opacity="0.92"/>
              <circle cx="50" cy="57" r="14" fill="#3a6b24" opacity="0.5"/>
              <polygon points="50,34 74,57 50,80 26,57" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5"/>
              <rect x="47.2" y="31.2" width="5.6" height="5.6" rx="1" fill="white" opacity="0.95"/>
              <rect x="71.2" y="54.2" width="5.6" height="5.6" rx="1" fill="white" opacity="0.95"/>
              <rect x="23.2" y="54.2" width="5.6" height="5.6" rx="1" fill="white" opacity="0.95"/>
              <polygon points="50,77 53.5,80.5 52,84 48,84 46.5,80.5" fill="white" opacity="0.95"/>
              <ellipse cx="50" cy="57" rx="4" ry="2.5" fill="#b8906a" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
              {Object.entries(FIELD_COORDS).map(([pos,c])=>{
                const player=lineup[fieldInn]?.[pos];const color=POS_COLORS[pos];const r=5.2;
                const parts=player?player.split(" "):[];
                const short=player?(parts.length>=2?`${parts[0][0]}.${parts[parts.length-1]}`:player.substring(0,7)):null;
                return (
                  <g key={pos} style={{cursor:"pointer"}} onClick={()=>requireCoach(()=>setAssignModal({pos,inning:fieldInn,mode:"pos"}))}>
                    {player&&<circle cx={c.x} cy={c.y} r={r+2.8} fill={color} opacity="0.2" filter="url(#gl2)"/>}
                    <circle cx={c.x+0.4} cy={c.y+0.6} r={r} fill="rgba(0,0,0,0.4)"/>
                    <circle cx={c.x} cy={c.y} r={r} fill={player?color:"rgba(15,15,15,0.72)"} stroke={player?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.22)"} strokeWidth={player?"0.8":"0.5"}/>
                    <text x={c.x} y={c.y+1.3} textAnchor="middle" fontSize="2.9" fontWeight="bold" fill={player?"white":"rgba(255,255,255,0.3)"} fontFamily="Georgia,serif">{pos}</text>
                    {player&&<g><rect x={c.x-9.5} y={c.y+r+0.6} width="19" height="5.8" rx="1.8" fill="rgba(0,0,0,0.82)" stroke={color} strokeWidth="0.4"/><text x={c.x} y={c.y+r+4.8} textAnchor="middle" fontSize="2.7" fill="white" fontFamily="Georgia,serif" fontWeight="bold">{short}</text></g>}
                    {!player&&<text x={c.x} y={c.y+r+5.2} textAnchor="middle" fontSize="2" fill="rgba(255,255,255,0.28)" fontFamily="Georgia,serif">empty</text>}
                  </g>
                );
              })}
            </svg>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,padding:"10px 12px 0"}}>
            {Object.entries(FIELD_COORDS).map(([pos])=>{
              const player=lineup[fieldInn]?.[pos];
              return (
                <div key={pos} style={{display:"flex",alignItems:"center",gap:5,background:T.dark2,borderRadius:8,padding:"5px 7px",cursor:"pointer",border:`1px solid ${T.border}`}} onClick={()=>requireCoach(()=>setAssignModal({pos,inning:fieldInn,mode:"pos"}))}>
                  <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:16,borderRadius:4,fontSize:8,fontWeight:"bold",color:"#fff",background:POS_COLORS[pos],flexShrink:0}}>{pos}</span>
                  <span style={{fontSize:10,color:T.dimText,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{player||<span style={{color:T.dark4}}>—</span>}</span>
                </div>
              );
            })}
          </div>
          <SectionHeader label="Not Playing"/>
          <div style={P.benchRow}>
            {names.filter(p=>!Object.values(lineup[fieldInn]||{}).includes(p)).length===0
              ?<span style={{color:T.greenLight,fontSize:13}}>All players on field! ✅</span>
              :names.filter(p=>!Object.values(lineup[fieldInn]||{}).includes(p)).map(p=>(
                <div key={p} style={P.chip} onClick={()=>requireCoach(()=>setAssignModal({pos:"pick",player:p,inning:fieldInn,mode:"player"}))}><span style={P.chipDot}/>{p}</div>
              ))
            }
          </div>
        </div>
      )}

      {/* PRINT */}
      {gameTab==="print"&&(
        <div style={{paddingBottom:100}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{fontSize:12,color:T.dimText,flex:1,marginRight:12,lineHeight:1.5}}>Tap Print to save as PDF or send to a printer.</div>
            <button style={{background:`linear-gradient(135deg,${T.gold},#8a6a00)`,border:"none",borderRadius:20,color:"#fff",padding:"9px 18px",fontSize:12,fontWeight:"bold",cursor:"pointer",flexShrink:0}} onClick={()=>window.print()}>🖨 Print / PDF</button>
          </div>
          <div id="printable" style={{background:"#fff",margin:"12px",borderRadius:12,padding:"18px",fontFamily:"Georgia,serif"}}>
            <div style={{display:"flex",justifyContent:"space-between",borderBottom:"3px solid #c62828",paddingBottom:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:18,fontWeight:"bold",color:"#c62828",letterSpacing:1}}>IRON DISCIPLES</div>
                <div style={{fontSize:10,color:"#888",letterSpacing:1,marginTop:2}}>9U · Official Lineup Card</div>
              </div>
              <div style={{textAlign:"right",fontSize:10,color:"#333",lineHeight:1.8}}>
                <div><strong>vs.</strong> {g.opponent||"———"}</div>
                <div><strong>Date:</strong> {fmtFull(g.date)||"———"}</div>
                <div><strong>Time:</strong> {g.time||"—"} &nbsp;<strong>Location:</strong> {g.location||"———"}</div>
                {g.result&&<div><strong>Result:</strong> {g.result} {g.runsFor&&g.runsAgainst?`(${g.runsFor}–${g.runsAgainst})`:""}</div>}
              </div>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,marginBottom:14}}>
              <thead><tr>
                <th style={{background:"#c62828",color:"#fff",padding:"5px 8px",textAlign:"left",border:"1px solid #8a1010",minWidth:90}}>PLAYER</th>
                {Array.from({length:INNINGS},(_,i)=><th key={i} style={{background:"#c62828",color:"#fff",padding:"5px 6px",textAlign:"center",border:"1px solid #8a1010",minWidth:36}}>INN {i+1}</th>)}
                <th style={{background:"#c62828",color:"#fff",padding:"5px 8px",textAlign:"left",border:"1px solid #8a1010",minWidth:60}}>NOTES</th>
              </tr></thead>
              <tbody>
                {names.map((p,pi)=>(
                  <tr key={pi} style={{background:pi%2===0?"#fff":"#fdf8f0"}}>
                    <td style={{padding:"5px 8px",border:"1px solid #e0d5c0",fontWeight:"bold",color:"#1a1a1a",fontSize:11}}>{p}</td>
                    {Array.from({length:INNINGS},(_,ii)=>{
                      const pos=playerPos(ii,p);
                      return <td key={ii} style={{padding:"5px 6px",textAlign:"center",border:"1px solid #e0d5c0",background:pos?POS_COLORS[pos]+"33":"transparent",fontWeight:pos?"bold":"normal",color:"#333",fontSize:10}}>{pos||"—"}</td>;
                    })}
                    <td style={{padding:"5px 8px",border:"1px solid #e0d5c0"}}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#c62828",marginBottom:8,borderBottom:"1px solid #e0d5c0",paddingBottom:4}}>FIELD BY INNING</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
              {Array.from({length:INNINGS},(_,i)=>(
                <div key={i} style={{border:"1px solid #e0d5c0",borderRadius:6,overflow:"hidden"}}>
                  <div style={{background:"#c62828",color:"#fff",padding:"3px 8px",fontSize:9,fontWeight:"bold"}}>INNING {i+1}</div>
                  {POSITIONS.map(pos=>{
                    const pl=lineup[i]?.[pos]||null;
                    return (
                      <div key={pos} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 8px",borderBottom:"1px solid #f0e8e0"}}>
                        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:13,borderRadius:3,fontSize:7,fontWeight:"bold",color:"#fff",background:POS_COLORS[pos],flexShrink:0}}>{pos}</span>
                        <span style={{fontSize:8,color:"#1a1a1a"}}>{pl||<span style={{color:"#bbb"}}>—</span>}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{textAlign:"center",fontSize:8,color:"#bbb",paddingTop:8,borderTop:"1px solid #e0d5c0"}}>
              Iron Disciples 9U · Printed {new Date().toLocaleDateString()} · iron-disciples.vercel.app
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignModal&&(
        <div style={S.overlay} onClick={()=>setAssignModal(null)}>
          <div style={S.sheet} onClick={e=>e.stopPropagation()}>
            <div style={S.sheetTitle}>{assignModal.mode==="player"?`Assign ${assignModal.player}`:`${assignModal.pos} — ${POS_LABELS[assignModal.pos]||""}`}</div>
            {assignModal.mode==="player"?(
              <div style={{flex:1,overflowY:"auto"}}>
                {POSITIONS.map(pos=>{
                  const cur=(lineup[assignModal.inning]||{})[pos];
                  return (
                    <button key={pos} style={P.mItem} onClick={()=>updateLineup(assignModal.inning,pos,assignModal.player)}>
                      <span style={{...P.mBadge,background:POS_COLORS[pos]}}>{pos}</span>
                      <span style={{flex:1,fontSize:14,color:T.dimText}}>{POS_LABELS[pos]}</span>
                      {cur&&<span style={{fontSize:11,color:T.silverDim}}>{cur}</span>}
                    </button>
                  );
                })}
              </div>
            ):(
              <div style={{flex:1,overflowY:"auto"}}>
                {names.map(p=>{
                  const cp=playerPos(assignModal.inning,p);
                  return (
                    <button key={p} style={P.mItem} onClick={()=>updateLineup(assignModal.inning,assignModal.pos,p)}>
                      <span style={{flex:1,fontSize:14,color:T.white}}>{p}</span>
                      {cp&&<span style={{...P.mBadge,background:POS_COLORS[cp]}}>{cp}</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <button style={S.btnClose} onClick={()=>setAssignModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {editModal&&(
        <div style={S.overlay} onClick={()=>setEditModal(null)}>
          <GameForm form={editModal} onChange={setEditModal} showResult title="Edit Game" onSave={saveEdits} onDelete={()=>setDelConfirm(editModal.id)} onCancel={()=>setEditModal(null)}/>
        </div>
      )}

      {delConfirm&&(
        <div style={S.overlay} onClick={()=>setDelConfirm(null)}>
          <div style={S.sheet} onClick={e=>e.stopPropagation()}>
            <div style={S.sheetTitle}>Delete this game?</div>
            <div style={{padding:"12px 20px",color:T.dimText,fontSize:14}}>This cannot be undone.</div>
            <div style={{padding:"8px 20px"}}><button style={{...S.btnPrimary,background:`linear-gradient(135deg,${T.red},#8a1010)`}} onClick={deleteGame}>Yes, Delete</button></div>
            <button style={S.btnClose} onClick={()=>setDelConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── GAMES LIST ────────────────────────────────────────────────────
  const upcoming  = games.filter(g=>!g.result);
  const completed = [...games].filter(g=>g.result).reverse();

  return (
    <div style={P.root}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 16px 12px"}}>
        <div style={{fontSize:24,fontWeight:"bold",color:T.white,fontFamily:T.serif}}>Games</div>
        {isCoach&&<button style={P.newBtn} onClick={()=>{setNewForm({});setNewModal(true);}}>+ New Game</button>}
      </div>
      <div style={{height:2,background:`linear-gradient(90deg,${T.red},${T.gold},${T.red})`,opacity:0.5}}/>

      {games.length===0&&<EmptyState icon="⚾" title="No games yet" sub={isCoach?"Tap '+ New Game' to get started":"No games have been created yet"} action={isCoach?"Create First Game":null} onAction={()=>{setNewForm({});setNewModal(true);}}/>}

      {upcoming.length>0&&<><SectionHeader label="Upcoming"/>
        {upcoming.map(g=>(
          <div key={g.id} style={P.card} onClick={()=>{setOpenId(g.id);setGameTab("lineup");setInning(0);}}>
            <div style={{...P.result,background:rBg(null),color:"#444"}}>—</div>
            <div style={{flex:1}}><div style={P.opp}>{g.opponent||"TBD"}</div><div style={P.meta}>{fmtShort(g.date)}{g.time?` · ${g.time}`:""}{g.location?` · ${g.location}`:""}</div></div>
            <div style={P.arrow}>›</div>
          </div>
        ))}
      </>}

      {completed.length>0&&<><SectionHeader label="Completed"/>
        {completed.map(g=>(
          <div key={g.id} style={P.card} onClick={()=>{setOpenId(g.id);setGameTab("lineup");setInning(0);}}>
            <div style={{...P.result,background:rBg(g.result),color:rColor(g.result)}}>
              <div style={{fontSize:16,fontWeight:"bold",fontFamily:T.serif,lineHeight:1}}>{g.result}</div>
              {g.runsFor&&g.runsAgainst&&<div style={{fontSize:9,marginTop:1}}>{g.runsFor}–{g.runsAgainst}</div>}
            </div>
            <div style={{flex:1}}><div style={P.opp}>{g.opponent||"TBD"}</div><div style={P.meta}>{fmtShort(g.date)}{g.time?` · ${g.time}`:""}{g.location?` · ${g.location}`:""}</div></div>
            <div style={P.arrow}>›</div>
          </div>
        ))}
      </>}

      {newModal&&(
        <div style={S.overlay} onClick={()=>setNewModal(false)}>
          <GameForm form={newForm} onChange={setNewForm} showResult={false} title="New Game" onSave={handleCreate} onCancel={()=>setNewModal(false)}/>
        </div>
      )}
      <div style={{height:80}}/>
    </div>
  );
}

const P = {
  root:{background:T.black,minHeight:"100vh"},
  newBtn:{background:`linear-gradient(135deg,${T.red},#8a1010)`,border:"none",borderRadius:20,color:T.white,padding:"8px 18px",fontSize:12,fontWeight:"bold",cursor:"pointer",fontFamily:T.serif},
  card:{display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:`1px solid ${T.border}`,cursor:"pointer"},
  result:{width:46,height:46,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,marginRight:12},
  opp:{fontSize:15,fontWeight:"bold",color:T.white,fontFamily:T.serif},
  meta:{fontSize:11,color:T.silverDim,marginTop:2,fontFamily:T.sans},
  arrow:{fontSize:20,color:T.dark4},
  gHeader:{background:`linear-gradient(160deg,#1a1010,${T.black})`,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${T.border}`},
  back:{background:"none",border:"none",color:T.gold,fontSize:15,cursor:"pointer",fontFamily:T.serif,fontWeight:"bold",padding:"4px 0",flexShrink:0},
  gTitle:{fontSize:16,fontWeight:"bold",color:T.white,fontFamily:T.serif,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},
  gMeta:{fontSize:11,color:T.silverDim,marginTop:2,fontFamily:T.sans},
  badge:{borderRadius:8,padding:"5px 10px",fontSize:13,fontWeight:"bold",fontFamily:T.serif,flexShrink:0},
  subNav:{display:"flex",background:T.dark,borderBottom:`1px solid ${T.border}`},
  subBtn:{flex:1,padding:"11px 4px",background:"none",border:"none",color:T.silverDim,fontSize:11,cursor:"pointer",fontFamily:T.sans},
  subActive:{color:T.gold,borderBottom:`2px solid ${T.gold}`,background:`rgba(200,160,0,0.06)`},
  editBtn:{padding:"11px 12px",background:"none",border:"none",color:T.silverDim,fontSize:11,cursor:"pointer",borderLeft:`1px solid ${T.border}`},
  scoreBar:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px",background:T.dark,borderBottom:`1px solid ${T.border}`},
  sTeam:{fontSize:11,color:T.silverDim,fontFamily:T.serif},
  sNum:{fontSize:22,fontWeight:"bold",color:T.white,fontFamily:T.serif},
  innTabs:{display:"flex",overflowX:"auto",gap:8,padding:"12px 14px 8px",scrollbarWidth:"none"},
  innTab:{flexShrink:0,width:50,height:54,background:T.dark2,border:`1px solid ${T.dark3}`,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.silverDim,gap:1},
  innActive:{background:`linear-gradient(135deg,${T.red},#8a1010)`,border:`1px solid ${T.red}`,color:T.white,boxShadow:`0 4px 12px ${T.redGlow}`},
  copyBar:{display:"flex",alignItems:"center",gap:8,padding:"4px 14px 8px",overflowX:"auto",scrollbarWidth:"none"},
  copyLbl:{fontSize:11,color:T.silverDim,flexShrink:0},
  copyBtn:{flexShrink:0,padding:"4px 10px",background:T.dark2,border:`1px solid ${T.dark3}`,borderRadius:6,color:T.silver,fontSize:11,cursor:"pointer"},
  posGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,padding:"0 14px"},
  posCard:{background:T.dark2,borderRadius:12,padding:"11px",border:`1px solid ${T.dark3}`,cursor:"pointer",position:"relative",display:"flex",flexDirection:"column",gap:5,minHeight:64},
  posBadge:{display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:"bold",color:"#fff",alignSelf:"flex-start"},
  posName:{fontSize:13,fontWeight:"bold",color:T.white},
  posEmpty:{fontSize:11,color:T.dark4,fontStyle:"italic",fontWeight:"normal"},
  posX:{position:"absolute",top:7,right:7,background:T.redGlow,border:"none",borderRadius:5,color:T.redLight,width:20,height:20,fontSize:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
  benchRow:{padding:"0 14px 12px",display:"flex",flexWrap:"wrap",gap:8},
  chip:{display:"flex",alignItems:"center",gap:5,background:T.dark2,border:`1px solid ${T.dark3}`,borderRadius:20,padding:"5px 12px",fontSize:12,cursor:"pointer",color:T.dimText},
  chipDot:{width:6,height:6,borderRadius:"50%",background:T.dark4,flexShrink:0},
  th:{background:T.dark2,color:T.silverDim,padding:"5px 8px",fontSize:9,letterSpacing:1,textTransform:"uppercase",textAlign:"center",border:`1px solid ${T.dark3}`,fontWeight:"bold"},
  tdName:{padding:"5px 8px",color:T.dimText,fontSize:11,border:`1px solid ${T.dark3}`,whiteSpace:"nowrap",background:T.dark},
  td:{padding:"4px 6px",textAlign:"center",fontSize:10,fontWeight:"bold",border:`1px solid ${T.dark3}`,minWidth:30},
  mItem:{width:"100%",padding:"12px 20px",background:"none",border:"none",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left",borderBottom:`1px solid ${T.border}`,fontFamily:T.sans},
  mBadge:{borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:"bold",color:"#fff"},
};
