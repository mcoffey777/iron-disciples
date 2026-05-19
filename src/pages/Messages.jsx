import { useState, useEffect, useRef } from "react";
import { T } from "../theme";
import { useAuth } from "../AuthContext";
import { S } from "../components/UI";

const REACTIONS = ["👍","❤️","🔥","⚾","🙏"];

function fmtTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString([], { weekday:"short", month:"short", day:"numeric" });
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// ── Poll ──────────────────────────────────────────────────────────────
function Poll({ msg, identity, isCoach, onVote, onClose }) {
  const poll       = msg.poll;
  const myVote     = poll.votes?.[identity?.name];
  const totalVotes = Object.values(poll.votes || {}).length;
  const voteCounts = (poll.options || []).map(opt =>
    Object.values(poll.votes || {}).filter(v => v === opt).length
  );
  return (
    <div style={M.pollBox}>
      <div style={M.pollQ}>{poll.question}</div>
      <div style={M.pollSub}>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</div>
      {(poll.options || []).map((opt, i) => {
        const count = voteCounts[i];
        const pct   = totalVotes > 0 ? Math.round(count / totalVotes * 100) : 0;
        const voted = myVote === opt;
        return (
          <div key={i} style={M.pollOpt} onClick={() => !poll.closed && onVote && onVote(opt)}>
            <div style={{ ...M.pollBar, width:`${pct}%`, background: voted ? T.gold+"66" : T.dark3 }}/>
            <div style={M.pollOptRow}>
              <span style={{ ...M.pollOptLbl, color: voted ? T.goldLight : T.white }}>{voted?"✓ ":""}{opt}</span>
              <span style={M.pollPct}>{pct}%</span>
            </div>
          </div>
        );
      })}
      {poll.closed && <div style={M.pollClosed}>Poll closed</div>}
      {isCoach && !poll.closed && (
        <button style={M.pollCloseBtn} onClick={onClose}>Close Poll</button>
      )}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────
function Bubble({ msg, identity, isCoach, onReact, onPin, onDelete, onVote, onClosePoll }) {
  const [open, setOpen] = useState(false);
  const isMine     = identity && msg.sender === identity.name;
  const isCoachMsg = msg.senderRole === "coach";
  const counts     = {};
  Object.values(msg.reactions || {}).forEach(r => { counts[r] = (counts[r]||0)+1; });
  const myReact = identity ? (msg.reactions||{})[identity.name] : null;

  return (
    <div style={{ ...M.row, justifyContent: isMine ? "flex-end" : "flex-start" }}
      onClick={() => setOpen(v=>!v)}>

      {!isMine && (
        <div style={{ ...M.avatar, background: isCoachMsg ? T.red : T.dark3 }}>
          {(msg.sender||"?")[0].toUpperCase()}
        </div>
      )}

      <div style={{ maxWidth:"74%" }}>
        {!isMine && (
          <div style={M.senderName}>
            {msg.sender||"Unknown"}
            {isCoachMsg && <span style={M.coachTag}> · Coach</span>}
            {msg.pinned  && <span style={M.pinTag}> 📌</span>}
          </div>
        )}

        <div style={{
          ...M.bubble,
          background: isMine
            ? `linear-gradient(135deg,${T.red},#8a1010)`
            : isCoachMsg
              ? `linear-gradient(135deg,#1a1200,#110e00)`
              : T.dark2,
          border: isMine ? "none"
            : isCoachMsg ? `1px solid ${T.borderGold}`
            : `1px solid ${T.border}`,
        }}>
          {msg.type === "poll" ? (
            <Poll msg={msg} identity={identity} isCoach={isCoach}
              onVote={opt => onVote(msg.id, opt)}
              onClose={() => onClosePoll(msg.id)}/>
          ) : (
            <div style={M.msgText}>{msg.text}</div>
          )}
          <div style={M.msgTime}>{fmtTime(msg.ts)}</div>
        </div>

        {Object.keys(counts).length > 0 && (
          <div style={M.reactRow}>
            {Object.entries(counts).map(([emoji, count]) => (
              <div key={emoji}
                style={{ ...M.reactChip, background: myReact===emoji?T.goldGlow:T.dark3, border:`1px solid ${myReact===emoji?T.gold:T.border}` }}
                onClick={e => { e.stopPropagation(); onReact(msg.id, emoji); }}>
                {emoji} {count}
              </div>
            ))}
          </div>
        )}

        {open && (
          <div style={M.actionBar}>
            {REACTIONS.map(e => (
              <button key={e} style={{ ...M.actionEmoji, background: myReact===e?T.goldGlow:"none" }}
                onClick={ex => { ex.stopPropagation(); onReact(msg.id,e); setOpen(false); }}>{e}</button>
            ))}
            {isCoach && <>
              <button style={M.actionBtn}
                onClick={ex => { ex.stopPropagation(); onPin(msg.id,!msg.pinned); setOpen(false); }}>
                {msg.pinned?"Unpin":"📌 Pin"}
              </button>
              <button style={{ ...M.actionBtn, color:T.redLight }}
                onClick={ex => { ex.stopPropagation(); onDelete(msg.id); setOpen(false); }}>
                Delete
              </button>
            </>}
          </div>
        )}
      </div>

      {isMine && (
        <div style={{ ...M.avatar, background: isCoach ? T.red : T.dark3 }}>
          {(msg.sender||"?")[0].toUpperCase()}
        </div>
      )}
    </div>
  );
}

// ── Poll creator ──────────────────────────────────────────────────────
function PollCreator({ onSend, onCancel }) {
  const [q,      setQ]      = useState("");
  const [opts,   setOpts]   = useState(["Yes","No","Maybe"]);
  const [newOpt, setNewOpt] = useState("");

  const addOpt = () => {
    if (!newOpt.trim()) return;
    setOpts(v => [...v, newOpt.trim()]);
    setNewOpt("");
  };

  return (
    <div style={S.sheet} onClick={e => e.stopPropagation()}>
      <div style={S.sheetTitle}>📊 Create Poll</div>
      <div style={{ overflowY:"auto", flex:1, padding:"12px 20px" }}>
        <div style={S.formField}>
          <div style={S.label}>Question</div>
          <input style={{ ...S.input, marginTop:6 }} placeholder="e.g. Can you make Saturday's game?"
            value={q} onChange={e => setQ(e.target.value)} autoFocus/>
        </div>
        <div style={S.formField}>
          <div style={S.label}>Options</div>
          {opts.map((o,i) => (
            <div key={i} style={{ display:"flex", gap:8, marginTop:6, alignItems:"center" }}>
              <div style={{ ...S.input, flex:1, color:T.white, fontSize:14 }}>{o}</div>
              <button style={{ background:"none", border:"none", color:T.redLight, fontSize:16, cursor:"pointer" }}
                onClick={() => setOpts(v => v.filter((_,j)=>j!==i))}>✕</button>
            </div>
          ))}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <input style={{ ...S.input, flex:1 }} placeholder="Add option..."
              value={newOpt} onChange={e => setNewOpt(e.target.value)}
              onKeyDown={e => e.key==="Enter" && addOpt()}/>
            <button style={{ ...S.btnGold, width:"auto", padding:"0 16px", borderRadius:10, fontSize:13 }}
              onClick={addOpt}>+ Add</button>
          </div>
        </div>
      </div>
      <div style={{ padding:"8px 20px 0", display:"flex", gap:8 }}>
        <button style={{ ...S.btnPrimary, opacity: q.trim()&&opts.length>=2?1:0.5 }}
          onClick={() => q.trim()&&opts.length>=2&&onSend({question:q,options:opts})}>
          Send Poll
        </button>
      </div>
      <button style={S.btnClose} onClick={onCancel}>Cancel</button>
    </div>
  );
}

// ── Chat view (shared between group and DM) ───────────────────────────
function ChatView({ msgs, fb, identity, isCoach, showToast, dmKey, onBack, backLabel, chatTitle, chatSub, canPost }) {
  const [text,        setText]       = useState("");
  const [showPoll,    setShowPoll]    = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [msgs?.length]);

  const send = () => {
    if (!text.trim() || !identity) return;
    if (dmKey) {
      fb.sendDm(dmKey, {
        text: text.trim(), type:"text",
        sender: identity.name, senderRole: isCoach?"coach":"parent",
        playerName: identity.playerName||"", reactions:{},
      });
    } else {
      fb.sendMessage({
        text: text.trim(), type:"text",
        sender: identity.name, senderRole: isCoach?"coach":"parent",
        playerName: identity.playerName||"", pinned:false, reactions:{},
      });
    }
    setText("");
  };

  const sendPoll = (pollData) => {
    fb.sendMessage({
      type:"poll", text:"",
      poll:{ ...pollData, votes:{}, closed:false },
      sender:identity.name, senderRole:isCoach?"coach":"parent",
      pinned:false, reactions:{},
    }, "id_messages");
    setShowPoll(false);
    showToast("Poll sent! 📊");
  };

  const handleReact = (msgId, emoji) => {
    if (!identity) return;
    const msg = msgs.find(m=>m.id===msgId);
    if (!msg) return;
    const reactions = {...(msg.reactions||{})};
    if (reactions[identity.name]===emoji) delete reactions[identity.name];
    else reactions[identity.name]=emoji;
    if (dmKey) fb.updateDm(dmKey, msgId, {reactions});
    else fb.updateMessage(msgId, {reactions});
  };

  const handlePin = (msgId, pinned) => {
    fb.updateMessage(msgId, {pinned});
    showToast(pinned?"Pinned 📌":"Unpinned");
  };

  const handleDelete = (msgId) => {
    if (dmKey) fb.deleteDm(dmKey, msgId);
    else fb.deleteMessage(msgId);
    showToast("Deleted");
  };

  const handleVote = (msgId, option) => {
    if (!identity) return;
    const msg = msgs.find(m=>m.id===msgId);
    if (!msg||msg.poll?.closed) return;
    const votes = {...(msg.poll?.votes||{})};
    votes[identity.name]=option;
    fb.updateMessage(msgId, {"poll/votes":votes});
  };

  const handleClosePoll = (msgId) => {
    fb.updateMessage(msgId, {"poll/closed":true});
    showToast("Poll closed");
  };

  const pinned = !dmKey ? msgs.filter(m=>m.pinned) : [];

  return (
    <div style={M.chatRoot}>
      {/* Chat header */}
      <div style={M.chatHeader}>
        <button style={M.backBtn} onClick={onBack}>‹ {backLabel}</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={M.chatTitle}>{chatTitle}</div>
          {chatSub && <div style={M.chatSub}>{chatSub}</div>}
        </div>
      </div>
      <div style={{ height:2, background:`linear-gradient(90deg,${T.red},${T.gold},${T.red})`, opacity:0.5 }}/>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div style={M.pinnedBanner}>
          <span style={M.pinnedLabel}>📌</span>
          <span style={M.pinnedText}>{pinned[pinned.length-1].text?.slice(0,60)}{pinned.length>1?` (+${pinned.length-1} more)`:""}</span>
        </div>
      )}

      {/* Messages */}
      <div style={M.msgList}>
        {msgs.length === 0 && (
          <div style={M.empty}>
            <div style={{ fontSize:36, marginBottom:10 }}>{dmKey?"💬":"🏟"}</div>
            <div style={{ fontSize:15, color:T.silver, fontFamily:T.serif }}>No messages yet</div>
            <div style={{ fontSize:12, color:T.silverDim, marginTop:6 }}>Say something!</div>
          </div>
        )}
        {msgs.map((msg, i) => {
          const prev     = msgs[i-1];
          const showDate = !prev || new Date(msg.ts).toDateString() !== new Date(prev.ts).toDateString();
          return (
            <div key={msg.id||i}>
              {showDate && <div style={M.dateLine}>{fmtDate(msg.ts)}</div>}
              <Bubble msg={msg} identity={identity} isCoach={isCoach}
                onReact={handleReact} onPin={handlePin} onDelete={handleDelete}
                onVote={handleVote} onClosePoll={handleClosePoll}/>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Options bar */}
      {showOptions && isCoach && !dmKey && (
        <div style={M.optBar}>
          <button style={M.optItem} onClick={()=>{setShowPoll(true);setShowOptions(false);}}>📊 Create Poll</button>
          <button style={M.optItem} onClick={()=>{
            fb.sendMessage({
              type:"text", text:"📢 ",
              sender:identity.name, senderRole:"coach",
              playerName:"", pinned:true, reactions:{},
            }, "id_messages");
            setShowOptions(false);
            showToast("Announcement sent!");
          }}>📌 Announcement</button>
        </div>
      )}

      {/* Input */}
      {canPost ? (
        <div style={M.inputBar}>
          {isCoach && !dmKey && (
            <button style={{ ...M.optBtn, background:showOptions?T.gold:T.dark2, color:showOptions?T.black:T.gold }}
              onClick={()=>setShowOptions(v=>!v)}>⊕</button>
          )}
          <input style={M.textInput}
            placeholder={identity ? `Message as ${identity.name}...` : "Join to send messages..."}
            value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}/>
          <button style={{ ...M.sendBtn, opacity:text.trim()?1:0.4 }} onClick={send}>➤</button>
        </div>
      ) : (
        <div style={M.inputBar}>
          <div style={{ flex:1, textAlign:"center", fontSize:12, color:T.silverDim }}>
            📢 Announcements only — reply in General chat
          </div>
        </div>
      )}

      {showPoll && (
        <div style={S.overlay} onClick={()=>setShowPoll(false)}>
          <PollCreator onSend={sendPoll} onCancel={()=>setShowPoll(false)}/>
        </div>
      )}
    </div>
  );
}

// ── MAIN MESSAGES PAGE ────────────────────────────────────────────────
export default function MessagesPage({ messages, dmMessages, fb, showToast, isCoach, onBack }) {
  const { identity, setShowIdentityModal, saveIdentity } = useAuth();
  const [view,      setView]      = useState("home"); // home | group | dm
  const [activeDm,  setActiveDm]  = useState(null);  // { key, name }
  const [nameModal, setNameModal]  = useState(false);
  const [editName,  setEditName]   = useState("");
  const [newDmName, setNewDmName]  = useState("");
  const [newDmModal,setNewDmModal] = useState(false);

  const requireIdentity = fn => {
    if (!identity) { setShowIdentityModal(true); return; }
    fn();
  };

  // Build DM list from all DM messages
  const dmKeys  = Object.keys(dmMessages || {});
  const allDms  = dmKeys.map(key => {
    const msgs    = Object.values((dmMessages||{})[key]||{}).sort((a,b)=>a.ts-b.ts);
    const last    = msgs[msgs.length-1];
    const names   = key.split("__");
    const other   = names.find(n => n !== identity?.name) || names[0];
    const unread  = msgs.filter(m => m.sender !== identity?.name && !m.read).length;
    return { key, other, last, msgs, unread };
  }).sort((a,b)=>(b.last?.ts||0)-(a.last?.ts||0));

  // Make DM key (sorted so A__B === B__A)
  const dmKey = (a, b) => [a,b].sort().join("__");

  const openDm = (otherName) => {
    const key = dmKey(identity?.name||"", otherName);
    setActiveDm({ key, name:otherName });
    setView("dm");
  };

  const startNewDm = () => requireIdentity(() => {
    if (!newDmName.trim()) return;
    openDm(newDmName.trim());
    setNewDmModal(false);
    setNewDmName("");
  });

  // Active DM messages
  const activeDmMsgs = activeDm
    ? Object.entries((dmMessages||{})[activeDm.key]||{}).map(([id,m])=>({...m,id})).sort((a,b)=>a.ts-b.ts)
    : [];

  // Group messages
  const groupMsgs = (messages||[]);

  // ── GROUP CHAT ──
  if (view === "group") {
    return (
      <ChatView
        msgs={groupMsgs} fb={fb} identity={identity} isCoach={isCoach}
        showToast={showToast} dmKey={null}
        onBack={() => setView("home")} backLabel="Messages"
        chatTitle="Team Chat" chatSub="Iron Disciples · Everyone"
        canPost={!!identity}/>
    );
  }

  // ── DM VIEW ──
  if (view === "dm" && activeDm) {
    return (
      <ChatView
        msgs={activeDmMsgs} fb={fb} identity={identity} isCoach={isCoach}
        showToast={showToast} dmKey={activeDm.key}
        onBack={() => setView("home")} backLabel="Messages"
        chatTitle={activeDm.name} chatSub="Direct Message"
        canPost={!!identity}/>
    );
  }

  // ── HOME VIEW ──
  const lastGroupMsg = groupMsgs[groupMsgs.length-1];

  return (
    <div style={M.root}>
      {/* Header */}
      <div style={M.header}>
        <div>
          <div style={M.title}>Messages</div>
          <div style={M.sub}>Iron Disciples</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {identity
            ? <button style={M.identityBtn} onClick={()=>{setEditName(identity.name);setNameModal(true);}}>
                👤 {identity.name}
              </button>
            : <button style={M.joinBtn} onClick={()=>setShowIdentityModal(true)}>
                Join Chat
              </button>
          }
        </div>
      </div>
      <div style={{ height:2, background:`linear-gradient(90deg,${T.red},${T.gold},${T.red})`, opacity:0.5 }}/>

      <div style={{ paddingBottom:80 }}>
        {/* Group chat */}
        <div style={M.sectionLabel}>GROUP</div>
        <div style={M.threadRow} onClick={()=>requireIdentity(()=>setView("group"))}>
          <div style={{ ...M.threadAvatar, background:`linear-gradient(135deg,${T.red},#8a1010)` }}>🏟</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={M.threadName}>Team Chat</div>
            <div style={M.threadPreview}>
              {lastGroupMsg
                ? `${lastGroupMsg.sender}: ${lastGroupMsg.type==="poll"?"📊 Poll":lastGroupMsg.text?.slice(0,40)}`
                : "No messages yet"}
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            {lastGroupMsg && <div style={M.threadTime}>{timeAgo(lastGroupMsg.ts)}</div>}
            <div style={M.threadArrow}>›</div>
          </div>
        </div>

        {/* DMs section */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 16px 6px" }}>
          <div style={M.sectionLabelInline}>DIRECT MESSAGES</div>
          {identity && (
            <button style={M.newDmBtn} onClick={()=>requireIdentity(()=>setNewDmModal(true))}>
              + New DM
            </button>
          )}
        </div>

        {allDms.length === 0 && (
          <div style={{ padding:"20px 16px", color:T.silverDim, fontSize:13, fontStyle:"italic" }}>
            {identity
              ? isCoach
                ? "Tap '+ New DM' to message a parent directly"
                : "Tap '+ New DM' to message a coach directly"
              : "Join chat to send direct messages"}
          </div>
        )}

        {allDms.map(dm => (
          <div key={dm.key} style={M.threadRow} onClick={()=>requireIdentity(()=>openDm(dm.other))}>
            <div style={{ ...M.threadAvatar, background:T.dark3 }}>
              {(dm.other||"?")[0].toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={M.threadName}>{dm.other}</div>
              <div style={M.threadPreview}>
                {dm.last ? `${dm.last.sender}: ${dm.last.text?.slice(0,40)||"..."}` : "No messages"}
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              {dm.last && <div style={M.threadTime}>{timeAgo(dm.last.ts)}</div>}
              {dm.unread > 0 && <div style={M.unreadBadge}>{dm.unread}</div>}
              <div style={M.threadArrow}>›</div>
            </div>
          </div>
        ))}
      </div>

      {/* New DM modal */}
      {newDmModal && (
        <div style={S.overlay} onClick={()=>setNewDmModal(false)}>
          <div style={S.sheet} onClick={e=>e.stopPropagation()}>
            <div style={S.sheetTitle}>New Direct Message</div>
            <div style={{ padding:"16px 20px" }}>
              <div style={S.label}>{isCoach ? "Parent's name" : "Coach's name"}</div>
              <input style={{ ...S.input, marginTop:6 }}
                placeholder={isCoach ? "Enter parent name..." : "Enter coach name..."}
                value={newDmName} onChange={e=>setNewDmName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&startNewDm()} autoFocus/>
              <div style={{ fontSize:11, color:T.silverDim, marginTop:8, lineHeight:1.5 }}>
                {isCoach
                  ? "Enter the exact name of the parent you want to message."
                  : "Enter the coach's name to start a private conversation."}
              </div>
            </div>
            <div style={{ padding:"0 20px" }}>
              <button style={S.btnPrimary} onClick={startNewDm}>Start Conversation</button>
            </div>
            <button style={S.btnClose} onClick={()=>setNewDmModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Name edit modal */}
      {nameModal && (
        <div style={S.overlay} onClick={()=>setNameModal(false)}>
          <div style={S.sheet} onClick={e=>e.stopPropagation()}>
            <div style={S.sheetTitle}>Edit Your Name</div>
            <div style={{ padding:"16px 20px" }}>
              <div style={S.label}>Your name</div>
              <input style={{ ...S.input, marginTop:6 }} value={editName}
                onChange={e=>setEditName(e.target.value)} autoFocus
                onKeyDown={e=>{ if(e.key==="Enter"&&editName.trim()){saveIdentity(editName.trim(),identity?.playerName||"");setNameModal(false);showToast("Name updated!");} }}/>
            </div>
            <div style={{ padding:"0 20px" }}>
              <button style={S.btnPrimary} onClick={()=>{
                if(!editName.trim()) return;
                saveIdentity(editName.trim(), identity?.playerName||"");
                setNameModal(false);
                showToast("Name updated!");
              }}>Save</button>
            </div>
            <button style={S.btnClose} onClick={()=>setNameModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const M = {
  // Home
  root:{ background:T.black, minHeight:"100vh" },
  header:{ background:`linear-gradient(160deg,#1a1010,${T.black})`, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${T.border}` },
  title:{ fontSize:22, fontWeight:"bold", color:T.white, fontFamily:T.serif },
  sub:{ fontSize:10, color:T.silverDim, marginTop:2, letterSpacing:1 },
  identityBtn:{ background:T.dark2, border:`1px solid ${T.border}`, borderRadius:20, color:T.dimText, padding:"5px 12px", fontSize:11, cursor:"pointer" },
  joinBtn:{ background:`linear-gradient(135deg,${T.gold},#8a6a00)`, border:"none", borderRadius:20, color:T.white, padding:"7px 14px", fontSize:12, fontWeight:"bold", cursor:"pointer", fontFamily:T.serif },
  sectionLabel:{ fontSize:10, letterSpacing:2, color:T.silverDim, padding:"14px 16px 6px", textTransform:"uppercase" },
  sectionLabelInline:{ fontSize:10, letterSpacing:2, color:T.silverDim, textTransform:"uppercase" },
  threadRow:{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:`1px solid ${T.border}`, cursor:"pointer" },
  threadAvatar:{ width:46, height:46, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:"bold", color:T.white, flexShrink:0 },
  threadName:{ fontSize:15, fontWeight:"bold", color:T.white, fontFamily:T.serif },
  threadPreview:{ fontSize:12, color:T.silverDim, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  threadTime:{ fontSize:10, color:T.silverDim, marginBottom:4 },
  threadArrow:{ fontSize:18, color:T.dark4 },
  unreadBadge:{ background:T.red, borderRadius:10, padding:"2px 7px", fontSize:10, color:T.white, fontWeight:"bold", display:"inline-block", marginBottom:2 },
  newDmBtn:{ background:`linear-gradient(135deg,${T.red},#8a1010)`, border:"none", borderRadius:16, color:T.white, padding:"6px 14px", fontSize:11, fontWeight:"bold", cursor:"pointer", fontFamily:T.serif },

  // Chat view
  chatRoot:{ background:T.black, minHeight:"100vh", display:"flex", flexDirection:"column" },
  chatHeader:{ background:`linear-gradient(160deg,#1a1010,${T.black})`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${T.border}` },
  backBtn:{ background:"none", border:"none", color:T.gold, fontSize:15, cursor:"pointer", fontFamily:T.serif, fontWeight:"bold", flexShrink:0, padding:"4px 0" },
  chatTitle:{ fontSize:16, fontWeight:"bold", color:T.white, fontFamily:T.serif },
  chatSub:{ fontSize:10, color:T.silverDim, marginTop:2 },
  pinnedBanner:{ background:`linear-gradient(135deg,#14100a,#0e0900)`, borderBottom:`1px solid ${T.borderGold}`, padding:"7px 14px", display:"flex", alignItems:"center", gap:8 },
  pinnedLabel:{ fontSize:14, flexShrink:0 },
  pinnedText:{ fontSize:11, color:T.dimText, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  msgList:{ flex:1, overflowY:"auto", padding:"12px 10px 140px", display:"flex", flexDirection:"column", gap:10 },
  empty:{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", textAlign:"center" },
  dateLine:{ textAlign:"center", fontSize:10, color:T.silverDim, padding:"8px 0", letterSpacing:1 },

  // Bubbles
  row:{ display:"flex", alignItems:"flex-end", gap:8 },
  avatar:{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:"bold", color:T.white, flexShrink:0 },
  senderName:{ fontSize:11, color:T.silverDim, marginBottom:3, paddingLeft:2 },
  coachTag:{ color:T.goldLight, fontWeight:"bold" },
  pinTag:{ color:T.gold },
  bubble:{ borderRadius:16, padding:"10px 13px", wordBreak:"break-word" },
  msgText:{ fontSize:14, color:T.white, lineHeight:1.5 },
  msgTime:{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:4, textAlign:"right" },
  reactRow:{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" },
  reactChip:{ borderRadius:12, padding:"2px 7px", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:3 },
  actionBar:{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap", padding:"6px 8px", background:T.dark2, borderRadius:12, border:`1px solid ${T.border}` },
  actionEmoji:{ background:"none", border:"none", fontSize:18, cursor:"pointer", borderRadius:8, padding:"3px 6px" },
  actionBtn:{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.dimText, padding:"3px 10px", fontSize:11, cursor:"pointer" },

  // Poll
  pollBox:{ minWidth:200 },
  pollQ:{ fontSize:14, fontWeight:"bold", color:T.white, fontFamily:T.serif, marginBottom:4, lineHeight:1.4 },
  pollSub:{ fontSize:10, color:T.silverDim, marginBottom:8 },
  pollOpt:{ position:"relative", background:T.dark3, borderRadius:8, marginBottom:6, padding:"8px 10px", cursor:"pointer", overflow:"hidden" },
  pollBar:{ position:"absolute", top:0, left:0, height:"100%", borderRadius:8, transition:"width 0.4s" },
  pollOptRow:{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"center" },
  pollOptLbl:{ fontSize:13 },
  pollPct:{ fontSize:11, color:T.silverDim },
  pollClosed:{ fontSize:10, color:T.silverDim, textAlign:"center", marginTop:6, fontStyle:"italic" },
  pollCloseBtn:{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.silverDim, padding:"4px 10px", fontSize:10, cursor:"pointer", marginTop:6, width:"100%", textAlign:"center" },

  // Input
  optBar:{ background:T.dark2, borderTop:`1px solid ${T.borderGold}`, padding:"10px 12px", display:"flex", gap:8, flexWrap:"wrap", position:"fixed", bottom:"calc(56px + max(56px, calc(56px + env(safe-area-inset-bottom))))", left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, zIndex:150 },
  optItem:{ background:T.dark3, border:`1px solid ${T.borderGold}`, borderRadius:20, color:T.goldLight, padding:"10px 18px", fontSize:14, cursor:"pointer", fontWeight:"bold" },
  inputBar:{ position:"fixed", bottom:"max(56px, calc(56px + env(safe-area-inset-bottom)))", left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"rgba(10,10,10,0.97)", borderTop:`1px solid ${T.border}`, padding:"10px 12px", display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(20px)", zIndex:100 },
  optBtn:{ width:36, height:36, borderRadius:"50%", border:`1px solid ${T.borderGold}`, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" },
  textInput:{ flex:1, background:T.dark2, border:`1px solid ${T.dark3}`, borderRadius:24, padding:"9px 16px", color:T.white, fontSize:14, outline:"none" },
  sendBtn:{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${T.red},#8a1010)`, border:"none", color:T.white, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
};
