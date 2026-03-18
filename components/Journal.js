'use client'
import { useState, useEffect } from 'react'

const DEFAULT_PAIRS = ["EURUSD","GBPUSD","BTCUSDT"]
const DEFAULT_STRATEGIES = ["Trend Following","Breakout","Trend Rejection"]
const DEFAULT_EMOTIONS = ["Calm","Confident","Anxious","Revenge Trading"]
const GRADES = ["A","B","C","D"]
const OUTCOMES = ["Win","Loss","Breakeven"]
const TIMEFRAMES = ["Daily","4 Hour","1 Hour","15 Min","5 Min"]
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

const outcomeColor = { Win:"#e2e8f0", Loss:"#60a5fa", Breakeven:"#a78bfa" }
const gradeColor = { A:"#4ade80", B:"#60a5fa", C:"#fbbf24", D:"#f87171" }
const stratColorList = ["#818cf8","#34d399","#fb923c","#f472b6","#facc15","#38bdf8"]
const pairColorList = ["#60a5fa","#a78bfa","#fbbf24","#34d399","#f87171","#fb923c"]
const emotionColorList = ["#4ade80","#818cf8","#f87171","#fbbf24","#38bdf8","#f472b6"]

const emptyEntry = () => ({ pair:"",strategy:"",reason:"",right:"",mistakes:"",learnings:"",outcome:"",pnl:"",grade:"",rr:"",emotion:"",accountSize:"",screenshots:{} })

const s = {
  app: { background:"#0f1117", minHeight:"100vh", color:"#e2e8f0", fontFamily:"system-ui, sans-serif", padding:0 },
  nav: { background:"#161b27", borderBottom:"0.5px solid #2d3448", display:"flex", alignItems:"center", gap:6, padding:"0 16px", height:52 },
  navBtn: (a) => ({ padding:"6px 12px", borderRadius:8, border:a?"0.5px solid #4b5563":"none", background:a?"#1e2535":"transparent", cursor:"pointer", fontSize:13, color:a?"#e2e8f0":"#6b7280", fontWeight:a?500:400 }),
  page: { padding:"20px" },
  card: { background:"#161b27", border:"0.5px solid #2d3448", borderRadius:12, padding:"16px 20px", marginBottom:16 },
  lbl: { fontSize:11, color:"#6b7280", marginBottom:4, display:"block", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.04em" },
  inp: { width:"100%", padding:"8px 10px", border:"0.5px solid #2d3448", borderRadius:8, background:"#0f1117", color:"#e2e8f0", fontSize:14, boxSizing:"border-box", outline:"none" },
  ta: { width:"100%", padding:"8px 10px", border:"0.5px solid #2d3448", borderRadius:8, background:"#0f1117", color:"#e2e8f0", fontSize:14, boxSizing:"border-box", resize:"vertical", minHeight:72, fontFamily:"inherit", lineHeight:1.5, outline:"none" },
  sel: { width:"100%", padding:"8px 10px", border:"0.5px solid #2d3448", borderRadius:8, background:"#0f1117", color:"#e2e8f0", fontSize:14, boxSizing:"border-box", cursor:"pointer", outline:"none" },
  btn: (a,c) => ({ padding:"7px 0", borderRadius:8, border:a?`1.5px solid ${c}`:"0.5px solid #2d3448", background:a?"rgba(255,255,255,0.05)":"transparent", cursor:"pointer", fontSize:13, fontWeight:a?500:400, color:a?c:"#6b7280", flex:1 }),
  metricCard: (c) => ({ background:"#1a2035", borderRadius:10, padding:"12px 16px", flex:1, minWidth:90, borderLeft:`3px solid ${c||"#2d3448"}` }),
  aiBox: { background:"#0d1117", border:"0.5px solid #818cf830", borderRadius:10, padding:"14px 16px", marginTop:12, fontSize:13, color:"#cbd5e1", lineHeight:1.8 },
  aiBtnStyle: { padding:"8px 18px", borderRadius:8, border:"0.5px solid #818cf8", background:"rgba(129,140,248,0.08)", cursor:"pointer", fontSize:13, fontWeight:500, color:"#818cf8" },
}

const dbGet = async (table, key) => {
  const res = await fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'get', table, key }) })
  const data = await res.json()
  return data.data
}

const dbSet = async (table, key, data) => {
  await fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'set', table, key, data }) })
}

const callAI = async (prompt, images=[]) => {
  const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt, images }) })
  const data = await res.json()
  return data.result || data.error || 'No response received.'
}

function Field({ label, children }) {
  return <div style={{ marginBottom:14 }}><label style={s.lbl}>{label}</label>{children}</div>
}

function StatCard({ label, value, color }) {
  return (
    <div style={s.metricCard(color)}>
      <div style={{ fontSize:11, color:"#6b7280", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:500, color:color||"#e2e8f0" }}>{value}</div>
    </div>
  )
}

function BarChart({ data, colors, total }) {
  const max = Math.max(1, ...Object.values(data))
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {Object.entries(data).sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
        <div key={k}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#9ca3af", marginBottom:4 }}>
            <span>{k}</span><span style={{ color:colors?.[k]||"#60a5fa" }}>{v}{total?` (${Math.round((v/total)*100)}%)`:""}</span>
          </div>
          <div style={{ height:8, background:"#1a2035", borderRadius:4, overflow:"hidden" }}>
            <div style={{ width:`${Math.round((v/max)*100)}%`, height:"100%", background:colors?.[k]||"#60a5fa", borderRadius:4, minWidth:4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function InlineAddSelect({ label, value, onChange, listItems, setListItems }) {
  const [adding, setAdding] = useState(false)
  const [val, setVal] = useState("")
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <label style={s.lbl}>{label}</label>
        {!adding && <button onClick={()=>setAdding(true)} style={{ fontSize:11, color:"#6b7280", background:"transparent", border:"none", cursor:"pointer", padding:0 }}>+ Add new</button>}
      </div>
      {adding ? (
        <div style={{ display:"flex", gap:6 }}>
          <input style={{ ...s.inp, flex:1 }} autoFocus placeholder={`New ${label.toLowerCase()}...`} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&val.trim()){setListItems(p=>[...p,val.trim()]);onChange(val.trim());setVal("");setAdding(false);}}} />
          <button onClick={()=>{ if(val.trim()){setListItems(p=>[...p,val.trim()]);onChange(val.trim());} setVal("");setAdding(false); }} style={{ padding:"6px 12px", borderRadius:8, border:"0.5px solid #2d3448", background:"#1e2535", color:"#e2e8f0", cursor:"pointer", fontSize:13 }}>Add</button>
          <button onClick={()=>{setAdding(false);setVal("")}} style={{ padding:"6px 10px", borderRadius:8, border:"0.5px solid #2d3448", background:"transparent", color:"#6b7280", cursor:"pointer", fontSize:13 }}>✕</button>
        </div>
      ) : (
        <select style={s.sel} value={value} onChange={e=>onChange(e.target.value)}>
          <option value="">Select {label.toLowerCase()}</option>
          {listItems.map(it=><option key={it}>{it}</option>)}
        </select>
      )}
    </div>
  )
}

function Lightbox({ imgs, idx, setIdx, onClose }) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({x:0,y:0})
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({x:0,y:0})
  const resetZoom = () => { setZoom(1); setPan({x:0,y:0}) }
  const changeImg = (i) => { setIdx(i); resetZoom() }
  const allImgs = Object.entries(imgs).map(([tf,sc])=>({...sc,tf}))
  if(!allImgs.length) return null
  const cur = allImgs[idx]||allImgs[0]
  return (
    <div onClick={onClose} style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.95)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
      <div style={{ position:"absolute", top:16, right:16, display:"flex", gap:8 }} onClick={e=>e.stopPropagation()}>
        <button onClick={()=>setZoom(z=>Math.min(5,z+0.5))} style={{ padding:"5px 12px", borderRadius:8, border:"0.5px solid #4b5563", background:"#161b27", color:"#e2e8f0", cursor:"pointer", fontSize:14 }}>+</button>
        <button onClick={resetZoom} style={{ padding:"5px 12px", borderRadius:8, border:"0.5px solid #4b5563", background:"#161b27", color:"#6b7280", cursor:"pointer", fontSize:12 }}>{Math.round(zoom*100)}%</button>
        <button onClick={()=>setZoom(z=>Math.max(1,z-0.5))} style={{ padding:"5px 12px", borderRadius:8, border:"0.5px solid #4b5563", background:"#161b27", color:"#e2e8f0", cursor:"pointer", fontSize:14 }}>−</button>
        <button onClick={onClose} style={{ padding:"5px 12px", borderRadius:8, border:"0.5px solid #4b5563", background:"#161b27", color:"#f87171", cursor:"pointer", fontSize:13 }}>✕</button>
      </div>
      <div style={{ fontSize:12, color:"#818cf8", marginBottom:10, fontWeight:500 }}>{cur.tf}</div>
      <div onWheel={e=>{e.preventDefault();setZoom(z=>Math.min(5,Math.max(1,z-e.deltaY*0.002)))}}
        onMouseDown={e=>{if(zoom<=1)return;e.preventDefault();setDragging(true);setDragStart({x:e.clientX-pan.x,y:e.clientY-pan.y})}}
        onMouseMove={e=>{if(!dragging)return;setPan({x:e.clientX-dragStart.x,y:e.clientY-dragStart.y})}}
        onMouseUp={()=>setDragging(false)} onMouseLeave={()=>setDragging(false)} onClick={e=>e.stopPropagation()}
        style={{ overflow:"hidden", width:"90vw", height:"75vh", display:"flex", alignItems:"center", justifyContent:"center", cursor:zoom>1?(dragging?"grabbing":"grab"):"zoom-in", userSelect:"none" }}>
        <img src={cur.data} alt="" style={{ maxWidth:"100%", maxHeight:"100%", borderRadius:zoom===1?8:0, transform:`scale(${zoom}) translate(${pan.x/zoom}px,${pan.y/zoom}px)`, transformOrigin:"center", transition:dragging?"none":"transform 0.15s", pointerEvents:"none" }} />
      </div>
      {allImgs.length>1 && (
        <div style={{ display:"flex", gap:8, marginTop:12 }} onClick={e=>e.stopPropagation()}>
          {allImgs.map((img,i)=>(
            <button key={i} onClick={()=>changeImg(i)} style={{ padding:"4px 10px", borderRadius:8, border:`0.5px solid ${i===idx?"#818cf8":"#2d3448"}`, background:i===idx?"rgba(129,140,248,0.15)":"transparent", color:i===idx?"#818cf8":"#6b7280", cursor:"pointer", fontSize:11 }}>{img.tf}</button>
          ))}
        </div>
      )}
      <div style={{ marginTop:8, fontSize:11, color:"#4b5563" }}>Scroll to zoom · drag to pan · click outside to close</div>
    </div>
  )
}

function AIBlock({ result, loading }) {
  if(!result && !loading) return null
  return (
    <div style={s.aiBox}>
      {loading ? <div style={{ color:"#4b5563" }}>Analysing...</div> : <div style={{ whiteSpace:"pre-wrap" }}>{result}</div>}
    </div>
  )
}
export default function Journal() {
  const [tab, setTab] = useState("home")
  const [entries, setEntries] = useState({})
  const [weekOverviews, setWeekOverviews] = useState({})
  const [loading, setLoading] = useState(true)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [form, setForm] = useState(emptyEntry())
  const [saved, setSaved] = useState(false)
  const [dashMonth, setDashMonth] = useState(new Date().getMonth())
  const [dashYear, setDashYear] = useState(new Date().getFullYear())
  const [lightboxDate, setLightboxDate] = useState(null)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [pairs, setPairs] = useState(DEFAULT_PAIRS)
  const [strategies, setStrategies] = useState(DEFAULT_STRATEGIES)
  const [emotions, setEmotions] = useState(DEFAULT_EMOTIONS)
  const [weekOverviewForm, setWeekOverviewForm] = useState({})
  const [overviewSaved, setOverviewSaved] = useState(false)
  const [expandedOverview, setExpandedOverview] = useState(false)
  const [dailyAI, setDailyAI] = useState({})
  const [dailyAILoading, setDailyAILoading] = useState(false)
  const [weeklyAI, setWeeklyAI] = useState({})
  const [weeklyAILoading, setWeeklyAILoading] = useState(false)
  const [patternAI, setPatternAI] = useState({})
  const [patternAILoading, setPatternAILoading] = useState(false)
  const [briefingAI, setBriefingAI] = useState("")
  const [briefingAILoading, setBriefingAILoading] = useState(false)
  const [gradeSuggest, setGradeSuggest] = useState("")
  const [gradeSuggestLoading, setGradeSuggestLoading] = useState(false)
  const [selectedWeeklySummaryKey, setSelectedWeeklySummaryKey] = useState(null)
  const [selectedPatternKey, setSelectedPatternKey] = useState(null)
  const [draft, setDraft] = useState({})
  const [draftStatus, setDraftStatus] = useState({})

  const pairColorMap = {}; pairs.forEach((p,i)=>{pairColorMap[p]=pairColorList[i%pairColorList.length]})
  const stratColorMap = {}; strategies.forEach((s,i)=>{stratColorMap[s]=stratColorList[i%stratColorList.length]})
  const emotionColorMap = {}; emotions.forEach((e,i)=>{emotionColorMap[e]=emotionColorList[i%emotionColorList.length]})

  useEffect(() => {
    (async () => {
      try {
        const e = await dbGet('journal_entries', 'all_entries'); if(e) setEntries(e)
        const o = await dbGet('journal_entries', 'week_overviews'); if(o) setWeekOverviews(o)
        const l = await dbGet('settings', 'lists'); if(l){if(l.pairs)setPairs(l.pairs);if(l.strategies)setStrategies(l.strategies);if(l.emotions)setEmotions(l.emotions)}
        const a = await dbGet('ai_results', 'all_ai'); if(a){if(a.dailyAI)setDailyAI(a.dailyAI);if(a.weeklyAI)setWeeklyAI(a.weeklyAI);if(a.patternAI)setPatternAI(a.patternAI);if(a.briefingAI)setBriefingAI(a.briefingAI)}
        const d = await dbGet('settings', 'drafts'); if(d) setDraft(d)
      } catch(e){ console.error(e) }
      setLoading(false)
    })()
  }, [])

  const saveEntries = async (newEntries) => { setEntries(newEntries); await dbSet('journal_entries','all_entries',newEntries) }
  const saveOverviews = async (newOv) => { setWeekOverviews(newOv); await dbSet('journal_entries','week_overviews',newOv) }
  const saveLists = async (newLists) => { await dbSet('settings','lists',newLists) }
  const saveAI = async (newAI) => { await dbSet('ai_results','all_ai',newAI) }
  const saveDrafts = async (newDraft) => { setDraft(newDraft); await dbSet('settings','drafts',newDraft) }

  const getMonday = () => { const d=new Date(); const mon=new Date(d); mon.setDate(d.getDate()-((d.getDay()+6)%7)); return mon.toISOString().slice(0,10) }
  const wk = getMonday()

  useEffect(()=>{
    const ov=weekOverviews[wk]||{}
    const init={}
    pairs.forEach(p=>{init[p]=ov[p]||""})
    setWeekOverviewForm(init)
  },[wk, pairs, weekOverviews])

  useEffect(()=>{
    if(!selectedDate) return
    if(entries[selectedDate]){
      setForm({...entries[selectedDate], screenshots:entries[selectedDate].screenshots||{}})
    } else if(draft[selectedDate]){
      setForm({...draft[selectedDate]})
      setDraftStatus(p=>({...p,[selectedDate]:"loaded"}))
    } else {
      setForm(emptyEntry())
    }
    setGradeSuggest("")
  },[selectedDate])

  const updateForm = (updater) => {
    setForm(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater
      if(selectedDate && !entries[selectedDate]){
        const newDraft = {...draft,[selectedDate]:next}
        saveDrafts(newDraft)
        setDraftStatus(p=>({...p,[selectedDate]:"saved"}))
      }
      return next
    })
  }

  const discardDraft = async () => {
    if(!selectedDate) return
    const newDraft = {...draft}; delete newDraft[selectedDate]
    await saveDrafts(newDraft)
    setDraftStatus(p=>({...p,[selectedDate]:""}))
    setForm(emptyEntry())
  }

  const saveEntry = async () => {
    if(!selectedDate) return
    const newEntries = {...entries,[selectedDate]:{...form}}
    await saveEntries(newEntries)
    const newDraft = {...draft}; delete newDraft[selectedDate]
    await saveDrafts(newDraft)
    setDraftStatus(p=>({...p,[selectedDate]:""}))
    setSaved(true); setTimeout(()=>setSaved(false),1800)
  }

  const saveOverview = async () => {
    const newOv = {...weekOverviews,[wk]:{...weekOverviewForm}}
    await saveOverviews(newOv)
    setOverviewSaved(true); setTimeout(()=>setOverviewSaved(false),1800)
  }

  const handleFile = (tf, e) => {
    const f=e.target.files[0]; if(!f) return
    const r=new FileReader(); r.onload=ev=>updateForm(p=>({...p,screenshots:{...p.screenshots,[tf]:{data:ev.target.result,name:f.name}}})); r.readAsDataURL(f)
  }

  const removeScreenshot = (tf) => updateForm(p=>{ const sc={...p.screenshots}; delete sc[tf]; return{...p,screenshots:sc} })

  const isWeekend = (ds) => { const d=new Date(ds+"T12:00:00"); return d.getDay()===0||d.getDay()===6 }
  const getMonthEntries = (y,m) => { const prefix=`${y}-${String(m+1).padStart(2,"0")}`; return Object.entries(entries).filter(([k])=>k.startsWith(prefix)).map(([k,v])=>({key:k,...v,screenshots:v.screenshots||{}})) }
  const calcStats = (trades) => {
    const w=trades.filter(t=>t.outcome)
    const wins=w.filter(t=>t.outcome==="Win").length, losses=w.filter(t=>t.outcome==="Loss").length
    const winRate=w.length?Math.round((wins/w.length)*100):0
    const totalPnl=w.reduce((s,t)=>s+(parseFloat(t.pnl)||0),0)
    const cb=(arr,key)=>arr.reduce((acc,e)=>{if(e[key])acc[e[key]]=(acc[e[key]]||0)+1;return acc},{})
    return{withOutcome:w,wins,losses,winRate,totalPnl,pairCounts:cb(w,"pair"),stratCounts:cb(w,"strategy"),gradeCounts:cb(w,"grade"),emotionCounts:cb(w,"emotion")}
  }

  const runDailyAI = async () => {
    if(!selectedDate) return
    setDailyAILoading(true)
    const f=form
    const imgs=Object.values(f.screenshots||{})
    const tfList=Object.keys(f.screenshots||{}).join(", ")
    const prompt=`You are a professional trading coach reviewing a trader's journal entry.\n\nTrade details:\n- Date: ${selectedDate}\n- Pair: ${f.pair||"N/A"}\n- Strategy: ${f.strategy||"N/A"}\n- Reason to enter: ${f.reason||"N/A"}\n- Outcome: ${f.outcome||"N/A"}\n- P&L: ${f.pnl||"N/A"}\n- R:R ratio: ${f.rr||"N/A"}\n- Grade: ${f.grade||"N/A"}\n- Emotional state: ${f.emotion||"N/A"}\n- What went right: ${f.right||"N/A"}\n- Mistakes: ${f.mistakes||"N/A"}\n- Learnings: ${f.learnings||"N/A"}\n- Chart timeframes: ${tfList||"None"}\n\n${imgs.length?`Analyse the ${imgs.length} chart screenshot(s) for price action, structure, trend and entry quality.`:""}\n\nProvide:\n1. Chart analysis (if images provided)\n2. Trade execution review\n3. Risk management feedback\n4. Emotional/psychological notes\n5. Key improvement point`
    const result = await callAI(prompt, imgs)
    const newDailyAI = {...dailyAI,[selectedDate]:result}
    setDailyAI(newDailyAI)
    await saveAI({dailyAI:newDailyAI,weeklyAI,patternAI,briefingAI})
    setDailyAILoading(false)
  }

  const runGradeSuggest = async () => {
    setGradeSuggestLoading(true)
    const f=form
    const prompt=`You are a trading coach. Based on this trade, suggest a grade (A, B, C, or D) and explain why in 2-3 sentences.\n\n- Strategy: ${f.strategy||"N/A"}\n- Reason: ${f.reason||"N/A"}\n- Outcome: ${f.outcome||"N/A"}\n- R:R: ${f.rr||"N/A"}\n- Emotion: ${f.emotion||"N/A"}\n- What went right: ${f.right||"N/A"}\n- Mistakes: ${f.mistakes||"N/A"}\n\nRespond with: "Suggested grade: X — [brief reason]"`
    const result = await callAI(prompt,[])
    setGradeSuggest(result)
    setGradeSuggestLoading(false)
  }

  const runWeeklySummary = async () => {
    setWeeklyAILoading(true)
    const d=new Date(); const mon=new Date(d); mon.setDate(d.getDate()-((d.getDay()+6)%7))
    const weekKey=mon.toISOString().slice(0,10)
    setSelectedWeeklySummaryKey(weekKey)
    const weekDates=Array.from({length:5},(_,i)=>{ const dd=new Date(mon); dd.setDate(mon.getDate()+i); return dd.toISOString().slice(0,10) })
    const weekTrades=weekDates.map(dt=>entries[dt]?{date:dt,...entries[dt]}:null).filter(Boolean)
    if(!weekTrades.length){const newW={...weeklyAI,[weekKey]:"No trades logged this week."};setWeeklyAI(newW);await saveAI({dailyAI,weeklyAI:newW,patternAI,briefingAI});setWeeklyAILoading(false);return}
    const summary=weekTrades.map(t=>`${t.date}: ${t.pair||"?"} | ${t.strategy||"?"} | ${t.outcome||"?"} | P&L: ${t.pnl||"0"} | Grade: ${t.grade||"?"} | Emotion: ${t.emotion||"?"}`).join("\n")
    const prompt=`You are a professional trading coach. Analyse this trader's week.\n\nWeekly trades:\n${summary}\n\nProvide:\n1. Weekly performance summary\n2. What went well\n3. Key patterns in mistakes or emotional states\n4. Best and worst trade\n5. 3 specific action points for next week`
    const result = await callAI(prompt,[])
    const newW={...weeklyAI,[weekKey]:result}
    setWeeklyAI(newW)
    await saveAI({dailyAI,weeklyAI:newW,patternAI,briefingAI})
    setWeeklyAILoading(false)
  }

  const runPatternDetector = async () => {
    setPatternAILoading(true)
    const allTrades=Object.entries(entries).map(([k,v])=>({date:k,...v})).filter(t=>t.outcome)
    const patternKey=new Date().toISOString().slice(0,10)
    setSelectedPatternKey(patternKey)
    if(allTrades.length<3){const newP={...patternAI,[patternKey]:"Log at least 3 trades to detect patterns."};setPatternAI(newP);await saveAI({dailyAI,weeklyAI,patternAI:newP,briefingAI});setPatternAILoading(false);return}
    const summary=allTrades.slice(-50).map(t=>`${t.date}: ${t.pair||"?"} | ${t.strategy||"?"} | ${t.outcome||"?"} | P&L: ${t.pnl||"0"} | Grade: ${t.grade||"?"} | Emotion: ${t.emotion||"?"} | Day: ${new Date(t.date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"short"})}`).join("\n")
    const prompt=`You are a trading data analyst. Find meaningful patterns in this trader's history.\n\nTrade history:\n${summary}\n\nReport on:\n1. Best and worst performing pair\n2. Best and worst strategy\n3. Emotional state vs outcomes\n4. Day of week patterns\n5. Grade vs outcome correlation\n6. Any other significant patterns\n\nBe specific with numbers and percentages.`
    const result = await callAI(prompt,[])
    const newP={...patternAI,[patternKey]:result}
    setPatternAI(newP)
    await saveAI({dailyAI,weeklyAI,patternAI:newP,briefingAI})
    setPatternAILoading(false)
  }

  const runBriefing = async () => {
    setBriefingAILoading(true)
    const overview=weekOverviews[wk]||{}
    const notes=pairs.map(p=>`${p}: ${overview[p]||"No notes"}`).join("\n")
    const allTrades=Object.entries(entries).map(([k,v])=>({date:k,...v})).filter(t=>t.outcome).slice(-20)
    const recentSummary=allTrades.map(t=>`${t.date}: ${t.pair||"?"} | ${t.strategy||"?"} | ${t.outcome||"?"}`).join("\n")
    const prompt=`You are a professional trading analyst preparing a trader for their week.\n\nPre-week notes per pair:\n${notes}\n\nRecent trade history:\n${recentSummary}\n\nProvide:\n1. Organised trade plan per pair\n2. Risk reminders based on recent patterns\n3. Weekly mindset focus\n4. What to watch out for`
    const result = await callAI(prompt,[])
    setBriefingAI(result)
    await saveAI({dailyAI,weeklyAI,patternAI,briefingAI:result})
    setBriefingAILoading(false)
  }

  const exportJSON = () => {
    const data={entries,weekOverviews,lists:{pairs,strategies,emotions},ai:{dailyAI,weeklyAI,patternAI,briefingAI}}
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"})
    const url=URL.createObjectURL(blob)
    const a=document.createElement("a");a.href=url;a.download=`trading-journal-backup-${new Date().toISOString().slice(0,10)}.json`;a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = async (e) => {
    const f=e.target.files[0]; if(!f) return
    const text=await f.text()
    try {
      const data=JSON.parse(text)
      if(data.entries){await saveEntries(data.entries)}
      if(data.weekOverviews){await saveOverviews(data.weekOverviews)}
      if(data.lists){setPairs(data.lists.pairs||DEFAULT_PAIRS);setStrategies(data.lists.strategies||DEFAULT_STRATEGIES);setEmotions(data.lists.emotions||DEFAULT_EMOTIONS);await saveLists(data.lists)}
      if(data.ai){setDailyAI(data.ai.dailyAI||{});setWeeklyAI(data.ai.weeklyAI||{});setPatternAI(data.ai.patternAI||{});setBriefingAI(data.ai.briefingAI||"");await saveAI(data.ai)}
      alert("Journal restored successfully!")
    } catch(err){ alert("Invalid backup file.") }
    e.target.value=""
  }

  const { firstDay, daysInMonth } = { firstDay:new Date(calYear,calMonth,1).getDay(), daysInMonth:new Date(calYear,calMonth+1,0).getDate() }
  const today = new Date().toISOString().slice(0,10)
  const dashTrades = getMonthEntries(dashYear,dashMonth)
  const stats = calcStats(dashTrades)
  const pastMonths = [...new Set(Object.keys(entries).map(k=>k.slice(0,7)))].sort().reverse()
  const lightboxScreenshots = lightboxDate ? (entries[lightboxDate]?.screenshots||form.screenshots||{}) : {}

  if(loading) return <div style={{...s.app,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}><div style={{color:"#6b7280"}}>Loading journal...</div></div>

  return (
    <div style={s.app}>
      {lightboxDate && Object.keys(lightboxScreenshots).length>0 && (
        <Lightbox imgs={lightboxScreenshots} idx={lightboxIdx} setIdx={setLightboxIdx} onClose={()=>setLightboxDate(null)} />
      )}
      <div style={s.nav}>
        <div style={{fontSize:15,fontWeight:500,color:"#e2e8f0",marginRight:4}}>TJ</div>
        {[["home","Calendar"],["journal","Entry"],["dashboard","Dashboard"],["review","AI Review"]].map(([id,lbl])=>(
          <button key={id} style={s.navBtn(tab===id)} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab==="home" && (
        <div style={s.page}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div><div style={{fontSize:22,fontWeight:500}}>Trading calendar</div><div style={{fontSize:13,color:"#6b7280",marginTop:2}}>Click any weekday to log or review a trade</div></div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>{let m=calMonth-1,y=calYear;if(m<0){m=11;y--}setCalMonth(m);setCalYear(y)}} style={{...s.navBtn(false),border:"0.5px solid #2d3448"}}>‹</button>
              <span style={{fontSize:13,fontWeight:500,color:"#e2e8f0",minWidth:130,textAlign:"center"}}>{MONTHS[calMonth]} {calYear}</span>
              <button onClick={()=>{let m=calMonth+1,y=calYear;if(m>11){m=0;y++}setCalMonth(m);setCalYear(y)}} style={{...s.navBtn(false),border:"0.5px solid #2d3448"}}>›</button>
            </div>
          </div>
          <div style={s.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:500,color:"#9ca3af"}}>Week overview — {new Date(wk+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</div>
              <button onClick={()=>setExpandedOverview(p=>!p)} style={{fontSize:12,color:"#6b7280",background:"transparent",border:"none",cursor:"pointer"}}>{expandedOverview?"Collapse ▲":"Expand ▼"}</button>
            </div>
            {expandedOverview ? (
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))",gap:12,marginBottom:14}}>
                  {pairs.map(p=>(
                    <div key={p}>
                      <label style={{...s.lbl,color:pairColorMap[p]}}>{p}</label>
                      <textarea style={{...s.ta,minHeight:80,borderColor:pairColorMap[p]+"40"}} placeholder={`Trade ideas, bias, key levels for ${p}...`} value={weekOverviewForm[p]||""} onChange={e=>setWeekOverviewForm(prev=>({...prev,[p]:e.target.value}))} />
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"flex-end"}}>
                  <button onClick={saveOverview} style={{padding:"7px 20px",borderRadius:8,border:"0.5px solid #2d3448",background:"#1e2535",cursor:"pointer",fontSize:13,fontWeight:500,color:overviewSaved?"#4ade80":"#e2e8f0"}}>{overviewSaved?"Saved!":"Save overview"}</button>
                </div>
              </>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))",gap:10}}>
                {pairs.map(p=>{const txt=weekOverviewForm[p];return(
                  <div key={p} onClick={()=>setExpandedOverview(true)} style={{background:"#0f1117",borderRadius:8,padding:"10px 12px",border:`0.5px solid ${pairColorMap[p]}40`,cursor:"pointer"}}>
                    <div style={{fontSize:11,fontWeight:500,color:pairColorMap[p],marginBottom:4}}>{p}</div>
                    <div style={{fontSize:12,color:txt?"#9ca3af":"#4b5563",lineHeight:1.5}}>{txt?txt.slice(0,80)+(txt.length>80?"...":""):"No notes yet"}</div>
                  </div>
                )})}
              </div>
            )}
          </div>
          <div style={s.card}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
              {DAY_NAMES.map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:"#6b7280",padding:"4px 0",fontWeight:500}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} />)}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day=i+1
                const ds=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
                const entry=entries[ds]; const wknd=isWeekend(ds); const isToday=ds===today; const oc=entry?.outcome
                return(
                  <div key={day} onClick={()=>{if(wknd)return;setSelectedDate(ds);setTab("journal")}} style={{borderRadius:8,padding:"8px 6px",cursor:wknd?"default":"pointer",textAlign:"center",minHeight:52,background:isToday?"#1e2535":oc?"rgba(255,255,255,0.03)":"transparent",border:isToday?"1px solid #4b5563":oc?`0.5px solid ${outcomeColor[oc]}30`:"0.5px solid transparent",opacity:wknd?0.3:1}}>
                    <div style={{fontSize:13,color:isToday?"#e2e8f0":"#9ca3af",fontWeight:isToday?500:400}}>{day}</div>
                    {oc&&<div style={{marginTop:4,fontSize:10,fontWeight:500,color:outcomeColor[oc]}}>{oc==="Win"?"W":oc==="Loss"?"L":"BE"}{entry.pnl?<div style={{fontSize:9,color:"#6b7280",marginTop:2}}>{parseFloat(entry.pnl)>=0?"+":""}{parseFloat(entry.pnl).toFixed(0)}</div>:null}</div>}
                    {entry&&!oc&&<div style={{marginTop:4,width:6,height:6,borderRadius:"50%",background:"#4b5563",margin:"4px auto 0"}} />}
                    {!entry&&draft[ds]&&<div style={{marginTop:4,width:6,height:6,borderRadius:"50%",background:"#fbbf24",margin:"4px auto 0"}} />}
                  </div>
                )
              })}
            </div>
          </div>
          <div style={s.card}>
            <div style={{fontSize:13,fontWeight:500,marginBottom:14,color:"#9ca3af"}}>Month summary — {MONTHS[calMonth]} {calYear}</div>
            {(()=>{const ms=calcStats(getMonthEntries(calYear,calMonth));return(
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <StatCard label="Trades" value={ms.withOutcome.length} color="#4b5563" />
                <StatCard label="Win rate" value={`${ms.winRate}%`} color={ms.winRate>=50?"#e2e8f0":"#60a5fa"} />
                <StatCard label="Wins" value={ms.wins} color="#e2e8f0" />
                <StatCard label="Losses" value={ms.losses} color="#60a5fa" />
                <StatCard label="P&L" value={`${ms.totalPnl>=0?"+":""}$${ms.totalPnl.toFixed(2)}`} color={ms.totalPnl>=0?"#e2e8f0":"#60a5fa"} />
              </div>
            )})()}
          </div>
          {pastMonths.length>0&&(
            <div style={s.card}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:14,color:"#9ca3af"}}>Past journals</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {pastMonths.map(ym=>{const[y,m]=ym.split("-").map(Number);const ms=calcStats(getMonthEntries(y,m-1));return(
                  <div key={ym} onClick={()=>{setDashYear(y);setDashMonth(m-1);setTab("dashboard")}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#0f1117",borderRadius:8,border:"0.5px solid #2d3448",cursor:"pointer"}}>
                    <div style={{fontSize:14,fontWeight:500}}>{MONTHS[m-1]} {y}</div>
                    <div style={{display:"flex",gap:16,fontSize:12}}>
                      <span style={{color:"#6b7280"}}>{ms.withOutcome.length} trades</span>
                      <span style={{color:ms.winRate>=50?"#e2e8f0":"#60a5fa"}}>{ms.winRate}% WR</span>
                      <span style={{color:ms.totalPnl>=0?"#e2e8f0":"#60a5fa"}}>{ms.totalPnl>=0?"+":""}${ms.totalPnl.toFixed(2)}</span>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="journal" && (
        <div style={s.page}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
            <button onClick={()=>setTab("home")} style={{...s.navBtn(false),border:"0.5px solid #2d3448",fontSize:12}}>← Calendar</button>
            {selectedDate&&<div style={{fontSize:15,fontWeight:500}}>{new Date(selectedDate+"T12:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</div>}
            {!selectedDate&&<div style={{fontSize:15,fontWeight:500,color:"#6b7280"}}>Select a date from the calendar</div>}
          </div>
          {!selectedDate?(
            <div style={{...s.card,textAlign:"center",padding:"3rem",color:"#6b7280"}}>Go to the calendar and click a weekday to log a trade.</div>
          ):(
            <div style={s.card}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))",gap:12}}>
                <Field label="Account size ($)"><input style={s.inp} type="number" placeholder="e.g. 10000" value={form.accountSize} onChange={e=>updateForm(p=>({...p,accountSize:e.target.value}))} /></Field>
                <InlineAddSelect label="Pair traded" value={form.pair} onChange={v=>updateForm(p=>({...p,pair:v}))} listItems={pairs} setListItems={p=>{setPairs(p);saveLists({pairs:p,strategies,emotions})}} />
                <InlineAddSelect label="Strategy" value={form.strategy} onChange={v=>updateForm(p=>({...p,strategy:v}))} listItems={strategies} setListItems={p=>{setStrategies(p);saveLists({pairs,strategies:p,emotions})}} />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))",gap:12}}>
                <Field label="Outcome"><div style={{display:"flex",gap:6}}>{OUTCOMES.map(o=><button key={o} onClick={()=>updateForm(p=>({...p,outcome:o}))} style={s.btn(form.outcome===o,outcomeColor[o])}>{o}</button>)}</div></Field>
                <Field label="P&L ($)"><input style={s.inp} type="number" placeholder="e.g. 250 or -150" value={form.pnl} onChange={e=>updateForm(p=>({...p,pnl:e.target.value}))} /></Field>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))",gap:12}}>
                <Field label="Grade">
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {GRADES.map(g=><button key={g} onClick={()=>updateForm(p=>({...p,grade:g}))} style={s.btn(form.grade===g,gradeColor[g])}>{g}</button>)}
                    <button onClick={runGradeSuggest} disabled={gradeSuggestLoading} style={{...s.aiBtnStyle,fontSize:11,padding:"6px 10px",whiteSpace:"nowrap"}}>{gradeSuggestLoading?"...":"AI suggest"}</button>
                  </div>
                  {(gradeSuggest||gradeSuggestLoading)&&<AIBlock result={gradeSuggest} loading={gradeSuggestLoading} />}
                </Field>
                <Field label="Risk/Reward ratio"><input style={s.inp} type="text" placeholder="e.g. 1:2" value={form.rr} onChange={e=>updateForm(p=>({...p,rr:e.target.value}))} /></Field>
                <InlineAddSelect label="Emotional state" value={form.emotion} onChange={v=>updateForm(p=>({...p,emotion:v}))} listItems={emotions} setListItems={p=>{setEmotions(p);saveLists({pairs,strategies,emotions:p})}} />
              </div>
              <Field label="Reason to enter trade"><textarea style={s.ta} placeholder="Why did you take this trade?" value={form.reason} onChange={e=>updateForm(p=>({...p,reason:e.target.value}))} /></Field>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Field label="What was done right"><textarea style={s.ta} placeholder="Execution, timing, discipline..." value={form.right} onChange={e=>updateForm(p=>({...p,right:e.target.value}))} /></Field>
                <Field label="Mistakes made"><textarea style={s.ta} placeholder="What went wrong?" value={form.mistakes} onChange={e=>updateForm(p=>({...p,mistakes:e.target.value}))} /></Field>
              </div>
              <Field label="Learnings"><textarea style={s.ta} placeholder="Key takeaway from this trade..." value={form.learnings} onChange={e=>updateForm(p=>({...p,learnings:e.target.value}))} /></Field>
              <Field label="Chart screenshots — upload per timeframe">
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px,1fr))",gap:10}}>
                  {TIMEFRAMES.map(tf=>{
                    const sc=form.screenshots?.[tf]
                    return(
                      <div key={tf} style={{background:"#0f1117",borderRadius:8,border:`0.5px solid ${sc?"#818cf840":"#2d3448"}`,padding:"10px",textAlign:"center"}}>
                        <div style={{fontSize:11,fontWeight:500,color:sc?"#818cf8":"#6b7280",marginBottom:8}}>{tf}</div>
                        {sc?(
                          <div style={{position:"relative",display:"inline-block"}}>
                            <img src={sc.data} alt={tf} onClick={()=>{setLightboxDate(selectedDate);setLightboxIdx(Object.keys(form.screenshots).indexOf(tf))}} style={{width:"100%",maxHeight:60,objectFit:"cover",borderRadius:6,cursor:"zoom-in"}} />
                            <button onClick={()=>removeScreenshot(tf)} style={{position:"absolute",top:-6,right:-6,width:16,height:16,borderRadius:"50%",background:"#f87171",border:"none",color:"#fff",fontSize:9,cursor:"pointer"}}>✕</button>
                          </div>
                        ):(
                          <label style={{fontSize:11,color:"#4b5563",cursor:"pointer",display:"block"}}>
                            + Upload
                            <input type="file" accept="image/*" onChange={e=>handleFile(tf,e)} style={{display:"none"}} />
                          </label>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Field>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,flexWrap:"wrap",gap:10}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <button onClick={saveEntry} style={{padding:"8px 22px",borderRadius:8,border:"0.5px solid #2d3448",background:"#1e2535",cursor:"pointer",fontSize:13,fontWeight:500,color:saved?"#4ade80":"#e2e8f0"}}>{saved?"Saved!":"Save entry"}</button>
                  <button onClick={runDailyAI} disabled={dailyAILoading} style={s.aiBtnStyle}>{dailyAILoading?"Analysing...":"AI trade review"}</button>
                  {draftStatus[selectedDate]&&!entries[selectedDate]&&(
                    <span style={{fontSize:11,color:"#fbbf24",display:"flex",alignItems:"center",gap:4}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:"#fbbf24",display:"inline-block"}} />
                      Draft saved
                    </span>
                  )}
                </div>
                <div style={{display:"flex",gap:8}}>
                  {draft[selectedDate]&&!entries[selectedDate]&&(
                    <button onClick={discardDraft} style={{padding:"8px 14px",borderRadius:8,border:"0.5px solid #f87171",background:"transparent",cursor:"pointer",fontSize:13,color:"#f87171"}}>Discard draft</button>
                  )}
                  <button onClick={()=>updateForm(emptyEntry())} style={{padding:"8px 18px",borderRadius:8,border:"0.5px solid #2d3448",background:"transparent",cursor:"pointer",fontSize:13,color:"#6b7280"}}>Clear</button>
                </div>
              </div>
              {(dailyAI[selectedDate]||dailyAILoading)&&<AIBlock result={dailyAI[selectedDate]} loading={dailyAILoading} />}
            </div>
          )}
        </div>
      )}

      {tab==="dashboard" && (
        <div style={s.page}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{fontSize:20,fontWeight:500}}>Dashboard</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>{let m=dashMonth-1,y=dashYear;if(m<0){m=11;y--}setDashMonth(m);setDashYear(y)}} style={{...s.navBtn(false),border:"0.5px solid #2d3448"}}>‹</button>
              <span style={{fontSize:13,fontWeight:500,color:"#e2e8f0",minWidth:130,textAlign:"center"}}>{MONTHS[dashMonth]} {dashYear}</span>
              <button onClick={()=>{let m=dashMonth+1,y=dashYear;if(m>11){m=0;y++}setDashMonth(m);setDashYear(y)}} style={{...s.navBtn(false),border:"0.5px solid #2d3448"}}>›</button>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <button onClick={exportJSON} style={{padding:"8px 18px",borderRadius:8,border:"0.5px solid #2d3448",background:"#1e2535",cursor:"pointer",fontSize:13,fontWeight:500,color:"#e2e8f0"}}>Export JSON backup</button>
            <label style={{padding:"8px 18px",borderRadius:8,border:"0.5px solid #2d3448",background:"transparent",cursor:"pointer",fontSize:13,color:"#6b7280"}}>
              Import JSON backup
              <input type="file" accept=".json" onChange={importJSON} style={{display:"none"}} />
            </label>
          </div>
          {pastMonths.length>1&&(
            <div style={s.card}>
              <div style={{fontSize:12,fontWeight:500,color:"#6b7280",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>All monthly history</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{borderBottom:"0.5px solid #2d3448"}}>
                    {["Month","Trades","Win rate","Wins","Losses","Total P&L","Top pair","Top strategy"].map(h=>(
                      <th key={h} style={{padding:"6px 10px",textAlign:"left",color:"#6b7280",fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {pastMonths.map(ym=>{
                      const[y,m]=ym.split("-").map(Number);const ms=calcStats(getMonthEntries(y,m-1))
                      const topPair=Object.entries(ms.pairCounts).sort((a,b)=>b[1]-a[1])[0]
                      const topStrat=Object.entries(ms.stratCounts).sort((a,b)=>b[1]-a[1])[0]
                      const isActive=dashMonth===m-1&&dashYear===y
                      return(
                        <tr key={ym} onClick={()=>{setDashYear(y);setDashMonth(m-1)}} style={{borderBottom:"0.5px solid #1a2035",cursor:"pointer",background:isActive?"#1a2035":"transparent"}}>
                          <td style={{padding:"8px 10px",fontWeight:500,color:isActive?"#e2e8f0":"#9ca3af"}}>{MONTHS[m-1]} {y}</td>
                          <td style={{padding:"8px 10px"}}>{ms.withOutcome.length}</td>
                          <td style={{padding:"8px 10px",fontWeight:500,color:ms.winRate>=50?"#e2e8f0":"#60a5fa"}}>{ms.winRate}%</td>
                          <td style={{padding:"8px 10px"}}>{ms.wins}</td>
                          <td style={{padding:"8px 10px",color:"#60a5fa"}}>{ms.losses}</td>
                          <td style={{padding:"8px 10px",fontWeight:500,color:ms.totalPnl>=0?"#e2e8f0":"#60a5fa"}}>{ms.totalPnl>=0?"+":""}${ms.totalPnl.toFixed(2)}</td>
                          <td style={{padding:"8px 10px",color:topPair?pairColorMap[topPair[0]]||"#9ca3af":"#4b5563"}}>{topPair?`${topPair[0]} (${topPair[1]})`:"-"}</td>
                          <td style={{padding:"8px 10px",color:topStrat?stratColorMap[topStrat[0]]||"#9ca3af":"#4b5563"}}>{topStrat?`${topStrat[0]} (${topStrat[1]})`:"-"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {stats.withOutcome.length===0?(
            <div style={{...s.card,textAlign:"center",padding:"3rem",color:"#6b7280"}}>No trades logged for {MONTHS[dashMonth]} {dashYear}.</div>
          ):(
            <>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
                <StatCard label="Total trades" value={stats.withOutcome.length} color="#4b5563" />
                <StatCard label="Win rate" value={`${stats.winRate}%`} color={stats.winRate>=50?"#e2e8f0":"#60a5fa"} />
                <StatCard label="Wins" value={stats.wins} color="#e2e8f0" />
                <StatCard label="Losses" value={stats.losses} color="#60a5fa" />
                <StatCard label="Total P&L" value={`${stats.totalPnl>=0?"+":""}$${stats.totalPnl.toFixed(2)}`} color={stats.totalPnl>=0?"#e2e8f0":"#60a5fa"} />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                {Object.keys(stats.pairCounts).length>0&&<div style={s.card}><div style={{fontSize:12,fontWeight:500,color:"#6b7280",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Pairs traded</div><BarChart data={stats.pairCounts} colors={pairColorMap} total={stats.withOutcome.length} /></div>}
                {Object.keys(stats.stratCounts).length>0&&<div style={s.card}><div style={{fontSize:12,fontWeight:500,color:"#6b7280",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Strategy usage</div><BarChart data={stats.stratCounts} colors={stratColorMap} total={stats.withOutcome.length} /></div>}
                {Object.keys(stats.gradeCounts).length>0&&<div style={s.card}><div style={{fontSize:12,fontWeight:500,color:"#6b7280",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Grade breakdown</div><BarChart data={stats.gradeCounts} colors={gradeColor} total={stats.withOutcome.length} /></div>}
                {Object.keys(stats.emotionCounts).length>0&&<div style={s.card}><div style={{fontSize:12,fontWeight:500,color:"#6b7280",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Emotional state</div><BarChart data={stats.emotionCounts} colors={emotionColorMap} total={stats.withOutcome.length} /></div>}
              </div>
              <div style={s.card}>
                <div style={{fontSize:12,fontWeight:500,color:"#6b7280",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Trade log — {MONTHS[dashMonth]} {dashYear}</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead><tr style={{borderBottom:"0.5px solid #2d3448"}}>{["Date","Pair","Strategy","Outcome","P&L","Grade","R:R","Emotion"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",color:"#6b7280",fontWeight:500}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {dashTrades.filter(t=>t.outcome).sort((a,b)=>a.key<b.key?-1:1).map((t,i)=>(
                        <tr key={i} onClick={()=>{setSelectedDate(t.key);setTab("journal")}} style={{borderBottom:"0.5px solid #1a2035",cursor:"pointer"}}>
                          <td style={{padding:"8px 10px",color:"#6b7280"}}>{new Date(t.key+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</td>
                          <td style={{padding:"8px 10px",fontWeight:500,color:pairColorMap[t.pair]||"#e2e8f0"}}>{t.pair}</td>
                          <td style={{padding:"8px 10px",color:stratColorMap[t.strategy]||"#9ca3af"}}>{t.strategy}</td>
                          <td style={{padding:"8px 10px",fontWeight:500,color:outcomeColor[t.outcome]||"#e2e8f0"}}>{t.outcome}</td>
                          <td style={{padding:"8px 10px",color:parseFloat(t.pnl)>=0?"#e2e8f0":"#60a5fa"}}>{t.pnl?`${parseFloat(t.pnl)>=0?"+":""}$${parseFloat(t.pnl).toFixed(2)}`:"-"}</td>
                          <td style={{padding:"8px 10px",fontWeight:500,color:gradeColor[t.grade]||"#e2e8f0"}}>{t.grade||"-"}</td>
                          <td style={{padding:"8px 10px",color:"#9ca3af"}}>{t.rr||"-"}</td>
                          <td style={{padding:"8px 10px",color:"#9ca3af"}}>{t.emotion||"-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab==="review" && (
        <div style={s.page}>
          <div style={{fontSize:20,fontWeight:500,marginBottom:20}}>AI Review centre</div>
          <div style={s.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:500}}>Weekly summary</div>
                <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>Full analysis of this week's trades</div>
              </div>
              <button onClick={runWeeklySummary} disabled={weeklyAILoading} style={s.aiBtnStyle}>{weeklyAILoading?"Generating...":"Generate this week"}</button>
            </div>
            {Object.keys(weeklyAI).length>0&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {Object.keys(weeklyAI).sort().reverse().map(k=>(
                  <button key={k} onClick={()=>setSelectedWeeklySummaryKey(k)} style={{padding:"4px 10px",borderRadius:8,fontSize:11,border:`0.5px solid ${selectedWeeklySummaryKey===k?"#818cf8":"#2d3448"}`,background:selectedWeeklySummaryKey===k?"rgba(129,140,248,0.12)":"transparent",color:selectedWeeklySummaryKey===k?"#818cf8":"#6b7280",cursor:"pointer"}}>
                    {new Date(k+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
                  </button>
                ))}
              </div>
            )}
            <AIBlock result={selectedWeeklySummaryKey?weeklyAI[selectedWeeklySummaryKey]:""} loading={weeklyAILoading} />
          </div>
          <div style={s.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:500}}>Pre-week briefing</div>
                <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>Structures your week overview into a trade plan</div>
              </div>
              <button onClick={runBriefing} disabled={briefingAILoading} style={s.aiBtnStyle}>{briefingAILoading?"Generating...":"Generate briefing"}</button>
            </div>
            <AIBlock result={briefingAI} loading={briefingAILoading} />
          </div>
          <div style={s.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:500}}>Pattern detector</div>
                <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>Finds behavioural and performance patterns across all trades</div>
              </div>
              <button onClick={runPatternDetector} disabled={patternAILoading} style={s.aiBtnStyle}>{patternAILoading?"Analysing...":"Run pattern analysis"}</button>
            </div>
            {Object.keys(patternAI).length>0&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {Object.keys(patternAI).sort().reverse().map(k=>(
                  <button key={k} onClick={()=>setSelectedPatternKey(k)} style={{padding:"4px 10px",borderRadius:8,fontSize:11,border:`0.5px solid ${selectedPatternKey===k?"#818cf8":"#2d3448"}`,background:selectedPatternKey===k?"rgba(129,140,248,0.12)":"transparent",color:selectedPatternKey===k?"#818cf8":"#6b7280",cursor:"pointer"}}>
                    {new Date(k+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
                  </button>
                ))}
              </div>
            )}
            <AIBlock result={selectedPatternKey?patternAI[selectedPatternKey]:""} loading={patternAILoading} />
          </div>
        </div>
      )}
    </div>
  )
}
