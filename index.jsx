import { useState, useMemo, useEffect, useRef } from "react"

/* ── 디자인 토큰 ─────────────────────────────────── */
const G = "#5BAD80", G2 = "#4a9a6e", GL = "#EAF6EF"
const BL = "#7CB9E8", BLL = "#EAF4FF"
const PK = "#F48FB1", PKL = "#FFF0F5"
const PU = "#A78BFA", PUL = "#F3EEFF"
const TE = "#4DB6AC", TEL = "#E0F7F5"
const TX = "#1E2A38", TX2 = "#52687A", TX3 = "#A0B0BE"
const BG = "#F4F6F9", SF = "#FFFFFF", BD = "#E8ECF2"
const R = "14px", RS = "9px"

const CM = {
  green:  { bar:G,  light:GL,  text:G  },
  pink:   { bar:PK, light:PKL, text:PK },
  blue:   { bar:BL, light:BLL, text:BL },
  purple: { bar:PU, light:PUL, text:PU },
  teal:   { bar:TE, light:TEL, text:TE },
}

const GCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; border:none; font-family:'Noto Sans KR',sans-serif; }
  body { background:${BG}; color:${TX}; }
  input,select,textarea { font-family:inherit; background:${BG}; color:${TX}; }
  input:focus,select:focus,textarea:focus { outline:none; border-color:${G}!important; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
  button { cursor:pointer; background:none; font-family:inherit; }
  ::-webkit-scrollbar { width:0; height:0; }
  .tab-on  { border-bottom:2.5px solid ${G}; color:${G}; font-weight:800; }
  .tab-off { color:${TX3}; font-weight:600; }
  @keyframes marq { 0%{transform:translateX(110%)} 100%{transform:translateX(-150%)} }
  @keyframes fi { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
`

/* ── 작은 공용 컴포넌트 ───────────────────────────── */
function Field({ value, onChange, placeholder, type="text", width, style={} }) {
  return (
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ height:34, borderRadius:RS, border:`1.5px solid ${BD}`,
        background:BG, padding:"0 10px", fontSize:13, color:TX,
        width: width || undefined, ...style }}
    />
  )
}

function Area({ value, onChange, placeholder, minH=60 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width:"100%", minHeight:minH, resize:"none",
        borderRadius:RS, border:`1.5px solid ${BD}`,
        background:BG, padding:"8px 10px", fontSize:13, color:TX, lineHeight:1.5 }}
    />
  )
}

function Card({ title, color="green", right, children }) {
  return (
    <div style={{ margin:"8px 12px 0", borderRadius:R, border:`1px solid ${BD}`, background:SF }}>
      <div style={{ display:"flex", alignItems:"center", gap:8,
        borderBottom:`1px solid ${BD}`, padding:"10px 12px" }}>
        <div style={{ width:4, height:28, borderRadius:4, background:CM[color].bar, flexShrink:0 }}/>
        <span style={{ fontSize:14, fontWeight:800, color:TX }}>{title}</span>
        {right && <div style={{ marginLeft:"auto" }}>{right}</div>}
      </div>
      <div style={{ padding:12 }}>{children}</div>
    </div>
  )
}

function Bar({ value, max, color="green", lbl, rbl }) {
  const pct = max > 0 ? Math.min((value/max)*100, 100) : 0
  return (
    <div style={{ marginTop:12 }}>
      <div style={{ height:5, background:BD, borderRadius:6, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:CM[color].bar,
          borderRadius:6, transition:"width 0.4s" }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between",
        marginTop:4, fontSize:11, color:TX3 }}>
        <span>{lbl ?? value}</span>
        <span>{rbl ?? `${Math.round(pct)}%`}</span>
      </div>
    </div>
  )
}

function Grip() {
  return (
    <div style={{ width:16, flexShrink:0, display:"flex", alignItems:"center",
      justifyContent:"center", cursor:"grab", color:BD }}>
      <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
        <circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/>
        <circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/>
        <circle cx="3" cy="13" r="1.5"/><circle cx="7" cy="13" r="1.5"/>
      </svg>
    </div>
  )
}

function DelBtn({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ width:16, height:16, flexShrink:0, fontSize:11, color:TX3,
        display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
  )
}

function AddBtn({ onClick, label="추가" }) {
  return (
    <button onClick={onClick}
      style={{ fontSize:11, fontWeight:600, color:G, textAlign:"left", marginTop:4 }}>
      + {label}
    </button>
  )
}

function SmlBtn({ onClick, children, col }) {
  return (
    <button onClick={onClick}
      style={{ height:26, borderRadius:RS, border:`1.5px solid ${col||BD}`,
        background:SF, padding:"0 10px", fontSize:11, fontWeight:600, color:col||TX2 }}>
      {children}
    </button>
  )
}

/* ── 드래그앤드롭 ─────────────────────────────────── */
function useDnD(items, onReorder) {
  const [dragI, setDragI] = useState(null)
  const [overI, setOverI] = useState(null)

  function h(i) {
    return {
      draggable: true,
      onDragStart: e => { e.dataTransfer.effectAllowed = "move"; setDragI(i) },
      onDragOver:  e => { e.preventDefault(); setOverI(i) },
      onDragLeave: () => setOverI(null),
      onDrop: e => {
        e.preventDefault()
        if (dragI !== null && dragI !== i) {
          const a = [...items]
          const [x] = a.splice(dragI, 1)
          a.splice(i, 0, x)
          onReorder(a)
        }
        setDragI(null); setOverI(null)
      },
      onDragEnd: () => { setDragI(null); setOverI(null) },
      dragging: dragI === i,
      over: overI === i && dragI !== i,
    }
  }
  return h
}

function DRow({ h, children }) {
  return (
    <div
      draggable={h.draggable}
      onDragStart={h.onDragStart} onDragOver={h.onDragOver}
      onDragLeave={h.onDragLeave} onDrop={h.onDrop} onDragEnd={h.onDragEnd}
      style={{
        opacity: h.dragging ? 0.4 : 1,
        borderTop: h.over ? `2.5px solid ${G}` : "2.5px solid transparent",
        transition: "opacity 0.15s",
      }}
    >
      {children}
    </div>
  )
}

/* ── 캘린더 피커 (fixed 포지션) ──────────────────── */
function CalPicker({ value, onChange, onClose, rect }) {
  const init  = value ? new Date(value) : new Date()
  const [cur, setCur] = useState(new Date(init.getFullYear(), init.getMonth(), 1))
  const y = cur.getFullYear(), mo = cur.getMonth()
  const pad = n => String(n).padStart(2, "0")

  const days = useMemo(() => {
    const first = new Date(y, mo, 1)
    const last  = new Date(y, mo+1, 0)
    const a = []
    for (let i = 0; i < first.getDay(); i++) a.push(null)
    for (let i = 1; i <= last.getDate(); i++) a.push(i)
    return a
  }, [y, mo])

  const DAY = ["일","월","화","수","목","금","토"]
  const selD = value ? new Date(value) : null
  const isSel = d => selD && d === selD.getDate() && mo === selD.getMonth() && y === selD.getFullYear()
  const isToday = d => { const t = new Date(); return d===t.getDate() && mo===t.getMonth() && y===t.getFullYear() }

  const W = 252
  const left = rect ? Math.min(rect.left, window.innerWidth - W - 8) : 60
  const top  = rect ? rect.bottom + 4 : 100

  return (
    <div>
      <div
        onClick={onClose}
        style={{ position:"fixed", inset:0, zIndex:498 }}
      />
      <div style={{ position:"fixed", left, top, zIndex:499,
        background:SF, border:`1px solid ${BD}`, borderRadius:R,
        boxShadow:"0 8px 28px rgba(0,0,0,0.16)", padding:14, width:W }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:10 }}>
          <button
            onClick={e => { e.stopPropagation(); setCur(new Date(y,mo-1,1)) }}
            style={{ width:28, height:28, borderRadius:8, border:`1px solid ${BD}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, color:TX2 }}>‹</button>
          <span style={{ fontSize:13, fontWeight:700, color:TX }}>{y}년 {mo+1}월</span>
          <button
            onClick={e => { e.stopPropagation(); setCur(new Date(y,mo+1,1)) }}
            style={{ width:28, height:28, borderRadius:8, border:`1px solid ${BD}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, color:TX2 }}>›</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
          {DAY.map((d,i) => (
            <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:600,
              color: i===0?PK : i===6?BL : TX3, padding:"2px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
          {days.map((d, i) => {
            if (d === null) return <div key={i} />
            return (
              <button key={i}
                onClick={e => { e.stopPropagation(); onChange(`${y}-${pad(mo+1)}-${pad(d)}`); onClose() }}
                style={{ aspectRatio:"1", borderRadius:6, fontSize:11, fontWeight:600,
                  border:"none", cursor:"pointer",
                  background: isSel(d) ? G : isToday(d) ? GL : "none",
                  color: isSel(d) ? "#fff" : isToday(d) ? G : (i%7===0)?PK:(i%7===6)?BL:TX }}>
                {d}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* 날짜 버튼 (활동 일정용) */
function DateBtn({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const ref = useRef(null)
  const fmt = v => { if (!v) return "날짜"; const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}` }

  function toggle(e) {
    e.stopPropagation()
    if (!open && ref.current) setRect(ref.current.getBoundingClientRect())
    setOpen(o => !o)
  }
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <button ref={ref} onClick={toggle}
        style={{ height:34, minWidth:50, borderRadius:RS,
          border:`1.5px solid ${open?G:BD}`, background:BG,
          fontSize:11, color:value?TX:TX3, padding:"0 6px", whiteSpace:"nowrap" }}>
        {fmt(value)}
      </button>
      {open && (
        <CalPicker value={value} onChange={onChange}
          onClose={() => setOpen(false)} rect={rect}/>
      )}
    </div>
  )
}

/* 날짜 네비게이션 */
function DateNav({ date, onChange, onToday }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const ref = useRef(null)
  const DAY = ["일","월","화","수","목","금","토"]
  const pad = n => String(n).padStart(2,"0")
  const toS = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

  function toggle(e) {
    e.stopPropagation()
    if (!open && ref.current) setRect(ref.current.getBoundingClientRect())
    setOpen(o => !o)
  }
  return (
    <div style={{ position:"sticky", top:44, zIndex:50, display:"flex",
      alignItems:"center", gap:8, height:54, padding:"0 12px",
      background:SF, borderBottom:`1px solid ${BD}` }}>
      <button
        onClick={() => { const n=new Date(date); n.setDate(n.getDate()-1); onChange(n) }}
        style={{ width:40, height:40, borderRadius:10, border:`1.5px solid ${BD}`,
          background:SF, display:"flex", alignItems:"center", justifyContent:"center",
          color:TX2, fontSize:20, flexShrink:0 }}>‹</button>
      <div ref={ref} onClick={toggle}
        style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", cursor:"pointer", userSelect:"none" }}>
        <span style={{ fontSize:10, color:TX3 }}>{date.getFullYear()}</span>
        <span style={{ fontSize:18, fontWeight:900, color:TX }}>
          {date.getMonth()+1}월 {date.getDate()}일 ({DAY[date.getDay()]})
        </span>
      </div>
      {open && (
        <CalPicker value={toS(date)}
          onChange={v => { onChange(new Date(v)); setOpen(false) }}
          onClose={() => setOpen(false)} rect={rect}/>
      )}
      <button
        onClick={() => { const n=new Date(date); n.setDate(n.getDate()+1); onChange(n) }}
        style={{ width:40, height:40, borderRadius:10, border:`1.5px solid ${BD}`,
          background:SF, display:"flex", alignItems:"center", justifyContent:"center",
          color:TX2, fontSize:20, flexShrink:0 }}>›</button>
      <button onClick={onToday}
        style={{ marginLeft:"auto", height:36, borderRadius:RS, background:G,
          padding:"0 16px", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>
        오늘
      </button>
    </div>
  )
}

/* ── 2Depth 커스텀 드롭다운 ───────────────────────── */
function TwoDepth({ value, onChange, groups, placeholder }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const ref = useRef(null)

  function getLabel(v) {
    if (!v) return placeholder || "선택"
    for (const g of groups) {
      const f = g.items.find(x => x.value === v)
      if (f) return f.label
    }
    return v
  }
  function toggle(e) {
    e.stopPropagation()
    if (!open && ref.current) setRect(ref.current.getBoundingClientRect())
    setOpen(o => !o)
  }
  function pick(v, e) {
    e.stopPropagation()
    onChange(v)
    setOpen(false)
  }

  const W = 180
  const left = rect ? Math.min(rect.left, window.innerWidth - W - 8) : 0
  const top  = rect ? rect.bottom + 4 : 0

  return (
    <div style={{ position:"relative", flex:1, minWidth:0 }}>
      <button ref={ref} onClick={toggle}
        style={{ height:34, width:"100%", borderRadius:RS,
          border:`1.5px solid ${open?G:BD}`, background:BG,
          paddingLeft:8, paddingRight:22, fontSize:12,
          color:value?TX:TX3, textAlign:"left",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          position:"relative" }}>
        {getLabel(value)}
        <span style={{ position:"absolute", right:6, top:"50%",
          transform:"translateY(-50%)", fontSize:10, color:TX3,
          pointerEvents:"none" }}>▼</span>
      </button>
      {open && (
        <div>
          <div onClick={e => { e.stopPropagation(); setOpen(false) }}
            style={{ position:"fixed", inset:0, zIndex:498 }}/>
          <div style={{ position:"fixed", left, top, zIndex:499,
            background:SF, border:`1px solid ${BD}`, borderRadius:R,
            boxShadow:"0 8px 24px rgba(0,0,0,0.14)", width:W, maxHeight:280, overflowY:"auto" }}>
            {groups.map(g => (
              <div key={g.header}>
                <div style={{ padding:"6px 12px 4px", fontSize:10, fontWeight:800,
                  color:TX3, background:BG, borderBottom:`1px solid ${BD}`,
                  letterSpacing:"0.05em" }}>
                  {g.header}
                </div>
                {g.items.map(item => (
                  <button key={item.value} onClick={e => pick(item.value, e)}
                    style={{ display:"block", width:"100%", padding:"8px 14px",
                      fontSize:12, textAlign:"left",
                      background: value===item.value ? GL : "none",
                      color: value===item.value ? G : TX,
                      borderBottom:`1px solid ${BD}50` }}>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
            <button onClick={e => pick("직접입력", e)}
              style={{ display:"block", width:"100%", padding:"8px 12px",
                fontSize:12, textAlign:"left",
                background: value==="직접입력" ? GL : "none",
                color: value==="직접입력" ? G : TX2,
                borderTop:`1px solid ${BD}`, fontStyle:"italic" }}>
              ✏ 직접입력
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── 탭바 ─────────────────────────────────────────── */
const TABS = [
  { id:"record",     label:"기록"    },
  { id:"collection", label:"모음"    },
  { id:"calendar",   label:"캘린더"  },
  { id:"forest",     label:"복운의 숲"},
]
function TabBar({ active, onChange }) {
  return (
    <nav style={{ position:"sticky", top:0, zIndex:100,
      display:"flex", height:44, background:SF, borderBottom:`1.5px solid ${BD}` }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={active===t.id ? "tab-on" : "tab-off"}
          style={{ flex:1, height:"100%", fontSize:12, background:"none" }}>
          {t.label}
        </button>
      ))}
    </nav>
  )
}

/* ── RECORD TAB 섹션들 ───────────────────────────── */

/* 신·창제 */
function SinSec({ min, onChange, goal=90 }) {
  const n = parseInt(min)||0, h=Math.floor(n/60), m=n%60
  const fmt = h===0 ? `${m}m` : m===0 ? `${h}h` : `${h}h ${m}m`
  return (
    <Card title="신 · 창제" color="green"
      right={<span style={{ fontSize:11, fontWeight:600, color:TX3 }}>평균 {n}분</span>}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <input type="number" value={min} onChange={e => onChange(e.target.value)}
          placeholder="0"
          style={{ width:90, height:46, borderRadius:RS, border:`1.5px solid ${BD}`,
            background:BG, textAlign:"center", fontSize:22, fontWeight:900, color:TX }}/>
        <span style={{ fontSize:13, color:TX }}>분</span>
        <span style={{ fontSize:13, color:TX2 }}>→</span>
        <span style={{ fontSize:26, fontWeight:900, color:G }}>{fmt}</span>
      </div>
      <Bar value={n} max={goal} color="green" lbl="0분" rbl={`${Math.round((n/goal)*100)}%`}/>
    </Card>
  )
}

/* 행·광포격려 */
const HAENG_G = [
  { header:"활동", items:[{value:"대화",label:"대화"},{value:"통화",label:"통화"},{value:"연락",label:"연락"},{value:"칸나",label:"칸나"}] },
  { header:"회합", items:[{value:"좌담회",label:"좌담회"},{value:"좌담회 참석간부",label:"좌담회 참석간부"},{value:"협의",label:"협의"},{value:"창제회",label:"창제회"}] },
]

function HaengSec({ items, onChange, goal=3 }) {
  const dnd = useDnD(items, onChange)
  const add = () => onChange([...items, { id: crypto.randomUUID(), name:"", type:"대화", custom:"" }])
  const del = id => onChange(items.filter(x => x.id !== id))
  const upd = (id,f,v) => onChange(items.map(x => x.id===id ? {...x,[f]:v} : x))
  const count = items.filter(i => i.name && (i.type!=="직접입력" || i.custom)).length

  return (
    <Card title="행 · 광포격려" color="pink">
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {items.map((item, i) => {
          const h = dnd(i)
          return (
            <DRow key={item.id} h={h}>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <Grip/>
                <input value={item.name} onChange={e => upd(item.id,"name",e.target.value)}
                  placeholder="이름"
                  style={{ width:58, flexShrink:0, height:34, borderRadius:RS,
                    border:`1.5px solid ${BD}`, background:BG,
                    padding:"0 8px", fontSize:13, color:TX }}/>
                <TwoDepth value={item.type} onChange={v => upd(item.id,"type",v)}
                  groups={HAENG_G} placeholder="구분"/>
                {item.type==="직접입력" && (
                  <input value={item.custom||""} onChange={e => upd(item.id,"custom",e.target.value)}
                    placeholder="직접 입력"
                    style={{ width:68, flexShrink:0, height:34, borderRadius:RS,
                      border:`1.5px solid ${BD}`, background:BG,
                      padding:"0 6px", fontSize:12, color:TX }}/>
                )}
                <DelBtn onClick={() => del(item.id)}/>
              </div>
            </DRow>
          )
        })}
        <AddBtn onClick={add}/>
      </div>
      <Bar value={count} max={goal} color="pink" lbl={`${count}명`} rbl={`${Math.round((count/goal)*100)}%`}/>
    </Card>
  )
}

/* 학·연찬 */
function HakSec({ items, onChange, goal=30 }) {
  const dnd = useDnD(items, onChange)
  const add = () => onChange([...items, { id:crypto.randomUUID(), bookType:"도서", bookName:"", startPage:"", endPage:"" }])
  const del = id => onChange(items.filter(x => x.id!==id))
  const upd = (id,f,v) => onChange(items.map(x => x.id===id ? {...x,[f]:v} : x))
  const total = items.reduce((s,i) => s + Math.max(0,(parseInt(i.endPage)||0)-(parseInt(i.startPage)||0)+1), 0)

  return (
    <Card title="학 · 연찬" color="blue">
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {items.map((item, i) => {
          const h = dnd(i)
          const pg = item.startPage && item.endPage
            ? Math.max(0,(parseInt(item.endPage)||0)-(parseInt(item.startPage)||0)+1) : null
          return (
            <DRow key={item.id} h={h}>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Grip/>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <select value={item.bookType} onChange={e => upd(item.id,"bookType",e.target.value)}
                      style={{ height:34, width:58, borderRadius:RS, border:`1.5px solid ${BD}`,
                        background:BG, paddingLeft:8, paddingRight:18,
                        fontSize:12, color:TX, appearance:"none", WebkitAppearance:"none" }}>
                      <option value="도서">도서</option>
                      <option value="어서">어서</option>
                    </select>
                    <span style={{ position:"absolute", right:4, top:"50%",
                      transform:"translateY(-50%)", pointerEvents:"none",
                      fontSize:9, color:TX3 }}>▼</span>
                  </div>
                  <input value={item.bookName} onChange={e => upd(item.id,"bookName",e.target.value)}
                    placeholder="도서명/어서명"
                    style={{ flex:1, height:34, borderRadius:RS, border:`1.5px solid ${BD}`,
                      background:BG, padding:"0 10px", fontSize:13, color:TX }}/>
                  <DelBtn onClick={() => del(item.id)}/>
                </div>
                <div style={{ marginLeft:22, display:"flex", alignItems:"center", gap:6 }}>
                  <Field value={item.startPage} onChange={v => upd(item.id,"startPage",v)}
                    placeholder="p. 시작" type="number" width="72px"/>
                  <span style={{ fontSize:13, color:TX3 }}>~</span>
                  <Field value={item.endPage} onChange={v => upd(item.id,"endPage",v)}
                    placeholder="p. 끝" type="number" width="72px"/>
                  {pg !== null && pg > 0 && (
                    <span style={{ fontSize:12, fontWeight:700, color:BL, marginLeft:2 }}>{pg}p</span>
                  )}
                </div>
              </div>
            </DRow>
          )
        })}
        <AddBtn onClick={add}/>
      </div>
      <Bar value={total} max={goal} color="blue" lbl={`${total}p`} rbl={`${Math.round((total/goal)*100)}%`}/>
    </Card>
  )
}

/* 한 줄 스피치 */
function SpeechSec({ items, onChange }) {
  const dnd = useDnD(items, onChange)
  const add = () => onChange([...items, { id:crypto.randomUUID(), text:"" }])
  const del = id => onChange(items.filter(x => x.id!==id))
  const upd = (id,v) => onChange(items.map(x => x.id===id ? {...x,text:v} : x))

  return (
    <Card title="한 줄 스피치" color="purple">
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {items.map((item, i) => {
          const h = dnd(i)
          return (
            <DRow key={item.id} h={h}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <Grip/>
                <input value={item.text} onChange={e => upd(item.id, e.target.value)}
                  placeholder="스피치 입력..."
                  style={{ flex:1, height:34, borderRadius:RS, border:`1.5px solid ${BD}`,
                    background:BG, padding:"0 10px", fontSize:13, color:TX }}/>
                <DelBtn onClick={() => del(item.id)}/>
              </div>
            </DRow>
          )
        })}
        <AddBtn onClick={add}/>
      </div>
    </Card>
  )
}

/* 결의 */
function ResoSec({ value, onChange }) {
  return (
    <Card title="결의" color="purple">
      <Area value={value} onChange={onChange} placeholder="오늘의 결의를 기록해주세요..." minH={60}/>
    </Card>
  )
}

/* 멤버 상황 */
function MemberSec({ items, onChange }) {
  const dnd = useDnD(items, onChange)
  const add = () => onChange([...items, { id:crypto.randomUUID(), name:"", memo:"" }])
  const del = id => onChange(items.filter(x => x.id!==id))
  const upd = (id,f,v) => onChange(items.map(x => x.id===id ? {...x,[f]:v} : x))

  return (
    <Card title="멤버 상황" color="teal">
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {items.map((item, i) => {
          const h = dnd(i)
          return (
            <DRow key={item.id} h={h}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <Grip/>
                <input value={item.name} onChange={e => upd(item.id,"name",e.target.value)}
                  placeholder="이름"
                  style={{ width:70, flexShrink:0, height:34, borderRadius:RS,
                    border:`1.5px solid ${BD}`, background:BG,
                    padding:"0 8px", fontSize:13, color:TX }}/>
                <input value={item.memo} onChange={e => upd(item.id,"memo",e.target.value)}
                  placeholder="상황 메모"
                  style={{ flex:1, minWidth:0, height:34, borderRadius:RS,
                    border:`1.5px solid ${BD}`, background:BG,
                    padding:"0 8px", fontSize:13, color:TX }}/>
                <DelBtn onClick={() => del(item.id)}/>
              </div>
            </DRow>
          )
        })}
        <AddBtn onClick={add}/>
      </div>
    </Card>
  )
}

/* 활동 일정 */
const ACT_G = [
  { header:"활동", items:[{value:"대화",label:"대화"},{value:"연락",label:"연락"},{value:"칸나",label:"칸나"}] },
  { header:"회합", items:[{value:"좌담회",label:"좌담회"},{value:"창제회",label:"창제회"},{value:"협의",label:"협의"}] },
]

function ActSec({ items, onChange }) {
  const dnd = useDnD(items, onChange)
  const add = () => onChange([...items, { id:crypto.randomUUID(), date:"", name:"", type:"", custom:"", companion:"" }])
  const del = id => onChange(items.filter(x => x.id!==id))
  const upd = (id,f,v) => onChange(items.map(x => x.id===id ? {...x,[f]:v} : x))

  function copy() {
    const txt = items
      .filter(i => i.name)
      .map(i => {
        const t = i.type==="직접입력" ? i.custom : i.type
        const d = i.date ? `${new Date(i.date).getMonth()+1}/${new Date(i.date).getDate()} ` : ""
        return `${d}${i.name}${t?" "+t:""}${i.companion?" (동행: "+i.companion+")":""}`.trim()
      }).join("\n")
    navigator.clipboard.writeText(txt).then(() => alert("복사되었습니다"))
  }

  return (
    <Card title="활동 일정" color="green"
      right={
        <div style={{ display:"flex", gap:6 }}>
          <SmlBtn onClick={() => {}}>불러오기</SmlBtn>
          <SmlBtn onClick={copy}>복사</SmlBtn>
        </div>
      }>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {items.map((item, i) => {
          const h = dnd(i)
          return (
            <DRow key={item.id} h={h}>
              <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"nowrap" }}>
                <Grip/>
                <DateBtn value={item.date} onChange={v => upd(item.id,"date",v)}/>
                <input value={item.name} onChange={e => upd(item.id,"name",e.target.value)}
                  placeholder="이름"
                  style={{ width:52, flexShrink:0, height:34, borderRadius:RS,
                    border:`1.5px solid ${BD}`, background:BG,
                    padding:"0 6px", fontSize:12, color:TX }}/>
                <TwoDepth value={item.type} onChange={v => upd(item.id,"type",v)}
                  groups={ACT_G} placeholder="구분"/>
                {item.type==="직접입력" && (
                  <input value={item.custom||""} onChange={e => upd(item.id,"custom",e.target.value)}
                    placeholder="입력"
                    style={{ width:56, flexShrink:0, height:34, borderRadius:RS,
                      border:`1.5px solid ${BD}`, background:BG,
                      padding:"0 6px", fontSize:11, color:TX }}/>
                )}
                <input value={item.companion} onChange={e => upd(item.id,"companion",e.target.value)}
                  placeholder="동행"
                  style={{ width:46, flexShrink:0, height:34, borderRadius:RS,
                    border:`1.5px solid ${BD}`, background:BG,
                    padding:"0 6px", fontSize:12, color:TX }}/>
                <DelBtn onClick={() => del(item.id)}/>
              </div>
            </DRow>
          )
        })}
        <AddBtn onClick={add}/>
      </div>
    </Card>
  )
}

/* ── 기록 탭 ─────────────────────────────────────── */
function mkDef() {
  return {
    sinMin: "",
    haeng:   [{ id:"h1", name:"", type:"대화", custom:"" }],
    hak:     [{ id:"k1", bookType:"도서", bookName:"", startPage:"", endPage:"" }],
    speech:  [{ id:"s1", text:"" }],
    reso:    "",
    members: [{ id:"m1", name:"", memo:"" }],
    activity:[{ id:"a1", date:"", name:"", type:"", custom:"", companion:"" }],
  }
}

function RecordTab({ records, setRecords }) {
  const [date, setDate] = useState(new Date())
  const [saved, setSaved] = useState(false)
  const pad = n => String(n).padStart(2,"0")
  const key = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
  const rec = records[key] || mkDef()
  const upd = patch => setRecords(prev => ({...prev, [key]: {...(prev[key]||mkDef()), ...patch}}))

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ paddingBottom:80 }}>
      <DateNav date={date} onChange={setDate} onToday={() => setDate(new Date())}/>
      <div style={{ display:"flex", flexDirection:"column", gap:4, paddingTop:8, paddingBottom:8 }}>
        <SinSec    min={rec.sinMin}    onChange={v => upd({sinMin:v})}   goal={90}/>
        <HaengSec  items={rec.haeng}   onChange={v => upd({haeng:v})}    goal={3}/>
        <HakSec    items={rec.hak}     onChange={v => upd({hak:v})}      goal={30}/>
        <SpeechSec items={rec.speech}  onChange={v => upd({speech:v})}/>
        <ResoSec   value={rec.reso}    onChange={v => upd({reso:v})}/>
        <MemberSec items={rec.members} onChange={v => upd({members:v})}/>
        <ActSec    items={rec.activity}onChange={v => upd({activity:v})}/>
      </div>
      <button onClick={save}
        style={{ position:"fixed", bottom:18, left:"50%", transform:"translateX(-50%)",
          borderRadius:24, background: saved ? G2 : G,
          padding:"13px 40px", fontSize:14, fontWeight:800, color:"#fff",
          boxShadow:"0 4px 20px rgba(91,173,128,0.35)",
          transition:"all 0.2s", whiteSpace:"nowrap", zIndex:60 }}>
        {saved ? "저장됨 ✓" : "저장 🌿"}
      </button>
    </div>
  )
}

/* ── 모음 탭 ─────────────────────────────────────── */
function fmtDate(s) {
  const d = new Date(s), D = ["일","월","화","수","목","금","토"]
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${D[d.getDay()]})`
}
function fmtShort(s) {
  const d = new Date(s), D = ["일","월","화","수","목","금","토"]
  return `${d.getMonth()+1}/${d.getDate()} (${D[d.getDay()]})`
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false)
  function click() {
    navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2000) })
  }
  return (
    <button onClick={click}
      style={{ width:24, height:24, borderRadius:6, border:`1px solid ${BD}`,
        background:SF, color:done?G:TX3, fontSize:12,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      {done ? "✓" : "⧉"}
    </button>
  )
}

function Tag({ c, label }) {
  return (
    <span style={{ fontSize:10, fontWeight:600,
      background:CM[c].light, color:CM[c].text,
      borderRadius:4, padding:"2px 6px", flexShrink:0 }}>
      {label}
    </span>
  )
}

function getT(h) { return h.type==="직접입력" ? h.custom : h.type }

function FullCard({ rec }) {
  const sinN   = parseInt(rec.sinMin||0)
  const haeng  = (rec.haeng||[]).filter(h => h.name)
  const hak    = (rec.hak||[]).filter(h => h.bookName)
  const speech = (rec.speech||[]).filter(s => s.text)
  const mem    = (rec.members||[]).filter(m => m.name)

  function copyTxt() {
    let t = `${fmtDate(rec.date)}\n▪️신 : ${sinN ? Math.floor(sinN/60)+"h "+(sinN%60)+"m" : "미기록"}`
    if (haeng.length)  t += `\n▪️행 : ${haeng.map(h => h.name+" "+getT(h)).join(", ")}`
    if (hak.length)    t += `\n▪️학 : ${hak.map(h => h.bookName+" p."+h.startPage+"~"+h.endPage).join(", ")}`
    if (speech.length) t += `\n▪️스피치 : ${speech.map(s => s.text).join(" / ")}`
    if (rec.reso)      t += `\n▪️결의 : ${rec.reso}`
    if (mem.length) { t += `\n▪️멤버\n`; mem.forEach(m => { t += `   * ${m.name} : ${m.memo}\n` }) }
    return t.trim()
  }

  return (
    <div style={{ borderRadius:R, border:`1px solid ${BD}`, background:SF, padding:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <span style={{ fontSize:14, fontWeight:700, color:TX }}>{fmtDate(rec.date)}</span>
        <CopyBtn text={copyTxt()}/>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:12 }}>
        {sinN>0    && <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}><Tag c="green"  label="창제"/><span style={{ color:TX }}>{Math.floor(sinN/60)}h {sinN%60}m</span></div>}
        {haeng.length>0 && <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}><Tag c="pink"   label="격려"/><span style={{ color:TX }}>{haeng.map(h => h.name+"("+getT(h)+")").join(", ")}</span></div>}
        {hak.length>0   && <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}><Tag c="blue"   label="연찬"/><span style={{ color:TX }}>{hak.map(h => h.bookName+" p."+h.startPage+"~"+h.endPage).join(", ")}</span></div>}
        {speech.length>0&& <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}><Tag c="purple" label="스피치"/><span style={{ color:TX, fontStyle:"italic" }}>"{speech.map(s=>s.text).join(" / ")}"</span></div>}
        {rec.reso       && <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}><Tag c="purple" label="결의"/><span style={{ color:TX }}>{rec.reso}</span></div>}
        {mem.length>0   && <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}><Tag c="teal"   label="멤버"/><span style={{ color:TX }}>{mem.map(m=>m.name+(m.memo?"("+m.memo+")":"")).join(", ")}</span></div>}
      </div>
    </div>
  )
}

/* 신 통계 */
function SinStats({ recs }) {
  const data = recs.map(r => ({ date:r.date, min:parseInt(r.sinMin||0) }))
  const max  = Math.max(...data.map(r=>r.min), 1)
  const avg  = Math.round(data.reduce((s,r)=>s+r.min,0) / Math.max(data.length,1))
  return (
    <div style={{ borderRadius:R, border:`1px solid ${BD}`, background:SF, padding:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color:TX, marginBottom:12 }}>일일 창제 시간</div>
      {data.length===0
        ? <p style={{ textAlign:"center", padding:24, color:TX3, fontSize:13 }}>데이터 없음</p>
        : (
          <div>
            <div style={{ position:"relative", height:120, marginBottom:8 }}>
              <div style={{ display:"flex", height:"100%", alignItems:"flex-end", gap:8 }}>
                {data.map((r,i) => (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                    <div style={{ width:"100%", borderRadius:"4px 4px 0 0",
                      background:`linear-gradient(to top,${G},${GL})`,
                      height:`${(r.min/max)*100}%`, minHeight:2 }}/>
                    <span style={{ fontSize:8, color:TX3 }}>{new Date(r.date).getDate()}일</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize:11, color:TX2 }}>평균 <strong style={{ color:G }}>{avg}분</strong></div>
          </div>
        )
      }
    </div>
  )
}

/* 행 통계 */
function HaengStats({ recs }) {
  const [sel, setSel] = useState(null)
  const keys = ["대화","통화","연락","칸나","좌담회","좌담회 참석간부","협의","창제회"]
  const stats = {}
  keys.forEach(k => { stats[k] = 0 })
  recs.forEach(r => (r.haeng||[]).forEach(h => {
    const t = getT(h)
    if (t && stats[t]!==undefined) stats[t]++
  }))
  const getFor = t => recs.flatMap(r => (r.haeng||[]).filter(h=>getT(h)===t).map(h=>({date:r.date,name:h.name})))

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ borderRadius:R, border:`1px solid ${BD}`, background:SF, padding:12 }}>
        <div style={{ fontSize:12, fontWeight:700, color:TX, marginBottom:12 }}>카테고리별 횟수</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {keys.map(type => (
            <button key={type} onClick={() => setSel(sel===type ? null : type)}
              style={{ borderRadius:10, padding:8, textAlign:"center", border:"none",
                background: sel===type ? PK : PKL,
                color: sel===type ? "#fff" : PK, cursor:"pointer" }}>
              <div style={{ fontSize:16, fontWeight:700 }}>{stats[type]}</div>
              <div style={{ fontSize:9, marginTop:2 }}>{type}</div>
            </button>
          ))}
        </div>
      </div>
      {sel && (
        <div style={{ borderRadius:R, border:`1px solid ${BD}`, background:SF, padding:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:TX, marginBottom:8 }}>{sel} 기록</div>
          {getFor(sel).length===0
            ? <p style={{ fontSize:12, color:TX3 }}>기록 없음</p>
            : getFor(sel).map((r,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between",
                  padding:"4px 0", borderBottom:`1px solid ${BD}` }}>
                  <span style={{ fontSize:11, color:TX3 }}>{new Date(r.date).getMonth()+1}/{new Date(r.date).getDate()}</span>
                  <span style={{ fontSize:12, color:TX }}>{r.name}</span>
                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}

/* 학 통계 */
function HakStats({ recs }) {
  const bm = new Map()
  recs.forEach(r => (r.hak||[]).forEach(h => {
    if (!h.bookName) return
    const k = h.bookType+"::"+h.bookName
    const pg = Math.max(0,(parseInt(h.endPage)||0)-(parseInt(h.startPage)||0)+1)
    if (!bm.has(k)) bm.set(k, { bookType:h.bookType, bookName:h.bookName, pages:0, days:new Set() })
    bm.get(k).pages += pg
    bm.get(k).days.add(r.date)
  }))
  const list = Array.from(bm.values()).sort((a,b) => b.pages-a.pages)
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {list.length===0
        ? <p style={{ textAlign:"center", padding:32, color:TX3, fontSize:13 }}>기록이 없습니다</p>
        : list.map((b,i) => (
            <div key={i} style={{ borderRadius:RS, border:`1px solid ${BD}`, background:SF,
              padding:"12px 14px", display:"flex", alignItems:"center",
              justifyContent:"space-between", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0, flex:1 }}>
                <span style={{ fontSize:10, fontWeight:600, background:BLL, color:BL,
                  borderRadius:4, padding:"2px 6px", flexShrink:0 }}>{b.bookType}</span>
                <span style={{ fontSize:13, fontWeight:700, color:TX,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.bookName}</span>
              </div>
              <div style={{ display:"flex", gap:10, flexShrink:0, alignItems:"center" }}>
                <span style={{ fontSize:13, fontWeight:700, color:BL }}>{b.pages}p</span>
                <span style={{ fontSize:12, color:TX3 }}>{b.days.size}일</span>
              </div>
            </div>
          ))
      }
    </div>
  )
}

/* 멤버 통계 (기간 설정 포함) */
function MemberStats({ recs }) {
  const [exp, setExp] = useState(null)
  const [showP, setShowP] = useState(false)
  const [pStart, setPStart] = useState("")
  const [pEnd,   setPEnd]   = useState("")
  const [rect, setRect] = useState(null)
  const btnRef = useRef(null)

  const filtRecs = recs.filter(r => {
    if (!pStart && !pEnd) return true
    const d = new Date(r.date)
    if (pStart && d < new Date(pStart)) return false
    if (pEnd   && d > new Date(pEnd))   return false
    return true
  })

  const mp = new Map()
  filtRecs.forEach(r => (r.members||[]).forEach(m => {
    if (!m.name) return
    if (!mp.has(m.name)) mp.set(m.name, [])
    mp.get(m.name).push({ date:r.date, memo:m.memo })
  }))
  const sorted = Array.from(mp.entries()).sort((a,b) => a[0].localeCompare(b[0],"ko"))

  function openP(e) {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setShowP(true)
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {/* 기간 설정 버튼 */}
      <div style={{ position:"relative" }}>
        <button ref={btnRef} onClick={openP}
          style={{ display:"flex", alignItems:"center", justifyContent:"center",
            gap:6, width:"100%", borderRadius:RS, border:`1px solid ${BD}`,
            background:SF, padding:"8px 0", fontSize:12, fontWeight:600, color:TX2 }}>
          ⚙ 기간 설정{pStart && ` (${pStart}${pEnd?" ~ "+pEnd:" ~"})`}
        </button>
      </div>
      {/* 기간 선택 팝업 */}
      {showP && <PeriodPicker
        pStart={pStart} pEnd={pEnd}
        onApply={(s,e) => { setPStart(s); setPEnd(e); setShowP(false) }}
        onClose={() => setShowP(false)}
        rect={rect}
      />}
      {/* 멤버 목록 */}
      {sorted.map(([name, memos]) => (
        <div key={name} style={{ borderRadius:R, border:`1px solid ${BD}`, background:SF, overflow:"hidden" }}>
          <button onClick={() => setExp(exp===name ? null : name)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              width:"100%", padding:12, background:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:TEL,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:700, color:TE }}>{name.charAt(0)}</div>
              <span style={{ fontSize:13, fontWeight:700, color:TX }}>{name}</span>
              <span style={{ background:TEL, color:TE, borderRadius:99,
                padding:"2px 8px", fontSize:10, fontWeight:600 }}>{memos.length}회</span>
            </div>
            <span style={{ fontSize:14, color:TX3 }}>{exp===name ? "∧" : "∨"}</span>
          </button>
          {exp===name && (
            <div style={{ borderTop:`1px solid ${BD}`, background:BG, padding:"8px 12px" }}>
              {[...memos].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((m,i) => (
                <div key={i} style={{ display:"flex", gap:8, padding:"6px 0",
                  borderBottom: i<memos.length-1 ? `1px solid ${BD}50` : "none" }}>
                  <span style={{ fontSize:10, color:TX3, flexShrink:0 }}>
                    {new Date(m.date).getMonth()+1}/{new Date(m.date).getDate()}
                  </span>
                  <span style={{ fontSize:11, color:TX }}>{m.memo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {sorted.length===0 && <p style={{ textAlign:"center", padding:32, color:TX3, fontSize:13 }}>기록이 없습니다</p>}
    </div>
  )
}

/* 기간 선택 피커 */
function PeriodPicker({ pStart, pEnd, onApply, onClose, rect }) {
  const [cm, setCm] = useState(new Date())
  const [ss, setSs] = useState(pStart||"")
  const [se, setSe] = useState(pEnd||"")
  const y = cm.getFullYear(), mo = cm.getMonth()
  const pad = n => String(n).padStart(2,"0")
  const toS = d => `${y}-${pad(mo+1)}-${pad(d)}`

  const days = useMemo(() => {
    const first = new Date(y,mo,1), last = new Date(y,mo+1,0)
    const a = []
    for (let i=0; i<first.getDay(); i++) a.push(null)
    for (let i=1; i<=last.getDate(); i++) a.push(i)
    return a
  }, [y, mo])

  function click(d) {
    const s = toS(d)
    if (!ss || (ss && se)) { setSs(s); setSe("") }
    else if (s >= ss) { setSe(s) }
    else { setSs(s); setSe("") }
  }

  const isIn = d => { const s=toS(d); return ss && se && s>=ss && s<=se }
  const isS  = d => toS(d)===ss
  const isE  = d => toS(d)===se
  const DAY  = ["일","월","화","수","목","금","토"]

  const W = 280
  const left = rect ? Math.min(rect.left, window.innerWidth-W-8) : 40
  const top  = rect ? rect.bottom+4 : 100

  return (
    <div>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:498 }}/>
      <div style={{ position:"fixed", left, top, zIndex:499,
        background:SF, border:`1px solid ${BD}`, borderRadius:R,
        boxShadow:"0 8px 24px rgba(0,0,0,0.13)", padding:16, width:W }}>
        <div style={{ fontSize:13, fontWeight:700, color:TX, textAlign:"center", marginBottom:12 }}>기간 선택</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <button onClick={() => setCm(new Date(y,mo-1,1))}
            style={{ width:28,height:28,borderRadius:8,border:`1px solid ${BD}`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:TX2 }}>‹</button>
          <span style={{ fontSize:13, fontWeight:700, color:TX }}>{y}년 {mo+1}월</span>
          <button onClick={() => setCm(new Date(y,mo+1,1))}
            style={{ width:28,height:28,borderRadius:8,border:`1px solid ${BD}`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:TX2 }}>›</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
          {DAY.map((d,i) => (
            <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:600,
              color: i===0?PK:i===6?BL:TX3 }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:12 }}>
          {days.map((d,i) => {
            if (d===null) return <div key={i}/>
            return (
              <button key={i} onClick={() => click(d)}
                style={{ aspectRatio:"1", borderRadius:6, fontSize:11, fontWeight:600,
                  border:"none", cursor:"pointer",
                  background: (isS(d)||isE(d)) ? G : isIn(d) ? GL : "none",
                  color: (isS(d)||isE(d)) ? "#fff" : isIn(d) ? G : (i%7===0)?PK:(i%7===6)?BL:TX }}>
                {d}
              </button>
            )
          })}
        </div>
        {ss && <div style={{ fontSize:11, color:TX2, textAlign:"center", marginBottom:12 }}>
          {ss}{se ? ` ~ ${se}` : " ~"}
        </div>}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => { setSs(""); setSe(""); onApply("",""); }}
            style={{ flex:1, borderRadius:RS, border:`1.5px solid ${BD}`,
              padding:"8px 0", fontSize:12, fontWeight:700, color:TX2, background:SF }}>초기화</button>
          <button onClick={() => onApply(ss, se)}
            style={{ flex:1, borderRadius:RS, background:G,
              padding:"8px 0", fontSize:12, fontWeight:700, color:"#fff" }}>적용</button>
        </div>
      </div>
    </div>
  )
}

function FilteredCard({ rec, filter }) {
  const speech = (rec.speech||[]).filter(s => s.text)
  const hak    = (rec.hak||[]).filter(h => h.bookName)
  let content = null, copyTxt = ""

  if (filter==="speech" && speech.length) {
    content  = <span style={{ color:TX, fontStyle:"italic" }}>"{speech.map(s=>s.text).join(" / ")}"</span>
    copyTxt  = fmtShort(rec.date)+": "+speech.map(s=>s.text).join(" / ")
  }
  if (filter==="resolution" && rec.reso) {
    content  = <span style={{ color:TX }}>{rec.reso}</span>
    copyTxt  = fmtShort(rec.date)+": "+rec.reso
  }
  if (filter==="hak" && hak.length) {
    content  = (
      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
        {hak.map((h,i) => (
          <span key={i} style={{ background:BLL, color:BL, borderRadius:99, padding:"2px 8px", fontSize:11 }}>
            {h.bookName} p.{h.startPage}~{h.endPage}
          </span>
        ))}
      </div>
    )
    copyTxt = fmtShort(rec.date)+": "+hak.map(h=>h.bookName+" p."+h.startPage+"~"+h.endPage).join(", ")
  }

  if (!content) return null

  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:12,
      borderRadius:RS, border:`1px solid ${BD}`, background:SF, padding:12 }}>
      <span style={{ fontSize:11, fontWeight:600, color:TX3, flexShrink:0 }}>{fmtShort(rec.date)}</span>
      <div style={{ flex:1, fontSize:12 }}>{content}</div>
      <CopyBtn text={copyTxt}/>
    </div>
  )
}

const FPILLS = [
  {id:"all",      label:"전체",   color:"green"},
  {id:"sin",      label:"신",     color:"green"},
  {id:"haeng",    label:"행",     color:"pink"},
  {id:"hak",      label:"학",     color:"blue"},
  {id:"speech",   label:"스피치", color:"purple"},
  {id:"resolution",label:"결의",  color:"purple"},
  {id:"member",   label:"멤버",   color:"teal"},
]

function CollectionTab({ records }) {
  const [q,      setQ]      = useState("")
  const [filter, setFilter] = useState("all")
  const [month,  setMonth]  = useState({ y:new Date().getFullYear(), m:new Date().getMonth()+1 })

  const recArr = useMemo(() =>
    Object.entries(records).map(([date,data]) => ({...data, date}))
      .sort((a,b) => new Date(b.date)-new Date(a.date)),
    [records]
  )

  const filtered = recArr.filter(r => {
    const d = new Date(r.date)
    if (d.getFullYear()!==month.y || d.getMonth()+1!==month.m) return false
    if (!q) return true
    const sq = q.toLowerCase()
    return (
      (r.haeng||[]).some(h => h.name.toLowerCase().includes(sq)) ||
      (r.hak||[]).some(h => h.bookName.toLowerCase().includes(sq)) ||
      (r.speech||[]).some(s => s.text.toLowerCase().includes(sq)) ||
      (r.reso && r.reso.toLowerCase().includes(sq)) ||
      (r.members||[]).some(m => m.name.toLowerCase().includes(sq))
    )
  })

  function buildReport() {
    const txt = filtered.map(r => {
      let t = `${fmtDate(r.date)}\n▪️신 : ${parseInt(r.sinMin||0)}분`
      const haeng = (r.haeng||[]).filter(h=>h.name)
      if (haeng.length) t += `\n▪️행 : ${haeng.map(h=>h.name+" "+getT(h)).join(", ")}`
      const hak = (r.hak||[]).filter(h=>h.bookName)
      if (hak.length) t += `\n▪️학 : ${hak.map(h=>h.bookName+" p."+h.startPage+"~"+h.endPage).join(", ")}`
      const sp = (r.speech||[]).filter(s=>s.text)
      if (sp.length) t += `\n▪️스피치 : ${sp.map(s=>s.text).join(" / ")}`
      if (r.reso) t += `\n▪️결의 : ${r.reso}`
      return t
    }).join("\n\n")
    navigator.clipboard.writeText(txt).then(() => alert("보고 문구가 복사되었습니다"))
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", paddingBottom:16 }}>
      {/* 월 네비 */}
      <div style={{ position:"sticky", top:44, zIndex:50,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        height:48, padding:"0 12px", background:SF, borderBottom:`1px solid ${BD}` }}>
        <button onClick={() => setMonth(({y,m}) => m===1?{y:y-1,m:12}:{y,m:m-1})}
          style={{ width:32,height:32,borderRadius:8,border:`1px solid ${BD}`,
            display:"flex",alignItems:"center",justifyContent:"center",color:TX2,fontSize:18 }}>‹</button>
        <span style={{ fontSize:14, fontWeight:700, color:TX }}>{month.y}년 {month.m}월</span>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => setMonth(({y,m}) => m===12?{y:y+1,m:1}:{y,m:m+1})}
            style={{ width:32,height:32,borderRadius:8,border:`1px solid ${BD}`,
              display:"flex",alignItems:"center",justifyContent:"center",color:TX2,fontSize:18 }}>›</button>
          {filter!=="member" && (
            <button onClick={buildReport}
              style={{ height:32, borderRadius:8, border:`1.5px solid ${PU}`,
                background:SF, padding:"0 12px", fontSize:12, fontWeight:700, color:PU }}>
              보고문구
            </button>
          )}
        </div>
      </div>
      {/* 검색 */}
      <div style={{ padding:"8px 12px" }}>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
            fontSize:14, color:TX3 }}>🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="검색어를 입력하세요"
            style={{ width:"100%", height:36, borderRadius:RS, border:`1.5px solid ${BD}`,
              background:BG, paddingLeft:32, paddingRight:12, fontSize:13, color:TX }}/>
        </div>
      </div>
      {/* 필터 */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"0 12px 12px", scrollbarWidth:"none" }}>
        {FPILLS.map(p => {
          const active = filter===p.id
          const c = CM[p.color]
          return (
            <button key={p.id} onClick={() => setFilter(p.id)}
              style={{ flexShrink:0, borderRadius:99, padding:"6px 12px",
                fontSize:11, fontWeight:600, cursor:"pointer", border:"none",
                background: active ? c.bar : c.light,
                color: active ? "#fff" : c.text,
                transition:"all 0.2s" }}>
              {p.label}
            </button>
          )
        })}
      </div>
      {/* 내용 */}
      <div style={{ display:"flex", flexDirection:"column", gap:12, padding:"0 12px" }}>
        {filter==="all"        && filtered.map((r,i) => <FullCard     key={i} rec={r}/>)}
        {filter==="sin"        && <SinStats   recs={filtered}/>}
        {filter==="haeng"      && <HaengStats recs={filtered}/>}
        {filter==="hak"        && <HakStats   recs={filtered}/>}
        {filter==="member"     && <MemberStats recs={filtered}/>}
        {(filter==="speech"||filter==="resolution") && filtered.map((r,i) => <FilteredCard key={i} rec={r} filter={filter}/>)}
        {filtered.length===0   && <div style={{ textAlign:"center", padding:40, color:TX3, fontSize:13 }}>기록이 없습니다</div>}
      </div>
    </div>
  )
}

/* ── 캘린더 탭 ───────────────────────────────────── */
function CalendarTab({ records }) {
  const [cur, setCur] = useState(new Date())
  const [sel, setSel] = useState(null)
  const y = cur.getFullYear(), mo = cur.getMonth()
  const pad = n => String(n).padStart(2,"0")

  const days = useMemo(() => {
    const first = new Date(y,mo,1), last = new Date(y,mo+1,0)
    const a = []
    for (let i=0; i<first.getDay(); i++) a.push(null)
    for (let i=1; i<=last.getDate(); i++) a.push(i)
    return a
  }, [y, mo])

  const today = new Date()
  const isToday = d => d===today.getDate() && mo===today.getMonth() && y===today.getFullYear()
  const isSel   = d => sel && d===sel.getDate() && mo===sel.getMonth() && y===sel.getFullYear()
  const getRec  = d => records[`${y}-${pad(mo+1)}-${pad(d)}`]
  const DAY = ["일","월","화","수","목","금","토"]

  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      {/* 월 네비 */}
      <div style={{ position:"sticky", top:44, zIndex:50,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        height:48, padding:"0 16px", background:SF, borderBottom:`1px solid ${BD}` }}>
        <button onClick={() => setCur(new Date(y,mo-1,1))}
          style={{ width:32,height:32,borderRadius:8,border:`1px solid ${BD}`,
            display:"flex",alignItems:"center",justifyContent:"center",color:TX2,fontSize:18 }}>‹</button>
        <span style={{ fontSize:16, fontWeight:700, color:TX }}>{y}년 {mo+1}월</span>
        <button onClick={() => setCur(new Date(y,mo+1,1))}
          style={{ width:32,height:32,borderRadius:8,border:`1px solid ${BD}`,
            display:"flex",alignItems:"center",justifyContent:"center",color:TX2,fontSize:18 }}>›</button>
      </div>
      {/* 요일 헤더 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)",
        borderBottom:`1px solid ${BD}`, background:SF }}>
        {DAY.map((d,i) => (
          <div key={d} style={{ padding:"8px 0", textAlign:"center", fontSize:11,
            fontWeight:600, color:i===0?PK:i===6?BL:TX3 }}>{d}</div>
        ))}
      </div>
      {/* 날짜 그리드 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, background:BD }}>
        {days.map((d,i) => {
          if (!d) return <div key={i} style={{ background:SF, aspectRatio:"1" }}/>
          const rec = getRec(d)
          const hasDot = rec && (parseInt(rec.sinMin||0)>0 || (rec.haeng||[]).some(h=>h.name) || (rec.hak||[]).some(h=>h.bookName))
          const dow = i%7
          return (
            <button key={i} onClick={() => setSel(new Date(y,mo,d))}
              style={{ aspectRatio:"1", background:isSel(d)?GL:SF,
                display:"flex", flexDirection:"column", alignItems:"center",
                padding:4, cursor:"pointer", outline:"none",
                boxShadow: isToday(d) ? `inset 0 0 0 2px ${G}` : "none" }}>
              <span style={{ fontSize:12, fontWeight:600,
                color: isToday(d)?G : dow===0?PK : dow===6?BL : TX }}>{d}</span>
              {hasDot && (
                <div style={{ display:"flex", gap:2, marginTop:2 }}>
                  {parseInt(rec.sinMin||0)>0       && <div style={{ width:6,height:6,borderRadius:"50%",background:G }}/>}
                  {(rec.haeng||[]).some(h=>h.name) && <div style={{ width:6,height:6,borderRadius:"50%",background:PK }}/>}
                  {(rec.hak||[]).some(h=>h.bookName)&& <div style={{ width:6,height:6,borderRadius:"50%",background:BL }}/>}
                </div>
              )}
            </button>
          )
        })}
      </div>
      {/* 선택 날짜 상세 */}
      {sel && (
        <div style={{ margin:"12px 12px 0", borderRadius:R, border:`1px solid ${BD}`,
          background:SF, padding:16 }}>
          <div style={{ fontSize:14, fontWeight:800, color:TX, marginBottom:12 }}>
            {sel.getMonth()+1}월 {sel.getDate()}일 기록
          </div>
          {(() => {
            const rec = getRec(sel.getDate())
            if (!rec) return <p style={{ textAlign:"center", fontSize:13, color:TX3 }}>기록이 없습니다</p>
            const sinN  = parseInt(rec.sinMin||0)
            const hCnt  = (rec.haeng||[]).filter(h=>h.name).length
            const hkPg  = (rec.hak||[]).reduce((s,h)=>s+Math.max(0,(parseInt(h.endPage)||0)-(parseInt(h.startPage)||0)+1),0)
            if (!sinN && !hCnt && !hkPg) return <p style={{ textAlign:"center", fontSize:13, color:TX3 }}>기록이 없습니다</p>
            return (
              <div style={{ display:"flex", justifyContent:"space-around" }}>
                {[
                  [sinN>0?`${Math.floor(sinN/60)}h ${sinN%60}m`:"–", "신·창제",    G ],
                  [`${hCnt}명`,                                       "행·광포격려", PK],
                  [`${hkPg}p`,                                        "학·연찬",    BL],
                ].map(([v,l,c]) => (
                  <div key={l} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:10, fontWeight:600, color:TX3 }}>{l}</div>
                    <div style={{ fontSize:18, fontWeight:900, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
            )
          })()}
          <button style={{ marginTop:12, width:"100%", borderRadius:RS,
            border:`1px solid ${BD}`, padding:"8px 0",
            fontSize:12, fontWeight:600, color:TX2, background:SF }}>기록보기</button>
        </div>
      )}
      {/* 범례 */}
      <div style={{ display:"flex", justifyContent:"center", gap:16, margin:"12px 12px 16px" }}>
        {[[G,"신·창제"],[PK,"행·광포격려"],[BL,"학·연찬"]].map(([c,l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:c }}/>
            <span style={{ fontSize:10, color:TX3 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 복운의 숲 탭 ─────────────────────────────────── */
const DEF_MSGS = [
  "오늘도 정진하는 당신이 멋져요! 한 걸음 한 걸음이 큰 성장이 됩니다",
  "꾸준함이 기적을 만들어요. 당신의 노력은 반드시 결실을 맺습니다",
  "오늘의 작은 실천이 내일의 큰 변화로 이어집니다",
]

function Marquee({ msgs, name, onEdit }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1)%msgs.length), 12000)
    return () => clearInterval(t)
  }, [msgs.length])

  return (
    <div style={{ background:`linear-gradient(to right,${G},${G2})`,
      padding:"12px 16px", display:"flex", alignItems:"center", gap:8, overflow:"hidden" }}>
      <div style={{ flex:1, height:20, overflow:"hidden", position:"relative" }}>
        <div key={idx} style={{ position:"absolute", whiteSpace:"nowrap",
          fontSize:13, fontWeight:600, color:"#fff",
          animation:"marq 25s linear infinite" }}>
          {msgs[idx].replace("당신", name)}
        </div>
      </div>
      <button onClick={onEdit}
        style={{ width:28, height:28, borderRadius:"50%",
          background:"rgba(255,255,255,0.2)", fontSize:14, flexShrink:0 }}>💬</button>
    </div>
  )
}

function WordChart({ cfg }) {
  const total    = 105
  const progress = Math.min(cfg.blocks, total)
  const pct      = Math.round((progress/total)*100)
  const emoji    = pct>=66 ? "👑" : pct>=33 ? "💍" : "💎"
  const colors   = ["#87cefa","#00bfff","#1e90ff"]
  return (
    <div style={{ borderRadius:R, border:`1px solid ${BD}`, background:SF, padding:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:12, fontWeight:800, color:TX }}>🙏🏻 나의 창제표</span>
        <span style={{ fontSize:11, fontWeight:700, color:TX3 }}>{pct}%</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(15,1fr)", gap:2, marginBottom:8 }}>
        {Array.from({length:total}, (_,i) => {
          const filled = i < progress
          const ci = filled ? Math.min(2, Math.floor((i/progress)*3)) : 0
          return (
            <div key={i} style={{ aspectRatio:"1", borderRadius:3,
              background: filled ? colors[ci] : BG,
              border: filled ? "none" : `1px solid ${BD}`,
              transition:"all 0.3s" }}/>
          )
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:4 }}>
        <span style={{ fontSize:16 }}>{emoji}</span>
        <span style={{ fontSize:10, fontWeight:700, color:TX3 }}>
          {Math.floor(cfg.blocks*30/60)}h {(cfg.blocks*30)%60}m / {Math.floor(cfg.goalMin/60)}h
        </span>
      </div>
    </div>
  )
}

/* 격려 활동 이모지 뷰 */
function ActViz({ count }) {
  const COLS = 10
  const rows = Math.ceil(count/COLS) || 0
  const getEmoji = rowIdx => rowIdx===0 ? "🌱" : rowIdx<=2 ? "🌳" : "🌸"

  return (
    <div style={{ borderRadius:R, border:`1px solid ${BD}`,
      background:`linear-gradient(135deg,${PKL}80,${GL}40)`, padding:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:800, color:TX }}>🌸 격려 활동</span>
        <span style={{ fontSize:16, fontWeight:900, color:PK }}>{count}회</span>
      </div>
      <div style={{ fontSize:10, color:TX3, textAlign:"center", marginBottom:8 }}>광포격려로 숲이 자라요</div>
      <div style={{ background:"rgba(255,255,255,0.5)", borderRadius:8, padding:8, minHeight:40 }}>
        {count===0
          ? <div style={{ textAlign:"center", padding:"12px 0", fontSize:12, color:TX3 }}>아직 기록이 없습니다</div>
          : Array.from({length:rows}, (_,rowIdx) => (
              <div key={rowIdx} style={{ display:"flex", gap:0, lineHeight:1.2 }}>
                {Array.from({length:Math.min(COLS, count-rowIdx*COLS)}, (_,col) => (
                  <span key={col} style={{ fontSize:16, display:"inline-block" }}>{getEmoji(rowIdx)}</span>
                ))}
              </div>
            ))
        }
      </div>
    </div>
  )
}

/* 회합 참석 이모지 뷰 */
function MeetViz({ count }) {
  const COLS = 8
  const rows = Math.ceil(count/COLS) || 0
  return (
    <div style={{ borderRadius:R, border:`1px solid rgba(255,215,0,0.3)`,
      background:"linear-gradient(135deg,#FFFBEC,#FFF8D0)", padding:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:800, color:TX }}>✨ 회합 참석</span>
        <span style={{ fontSize:16, fontWeight:900, color:"#D4A017" }}>{count}회</span>
      </div>
      <div style={{ fontSize:10, color:TX3, textAlign:"center", marginBottom:8 }}>함께한 순간이 빛나요</div>
      <div style={{ background:"rgba(255,255,255,0.6)", borderRadius:8, padding:8, minHeight:36 }}>
        {count===0
          ? <p style={{ textAlign:"center", fontSize:11, color:TX3 }}>아직 기록이 없습니다</p>
          : Array.from({length:rows}, (_,rowIdx) => (
              <div key={rowIdx} style={{ display:"flex", gap:0, lineHeight:1.2 }}>
                {Array.from({length:Math.min(COLS, count-rowIdx*COLS)}, (_,col) => (
                  <span key={col} style={{ fontSize:16, display:"inline-block" }}>✨</span>
                ))}
              </div>
            ))
        }
      </div>
    </div>
  )
}

/* 연찬 목록 */
function BooksList({ records }) {
  const bm = new Map()
  Object.values(records).forEach(r => (r.hak||[]).forEach(h => {
    if (!h.bookName) return
    const k = h.bookType+"::"+h.bookName
    const pg = Math.max(0,(parseInt(h.endPage)||0)-(parseInt(h.startPage)||0)+1)
    if (!bm.has(k)) bm.set(k, { bookType:h.bookType, bookName:h.bookName, pages:0 })
    bm.get(k).pages += pg
  }))
  const books  = [...bm.values()].filter(b => b.bookType==="도서")
  const essays = [...bm.values()].filter(b => b.bookType==="어서")
  if (!books.length && !essays.length) return null

  function BGroup({ label, icon, list, total, color, bgc }) {
    if (!list.length) return null
    return (
      <div style={{ borderRadius:R, border:`1px solid ${BD}`, background:SF, padding:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:800, color:TX }}>{icon} {label}</span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:TX3 }}>{list.length}{label==="도서"?"권":"편"}</span>
            <span style={{ fontSize:13, fontWeight:900, color }}>{total.toLocaleString()}p</span>
          </div>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {list.map((b,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:4,
              background:bgc, borderRadius:99, padding:"4px 10px" }}>
              <span style={{ fontSize:10, color:TX }}>{b.bookName}</span>
              <span style={{ fontSize:9, fontWeight:700, color }}>{b.pages}p</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <BGroup label="도서" icon="📚" list={books}  total={books.reduce((s,b)=>s+b.pages,0)}  color={BL} bgc={BLL}/>
      <BGroup label="어서" icon="📄" list={essays} total={essays.reduce((s,b)=>s+b.pages,0)} color={PU} bgc={PUL}/>
    </div>
  )
}

/* 메시지 모달 */
function MsgModal({ open, onClose, msgs, name, onSave }) {
  const [em, setEm] = useState([])
  const [en, setEn] = useState("")
  const [nw, setNw] = useState("")

  useEffect(() => {
    if (open) { setEm(msgs); setEn(name) }
  }, [open])

  if (!open) return null

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(0,0,0,0.5)", padding:16 }}>
      <div style={{ width:"100%", maxWidth:360, maxHeight:"80vh", overflowY:"auto",
        borderRadius:R, background:SF, padding:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:TX, textAlign:"center", marginBottom:16 }}>
          격려 메시지 편집
        </div>
        <label style={{ fontSize:12, fontWeight:600, color:TX2, display:"block", marginBottom:6 }}>이름</label>
        <input value={en} onChange={e => setEn(e.target.value)} placeholder="이름 입력..."
          style={{ width:"100%", borderRadius:RS, border:`1.5px solid ${BD}`,
            background:BG, padding:"8px 12px", fontSize:13, color:TX, marginBottom:16 }}/>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
          {em.map((msg,i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
              <div style={{ flex:1, borderRadius:8, background:BG, padding:8, fontSize:12, color:TX }}>{msg}</div>
              <button onClick={() => setEm(em.filter((_,j)=>j!==i))}
                style={{ fontSize:12, color:TX3 }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <input value={nw} onChange={e => setNw(e.target.value)} placeholder="새 메시지..."
            style={{ flex:1, borderRadius:RS, border:`1.5px solid ${BD}`,
              background:BG, padding:"8px 12px", fontSize:13, color:TX }}/>
          <button onClick={() => { if(nw.trim()){setEm([...em,nw.trim()]);setNw("")} }}
            style={{ borderRadius:RS, background:G, padding:"8px 12px",
              fontSize:12, fontWeight:700, color:"#fff" }}>추가</button>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={onClose}
            style={{ flex:1, borderRadius:RS, border:`1.5px solid ${BD}`,
              padding:"10px 0", fontSize:13, fontWeight:700, color:TX2, background:SF }}>취소</button>
          <button onClick={() => { onSave(em, en); onClose() }}
            style={{ flex:1, borderRadius:RS, background:G,
              padding:"10px 0", fontSize:13, fontWeight:700, color:"#fff" }}>저장</button>
        </div>
      </div>
    </div>
  )
}

/* 창제표 설정 모달 */
function ChartModal({ open, onClose, cfg, onSave }) {
  const [word,  setWord]  = useState("")
  const [name,  setName]  = useState("")
  const [sd,    setSd]    = useState("")
  const [ed,    setEd]    = useState("")
  const [prayer,setPrayer]= useState("")
  const [gh,    setGh]    = useState(50)

  useEffect(() => {
    if (open) {
      setWord(cfg.word); setName(cfg.name)
      setSd(cfg.startDate); setEd(cfg.endDate)
      setPrayer(cfg.prayer); setGh(Math.floor(cfg.goalMin/60))
    }
  }, [open])

  if (!open) return null

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(0,0,0,0.5)", padding:16 }}>
      <div style={{ width:"100%", maxWidth:360, maxHeight:"90vh", overflowY:"auto",
        borderRadius:R, background:SF, padding:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:TX, textAlign:"center", marginBottom:16 }}>
          창제표 설정
        </div>
        {[
          ["창제표 단어", <input key="w" value={word} onChange={e=>setWord(e.target.value.slice(0,4))} style={{ width:"100%",borderRadius:RS,border:`1.5px solid ${BD}`,background:BG,padding:"8px 12px",fontSize:13,color:TX }}/>],
          ["이름",        <input key="n" value={name} onChange={e=>setName(e.target.value)} style={{ width:"100%",borderRadius:RS,border:`1.5px solid ${BD}`,background:BG,padding:"8px 12px",fontSize:13,color:TX }}/>],
          ["기원문",      <textarea key="p" value={prayer} onChange={e=>setPrayer(e.target.value)} rows={3} style={{ width:"100%",resize:"none",borderRadius:RS,border:`1.5px solid ${BD}`,background:BG,padding:"8px 12px",fontSize:13,color:TX }}/>],
        ].map(([l, el]) => (
          <div key={l} style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:600, color:TX2, display:"block", marginBottom:6 }}>{l}</label>
            {el}
          </div>
        ))}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
          {[["시작일",sd,setSd],["종료일",ed,setEd]].map(([l,v,s]) => (
            <div key={l}>
              <label style={{ fontSize:12, fontWeight:600, color:TX2, display:"block", marginBottom:6 }}>{l}</label>
              <input type="date" value={v} onChange={e=>s(e.target.value)}
                style={{ width:"100%", borderRadius:RS, border:`1.5px solid ${BD}`,
                  background:BG, padding:"8px", fontSize:12, color:TX }}/>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:600, color:TX2, display:"block", marginBottom:6 }}>목표 시간 (시간)</label>
          <input type="number" value={gh} onChange={e => setGh(Number(e.target.value))} min={1}
            style={{ width:80, borderRadius:RS, border:`1.5px solid ${BD}`,
              background:BG, padding:"8px 12px", fontSize:14, fontWeight:700,
              color:TX, textAlign:"center" }}/>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={onClose}
            style={{ flex:1, borderRadius:RS, border:`1.5px solid ${BD}`,
              padding:"10px 0", fontSize:13, fontWeight:700, color:TX2, background:SF }}>취소</button>
          <button onClick={() => { onSave({...cfg,word,name,startDate:sd,endDate:ed,prayer,goalMin:gh*60}); onClose() }}
            style={{ flex:1, borderRadius:RS, background:G,
              padding:"10px 0", fontSize:13, fontWeight:700, color:"#fff" }}>저장</button>
        </div>
      </div>
    </div>
  )
}

function ForestTab({ records }) {
  const [msgs,     setMsgs]    = useState(DEF_MSGS)
  const [cfg,      setCfg]     = useState({
    word:"승리", name:"당신",
    startDate:"2026-03-01", endDate:"2026-04-30",
    prayer:"세계 평화와 일체 중생의 행복을 기원합니다",
    goalMin:3000, blocks:78,
  })
  const [showMsg,  setShowMsg] = useState(false)
  const [showCfg,  setShowCfg] = useState(false)

  const stats = useMemo(() => {
    let sinTotal=0, actCnt=0, meetCnt=0, pages=0
    const ACT_T  = ["대화","통화","연락","칸나"]
    const MEET_T = ["좌담회","좌담회 참석간부","협의","창제회"]
    Object.values(records).forEach(r => {
      sinTotal += parseInt(r.sinMin||0)
      ;(r.haeng||[]).forEach(h => {
        if (!h.name) return
        const t = getT(h)
        if (ACT_T.includes(t))  actCnt++
        if (MEET_T.includes(t)) meetCnt++
      })
      ;(r.hak||[]).forEach(h => {
        pages += Math.max(0,(parseInt(h.endPage)||0)-(parseInt(h.startPage)||0)+1)
      })
    })
    return { sinTotal, actCnt, meetCnt, pages }
  }, [records])

  const fmtD = s => { const d=new Date(s); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}` }

  return (
    <div style={{ display:"flex", flexDirection:"column", paddingBottom:16 }}>
      <Marquee msgs={msgs} name={cfg.name} onEdit={() => setShowMsg(true)}/>
      <div style={{ margin:"8px 12px 0", fontSize:10, color:TX3+"90" }}>
        {fmtD(cfg.startDate)} ~ {fmtD(cfg.endDate)}
      </div>
      {/* 통계 카드 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, margin:"8px 12px 0" }}>
        {[
          ["🙏",  `${Math.floor(stats.sinTotal/60)}h`, "창제 시간", GL],
          ["📖",  `${stats.pages.toLocaleString()}p`,  "연찬",      BLL],
          ["🌸",  stats.actCnt,                        "격려 활동", PKL],
          ["✨",  stats.meetCnt,                       "회합 참석", "#FFFBEC"],
        ].map(([ic,v,l,bg]) => (
          <div key={l} style={{ borderRadius:10, padding:"10px 4px", textAlign:"center", background:bg }}>
            <div style={{ fontSize:18 }}>{ic}</div>
            <div style={{ fontSize:15, fontWeight:900, color:TX, marginTop:2 }}>{v}</div>
            <div style={{ fontSize:9, fontWeight:600, color:TX2, marginTop:1 }}>{l}</div>
          </div>
        ))}
      </div>
      {/* 창제표 */}
      <div style={{ margin:"12px 12px 0" }}>
        <WordChart cfg={cfg}/>
        <button onClick={() => setShowCfg(true)}
          style={{ marginTop:8, width:"100%", borderRadius:RS,
            border:`1.5px dashed ${G}`, background:GL+"80",
            padding:"6px 0", fontSize:10, fontWeight:700, color:G }}>
          창제표 설정
        </button>
      </div>
      <div style={{ margin:"12px 12px 0" }}><ActViz  count={stats.actCnt}/></div>
      <div style={{ margin:"12px 12px 0" }}><MeetViz count={stats.meetCnt}/></div>
      <div style={{ margin:"12px 12px 0" }}><BooksList records={records}/></div>

      <MsgModal open={showMsg} onClose={() => setShowMsg(false)}
        msgs={msgs} name={cfg.name}
        onSave={(m,n) => { setMsgs(m); setCfg(c => ({...c, name:n})) }}/>
      <ChartModal open={showCfg} onClose={() => setShowCfg(false)}
        cfg={cfg} onSave={setCfg}/>
    </div>
  )
}

/* ── 앱 루트 ─────────────────────────────────────── */
export default function App() {
  const [tab,     setTab]     = useState("record")
  const [records, setRecords] = useState({})

  return (
    <div>
      <style>{GCSS}</style>
      <div style={{ maxWidth:390, margin:"0 auto", minHeight:"100vh",
        background:BG, display:"flex", flexDirection:"column" }}>
        <TabBar active={tab} onChange={setTab}/>
        <div style={{ flex:1 }}>
          {tab==="record"     && <RecordTab     records={records} setRecords={setRecords}/>}
          {tab==="collection" && <CollectionTab records={records}/>}
          {tab==="calendar"   && <CalendarTab   records={records}/>}
          {tab==="forest"     && <ForestTab     records={records}/>}
        </div>
      </div>
    </div>
  )
}
