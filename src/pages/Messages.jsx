import { useState, useEffect, useRef } from "react";
import { T } from "../theme";
import { useAuth } from "../AuthContext";
import { S } from "../components/UI";

const REACTIONS = ["👍","❤️","🔥","⚾","🙏"];

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function fmtTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
}

// ── Poll component ────────────────────────────────────────────────────
function Poll({ msg, identity, isCoach, onVote, onClose }) {
  const poll    = msg.poll;
  const myVote  = poll.votes?.[identity?.name];
  const totalVotes = Object.values(poll.votes||{}).length;

  const voteCounts = (poll.options||[]).map(opt =>
    Object.values(poll.votes||{}).filter(v=>v===opt).length
  );

  return (
    <div style={M.pollBox}>
      <div style={M.pollQuestion}>{poll.question}</div>
      <div style={M.pollSub}>{totalVotes} vote{totalVotes!==1?"s":""}</div>
      {(poll.options||[]).map((opt, i) => {
        const count = voteCounts[i];
        const pct   = totalVotes>0 ? Math.round(count/totalVotes*100) : 0;
        const voted = myVote===opt;
        return (
          <div key={i} style={M.pollOption} onClick={()=>!poll.closed&&onVote&&onVote(opt)}>
            <div style={{...M.pollBar, width:`${pct}%`, background: voted?T.gold+"55":T.dark3}}/>
            <div style={M.pollOptionRow}>
              <span style={{...M.pollOptLabel, color: voted?T.goldLight:T.white}}>{voted?"✓ ":""}{opt}</span>
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

// ── Single message bubble ─────────────────────────────────────────────
function MessageBubble({ msg, identity, isCoach, onReact, onPin, onDelete, onVote, onClosePoll }) {
  const [showActions, setShowActions] = useState(false);
  const isMine = identity && (msg.sender === identity.name || (isCoach && msg.senderRole==="coach"));
  const isCoachMsg = msg.senderRole === "coach";

  const reactionCounts = {};
  Object.values(msg.reactions||{}).forEach(r => { reactionCounts[r] = (reactionCounts[r]||0)+1; });
  const myReaction = identity ? (msg.reactions||{})[identity.name] : null;

  return (
    <div style={{...M.msgRow, justifyContent: isMine?"flex-end":"flex-start"}}
      onClick={()=>setShowActions(v=>!v)}>

      {/* Avatar (left side for others) */}
      {!isMine && (
        <div style={{...M.avatar, background: isCoachMsg ? T.red : T.dark3}}>
          {(msg.sender||"?")[0].toUpperCase()}
        </div>
      )}

      <div style={{maxWidth:"72%"}}>
        {/* Sender name */}
        {!isMine && (
          <div style={M.senderName}>
            {msg.sender||"Unknown"}
            {isCoachMsg && <span style={M.coachTag}> Coach</span>}
            {msg.pinned && <span style={M.pinnedTag}> 📌</span>}
          </div>
        )}

        {/* Bubble */}
        <div style={{...M.bubble, background: isMine ? `linear-gradient(135deg,${T.red},#8a1010)` : isCoachMsg ? `linear-gradient(135deg,#1a1000,#120c00)` : T.dark2,
          border: isMine ? "none" : isCoachMsg ? `1px solid ${T.borderGold}` : `1px solid ${T.border}`}}>

          {msg.type==="poll" ? (
            <Poll msg={msg} identity={identity} isCoach={isCoach}
              onVote={opt=>onVote(msg.id, opt)}
              onClose={()=>onClosePoll(msg.id)}/>
          ) : (
            <div style={M.msgText}>{msg.text}</div>
          )}

          <div style={M.msgTime}>{fmtTime(msg.ts)}</div>
        </div>

        {/* Reactions */}
        {Object.keys(reactionCounts).length>0 && (
          <div style={M.reactionsRow}>
            {Object.entries(reactionCounts).map(([emoji, count])=>(
              <div key={emoji} style={{...M.reactionChip, background: myReaction===emoji?T.goldGlow:T.dark3, border:`1px solid ${myReaction===emoji?T.gold:T.border}`}}
                onClick={e=>{e.stopPropagation();onReact(msg.id, emoji);}}>
                {emoji} {count}
              </div>
            ))}
          </div>
        )}

        {/* Action bar */}
        {showActions && (
          <div style={M.actionBar}>
            {REACTIONS.map(emoji=>(
              <button key={emoji} style={{...M.actionEmoji, background: myReaction===emoji?T.goldGlow:"none"}}
                onClick={e=>{e.stopPropagation();onReact(msg.id,emoji);setShowActions(false);}}>
                {emoji}
              </button>
            ))}
            {isCoach && (
              <>
                <button style={M.actionBtn} onClick={e=>{e.stopPropagation();onPin(msg.id,!msg.pinned);setShowActions(false);}}>
                  {msg.pinned?"Unpin":"📌 Pin"}
                </button>
                <button style={{...M.actionBtn,color:T.redLight}} onClick={e=>{e.stopPropagation();onDelete(msg.id);setShowActions(false);}}>
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Avatar (right side for mine) */}
      {isMine && (
        <div style={{...M.avatar, background: isCoach ? T.red : T.dark3}}>
          {(msg.sender||"?")[0].toUpperCase()}
        </div>
      )}
    </div>
  );
}

// ── Poll creator modal ────────────────────────────────────────────────
function PollCreator({ onSend, onCancel }) {
  const [question, setQuestion] = useState("");
  const [options,  setOptions]  = useState(["Yes","No","Maybe"]);
  const [newOpt,   setNewOpt]   = useState("");

  const addOption = () => {
    if (!newOpt.trim()) return;
    setOptions(v=>[...v, newOpt.trim()]);
    setNewOpt("");
  };

  const send = () => {
    if (!question.trim() || options.length < 2) return;
    onSend({ question, options });
  };

  return (
    <div style={S.sheet} onClick={e=>e.stopPropagation()}>
      <div style={S.sheetTitle}>📊 Create Poll</div>
      <div style={{overflowY:"auto",flex:1,padding:"12px 20px"}}>
        <div style={S.formField}>
          <div style={S.label}>Question</div>
          <input style={{...S.input,marginTop:6}} placeholder="e.g. Can you make Saturday's game?"
            value={question} onChange={e=>setQuestion(e.target.value)} autoFocus/>
        </div>
        <div style={S.formField}>
          <div style={S.label}>Options</div>
          {options.map((opt,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
              <div style={{...S.input,flex:1,display:"flex",alignItems:"center",color:T.white,fontSize:14}}>{opt}</div>
              <button style={{background:"none",border:"none",color:T.redLight,fontSize:16,cursor:"pointer"}}
                onClick={()=>setOptions(v=>v.filter((_,j)=>j!==i))}>✕</button>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <input style={{...S.input,flex:1}} placeholder="Add option..." value={newOpt}
              onChange={e=>setNewOpt(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addOption()}/>
            <button style={{...S.btnGold,width:"auto",padding:"0 16px",borderRadius:10,fontSize:13}} onClick={addOption}>+ Add</button>
          </div>
        </div>
      </div>
      <div style={{padding:"8px 20px 0",display:"flex",gap:8}}>
        <button style={{...S.btnPrimary, opacity:question.trim()&&options.length>=2?1:0.5}} onClick={send}>Send Poll</button>
      </div>
      <button style={S.btnClose} onClick={onCancel}>Cancel</button>
    </div>
  );
}

// ── MAIN MESSAGES PAGE ────────────────────────────────────────────────
export default function MessagesPage({ messages, fb, showToast, isCoach, onBack }) {
  const { identity, setShowIdentityModal, saveIdentity } = useAuth();
  const [text,        setText]        = useState("");
  const [showPoll,    setShowPoll]     = useState(false);
  const [showOptions, setShowOptions]  = useState(false);
  const [nameModal,   setNameModal]    = useState(false);
  const [editName,    setEditName]     = useState("");
  const bottomRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages?.length]);

  // Ensure user has identity before chatting
  const requireIdentity = (fn) => {
    if (!identity) { setShowIdentityModal(true); return; }
    fn();
  };

  const sendMessage = () => requireIdentity(()=>{
    if (!text.trim()) return;
    fb.sendMessage({
      type: "text",
      text: text.trim(),
      sender: identity.name,
      senderRole: isCoach ? "coach" : "parent",
      playerName: identity.playerName || "",
      pinned: false,
      reactions: {},
    });
    setText("");
  });

  const sendPoll = (pollData) => requireIdentity(()=>{
    fb.sendMessage({
      type: "poll",
      text: "",
      poll: { ...pollData, votes:{}, closed:false },
      sender: identity.name,
      senderRole: isCoach ? "coach" : "parent",
      pinned: false,
      reactions: {},
    });
    setShowPoll(false);
    showToast("Poll sent!");
  });

  const handleReact = (msgId, emoji) => requireIdentity(()=>{
    const msg = messages.find(m=>m.id===msgId);
    if (!msg) return;
    const reactions = {...(msg.reactions||{})};
    if (reactions[identity.name]===emoji) delete reactions[identity.name];
    else reactions[identity.name] = emoji;
    fb.updateMessage(msgId, {reactions});
  });

  const handlePin = (msgId, pinned) => {
    fb.updateMessage(msgId, {pinned});
    showToast(pinned ? "Message pinned 📌" : "Unpinned");
  };

  const handleDelete = (msgId) => {
    fb.deleteMessage(msgId);
    showToast("Message deleted");
  };

  const handleVote = (msgId, option) => requireIdentity(()=>{
    const msg = messages.find(m=>m.id===msgId);
    if (!msg || msg.poll?.closed) return;
    const votes = {...(msg.poll?.votes||{})};
    votes[identity.name] = option;
    fb.updateMessage(msgId, {"poll/votes": votes});
  });

  const handleClosePoll = (msgId) => {
    fb.updateMessage(msgId, {"poll/closed": true});
    showToast("Poll closed");
  };

  // Pinned messages
  const pinned = (messages||[]).filter(m=>m.pinned);
  const allMsgs = messages||[];

  return (
    <div style={M.root}>
      {/* Header */}
      <div style={M.header}>
        <div style={M.headerLeft}>
          <div style={M.title}>Messages</div>
          <div style={M.sub}>Iron Disciples · Team Chat</div>
        </div>
        <div style={M.headerRight}>
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
      <div style={{height:2,background:`linear-gradient(90deg,${T.red},${T.gold},${T.red})`,opacity:0.5}}/>

      {/* Pinned messages */}
      {pinned.length>0 && (
        <div style={M.pinnedSection}>
          <div style={M.pinnedLabel}>📌 Pinned</div>
          {pinned.map(msg=>(
            <div key={msg.id} style={M.pinnedItem}>
              <span style={M.pinnedSender}>{msg.sender}: </span>
              <span style={M.pinnedText}>{msg.type==="poll"?`📊 ${msg.poll?.question}`:msg.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages list */}
      <div style={M.msgList}>
        {allMsgs.length===0 && (
          <div style={M.emptyChat}>
            <div style={{fontSize:40,marginBottom:12}}>💬</div>
            <div style={{fontSize:16,color:T.silver,fontFamily:T.serif,marginBottom:8}}>No messages yet</div>
            <div style={{fontSize:13,color:T.silverDim,lineHeight:1.6}}>
              {identity?"Send the first message!":"Join the chat to send messages."}
            </div>
          </div>
        )}

        {allMsgs.map((msg,i)=>{
          const prev = allMsgs[i-1];
          const showDate = !prev || new Date(msg.ts).toDateString() !== new Date(prev.ts).toDateString();
          return (
            <div key={msg.id||i}>
              {showDate && (
                <div style={M.dateDivider}>
                  {new Date(msg.ts).toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"})}
                </div>
              )}
              <MessageBubble
                msg={msg} identity={identity} isCoach={isCoach}
                onReact={handleReact} onPin={handlePin}
                onDelete={handleDelete} onVote={handleVote}
                onClosePoll={handleClosePoll}/>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Coach options bar - appears ABOVE input */}
      {showOptions && isCoach && (
        <div style={M.optionsBar}>
          <button style={M.optItem} onClick={()=>{setShowPoll(true);setShowOptions(false);}}>
            📊 Create Poll
          </button>
          <button style={M.optItem} onClick={()=>{
            requireIdentity(()=>{
              fb.sendMessage({
                type:"text", text:"📢 ANNOUNCEMENT: ",
                sender:identity.name, senderRole:"coach",
                playerName:"", pinned:true, reactions:{},
              });
            });
            setShowOptions(false);
            showToast("Pinned announcement sent!");
          }}>
            📌 Pinned Announcement
          </button>
        </div>
      )}

      {/* Input bar */}
      <div style={M.inputBar}>
        {identity ? (
          <>
            {/* Options button (coach only - for polls/announcements) */}
            {isCoach && (
              <button style={M.optBtn} onClick={()=>setShowOptions(v=>!v)}>⊕</button>
            )}

            <input
              style={M.textInput}
              placeholder={`Message as ${identity.name}...`}
              value={text}
              onChange={e=>setText(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }}/>

            <button style={{...M.sendBtn, opacity:text.trim()?1:0.4}} onClick={sendMessage}>
              ➤
            </button>
          </>
        ) : (
          <button style={{...S.btnPrimary, margin:"0 12px", borderRadius:30}} onClick={()=>setShowIdentityModal(true)}>
            Join Chat to Send Messages
          </button>
        )}
      </div>

      {/* Poll creator */}
      {showPoll && (
        <div style={S.overlay} onClick={()=>setShowPoll(false)}>
          <PollCreator onSend={sendPoll} onCancel={()=>setShowPoll(false)}/>
        </div>
      )}

      {/* Name edit modal */}
      {nameModal && (
        <div style={S.overlay} onClick={()=>setNameModal(false)}>
          <div style={S.sheet} onClick={e=>e.stopPropagation()}>
            <div style={S.sheetTitle}>Edit Your Name</div>
            <div style={{padding:"16px 20px"}}>
              <div style={S.label}>Your name</div>
              <input style={{...S.input,marginTop:6}} value={editName}
                onChange={e=>setEditName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&saveNameEdit()} autoFocus/>
            </div>
            <div style={{padding:"0 20px"}}>
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

// ── Styles ────────────────────────────────────────────────────────────
const M = {
  root:{ background:T.black, minHeight:"100vh", display:"flex", flexDirection:"column" },
  header:{ background:`linear-gradient(160deg,#1a1010,${T.black})`, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${T.border}` },
  headerLeft:{},
  headerRight:{},
  title:{ fontSize:22, fontWeight:"bold", color:T.white, fontFamily:T.serif },
  sub:{ fontSize:10, color:T.silverDim, marginTop:2, letterSpacing:1 },
  identityBtn:{ background:T.dark2, border:`1px solid ${T.border}`, borderRadius:20, color:T.dimText, padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:T.sans },
  joinBtn:{ background:`linear-gradient(135deg,${T.gold},#8a6a00)`, border:"none", borderRadius:20, color:T.white, padding:"7px 14px", fontSize:12, fontWeight:"bold", cursor:"pointer", fontFamily:T.serif },

  // Pinned
  pinnedSection:{ background:`linear-gradient(135deg,#14100a,#0e0900)`, borderBottom:`1px solid ${T.borderGold}`, padding:"8px 14px" },
  pinnedLabel:{ fontSize:9, letterSpacing:2, color:T.gold, textTransform:"uppercase", marginBottom:4 },
  pinnedItem:{ padding:"3px 0", borderBottom:`1px solid rgba(200,160,0,0.1)` },
  pinnedSender:{ fontSize:11, color:T.goldLight, fontWeight:"bold" },
  pinnedText:{ fontSize:11, color:T.dimText },

  // Message list
  msgList:{ flex:1, overflowY:"auto", padding:"12px 10px 80px", display:"flex", flexDirection:"column", gap:10 },
  emptyChat:{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", textAlign:"center" },
  dateDivider:{ textAlign:"center", fontSize:10, color:T.silverDim, padding:"8px 0", letterSpacing:1 },

  // Message bubbles
  msgRow:{ display:"flex", alignItems:"flex-end", gap:8 },
  avatar:{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:"bold", color:T.white, flexShrink:0, fontFamily:T.sans },
  senderName:{ fontSize:11, color:T.silverDim, marginBottom:3, paddingLeft:2 },
  coachTag:{ color:T.redLight, fontWeight:"bold" },
  pinnedTag:{ color:T.gold },
  bubble:{ borderRadius:16, padding:"10px 13px", wordBreak:"break-word" },
  msgText:{ fontSize:14, color:T.white, lineHeight:1.5, fontFamily:T.sans },
  msgTime:{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:4, textAlign:"right" },

  // Reactions
  reactionsRow:{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" },
  reactionChip:{ borderRadius:12, padding:"2px 7px", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:3 },

  // Action bar
  actionBar:{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap", padding:"6px 8px", background:T.dark2, borderRadius:12, border:`1px solid ${T.border}` },
  actionEmoji:{ background:"none", border:"none", fontSize:18, cursor:"pointer", borderRadius:8, padding:"3px 6px" },
  actionBtn:{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.dimText, padding:"3px 10px", fontSize:11, cursor:"pointer", fontFamily:T.sans },

  // Poll
  pollBox:{ minWidth:200 },
  pollQuestion:{ fontSize:14, fontWeight:"bold", color:T.white, fontFamily:T.serif, marginBottom:4, lineHeight:1.4 },
  pollSub:{ fontSize:10, color:T.silverDim, marginBottom:8 },
  pollOption:{ position:"relative", background:T.dark3, borderRadius:8, marginBottom:6, padding:"8px 10px", cursor:"pointer", overflow:"hidden" },
  pollBar:{ position:"absolute", top:0, left:0, height:"100%", borderRadius:8, transition:"width 0.4s" },
  pollOptionRow:{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"center" },
  pollOptLabel:{ fontSize:13, fontFamily:T.sans },
  pollPct:{ fontSize:11, color:T.silverDim },
  pollClosed:{ fontSize:10, color:T.silverDim, textAlign:"center", marginTop:6, fontStyle:"italic" },
  pollCloseBtn:{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.silverDim, padding:"4px 10px", fontSize:10, cursor:"pointer", marginTop:6, width:"100%", fontFamily:T.sans },

  // Input bar
  inputBar:{ position:"sticky", bottom:64, left:0, right:0, background:"rgba(12,12,12,0.97)", borderTop:`1px solid ${T.border}`, padding:"10px 10px", display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(20px)" },
  optBtn:{ width:36, height:36, borderRadius:"50%", background:T.dark2, border:`1px solid ${T.border}`, color:T.gold, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  textInput:{ flex:1, background:T.dark2, border:`1px solid ${T.dark3}`, borderRadius:24, padding:"9px 16px", color:T.white, fontSize:14, outline:"none", fontFamily:T.sans },
  sendBtn:{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${T.red},#8a1010)`, border:"none", color:T.white, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },

  // Options bar
  optionsBar:{ background:T.dark2, borderTop:`1px solid ${T.borderGold}`, borderBottom:`1px solid ${T.border}`, padding:"10px 12px", display:"flex", gap:8, flexWrap:"wrap", position:"sticky", bottom:114, left:0, right:0, zIndex:50 },
  optItem:{ background:T.dark3, border:`1px solid ${T.borderGold}`, borderRadius:20, color:T.goldLight, padding:"9px 16px", fontSize:13, cursor:"pointer", fontFamily:T.sans, fontWeight:"bold" },
};
rom "../theme";
import { useAuth } from "../AuthContext";
import { S } from "../components/UI";

const REACTIONS = ["👍","❤️","🔥","⚾","🙏"];

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function fmtTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
}

// ── Poll component ────────────────────────────────────────────────────
function Poll({ msg, identity, isCoach, onVote, onClose }) {
  const poll    = msg.poll;
  const myVote  = poll.votes?.[identity?.name];
  const totalVotes = Object.values(poll.votes||{}).length;

  const voteCounts = (poll.options||[]).map(opt =>
    Object.values(poll.votes||{}).filter(v=>v===opt).length
  );

  return (
    <div style={M.pollBox}>
      <div style={M.pollQuestion}>{poll.question}</div>
      <div style={M.pollSub}>{totalVotes} vote{totalVotes!==1?"s":""}</div>
      {(poll.options||[]).map((opt, i) => {
        const count = voteCounts[i];
        const pct   = totalVotes>0 ? Math.round(count/totalVotes*100) : 0;
        const voted = myVote===opt;
        return (
          <div key={i} style={M.pollOption} onClick={()=>!poll.closed&&onVote&&onVote(opt)}>
            <div style={{...M.pollBar, width:`${pct}%`, background: voted?T.gold+"55":T.dark3}}/>
            <div style={M.pollOptionRow}>
              <span style={{...M.pollOptLabel, color: voted?T.goldLight:T.white}}>{voted?"✓ ":""}{opt}</span>
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

// ── Single message bubble ─────────────────────────────────────────────
function MessageBubble({ msg, identity, isCoach, onReact, onPin, onDelete, onVote, onClosePoll }) {
  const [showActions, setShowActions] = useState(false);
  const isMine = identity && (msg.sender === identity.name || (isCoach && msg.senderRole==="coach"));
  const isCoachMsg = msg.senderRole === "coach";

  const reactionCounts = {};
  Object.values(msg.reactions||{}).forEach(r => { reactionCounts[r] = (reactionCounts[r]||0)+1; });
  const myReaction = identity ? (msg.reactions||{})[identity.name] : null;

  return (
    <div style={{...M.msgRow, justifyContent: isMine?"flex-end":"flex-start"}}
      onClick={()=>setShowActions(v=>!v)}>

      {/* Avatar (left side for others) */}
      {!isMine && (
        <div style={{...M.avatar, background: isCoachMsg ? T.red : T.dark3}}>
          {(msg.sender||"?")[0].toUpperCase()}
        </div>
      )}

      <div style={{maxWidth:"72%"}}>
        {/* Sender name */}
        {!isMine && (
          <div style={M.senderName}>
            {msg.sender||"Unknown"}
            {isCoachMsg && <span style={M.coachTag}> Coach</span>}
            {msg.pinned && <span style={M.pinnedTag}> 📌</span>}
          </div>
        )}

        {/* Bubble */}
        <div style={{...M.bubble, background: isMine ? `linear-gradient(135deg,${T.red},#8a1010)` : isCoachMsg ? `linear-gradient(135deg,#1a1000,#120c00)` : T.dark2,
          border: isMine ? "none" : isCoachMsg ? `1px solid ${T.borderGold}` : `1px solid ${T.border}`}}>

          {msg.type==="poll" ? (
            <Poll msg={msg} identity={identity} isCoach={isCoach}
              onVote={opt=>onVote(msg.id, opt)}
              onClose={()=>onClosePoll(msg.id)}/>
          ) : (
            <div style={M.msgText}>{msg.text}</div>
          )}

          <div style={M.msgTime}>{fmtTime(msg.ts)}</div>
        </div>

        {/* Reactions */}
        {Object.keys(reactionCounts).length>0 && (
          <div style={M.reactionsRow}>
            {Object.entries(reactionCounts).map(([emoji, count])=>(
              <div key={emoji} style={{...M.reactionChip, background: myReaction===emoji?T.goldGlow:T.dark3, border:`1px solid ${myReaction===emoji?T.gold:T.border}`}}
                onClick={e=>{e.stopPropagation();onReact(msg.id, emoji);}}>
                {emoji} {count}
              </div>
            ))}
          </div>
        )}

        {/* Action bar */}
        {showActions && (
          <div style={M.actionBar}>
            {REACTIONS.map(emoji=>(
              <button key={emoji} style={{...M.actionEmoji, background: myReaction===emoji?T.goldGlow:"none"}}
                onClick={e=>{e.stopPropagation();onReact(msg.id,emoji);setShowActions(false);}}>
                {emoji}
              </button>
            ))}
            {isCoach && (
              <>
                <button style={M.actionBtn} onClick={e=>{e.stopPropagation();onPin(msg.id,!msg.pinned);setShowActions(false);}}>
                  {msg.pinned?"Unpin":"📌 Pin"}
                </button>
                <button style={{...M.actionBtn,color:T.redLight}} onClick={e=>{e.stopPropagation();onDelete(msg.id);setShowActions(false);}}>
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Avatar (right side for mine) */}
      {isMine && (
        <div style={{...M.avatar, background: isCoach ? T.red : T.dark3}}>
          {(msg.sender||"?")[0].toUpperCase()}
        </div>
      )}
    </div>
  );
}

// ── Poll creator modal ────────────────────────────────────────────────
function PollCreator({ onSend, onCancel }) {
  const [question, setQuestion] = useState("");
  const [options,  setOptions]  = useState(["Yes","No","Maybe"]);
  const [newOpt,   setNewOpt]   = useState("");

  const addOption = () => {
    if (!newOpt.trim()) return;
    setOptions(v=>[...v, newOpt.trim()]);
    setNewOpt("");
  };

  const send = () => {
    if (!question.trim() || options.length < 2) return;
    onSend({ question, options });
  };

  return (
    <div style={S.sheet} onClick={e=>e.stopPropagation()}>
      <div style={S.sheetTitle}>📊 Create Poll</div>
      <div style={{overflowY:"auto",flex:1,padding:"12px 20px"}}>
        <div style={S.formField}>
          <div style={S.label}>Question</div>
          <input style={{...S.input,marginTop:6}} placeholder="e.g. Can you make Saturday's game?"
            value={question} onChange={e=>setQuestion(e.target.value)} autoFocus/>
        </div>
        <div style={S.formField}>
          <div style={S.label}>Options</div>
          {options.map((opt,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
              <div style={{...S.input,flex:1,display:"flex",alignItems:"center",color:T.white,fontSize:14}}>{opt}</div>
              <button style={{background:"none",border:"none",color:T.redLight,fontSize:16,cursor:"pointer"}}
                onClick={()=>setOptions(v=>v.filter((_,j)=>j!==i))}>✕</button>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <input style={{...S.input,flex:1}} placeholder="Add option..." value={newOpt}
              onChange={e=>setNewOpt(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addOption()}/>
            <button style={{...S.btnGold,width:"auto",padding:"0 16px",borderRadius:10,fontSize:13}} onClick={addOption}>+ Add</button>
          </div>
        </div>
      </div>
      <div style={{padding:"8px 20px 0",display:"flex",gap:8}}>
        <button style={{...S.btnPrimary, opacity:question.trim()&&options.length>=2?1:0.5}} onClick={send}>Send Poll</button>
      </div>
      <button style={S.btnClose} onClick={onCancel}>Cancel</button>
    </div>
  );
}

// ── MAIN MESSAGES PAGE ────────────────────────────────────────────────
export default function MessagesPage({ messages, fb, showToast, isCoach, onBack }) {
  const { identity, setShowIdentityModal, saveIdentity } = useAuth();
  const [text,        setText]        = useState("");
  const [showPoll,    setShowPoll]     = useState(false);
  const [showOptions, setShowOptions]  = useState(false);
  const [nameModal,   setNameModal]    = useState(false);
  const [editName,    setEditName]     = useState("");
  const bottomRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages?.length]);

  // Ensure user has identity before chatting
  const requireIdentity = (fn) => {
    if (!identity) { setShowIdentityModal(true); return; }
    fn();
  };

  const sendMessage = () => requireIdentity(()=>{
    if (!text.trim()) return;
    fb.sendMessage({
      type: "text",
      text: text.trim(),
      sender: identity.name,
      senderRole: isCoach ? "coach" : "parent",
      playerName: identity.playerName || "",
      pinned: false,
      reactions: {},
    });
    setText("");
  });

  const sendPoll = (pollData) => requireIdentity(()=>{
    fb.sendMessage({
      type: "poll",
      text: "",
      poll: { ...pollData, votes:{}, closed:false },
      sender: identity.name,
      senderRole: isCoach ? "coach" : "parent",
      pinned: false,
      reactions: {},
    });
    setShowPoll(false);
    showToast("Poll sent!");
  });

  const handleReact = (msgId, emoji) => requireIdentity(()=>{
    const msg = messages.find(m=>m.id===msgId);
    if (!msg) return;
    const reactions = {...(msg.reactions||{})};
    if (reactions[identity.name]===emoji) delete reactions[identity.name];
    else reactions[identity.name] = emoji;
    fb.updateMessage(msgId, {reactions});
  });

  const handlePin = (msgId, pinned) => {
    fb.updateMessage(msgId, {pinned});
    showToast(pinned ? "Message pinned 📌" : "Unpinned");
  };

  const handleDelete = (msgId) => {
    fb.deleteMessage(msgId);
    showToast("Message deleted");
  };

  const handleVote = (msgId, option) => requireIdentity(()=>{
    const msg = messages.find(m=>m.id===msgId);
    if (!msg || msg.poll?.closed) return;
    const votes = {...(msg.poll?.votes||{})};
    votes[identity.name] = option;
    fb.updateMessage(msgId, {"poll/votes": votes});
  });

  const handleClosePoll = (msgId) => {
    fb.updateMessage(msgId, {"poll/closed": true});
    showToast("Poll closed");
  };

  // Pinned messages
  const pinned = (messages||[]).filter(m=>m.pinned);
  const allMsgs = messages||[];

  return (
    <div style={M.root}>
      {/* Header */}
      <div style={M.header}>
        <div style={M.headerLeft}>
          <div style={M.title}>Messages</div>
          <div style={M.sub}>Iron Disciples · Team Chat</div>
        </div>
        <div style={M.headerRight}>
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
      <div style={{height:2,background:`linear-gradient(90deg,${T.red},${T.gold},${T.red})`,opacity:0.5}}/>

      {/* Pinned messages */}
      {pinned.length>0 && (
        <div style={M.pinnedSection}>
          <div style={M.pinnedLabel}>📌 Pinned</div>
          {pinned.map(msg=>(
            <div key={msg.id} style={M.pinnedItem}>
              <span style={M.pinnedSender}>{msg.sender}: </span>
              <span style={M.pinnedText}>{msg.type==="poll"?`📊 ${msg.poll?.question}`:msg.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages list */}
      <div style={M.msgList}>
        {allMsgs.length===0 && (
          <div style={M.emptyChat}>
            <div style={{fontSize:40,marginBottom:12}}>💬</div>
            <div style={{fontSize:16,color:T.silver,fontFamily:T.serif,marginBottom:8}}>No messages yet</div>
            <div style={{fontSize:13,color:T.silverDim,lineHeight:1.6}}>
              {identity?"Send the first message!":"Join the chat to send messages."}
            </div>
          </div>
        )}

        {allMsgs.map((msg,i)=>{
          const prev = allMsgs[i-1];
          const showDate = !prev || new Date(msg.ts).toDateString() !== new Date(prev.ts).toDateString();
          return (
            <div key={msg.id||i}>
              {showDate && (
                <div style={M.dateDivider}>
                  {new Date(msg.ts).toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"})}
                </div>
              )}
              <MessageBubble
                msg={msg} identity={identity} isCoach={isCoach}
                onReact={handleReact} onPin={handlePin}
                onDelete={handleDelete} onVote={handleVote}
                onClosePoll={handleClosePoll}/>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input bar */}
      <div style={M.inputBar}>
        {identity ? (
          <>
            {/* Options button (coach only - for polls/announcements) */}
            {isCoach && (
              <button style={M.optBtn} onClick={()=>setShowOptions(v=>!v)}>⊕</button>
            )}

            <input
              style={M.textInput}
              placeholder={`Message as ${identity.name}...`}
              value={text}
              onChange={e=>setText(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }}/>

            <button style={{...M.sendBtn, opacity:text.trim()?1:0.4}} onClick={sendMessage}>
              ➤
            </button>
          </>
        ) : (
          <button style={{...S.btnPrimary, margin:"0 12px", borderRadius:30}} onClick={()=>setShowIdentityModal(true)}>
            Join Chat to Send Messages
          </button>
        )}
      </div>

      {/* Coach options bar */}
      {showOptions && isCoach && (
        <div style={M.optionsBar}>
          <button style={M.optItem} onClick={()=>{setShowPoll(true);setShowOptions(false);}}>
            📊 Create Poll
          </button>
          <button style={M.optItem} onClick={()=>{
            requireIdentity(()=>{
              fb.sendMessage({
                type:"text", text:"📢 ANNOUNCEMENT: ",
                sender:identity.name, senderRole:"coach",
                playerName:"", pinned:true, reactions:{},
              });
            });
            setShowOptions(false);
            showToast("Pinned announcement sent!");
          }}>
            📌 Pinned Announcement
          </button>
        </div>
      )}

      {/* Poll creator */}
      {showPoll && (
        <div style={S.overlay} onClick={()=>setShowPoll(false)}>
          <PollCreator onSend={sendPoll} onCancel={()=>setShowPoll(false)}/>
        </div>
      )}

      {/* Name edit modal */}
      {nameModal && (
        <div style={S.overlay} onClick={()=>setNameModal(false)}>
          <div style={S.sheet} onClick={e=>e.stopPropagation()}>
            <div style={S.sheetTitle}>Edit Your Name</div>
            <div style={{padding:"16px 20px"}}>
              <div style={S.label}>Your name</div>
              <input style={{...S.input,marginTop:6}} value={editName}
                onChange={e=>setEditName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&saveNameEdit()} autoFocus/>
            </div>
            <div style={{padding:"0 20px"}}>
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

// ── Styles ────────────────────────────────────────────────────────────
const M = {
  root:{ background:T.black, minHeight:"100vh", display:"flex", flexDirection:"column" },
  header:{ background:`linear-gradient(160deg,#1a1010,${T.black})`, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${T.border}` },
  headerLeft:{},
  headerRight:{},
  title:{ fontSize:22, fontWeight:"bold", color:T.white, fontFamily:T.serif },
  sub:{ fontSize:10, color:T.silverDim, marginTop:2, letterSpacing:1 },
  identityBtn:{ background:T.dark2, border:`1px solid ${T.border}`, borderRadius:20, color:T.dimText, padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:T.sans },
  joinBtn:{ background:`linear-gradient(135deg,${T.gold},#8a6a00)`, border:"none", borderRadius:20, color:T.white, padding:"7px 14px", fontSize:12, fontWeight:"bold", cursor:"pointer", fontFamily:T.serif },

  // Pinned
  pinnedSection:{ background:`linear-gradient(135deg,#14100a,#0e0900)`, borderBottom:`1px solid ${T.borderGold}`, padding:"8px 14px" },
  pinnedLabel:{ fontSize:9, letterSpacing:2, color:T.gold, textTransform:"uppercase", marginBottom:4 },
  pinnedItem:{ padding:"3px 0", borderBottom:`1px solid rgba(200,160,0,0.1)` },
  pinnedSender:{ fontSize:11, color:T.goldLight, fontWeight:"bold" },
  pinnedText:{ fontSize:11, color:T.dimText },

  // Message list
  msgList:{ flex:1, overflowY:"auto", padding:"12px 10px 80px", display:"flex", flexDirection:"column", gap:10 },
  emptyChat:{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", textAlign:"center" },
  dateDivider:{ textAlign:"center", fontSize:10, color:T.silverDim, padding:"8px 0", letterSpacing:1 },

  // Message bubbles
  msgRow:{ display:"flex", alignItems:"flex-end", gap:8 },
  avatar:{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:"bold", color:T.white, flexShrink:0, fontFamily:T.sans },
  senderName:{ fontSize:11, color:T.silverDim, marginBottom:3, paddingLeft:2 },
  coachTag:{ color:T.redLight, fontWeight:"bold" },
  pinnedTag:{ color:T.gold },
  bubble:{ borderRadius:16, padding:"10px 13px", wordBreak:"break-word" },
  msgText:{ fontSize:14, color:T.white, lineHeight:1.5, fontFamily:T.sans },
  msgTime:{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:4, textAlign:"right" },

  // Reactions
  reactionsRow:{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" },
  reactionChip:{ borderRadius:12, padding:"2px 7px", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:3 },

  // Action bar
  actionBar:{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap", padding:"6px 8px", background:T.dark2, borderRadius:12, border:`1px solid ${T.border}` },
  actionEmoji:{ background:"none", border:"none", fontSize:18, cursor:"pointer", borderRadius:8, padding:"3px 6px" },
  actionBtn:{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.dimText, padding:"3px 10px", fontSize:11, cursor:"pointer", fontFamily:T.sans },

  // Poll
  pollBox:{ minWidth:200 },
  pollQuestion:{ fontSize:14, fontWeight:"bold", color:T.white, fontFamily:T.serif, marginBottom:4, lineHeight:1.4 },
  pollSub:{ fontSize:10, color:T.silverDim, marginBottom:8 },
  pollOption:{ position:"relative", background:T.dark3, borderRadius:8, marginBottom:6, padding:"8px 10px", cursor:"pointer", overflow:"hidden" },
  pollBar:{ position:"absolute", top:0, left:0, height:"100%", borderRadius:8, transition:"width 0.4s" },
  pollOptionRow:{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"center" },
  pollOptLabel:{ fontSize:13, fontFamily:T.sans },
  pollPct:{ fontSize:11, color:T.silverDim },
  pollClosed:{ fontSize:10, color:T.silverDim, textAlign:"center", marginTop:6, fontStyle:"italic" },
  pollCloseBtn:{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.silverDim, padding:"4px 10px", fontSize:10, cursor:"pointer", marginTop:6, width:"100%", fontFamily:T.sans },

  // Input bar
  inputBar:{ position:"sticky", bottom:64, left:0, right:0, background:"rgba(12,12,12,0.97)", borderTop:`1px solid ${T.border}`, padding:"10px 10px", display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(20px)" },
  optBtn:{ width:36, height:36, borderRadius:"50%", background:T.dark2, border:`1px solid ${T.border}`, color:T.gold, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  textInput:{ flex:1, background:T.dark2, border:`1px solid ${T.dark3}`, borderRadius:24, padding:"9px 16px", color:T.white, fontSize:14, outline:"none", fontFamily:T.sans },
  sendBtn:{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${T.red},#8a1010)`, border:"none", color:T.white, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },

  // Options bar
  optionsBar:{ background:T.dark2, borderTop:`1px solid ${T.border}`, padding:"8px 12px", display:"flex", gap:8 },
  optItem:{ background:T.dark3, border:`1px solid ${T.border}`, borderRadius:20, color:T.dimText, padding:"7px 14px", fontSize:12, cursor:"pointer", fontFamily:T.sans },
};
