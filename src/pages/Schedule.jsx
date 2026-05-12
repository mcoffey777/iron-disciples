import { useState } from "react";
import { T } from "../theme";
import { useAuth } from "../AuthContext";
import { S, SectionHeader, EmptyState } from "../components/UI";

const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const MSHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const EVENT_TYPES=[
  {id:"game",      label:"⚾ Game",       color:T.red,    bg:T.redGlow},
  {id:"practice",  label:"🏃 Practice",   color:T.blueLight, bg:"rgba(21,101,192,0.2)"},
  {id:"tournament",label:"🏆 Tournament", color:T.goldLight,  bg:T.goldGlow},
  {id:"event",     label:"📌 Team Event", color:T.greenLight, bg:"rgba(46,125,50,0.2)"},
];

const typeColor = t => EVENT_TYPES.find(e=>e.id===t)?.color || T.silver;
const typeBg    = t => EVENT_TYPES.find(e=>e.id===t)?.bg    || T.border;
const typeLabel = t => EVENT_TYPES.find(e=>e.id===t)?.label || "Event";

const fmtShort = d=>{ if(!d) return ""; const [y,m,dd]=d.split("-"); return `${MSHORT[parseInt(m)-1]} ${parseInt(dd)}`; };
const fmtFull  = d=>{ if(!d) return ""; const [y,m,dd]=d.split("-"); return `${MSHORT[parseInt(m)-1]} ${parseInt(dd)}, ${y}`; };
const rColor = r=>r==="W"?"#4CAF50":r==="L"?"#ef5350":r==="T"?"#f0c400":"#555";
const rBg    = r=>r==="W"?"rgba(76,175,80,0.15)":r==="L"?"rgba(229,57,53,0.15)":r==="T"?"rgba(240,196,0,0.15)":"rgba(255,255,255,0.04)";

function newEvent(date="") {
  return { id:`evt_${Date.now()}`,date,time:"",title:"",location:"",eventType:"practice",notes:"" };
}

function EventForm({form,onChange,onSave,onDelete,onCancel,title}) {
  return (
    <div style={S.sheet} onClick={e=>e.stopPropagation()}>
      <div style={S.sheetTitle}>{title}</div>
      <div style={{overflowY:"auto",flex:1,padding:"12px 20px"}}>
        <div style={S.formField}>
          <div style={S.label}>Event Type</div>
          <div style={{...S.toggleRow,marginTop:6}}>
            {EVENT_TYPES.map(t=>(
              <button key={t.id} style={{...S.toggle,...(form.eventType===t.id?{background:t.color,color:"#fff",border:`1px solid ${t.color}`}:{})}} onClick={()=>onChange(v=>({...v,eventType:t.id}))}>{t.label}</button>
            ))}
          </div>
        </div>
        <div style={S.formField}>
          <div style={S.label}>{form.eventType==="game"?"Opponent":"Title"}</div>
          <input style={{...S.input,marginTop:6}} placeholder={form.eventType==="game"?"Team name":"Practice, Team dinner, etc."} value={form.title||""} onChange={e=>onChange(v=>({...v,title:e.target.value}))}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <div style={{...S.formField,flex:2}}><div style={S.label}>Date</div><input style={{...S.input,marginTop:6}} type="date" value={form.date||""} onChange={e=>onChange(v=>({...v,date:e.target.value}))}/></div>
          <div style={{...S.formField,flex:1}}><div style={S.label}>Time</div><input style={{...S.input,marginTop:6}} type="time" value={form.time||""} onChange={e=>onChange(v=>({...v,time:e.target.value}))}/></div>
        </div>
        <div style={S.formField}>
          <div style={S.label}>Location</div>
          <input style={{...S.input,marginTop:6}} placeholder="Field name, address..." value={form.location||""} onChange={e=>onChange(v=>({...v,location:e.target.value}))}/>
        </div>
        <div style={S.formField}><div style={S.label}>Notes</div><textarea style={{...S.textarea,marginTop:6,height:64}} placeholder="Additional info..." value={form.notes||""} onChange={e=>onChange(v=>({...v,notes:e.target.value}))}/></div>
      </div>
      <div style={{padding:"8px 20px 0",display:"flex",gap:8}}>
        <button style={S.btnPrimary} onClick={onSave}>{title.includes("New")?"Add to Schedule":"Save Changes"}</button>
        {onDelete&&<button style={{...S.btnSecondary,color:T.redLight,border:`1px solid ${T.borderRed}`}} onClick={onDelete}>Delete</button>}
      </div>
      <button style={S.btnClose} onClick={onCancel}>Cancel</button>
    </div>
  );
}

export default function SchedulePage({games,events,fb,showToast,isCoach,onBack}) {
  const {requireCoach} = useAuth();
  const [subTab,setSubTab] = useState("calendar");
  const [calMonth,setCalMonth] = useState(()=>{const n=new Date();return{year:n.getFullYear(),month:n.getMonth()};});
  const [eventModal,setEventModal] = useState(null);
  const [eventForm,setEventForm]   = useState(null);

  const {year,month} = calMonth;
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);

  const dStr = d=>`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const today=new Date();
  const isToday=d=>d&&today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===d;
  const gamesOnDay  = d=>games.filter(g=>g.date===dStr(d));
  const eventsOnDay = d=>events.filter(e=>e.date===dStr(d));
  const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;
  const monthItems=[...games.filter(g=>g.date?.startsWith(monthStr)),...events.filter(e=>e.date?.startsWith(monthStr))].sort((a,b)=>(a.date||"").localeCompare(b.date||""));

  const openAdd=(date)=>requireCoach(()=>{const e=newEvent(date);setEventForm(e);setEventModal("add");});
  const openEdit=(e)=>{setEventForm({...e});setEventModal("edit");};
  const saveEvent=()=>requireCoach(()=>{fb.setEvent(eventForm);setEventModal(null);setEventForm(null);showToast("Event saved!");});
  const deleteEvent=()=>requireCoach(()=>{fb.deleteEvent(eventForm.id);setEventModal(null);setEventForm(null);showToast("Removed");});

  // Completed games for record tab
  const completed = games.filter(g=>g.result);
  const totalW=completed.filter(g=>g.result==="W").length;
  const totalL=completed.filter(g=>g.result==="L").length;
  const totalT=completed.filter(g=>g.result==="T").length;

  // Opponent records
  const oppRec={};
  completed.forEach(g=>{
    if(!g.opponent) return;
    if(!oppRec[g.opponent]) oppRec[g.opponent]={W:0,L:0,T:0,games:[]};
    oppRec[g.opponent][g.result]++;
    oppRec[g.opponent].games.push(g);
  });

  return (
    <div style={P.root}>
      <div style={P.header}>
        <div style={P.title}>Schedule</div>
        {isCoach&&subTab!=="record"&&<button style={P.addBtn} onClick={()=>openAdd("")}>+ Add</button>}
      </div>
      <div style={{height:2,background:`linear-gradient(90deg,${T.red},${T.gold},${T.red})`,opacity:0.5}}/>

      {/* Sub-tabs */}
      <div style={P.subNav}>
        {[["calendar","📅 Calendar"],["list","📋 List"],["record","🏆 Record"]].map(([id,lbl])=>(
          <button key={id} style={{...P.subBtn,...(subTab===id?P.subActive:{})}} onClick={()=>setSubTab(id)}>{lbl}</button>
        ))}
      </div>

      {/* CALENDAR */}
      {subTab==="calendar"&&(
        <div>
          {/* Month nav */}
          <div style={P.monthNav}>
            <button style={P.arrow} onClick={()=>setCalMonth(p=>{const d=new Date(p.year,p.month-1);return{year:d.getFullYear(),month:d.getMonth()};})}>‹</button>
            <div style={P.monthLabel}>{MONTHS[month]} {year}</div>
            <button style={P.arrow} onClick={()=>setCalMonth(p=>{const d=new Date(p.year,p.month+1);return{year:d.getFullYear(),month:d.getMonth()};})}>›</button>
          </div>

          {/* W-L strip */}
          <div style={P.recStrip}>
            <span style={{...P.recNum,color:T.greenLight}}>{totalW}</span><span style={P.recLbl}>W</span>
            <span style={P.recDash}>—</span>
            <span style={{...P.recNum,color:T.redLight}}>{totalL}</span><span style={P.recLbl}>L</span>
            {totalT>0&&<><span style={P.recDash}>—</span><span style={{...P.recNum,color:T.goldLight}}>{totalT}</span><span style={P.recLbl}>T</span></>}
          </div>

          {/* Day headers */}
          <div style={P.dayHdrs}>{DAYS.map(d=><div key={d} style={P.dayHdr}>{d}</div>)}</div>

          {/* Calendar grid */}
          <div style={P.calGrid}>
            {cells.map((d,i)=>{
              const dg=d?gamesOnDay(d):[]; const ev=d?eventsOnDay(d):[];
              return (
                <div key={i} style={{...P.cell,...(d?P.cellActive:{}),...(isToday(d)?P.cellToday:{})}} onClick={()=>{if(!d)return;openAdd(dStr(d));}}>
                  {d&&<>
                    <div style={{...P.cellNum,...(isToday(d)?P.cellNumToday:{})}}>{d}</div>
                    <div style={P.dots}>
                      {dg.map((g,gi)=><div key={gi} style={{...P.dot,background:g.result?rColor(g.result):"#555"}} onClick={e=>{e.stopPropagation();openEdit(g);}}/>)}
                      {ev.map((e,ei)=><div key={ei} style={{...P.dot,background:typeColor(e.eventType)}} onClick={ex=>{ex.stopPropagation();openEdit(e);}}/>)}
                    </div>
                  </>}
                </div>
              );
            })}
          </div>

          {/* Month items */}
          <div style={{padding:"8px 12px 80px"}}>
            {monthItems.length===0&&<div style={{textAlign:"center",color:T.silverDim,fontSize:13,padding:"20px",fontStyle:"italic"}}>No events this month</div>}
            {monthItems.map((item,idx)=>{
              const isGame=games.some(g=>g.id===item.id);
              const type=isGame?"game":item.eventType;
              return (
                <div key={idx} style={P.listRow} onClick={()=>openEdit(item)}>
                  <div style={P.listDate}>{fmtShort(item.date)}{item.time?`\n${item.time}`:""}</div>
                  <div style={P.listMain}>
                    <div style={P.listTitle}>{item.opponent||item.title||"Practice"}</div>
                    {item.location&&<div style={P.listMeta}>{item.location}</div>}
                  </div>
                  <div style={{...P.typePill,background:typeBg(type),color:typeColor(type),border:`1px solid ${typeColor(type)}40`}}>
                    {isGame&&item.result?<><span style={{fontWeight:"bold"}}>{item.result}</span>{item.runsFor&&item.runsAgainst?` ${item.runsFor}-${item.runsAgainst}`:""}</>:typeLabel(type)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST */}
      {subTab==="list"&&(
        <div style={{paddingBottom:80}}>
          {[...games,...events].length===0&&<EmptyState icon="📅" title="Nothing scheduled" sub={isCoach?"Tap '+ Add' to add games and practices":""} action={isCoach?"Add First Event":null} onAction={()=>openAdd("")}/>}
          {[["Upcoming",i=>!i.result],["Completed",i=>!!i.result]].map(([section,filter])=>{
            const items=[...games,...events].filter(i=>filter(i)).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
            if(!items.length) return null;
            return (
              <div key={section}>
                <SectionHeader label={section}/>
                {items.map(item=>{
                  const isGame=games.some(g=>g.id===item.id);
                  const type=isGame?"game":item.eventType;
                  return (
                    <div key={item.id} style={P.listRow2} onClick={()=>openEdit(item)}>
                      <div style={{...P.listIcon,background:typeBg(type),color:typeColor(type)}}>{isGame?"⚾":type==="practice"?"🏃":type==="tournament"?"🏆":"📌"}</div>
                      <div style={{flex:1}}>
                        <div style={P.listTitle}>{item.opponent||item.title||"Practice"}</div>
                        <div style={P.listMeta}>{fmtFull(item.date)}{item.time?` · ${item.time}`:""}{item.location?` · ${item.location}`:""}</div>
                      </div>
                      {isGame&&item.result&&(
                        <div style={{...P.resultBadge,background:rBg(item.result),color:rColor(item.result)}}>
                          <div style={{fontSize:14,fontWeight:"bold"}}>{item.result}</div>
                          {item.runsFor&&item.runsAgainst&&<div style={{fontSize:9}}>{item.runsFor}–{item.runsAgainst}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* RECORD */}
      {subTab==="record"&&(
        <div style={{padding:"12px",paddingBottom:80}}>
          {/* Overall */}
          <div style={P.overallCard}>
            <div style={P.overallTitle}>SEASON RECORD</div>
            <div style={P.overallRow}>
              <div style={P.overallBox}><div style={{...P.overallNum,color:T.greenLight}}>{totalW}</div><div style={P.overallLbl}>WINS</div></div>
              <div style={P.overallDash}>—</div>
              <div style={P.overallBox}><div style={{...P.overallNum,color:T.redLight}}>{totalL}</div><div style={P.overallLbl}>LOSSES</div></div>
              {totalT>0&&<><div style={P.overallDash}>—</div><div style={P.overallBox}><div style={{...P.overallNum,color:T.goldLight}}>{totalT}</div><div style={P.overallLbl}>TIES</div></div></>}
            </div>
            {(totalW+totalL+totalT)>0&&<div style={P.winPct}>Win %: {Math.round(totalW/(totalW+totalL+totalT)*100)}%</div>}
            {(totalW+totalL)>0&&<div style={P.barOuter}><div style={{...P.barInner,width:`${Math.round(totalW/(totalW+totalL)*100)}%`}}/></div>}
          </div>

          {/* Vs opponents */}
          {Object.keys(oppRec).length>0&&<>
            <SectionHeader label="Vs. Opponents"/>
            {Object.entries(oppRec).sort((a,b)=>(b[1].W-b[1].L)-(a[1].W-a[1].L)).map(([opp,r])=>(
              <div key={opp} style={P.oppCard}>
                <div style={P.oppName}>{opp}</div>
                <div style={P.oppRec}>
                  <span style={{...P.oppNum,color:T.greenLight}}>{r.W}W</span>
                  <span style={P.oppDot}>·</span>
                  <span style={{...P.oppNum,color:T.redLight}}>{r.L}L</span>
                  {r.T>0&&<><span style={P.oppDot}>·</span><span style={{...P.oppNum,color:T.goldLight}}>{r.T}T</span></>}
                </div>
                <div style={P.oppDots}>{r.games.map((g,i)=><div key={i} style={{...P.oppDotItem,background:rColor(g.result)}}/>)}</div>
                <div style={{...P.oppPct,color:(r.W/(r.W+r.L+r.T))>=0.5?T.greenLight:T.redLight}}>{Math.round(r.W/(r.W+r.L+r.T)*100)}%</div>
              </div>
            ))}
          </>}

          {/* Run totals */}
          {completed.filter(g=>g.runsFor&&g.runsAgainst).length>0&&(()=>{
            const played=completed.filter(g=>g.runsFor&&g.runsAgainst);
            const rf=played.reduce((s,g)=>s+parseInt(g.runsFor||0),0);
            const ra=played.reduce((s,g)=>s+parseInt(g.runsAgainst||0),0);
            return <>
              <SectionHeader label="Run Totals"/>
              <div style={P.runRow}>
                {[["Runs Scored",rf,T.greenLight],["Runs Allowed",ra,T.redLight],["Differential",rf>=ra?`+${rf-ra}`:rf-ra,rf>=ra?T.greenLight:T.redLight]].map(([lbl,val,clr])=>(
                  <div key={lbl} style={P.runBox}><div style={{...P.runNum,color:clr}}>{val}</div><div style={P.runLbl}>{lbl}</div></div>
                ))}
              </div>
            </>;
          })()}

          {completed.length===0&&<EmptyState icon="🏆" title="No completed games" sub="Results will appear here once games are finished"/>}
        </div>
      )}

      {/* Event modal */}
      {eventModal&&eventForm&&(
        <div style={S.overlay} onClick={()=>{setEventModal(null);setEventForm(null);}}>
          <EventForm form={eventForm} onChange={setEventForm}
            onSave={saveEvent}
            onDelete={eventModal==="edit"?deleteEvent:null}
            onCancel={()=>{setEventModal(null);setEventForm(null);}}
            title={eventModal==="add"?"New Event":"Edit Event"}/>
        </div>
      )}
    </div>
  );
}

const P={
  root:{background:T.black,minHeight:"100vh"},
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 16px 12px"},
  title:{fontSize:24,fontWeight:"bold",color:T.white,fontFamily:T.serif},
  addBtn:{background:`linear-gradient(135deg,${T.red},#8a1010)`,border:"none",borderRadius:20,color:T.white,padding:"8px 18px",fontSize:12,fontWeight:"bold",cursor:"pointer",fontFamily:T.serif},
  subNav:{display:"flex",background:T.dark,borderBottom:`1px solid ${T.border}`},
  subBtn:{flex:1,padding:"11px 4px",background:"none",border:"none",color:T.silverDim,fontSize:11,cursor:"pointer",fontFamily:T.sans},
  subActive:{color:T.gold,borderBottom:`2px solid ${T.gold}`,background:`rgba(200,160,0,0.06)`},
  monthNav:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 8px"},
  arrow:{background:"none",border:"none",color:T.silver,fontSize:28,cursor:"pointer",padding:"0 8px",lineHeight:1},
  monthLabel:{fontSize:18,fontWeight:"bold",color:T.white,fontFamily:T.serif},
  recStrip:{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"0 0 10px"},
  recNum:{fontSize:20,fontWeight:"bold",fontFamily:T.serif},
  recLbl:{fontSize:11,color:T.silverDim},
  recDash:{fontSize:14,color:T.dark4},
  dayHdrs:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 8px",borderBottom:`1px solid ${T.border}`},
  dayHdr:{textAlign:"center",fontSize:10,color:T.silverDim,padding:"4px 0"},
  calGrid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"4px 8px",gap:2},
  cell:{minHeight:46,borderRadius:8,padding:"4px 3px"},
  cellActive:{cursor:"pointer",background:T.dark2},
  cellToday:{background:"#1a0808",border:`1px solid ${T.red}`},
  cellNum:{fontSize:12,color:T.silverDim,textAlign:"center",lineHeight:1.4},
  cellNumToday:{color:T.redLight,fontWeight:"bold"},
  dots:{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center",marginTop:3},
  dot:{width:7,height:7,borderRadius:"50%",cursor:"pointer"},
  listRow:{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${T.border}`,cursor:"pointer"},
  listDate:{fontSize:10,color:T.silverDim,width:52,flexShrink:0,whiteSpace:"pre",lineHeight:1.4},
  listMain:{flex:1},
  listTitle:{fontSize:13,color:T.white,fontFamily:T.serif,fontWeight:"bold"},
  listMeta:{fontSize:10,color:T.silverDim,marginTop:2},
  typePill:{fontSize:10,fontWeight:"bold",borderRadius:8,padding:"3px 9px",flexShrink:0,fontFamily:T.sans},
  listRow2:{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderBottom:`1px solid ${T.border}`,cursor:"pointer"},
  listIcon:{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0},
  resultBadge:{width:40,height:40,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0},
  overallCard:{background:T.dark2,border:`1px solid ${T.border}`,borderRadius:14,padding:"20px 16px 16px",marginBottom:12,textAlign:"center"},
  overallTitle:{fontSize:10,letterSpacing:3,color:T.silverDim,marginBottom:12},
  overallRow:{display:"flex",alignItems:"center",justifyContent:"center",gap:16},
  overallBox:{textAlign:"center"},
  overallNum:{fontSize:52,fontWeight:"bold",fontFamily:T.serif,lineHeight:1},
  overallLbl:{fontSize:10,color:T.silverDim,letterSpacing:2,marginTop:4},
  overallDash:{fontSize:28,color:T.dark3,fontFamily:T.serif},
  winPct:{fontSize:13,color:T.silverDim,marginTop:10},
  barOuter:{height:8,background:T.dark3,borderRadius:4,marginTop:10,overflow:"hidden"},
  barInner:{height:"100%",background:`linear-gradient(90deg,${T.green},${T.greenLight})`,borderRadius:4},
  oppCard:{background:T.dark2,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10},
  oppName:{flex:1,fontSize:14,fontWeight:"bold",color:T.white,fontFamily:T.serif},
  oppRec:{display:"flex",alignItems:"center",gap:4},
  oppNum:{fontSize:13,fontWeight:"bold",fontFamily:T.serif},
  oppDot:{color:T.dark3,fontSize:10},
  oppDots:{display:"flex",gap:3},
  oppDotItem:{width:7,height:7,borderRadius:"50%"},
  oppPct:{fontSize:12,fontWeight:"bold",fontFamily:T.serif,width:34,textAlign:"right"},
  runRow:{display:"flex",gap:8,marginBottom:20},
  runBox:{flex:1,background:T.dark2,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 8px",textAlign:"center"},
  runNum:{fontSize:26,fontWeight:"bold",fontFamily:T.serif,lineHeight:1},
  runLbl:{fontSize:9,color:T.silverDim,letterSpacing:1,marginTop:4,textTransform:"uppercase"},
};
