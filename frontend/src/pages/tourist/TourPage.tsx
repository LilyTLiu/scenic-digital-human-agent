import { useState, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import type { Emotion } from '../../components/DigitalHuman'
import { voiceApi } from '../../services/api'
import { getPersona } from '../../config/personas'
import { findPersonaVoice, findBestVoice, findFallbackVoice } from '../../utils/voice'

// ─── 景点位置（按迪士尼风格 2.5D 鸟瞰图布局 ── 中轴线从下到上） ───

interface ScenicSpot {
  id: string
  name: string
  subtitle: string
  icon: string
  color: string
  mapX: number
  mapY: number
  description: string
  practicalInfo?: string
}

const SCENIC_SPOTS: ScenicSpot[] = [
  {
    id: 'zhaobi', name: '灵山大照壁', subtitle: '华夏第一壁 · 游览起点',
    icon: '🧱', color: '#8b7355',
    mapX: 50, mapY: 90,
    description: '灵山大照壁位于景区入口广场，长39.8米，高7.2米，被誉为"华夏第一壁"。照壁正面镌刻着原中国佛教协会会长赵朴初先生题写的"灵山胜境"四个鎏金大字，笔力遒劲、气势恢宏。照壁背面刻有"诸恶莫作，众善奉行"的佛教偈语，提醒世人存善心、行善事。这里是游览灵山的第一站，几乎所有游客都会在此合影留念，寓意"祈福纳祥，平安吉祥"。照壁两侧种植着百年古樟，枝繁叶茂，与照壁共同构成了一幅庄严而宁静的画面。',
    practicalInfo: '全天开放，建议游览时长5-10分钟。',
  },
  {
    id: 'wumingqiao', name: '五明桥 · 佛足坛', subtitle: '过智慧桥 · 瞻仰佛足圣迹',
    icon: '🌉', color: '#7a9e7e',
    mapX: 50, mapY: 78,
    description: '五明桥横跨景区入口的香水河，桥名取自佛教"五明"之学——声明、工巧明、医方明、因明、内明。过桥寓意"以智慧渡彼岸"。桥北端是佛足坛，坛上雕刻着一对巨大的佛足印，足心刻有法轮图案，象征佛陀的足迹遍及四方、普度众生。',
    practicalInfo: '全天开放，建议游览时长10分钟。',
  },
  {
    id: 'jiulongguanyu', name: '九龙灌浴', subtitle: '花开见佛 · 大型动态音乐群雕',
    icon: '🐉', color: '#4a9ec8',
    mapX: 50, mapY: 65,
    description: '九龙灌浴是国内最大的动态音乐群雕，再现了佛陀诞生时的祥瑞景象。雕塑主体由一座高达27.5米的莲花铜像和环绕四周的九条青铜巨龙组成。表演开始时，九条金龙同时向天空喷射出高达30多米的水柱，中央的巨大莲花在《佛诞》音乐伴奏下缓缓绽放，幼年释迦牟尼佛从莲花中徐徐升起。',
    practicalInfo: '平日演出：10:00、11:30、13:30、15:00；每场约15分钟，建议提前10分钟到场。',
  },
  {
    id: 'xiangfuchansi', name: '祥符禅寺', subtitle: '千年古刹 · 玄奘与小灵山的渊源',
    icon: '🏯', color: '#5d8a5e',
    mapX: 45, mapY: 50,
    description: '祥符禅寺始建于唐代贞观年间，距今已有1300多年历史。相传唐玄奘西天取经归来后，曾在此驻锡弘法。寺内有一口六角古井，是唐代名泉，曾被茶圣陆羽品鉴并列入江南名泉。寺中还有一棵千年古银杏，枝繁叶茂，见证了寺院的兴衰与重生。',
    practicalInfo: '开放时间8:30-16:30，免费参观，建议游览时长20-30分钟。',
  },
  {
    id: 'fanshouguangchang', name: '佛手广场', subtitle: '天下第一掌 · 祈福纳祥',
    icon: '✋', color: '#d4a84b',
    mapX: 50, mapY: 40,
    description: '佛手广场位于祥符禅寺与大佛之间，核心景观是"天下第一掌"——一只按灵山大佛右手原比例复制的巨大铜掌，高11.7米、宽5.5米，重达13吨。铜掌的造型与大佛的右手完全一致，施"无畏印"，掌心刻有法轮图案。',
    practicalInfo: '全天开放，免费参观，建议游览时长15-20分钟。',
  },
  {
    id: 'lingshandafo', name: '灵山大佛', subtitle: '88米青铜大佛 · 世界最高露天青铜立佛',
    icon: '🪷', color: '#c8963e',
    mapX: 50, mapY: 20,
    description: '灵山大佛高88米（佛身79米+莲花瓣9米），连同基座总高达101.5米，是目前世界上最高的露天青铜释迦牟尼立像。大佛由725吨青铜铸成，佛祖面相慈眉善目，右手施"无畏印"，左手施"与愿印"。登216级台阶可近距离瞻仰佛容，俯瞰太湖万顷碧波。',
    practicalInfo: '开放时间8:00-17:00，登顶需爬216级台阶（有电梯），建议游览时长40-60分钟。',
  },
  {
    id: 'fansong', name: '灵山梵宫', subtitle: '东方卢浮宫 · 佛教艺术殿堂',
    icon: '🏛️', color: '#d4852a',
    mapX: 72, mapY: 46,
    description: '灵山梵宫于2008年建成开放，总建筑面积达7万余平方米，被誉为"东方卢浮宫"。建筑外观呈"莲花环抱"之势，内部汇集了东阳木雕、琉璃、壁画、漆画、石雕等数十种中国传统工艺，堪称一座"活态的非遗艺术博物馆"。',
    practicalInfo: '开放时间9:00-17:00（冬季16:30），《吉祥颂》演出：10:35、11:30、14:00、16:00，每场约20分钟。',
  },
  {
    id: 'wuyintancheng', name: '五印坛城', subtitle: '藏传佛教 · 雪域文化体验',
    icon: '⛩️', color: '#c44e3d',
    mapX: 78, mapY: 34,
    description: '五印坛城是灵山胜境中展现藏传佛教文化的核心建筑，与梵宫隔香水海相望。建筑群采用藏式风格，金顶红墙、经幡飘扬。最受欢迎的体验是转经筒——沿着坛城外围的转经廊，依次转动108个铜制转经筒，每转一圈相当于诵念一遍经文。',
    practicalInfo: '开放时间9:00-17:00，建议游览时长30-40分钟，转经筒体验免费。',
  },
  {
    id: 'manfeilongta', name: '曼飞龙塔', subtitle: '傣族风格 · 南传佛教建筑',
    icon: '🕌', color: '#e8c97a',
    mapX: 82, mapY: 65,
    description: '曼飞龙塔又称"白塔"，是灵山胜境中代表南传佛教文化的核心建筑，完全复刻了云南西双版纳曼飞龙白塔的形制。主塔矗立在圆形须弥座中央，八座小塔环绕主塔分布，塔身表面采用浅浮雕工艺，工艺精湛。',
    practicalInfo: '全天开放，建议游览时长15-20分钟。',
  },
  {
    id: 'lingshanjingshe', name: '灵山精舍', subtitle: '禅意园林 · 宁静致远',
    icon: '🌿', color: '#5a9e6e',
    mapX: 25, mapY: 72,
    description: '灵山精舍是一处融合了禅宗文化与古典园林艺术的静谧空间。精舍依山而建，曲径通幽，园内遍植翠竹、苍松、腊梅，叠石理水、亭台楼阁错落有致。精舍设有茶室和禅修空间，游客可以在此品一杯清茶、抄一卷经文。',
    practicalInfo: '开放时间9:00-16:30，茶室需另外消费，建议游览时长20-30分钟。',
  },
]

// ─── 路线定义 ───

interface RouteDef { id: string; title: string; icon: string; color: string; glowColor: string; stops: string[] }
const ROUTES: RouteDef[] = [
  {
    id: 'history', title: '历史文化游', icon: '🏛️', color: '#e85d3a', glowColor: '#ff7f50',
    stops: ['zhaobi', 'wumingqiao', 'xiangfuchansi', 'lingshandafo', 'fansong', 'wuyintancheng'],
  },
  {
    id: 'nature', title: '自然风光游', icon: '🌿', color: '#00b894', glowColor: '#55efc4',
    stops: ['lingshanjingshe', 'jiulongguanyu', 'lingshandafo', 'manfeilongta', 'fansong'],
  },
  {
    id: 'family', title: '亲子欢乐游', icon: '👨‍👩‍👧', color: '#f39c12', glowColor: '#fdcb6e',
    stops: ['jiulongguanyu', 'fanshouguangchang', 'wuyintancheng', 'fansong'],
  },
]

// ─── 工具函数 ───

function detectEmotion(text: string): Emotion {
  if (/欢迎|您好|壮观|宏伟|赞叹|震撼|美不胜收|最高|最大/.test(text)) return 'happy'
  if (/千年|古老|传承|历史|文化|精神|传说/.test(text)) return 'thinking'
  return 'neutral'
}

// 使用 Python 生成的 2.5D 手绘插画底图
const MAP_BG = '/map_bg.png'

// ─── 路线路径渲染 ───

function renderRoutePath(
  stops: string[], color: string, glowColor: string,
  dash: string, opacity: number, allSpots: ScenicSpot[],
) {
  const segments: { x1: string; y1: string; x2: string; y2: string; cx: number; cy: number; angle: number }[] = []
  for (let i = 0; i < stops.length - 1; i++) {
    const from = allSpots.find(s => s.id === stops[i])
    const to = allSpots.find(s => s.id === stops[i + 1])
    if (!from || !to) continue
    const x1 = from.mapX; const y1 = from.mapY
    const x2 = to.mapX; const y2 = to.mapY
    segments.push({
      x1: `${x1}%`, y1: `${y1}%`, x2: `${x2}%`, y2: `${y2}%`,
      cx: (x1 + x2) / 2, cy: (y1 + y2) / 2,
      angle: Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI,
    })
  }
  return (
    <g key={`route-${color}`}>
      {/* 发光底层 */}
      {segments.map((seg, i) => (
        <line key={`glow-${i}`} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
          stroke={glowColor} strokeWidth="14" strokeDasharray={dash}
          opacity={opacity * 0.5} strokeLinecap="round" filter="url(#neonGlow)"
        />
      ))}
      {/* 强发光核心 */}
      {segments.map((seg, i) => (
        <line key={`core-${i}`} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
          stroke={glowColor} strokeWidth="6" strokeDasharray={dash}
          opacity={opacity * 0.7} strokeLinecap="round" filter="url(#neonStrong)"
        />
      ))}
      {/* 实线 */}
      {segments.map((seg, i) => (
        <line key={`line-${i}`} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
          stroke={color} strokeWidth="3.5"
          opacity={opacity} strokeLinecap="round"
        />
      ))}
      {/* 箭头 */}
      {segments.filter((_, i) => opacity > 0.4).map((seg, i) => (
        <polygon key={`arr-${i}`}
          points="-5,-3.5 5,0 -5,3.5"
          fill={color}
          opacity={opacity}
          transform={`translate(${seg.cx}%,${seg.cy}%) rotate(${seg.angle})`}
        />
      ))}
    </g>
  )
}

// ─── 标记点渲染 ───

function SpotPin({ spot, isActive, routeOrder, inRoute, routeColor }: {
  spot: ScenicSpot; isActive: boolean; routeOrder: number; inRoute: boolean; routeColor: string
}) {
  const size = inRoute ? 38 : (isActive ? 44 : 32)
  const innerSize = size - 8
  return (
    <div style={{
      position: 'absolute', left: `${spot.mapX}%`, top: `${spot.mapY}%`,
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 5, pointerEvents: 'none',
      zIndex: isActive ? 30 : 15,
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }}>
      {/* 发光光晕 */}
      {isActive && (
        <div style={{
          position: 'absolute', width: 80, height: 80, borderRadius: '50%',
          background: `radial-gradient(circle, ${spot.color}40 0%, transparent 70%)`,
          animation: 'pinPulse 2s ease-in-out infinite',
          top: -40, left: -40,
          pointerEvents: 'none',
        }}/>
      )}
      {/* 浮动标记点 — 迪士尼风格圆盘 */}
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: inRoute
          ? `linear-gradient(135deg, ${routeColor}, ${routeColor}cc)`
          : `linear-gradient(135deg, ${spot.color}, ${spot.color}bb)`,
        border: `3px solid ${isActive ? '#fff' : 'rgba(255,255,255,0.6)'}`,
        boxShadow: isActive
          ? `0 4px 24px ${spot.color}70, 0 0 0 4px ${spot.color}25, 0 2px 8px rgba(0,0,0,0.2)`
          : `0 3px 14px ${spot.color}40, 0 1px 3px rgba(0,0,0,0.15)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: isActive ? 'pinFloat 2.5s ease-in-out infinite' : 'none',
        cursor: 'pointer',
        position: 'relative',
        filter: inRoute ? 'none' : `saturate(${isActive ? 1.2 : 0.9})`,
      }}>
        {/* 内部圆 */}
        <div style={{
          width: innerSize, height: innerSize, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {inRoute ? (
            <span style={{
              fontSize: routeOrder < 10 ? 16 : 12,
              fontWeight: 800, color: '#fff',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}>{routeOrder}</span>
          ) : (
            <span style={{ fontSize: innerSize * 0.45, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
              {spot.icon}
            </span>
          )}
        </div>
      </div>
      {/* 名称标签 */}
      {isActive && (
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: '#fff',
          background: spot.color,
          padding: '3px 14px', borderRadius: 20,
          whiteSpace: 'nowrap',
          boxShadow: `0 2px 10px ${spot.color}50`,
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {spot.icon} {spot.name}
        </div>
      )}
      {!isActive && (
        <span style={{
          fontSize: 10, fontWeight: inRoute ? 600 : 500,
          color: inRoute ? routeColor : '#6b5a4a',
          background: inRoute ? `${routeColor}15` : 'rgba(255,255,255,0.85)',
          padding: '1px 8px', borderRadius: 10,
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>{spot.name}</span>
      )}
    </div>
  )
}

// ─── 主组件 ───

export default function TourPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const persona = getPersona(searchParams.get('persona'))
  const [activeSpot, setActiveSpot] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playIdRef = useRef(0)
  const mapRef = useRef<HTMLDivElement>(null)

  const routeIdx = parseInt(searchParams.get('route') || '', 10)
  const activeRoute: RouteDef | null = (routeIdx >= 0 && routeIdx < ROUTES.length) ? ROUTES[routeIdx] : null
  const routeSpotOrder = activeRoute
    ? Object.fromEntries(activeRoute.stops.map((id, i) => [id, i + 1]))
    : {}

  const selectedSpot = SCENIC_SPOTS.find((s) => s.id === activeSpot)

  const stopAudio = useCallback(() => {
    playIdRef.current++
    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speakViaEdgeTts = useCallback(async (text: string, voice: string, currentId: number) => {
    try {
      const ab = await voiceApi.tts(text, voice, persona.tts_style, persona.tts_rate, persona.tts_pitch)
      if (playIdRef.current !== currentId) return
      const url = URL.createObjectURL(ab)
      const a = new Audio(url)
      audioRef.current = a
      a.onended = () => { if (playIdRef.current === currentId) { setSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null } }
      a.onerror = () => { if (playIdRef.current === currentId) { setSpeaking(false); audioRef.current = null } }
      a.play()
    } catch {
      if (playIdRef.current !== currentId) return
      let browserVoice = findPersonaVoice(persona.id)
      if (!browserVoice) browserVoice = findBestVoice(voice)
      const u = new SpeechSynthesisUtterance(text)
      u.voice = browserVoice || findFallbackVoice()
      u.lang = 'zh-CN'
      u.rate = persona.browser_rate
      u.pitch = persona.browser_pitch
      u.onend = () => { if (playIdRef.current === currentId) setSpeaking(false) }
      window.speechSynthesis.speak(u)
    }
  }, [persona])

  const handleSpotClick = useCallback((spot: ScenicSpot) => {
    stopAudio()
    setActiveSpot(spot.id)
    setShowDetail(true)
    const text = spot.description + (spot.practicalInfo ? ' ' + spot.practicalInfo : '')
    speakViaEdgeTts(text, persona.voice, playIdRef.current + 1)
  }, [stopAudio, speakViaEdgeTts, persona.voice])

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100
    let nearest: ScenicSpot | null = null
    let minDist = Infinity
    for (const spot of SCENIC_SPOTS) {
      if (activeRoute && !activeRoute.stops.includes(spot.id)) continue
      const dist = Math.sqrt((spot.mapX - xPercent) ** 2 + (spot.mapY - yPercent) ** 2)
      if (dist < minDist) { minDist = dist; nearest = spot }
    }
    if (nearest && minDist < 14) handleSpotClick(nearest)
  }, [handleSpotClick, activeRoute])

  return (
    <div className="page-enter" style={{
      height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: '#f8f4ec',
    }}>
      {/* ─── 顶部栏 ─── */}
      <div style={{
        padding: '10px 16px', background: '#fefcf8',
        borderBottom: '1px solid rgba(200,190,170,0.3)',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>
        <span style={{ fontSize: 20 }}>🗺️</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#4a3a2a', letterSpacing: 0 }}>
          灵山胜境
        </span>
        <div style={{ flex: 1, display: 'flex', gap: 3, marginLeft: 4, overflow: 'auto', flexShrink: 1, minWidth: 0 }}>
          <button onClick={() => navigate('/tourist/tour')}
            style={{
              padding: '2px 7px', borderRadius: 10, border: 'none',
              background: !activeRoute ? '#c8963e' : 'rgba(0,0,0,0.04)',
              color: !activeRoute ? '#fff' : '#9c948c',
              fontSize: 10, fontWeight: !activeRoute ? 600 : 400, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>📍 全景</button>
          {ROUTES.map((r, i) => (
            <button key={r.id} onClick={() => navigate(`/tourist/tour?route=${i}`)}
              style={{
                padding: '2px 7px', borderRadius: 10, border: 'none',
                background: activeRoute?.id === r.id ? r.color : `${r.color}18`,
                color: activeRoute?.id === r.id ? '#fff' : r.color,
                fontSize: 10, fontWeight: activeRoute?.id === r.id ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >{r.icon} {r.title}</button>
          ))}
        </div>

      </div>

      {/* ─── 地图画面 ─── */}
      <div ref={mapRef} onClick={handleMapClick}
        style={{
          flex: 1, position: 'relative', cursor: 'pointer', overflow: 'hidden',
          background: '#f8f4ec',
        }}
      >
        {/* 手绘插画底图 */}
        <img src={MAP_BG} alt="灵山胜境导览图"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
        />

        {/* 路线路径（SVG 覆盖层） */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <svg style={{ width: '100%', height: '100%' }}>
            <defs>
              <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b1"/>
                <feGaussianBlur stdDeviation="1.5" result="b2"/>
                <feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="neonStrong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="b1"/>
                <feGaussianBlur stdDeviation="2.5" result="b2"/>
                <feGaussianBlur stdDeviation="1" result="b3"/>
                <feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="b3"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {activeRoute
              ? renderRoutePath(activeRoute.stops, activeRoute.color, activeRoute.glowColor, "8,4", 0.7, SCENIC_SPOTS)
              : ROUTES.map(r => renderRoutePath(r.stops, r.color, r.glowColor, "6,4", 0.35, SCENIC_SPOTS))}
          </svg>
        </div>

        {/* 景点标记 */}
        {SCENIC_SPOTS.map((spot) => {
          const order = routeSpotOrder[spot.id]
          const inRoute = !!order
          if (activeRoute && !inRoute) return null
          return (
            <SpotPin key={spot.id} spot={spot}
              isActive={activeSpot === spot.id}
              routeOrder={order}
              inRoute={inRoute}
              routeColor={activeRoute?.color || spot.color}
            />
          )
        })}

        {/* 底部路线图例 */}
        {!showDetail && (
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 8, padding: '5px 12px',
            background: 'rgba(255,255,255,0.85)', borderRadius: 20,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'auto', zIndex: 20,
          }}>
            <span style={{ fontSize: 9, color: '#b8a898', marginRight: 2 }}>路线</span>
            {ROUTES.map((r, i) => (
              <button key={r.id} onClick={(e) => { e.stopPropagation(); navigate(`/tourist/tour?route=${i}`) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer',
                  padding: '2px 6px', borderRadius: 8, border: 'none',
                  background: activeRoute?.id === r.id ? r.color : 'transparent',
                  color: activeRoute?.id === r.id ? '#fff' : r.color,
                  fontSize: 9, fontWeight: activeRoute?.id === r.id ? 600 : 400,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ width: 10, height: 2, borderRadius: 1, background: activeRoute?.id === r.id ? '#fff' : r.color }}/>
                {r.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── 底部详情面板 ─── */}
      {showDetail && selectedSpot && (
        <div style={{
          background: '#fff', borderTop: '1px solid rgba(200,190,170,0.3)',
          animation: 'pageIn 0.3s ease-out',
          maxHeight: '38%', overflow: 'auto',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px',
            background: `linear-gradient(135deg, ${selectedSpot.color}12, ${selectedSpot.color}05)`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              border: `2.5px solid ${selectedSpot.color}50`,
              boxShadow: `0 2px 12px ${selectedSpot.color}30`,
            }}>
              {persona.image && <img src={persona.image} alt={persona.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}/>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>{selectedSpot.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: selectedSpot.color }}>
                  {selectedSpot.name}
                </span>
                {activeRoute && routeSpotOrder[selectedSpot.id] && (
                  <span style={{
                    fontSize: 9, padding: '1px 6px', borderRadius: 8,
                    background: activeRoute.color, color: '#fff', fontWeight: 700,
                  }}>第{routeSpotOrder[selectedSpot.id]}站</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#b8a898', marginTop: 1 }}>
                {speaking ? '🔊 正在讲解' : selectedSpot.subtitle}
              </div>
            </div>
            <button onClick={() => handleSpotClick(selectedSpot)}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: selectedSpot.color + '15', color: selectedSpot.color,
                fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>🔊</button>
            <button onClick={() => { stopAudio(); setShowDetail(false) }}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none',
                background: '#f5f1eb', color: '#9c948c',
                fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
          </div>
          <div style={{ padding: '10px 16px 14px' }}>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: '#3d3630', margin: 0, textAlign: 'justify' }}>
              {selectedSpot.description}
            </p>
            {selectedSpot.practicalInfo && (
              <div style={{
                marginTop: 8, padding: '8px 12px', borderRadius: 10,
                background: 'linear-gradient(135deg, #fef9f0, #fff8ee)',
                borderLeft: `3px solid ${selectedSpot.color}`,
              }}>
                <span style={{ fontSize: 11, color: '#9c948c' }}>📋 </span>
                <span style={{ fontSize: 12, color: '#6b6058', fontWeight: 500 }}>
                  {selectedSpot.practicalInfo}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pinFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pinPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
