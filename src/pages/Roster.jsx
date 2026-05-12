import { useState } from "react";
import { T, POSITIONS, POS_COLORS, POS_LABELS } from "../theme";
import { useAuth } from "../AuthContext";
import { S, SectionHeader, EmptyState } from "../components/UI";

const DEFAULT_PLAYERS = Array.from({length:11},(_,i)=>({
  id:`player_${i+1}`, name:`Player ${i+1}`, number:i+1,
  position:"TBD", parentName:"", parentPhone:"", notes:""
}));

function PlayerForm({form,onChange,onSave,onDelete,onCancel,isCoach}) {
  return (
    <div style={S.sheet} onClick={e=>e.stopPropagation()}>
      <div style={S.sheetTitle}>{form.name||"Player"}</div>
      <div style={{overflowY:"auto",flex:1,padding:"12px 20px"}}>
        {isCoach?<>
          <div style={{display:"flex",gap:8}}>
            <div style={{...S.formField,flex:2}}><div style={S.label}>Player Name</div><input style={{...S.input,marginTop:6}} value={form.name||""} onChange={e=>onChange(v=>({...v,name:e.target.value}))}/></div>
            <div style={{...S.formField,flex:1}}><div style={S.label}># Number</div><input style={{...S.input,marginTop:6}} type="number" min="0" max="99" value={form.number||""} onChange={e=>onChange(v=>({...v,number:e.target.value}))}/></div>
          </div>
          <div style={S.formField}>
            <div style={S.label}>Primary Position</div>
            <div style={{...S.toggleRow,marginTop:6,flexWrap:"wrap"}}>
              {[...POSITIONS,"TBD"].map(pos=>(
                <button key={pos} style={{...S.toggle,...(form.position===pos?{background:pos==="TBD"?T.dark4:POS_COLORS[pos],color:"#fff",border:"1px solid transparent"}:{})}} onClick={()=>onChange(v=>({...v,position:pos}))}>{pos}</button>
              ))}
            </div>
          </div>
          <div style={P.divider}/>
          <div style={{...S.label,marginBottom:6,color:T.gold}}>👤 Parent Info (coach only)</div>
          <div style={S.formField}><div style={S.label}>Parent Name</div><input style={{...S.input,marginTop:6}} placeholder="Parent/Guardian name" value={form.parentName||""} onChange={e=>onChange(v=>({...v,parentName:e.target.value}))}/></div>
          <div style={S.formField}><div style={S.label}>Phone Number</div><input style={{...S.input,marginTop:6}} type="tel" placeholder="(555) 000-0000" value={form.parentPhone||""} onChange={e=>onChange(v=>({...v,parentPhone:e.target.value}))}/></div>
          <div style={S.formField}><div style={S.label}>Notes</div><textarea style={{...S.textarea,marginTop:6,height:64}} placeholder="Allergies, notes, etc." value={form.notes||""} onChange={e=>onChange(v=>({...v,notes:e.target.value}))}/></div>
        </>:<>
          <div style={P.viewRow}><span style={P.viewLabel}>Number</span><span style={P.viewVal}>#{form.number||"—"}</span></div>
          <div style={P.viewRow}><span style={P.viewLabel}>Position</span>
            <span style={{...P.viewVal,...(form.position&&form.position!=="TBD"?{background:POS_COLORS[form.position]+"33",color:T.white,padding:"2px 8px",borderRadius:6}:{})}}>
              {form.position&&form.position!=="TBD"?POS_LABELS[form.position]||form.position:"TBD"}
            </span>
          </div>
        </>}
      </div>
      {isCoach&&<div style={{padding:"8px 20px 0",display:"flex",gap:8}}>
        <button style={S.btnPrimary} onClick={onSave}>Save</button>
        {onDelete&&<button style={{...S.btnSecondary,color:T.redLight,border:`1px solid ${T.borderRed}`}} onClick={onDelete}>Remove</button>}
      </div>}
      <button style={S.btnClose} onClick={onCancel}>{isCoach?"Cancel":"Close"}</button>
    </div>
  );
}

export default function RosterPage({players:rawPlayers,games,fb,showToast,isCoach,onBack}) {
  const {requireCoach} = useAuth();
  const [editModal,setEditModal] = useState(null);
  const [editForm,setEditForm]   = useState(null);
  const [addModal,setAddModal]   = useState(false);
  const [addForm,setAddForm]     = useState({});
  const [delConfirm,setDelConfirm] = useState(null);

  const players = (rawPlayers||[]).length>0 ? rawPlayers : DEFAULT_PLAYERS;

  const openEdit = (p) => { setEditForm({...p}); setEditModal(p.id); };
  const saveEdit = () => requireCoach(()=>{
    const updated = players.map(p=>p.id===editForm.id?editForm:p);
    fb.setPlayers(updated);
    setEditModal(null);setEditForm(null);showToast("Player saved!");
  });
  const deletePlayer = () => requireCoach(()=>{
    fb.setPlayers(players.filter(p=>p.id!==delConfirm));
    setDelConfirm(null);setEditModal(null);setEditForm(null);showToast("Player removed");
  });
  const addPlayer = () => requireCoach(()=>{
    const newP={id:`player_${Date.now()}`,name:"",number:players.length+1,position:"TBD",parentName:"",parentPhone:"",notes:"",...addForm};
    if(!newP.name.trim()){showToast("Enter a player name");return;}
    fb.setPlayers([...players,newP]);
    setAddModal(false);setAddForm({});showToast(`${newP.name} added!`);
  });

  // Games played per player
  const gamesPlayed = (playerName) =>
    games.filter(g=>g.lineup&&g.lineup.some(inn=>Object.values(inn).includes(playerName))).length;

  // Positions played across season
  const positionsPlayed = (playerName) => {
    const posSet = new Set();
    games.forEach(g=>{
      if(!g.lineup) return;
      g.lineup.forEach(inn=>{
        Object.entries(inn).forEach(([pos,p])=>{ if(p===playerName&&POSITIONS.includes(pos)) posSet.add(pos); });
      });
    });
    return [...posSet];
  };

  return (
    <div style={P.root}>
      <div style={P.header}>
        <div style={P.title}>Roster</div>
        {isCoach&&<button style={P.addBtn} onClick={()=>{setAddForm({});setAddModal(true);}}>+ Add Player</button>}
      </div>
      <div style={{height:2,background:`linear-gradient(90deg,${T.red},${T.gold},${T.red})`,opacity:0.5}}/>

      <SectionHeader label={`${players.length} Players`}/>

      {players.length===0&&<EmptyState icon="👥" title="No players yet" sub={isCoach?"Tap '+ Add Player' to build your roster":""} action={isCoach?"Add First Player":null} onAction={()=>{setAddForm({});setAddModal(true);}}/>}

      <div style={{padding:"0 12px"}}>
        {players.map((p,i)=>{
          const gp = gamesPlayed(p.name);
          const positions = positionsPlayed(p.name);
          return (
            <div key={p.id||i} style={P.playerCard} onClick={()=>openEdit(p)}>
              {/* Number badge */}
              <div style={{...P.numBadge,background:p.position&&p.position!=="TBD"?POS_COLORS[p.position]:T.dark3}}>
                #{p.number||i+1}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={P.playerName}>{p.name}</div>
                <div style={P.playerSub}>
                  {p.position&&p.position!=="TBD"
                    ?<span style={{...P.posPill,background:POS_COLORS[p.position]+"33",color:POS_COLORS[p.position]}}>{POS_LABELS[p.position]||p.position}</span>
                    :<span style={{color:T.silverDim,fontSize:11}}>No position set</span>
                  }
                </div>
                {gp>0&&(
                  <div style={P.statsRow}>
                    <span style={P.statBadge}>{gp} games</span>
                    {positions.slice(0,3).map(pos=>(
                      <span key={pos} style={{...P.statBadge,background:POS_COLORS[pos]+"22",color:POS_COLORS[pos]}}>{pos}</span>
                    ))}
                  </div>
                )}
              </div>
              {isCoach&&p.parentPhone&&(
                <a href={`tel:${p.parentPhone}`} style={P.callBtn} onClick={e=>e.stopPropagation()}>📞</a>
              )}
              <div style={P.cardArrow}>›</div>
            </div>
          );
        })}
      </div>

      {/* Season games played grid */}
      {games.length>0&&<>
        <SectionHeader label="Season Participation"/>
        <div style={{padding:"0 12px 80px"}}>
          {players.map((p,i)=>{
            const gp=gamesPlayed(p.name);
            return (
              <div key={p.id||i} style={P.statLine}>
                <div style={P.statName}>{p.name.split(" ").slice(-1)[0]}</div>
                <div style={P.statDots}>
                  {games.slice(-8).map((g,gi)=>{
                    const played=g.lineup&&g.lineup.some(inn=>Object.values(inn).includes(p.name));
                    const pos=played&&g.lineup?g.lineup.reduce((found,inn)=>found||Object.entries(inn).find(([pos2,pl])=>pl===p.name&&POSITIONS.includes(pos2))?.[0],null):null;
                    return <div key={gi} style={{...P.statDot,background:pos?POS_COLORS[pos]:played?T.greenLight:T.dark3}} title={pos||"bench"}/>;
                  })}
                </div>
                <div style={P.statCount}>{gp}/{games.length}</div>
              </div>
            );
          })}
        </div>
      </>}

      {/* Edit player modal */}
      {editModal&&editForm&&(
        <div style={S.overlay} onClick={()=>{setEditModal(null);setEditForm(null);}}>
          <PlayerForm form={editForm} onChange={setEditForm} isCoach={isCoach}
            onSave={saveEdit}
            onDelete={isCoach?()=>setDelConfirm(editForm.id):null}
            onCancel={()=>{setEditModal(null);setEditForm(null);}}/>
        </div>
      )}

      {/* Add player modal */}
      {addModal&&(
        <div style={S.overlay} onClick={()=>setAddModal(false)}>
          <div style={S.sheet} onClick={e=>e.stopPropagation()}>
            <div style={S.sheetTitle}>Add Player</div>
            <div style={{padding:"12px 20px"}}>
              <div style={{display:"flex",gap:8}}>
                <div style={{...S.formField,flex:2}}><div style={S.label}>Player Name</div><input style={{...S.input,marginTop:6}} placeholder="Full name" value={addForm.name||""} onChange={e=>setAddForm(v=>({...v,name:e.target.value}))} autoFocus/></div>
                <div style={{...S.formField,flex:1}}><div style={S.label}># Number</div><input style={{...S.input,marginTop:6}} type="number" min="0" max="99" placeholder="0" value={addForm.number||""} onChange={e=>setAddForm(v=>({...v,number:e.target.value}))}/></div>
              </div>
              <div style={S.formField}>
                <div style={S.label}>Position</div>
                <div style={{...S.toggleRow,marginTop:6,flexWrap:"wrap"}}>
                  {[...POSITIONS,"TBD"].map(pos=>(
                    <button key={pos} style={{...S.toggle,...(addForm.position===pos?{background:pos==="TBD"?T.dark4:POS_COLORS[pos],color:"#fff",border:"1px solid transparent"}:{})}} onClick={()=>setAddForm(v=>({...v,position:pos}))}>{pos}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{padding:"0 20px"}}><button style={S.btnPrimary} onClick={addPlayer}>Add to Roster</button></div>
            <button style={S.btnClose} onClick={()=>setAddModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delConfirm&&(
        <div style={S.overlay} onClick={()=>setDelConfirm(null)}>
          <div style={S.sheet} onClick={e=>e.stopPropagation()}>
            <div style={S.sheetTitle}>Remove this player?</div>
            <div style={{padding:"12px 20px",color:T.dimText,fontSize:14}}>They will be removed from the roster. This cannot be undone.</div>
            <div style={{padding:"8px 20px"}}><button style={{...S.btnPrimary,background:`linear-gradient(135deg,${T.red},#8a1010)`}} onClick={deletePlayer}>Yes, Remove</button></div>
            <button style={S.btnClose} onClick={()=>setDelConfirm(null)}>Cancel</button>
          </div>
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
  playerCard:{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${T.border}`,cursor:"pointer"},
  numBadge:{width:44,height:44,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:"bold",color:T.white,flexShrink:0,fontFamily:T.serif},
  playerName:{fontSize:15,fontWeight:"bold",color:T.white,fontFamily:T.serif},
  playerSub:{marginTop:3},
  posPill:{fontSize:10,fontWeight:"bold",borderRadius:6,padding:"2px 8px",display:"inline-block"},
  statsRow:{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"},
  statBadge:{fontSize:9,color:T.silverDim,background:T.dark2,borderRadius:5,padding:"2px 6px"},
  callBtn:{fontSize:18,background:"none",border:"none",cursor:"pointer",flexShrink:0,textDecoration:"none"},
  cardArrow:{fontSize:18,color:T.dark4,flexShrink:0},
  divider:{height:1,background:`linear-gradient(90deg,transparent,${T.gold},transparent)`,margin:"16px 0",opacity:0.3},
  viewRow:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${T.border}`},
  viewLabel:{fontSize:12,color:T.silverDim},
  viewVal:{fontSize:14,color:T.white,fontWeight:"bold",fontFamily:T.serif},
  statLine:{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${T.border}`},
  statName:{width:70,fontSize:11,color:T.dimText,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  statDots:{display:"flex",gap:3,flex:1},
  statDot:{width:22,height:22,borderRadius:5},
  statCount:{fontSize:11,color:T.silverDim,flexShrink:0,width:32,textAlign:"right"},
};
