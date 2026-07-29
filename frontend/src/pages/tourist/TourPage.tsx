import { useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Emotion } from '../../components/DigitalHuman'
import { voiceApi } from '../../services/api'
import { getPersona, DEFAULT_PERSONA } from '../../config/personas'
import { findBestVoice, findFallbackVoice } from '../../utils/voice'

interface ScenicSpot {
  id: string
  name: string
  subtitle: string
  icon: string
  color: string
  mapX: number  // percentage position on map
  mapY: number
  description: string  // fixed description, no API call
  practicalInfo?: string
}

const SCENIC_SPOTS: ScenicSpot[] = [
  {
    id: 'zhaobi',
    name: '灵山大照壁',
    subtitle: '华夏第一壁 · 游览起点',
    icon: '🧱',
    color: '#8b7355',
    mapX: 50, mapY: 90,
    description: '灵山大照壁位于景区入口广场，长39.8米，高7.2米，被誉为"华夏第一壁"。照壁正面镌刻着原中国佛教协会会长赵朴初先生题写的"灵山胜境"四个鎏金大字，笔力遒劲、气势恢宏。照壁背面刻有"诸恶莫作，众善奉行"的佛教偈语，提醒世人存善心、行善事。这里是游览灵山的第一站，几乎所有游客都会在此合影留念，寓意"祈福纳祥，平安吉祥"。照壁两侧种植着百年古樟，枝繁叶茂，与照壁共同构成了一幅庄严而宁静的画面。',
    practicalInfo: '全天开放，建议游览时长5-10分钟。',
  },
  {
    id: 'wumingqiao',
    name: '五明桥 · 佛足坛',
    subtitle: '过智慧桥 · 瞻仰佛足圣迹',
    icon: '🌉',
    color: '#7a9e7e',
    mapX: 50, mapY: 82,
    description: '五明桥横跨景区入口的香水河，桥名取自佛教"五明"之学——声明、工巧明、医方明、因明、内明，分别代表语言、技艺、医学、逻辑和佛学五种智慧。过桥寓意"以智慧渡彼岸"。桥北端是佛足坛，坛上雕刻着一对巨大的佛足印，足心刻有法轮图案，象征佛陀的足迹遍及四方、普度众生。佛足坛两侧设有十二座石灯幢，夜幕降临时灯火璀璨，更添庄严气氛。',
    practicalInfo: '全天开放，建议游览时长10分钟。',
  },
  {
    id: 'jiulongguanyu',
    name: '九龙灌浴',
    subtitle: '花开见佛 · 大型动态音乐群雕',
    icon: '🐉',
    color: '#4a9ec8',
    mapX: 50, mapY: 68,
    description: '九龙灌浴是国内最大的动态音乐群雕，再现了佛陀诞生时的祥瑞景象。雕塑主体由一座高达27.5米的莲花铜像和环绕四周的九条青铜巨龙组成。表演开始时，九条金龙同时向天空喷射出高达30多米的水柱，中央的巨大莲花在《佛诞》音乐的伴奏下缓缓绽放，幼年释迦牟尼佛从莲花中徐徐升起，一手指天、一手指地，寓意"天上天下，唯我独尊"。整个过程持续约15分钟，场面极其震撼。表演结束后，游客可在广场两侧的龙头处接取"八功德水"，据说能带来吉祥安康。',
    practicalInfo: '平日演出：10:00、11:30、13:30、15:00；周末及节假日加演（以景区广播为准），每场约15分钟，建议提前10分钟到场。',
  },
  {
    id: 'xiangfuchansi',
    name: '祥符禅寺',
    subtitle: '千年古刹 · 玄奘与小灵山的渊源',
    icon: '🏯',
    color: '#5d8a5e',
    mapX: 50, mapY: 55,
    description: '祥符禅寺始建于唐代贞观年间，距今已有1300多年历史。相传唐玄奘西天取经归来后，曾在此驻锡弘法。寺内有一口六角古井，是唐代名泉，曾被茶圣陆羽品鉴并列入江南名泉。大雄宝殿内供奉着释迦牟尼佛及迦叶、阿难两大弟子，香火千年不断。钟楼内悬挂着"祥符禅钟"，重达12.8吨，钟声浑厚悠远，响彻山谷。寺中还有一棵千年古银杏，枝繁叶茂，见证了寺院的兴衰与重生。祥符禅寺是灵山的精神之源，"小灵山"之名也由此而来。',
    practicalInfo: '开放时间8:30-16:30，免费参观，建议游览时长20-30分钟。',
  },
  {
    id: 'lingshandafo',
    name: '灵山大佛',
    subtitle: '88米青铜大佛 · 世界最高露天青铜立佛',
    icon: '🪷',
    color: '#c8963e',
    mapX: 50, mapY: 35,
    description: '灵山大佛高88米（佛身79米+莲花瓣9米），连同基座总高达101.5米，是目前世界上最高的露天青铜释迦牟尼立像。大佛由725吨青铜铸成，采用2000块铸铜面板精密拼接，焊缝总长达30余公里。佛祖面相慈眉善目，右手施"无畏印"（表示拔除众生痛苦），左手施"与愿印"（表示给予众生快乐）。登216级台阶可近距离瞻仰佛容，俯瞰太湖万顷碧波和马山半岛的壮丽景色。大佛底部设有佛教文化博物馆，展示了灵山的历史渊源和建造历程。民间有"抱佛脚"的说法——抱住大佛的脚趾祈福，据说非常灵验。',
    practicalInfo: '开放时间8:00-17:00，登顶需爬216级台阶（有电梯可供老人使用），建议游览时长40-60分钟。',
  },
  {
    id: 'fanshouguangchang',
    name: '佛手广场',
    subtitle: '天下第一掌 · 祈福纳祥',
    icon: '✋',
    color: '#d4a84b',
    mapX: 50, mapY: 45,
    description: '佛手广场位于祥符禅寺与大佛之间，核心景观是"天下第一掌"——一只按灵山大佛右手原比例复制的巨大铜掌，高11.7米、宽5.5米，重达13吨。铜掌的造型与大佛的右手完全一致，施"无畏印"，掌心刻有法轮图案。游客纷纷在此与铜掌合影，或者伸手与铜掌"击掌"，寓意"与佛结缘、祈福平安"。广场周围还设有百子戏弥勒雕塑群，弥勒佛笑容可掬，身上塑有100个形态各异的孩童，寓意"多子多福、皆大欢喜"。',
    practicalInfo: '全天开放，免费参观，建议游览时长15-20分钟。',
  },
  {
    id: 'fansong',
    name: '灵山梵宫',
    subtitle: '东方卢浮宫 · 佛教艺术殿堂',
    icon: '🏛️',
    color: '#d4852a',
    mapX: 25, mapY: 62,
    description: '灵山梵宫于2008年建成开放，总建筑面积达7万余平方米，被誉为"东方卢浮宫"。建筑外观呈"莲花环抱"之势，五座莲花圣塔矗立其上，塔刹采用鎏金工艺。梵宫内部汇集了东阳木雕、琉璃、壁画、漆画、石雕等数十种中国传统工艺，堪称一座"活态的非遗艺术博物馆"。廊厅两侧的12幅巨型油画《世界佛教传法图》，每幅高12米、宽3米，气势磅礴。中庭的星空穹顶以LED技术模拟浩瀚星河，变幻莫测，让人仿佛置身佛国天界。圣坛可容纳1500人，大型全息演出《灵山吉祥颂》以270度环形银幕呈现佛陀成道的故事，视觉震撼至极。',
    practicalInfo: '开放时间9:00-17:00（冬季16:30），《吉祥颂》演出：10:35、11:30、14:00、16:00，每场约20分钟，凭大门票免费入场，建议提前30分钟排队。',
  },
  {
    id: 'wuyintancheng',
    name: '五印坛城',
    subtitle: '藏传佛教 · 雪域文化体验',
    icon: '⛩️',
    color: '#c44e3d',
    mapX: 75, mapY: 62,
    description: '五印坛城是灵山胜境中展现藏传佛教文化的核心建筑，与梵宫隔香水海相望。建筑群采用藏式风格，金顶红墙、经幡飘扬，庄严肃穆中透着神秘。坛城内部供奉着藏传佛教的佛像、唐卡和曼荼罗，展示了雪域高原的佛教艺术精华。最受欢迎的体验是转经筒——沿着坛城外围的转经廊，依次转动108个铜制转经筒，每转一圈相当于诵念一遍经文，据说能为家人祈福消灾。登上坛城顶层平台，可以俯瞰香水海全景，与对面的梵宫遥遥相对，一汉一藏、交相辉映，展现了中国佛教文化的包容与多元。',
    practicalInfo: '开放时间9:00-17:00，建议游览时长30-40分钟，转经筒体验免费。',
  },
  {
    id: 'manfeilongta',
    name: '曼飞龙塔',
    subtitle: '傣族风格 · 南传佛教建筑',
    icon: '🕌',
    color: '#e8c97a',
    mapX: 80, mapY: 78,
    description: '曼飞龙塔又称"白塔"，是灵山胜境中代表南传佛教（傣族佛教）文化的核心建筑，完全复刻了云南西双版纳曼飞龙白塔的形制。主塔矗立在圆形须弥座中央，塔身呈葫芦状，塔刹高耸，鎏金装饰熠熠生辉；八座小塔环绕主塔分布，形成"众星拱月"的格局。塔身表面采用浅浮雕工艺，刻有释迦牟尼佛成道图、阿罗汉像、莲花纹、卷草纹等南传佛教特色图案，工艺精湛、栩栩如生。塔周围的园林景观融合了傣族建筑风格，种植着棕榈、芭蕉等热带植物，让人仿佛置身彩云之南。',
    practicalInfo: '全天开放，建议游览时长15-20分钟。',
  },
  {
    id: 'lingshanjingshe',
    name: '灵山精舍',
    subtitle: '禅意园林 · 宁静致远',
    icon: '🌿',
    color: '#5a9e6e',
    mapX: 20, mapY: 78,
    description: '灵山精舍是一处融合了禅宗文化与古典园林艺术的静谧空间。精舍依山而建，曲径通幽，园内遍植翠竹、苍松、腊梅，叠石理水、亭台楼阁错落有致，处处体现着"天人合一"的造园理念。精舍设有茶室和禅修空间，游客可以在此品一杯清茶、抄一卷经文，体验"竹径通幽处，禅房花木深"的意境。这里是灵山胜境中最适合放慢脚步、静心思考的地方，远离尘世喧嚣，体味内心的宁静。许多游客评价说"到了灵山精舍，才真正懂得了什么叫放下"。',
    practicalInfo: '开放时间9:00-16:30，茶室需另外消费，建议游览时长20-30分钟。',
  },
]

// 路线定义：名称匹配到景点ID
interface RouteStop { spotId: string; order: number }
interface RouteDef { title: string; icon: string; color: string; stops: string[] }
const ROUTES: RouteDef[] = [
  {
    title: '历史文化深度游', icon: '🏛️', color: '#8b5e3c',
    stops: ['zhaobi', 'wumingqiao', 'xiangfuchansi', 'lingshandafo', 'fansong', 'wuyintancheng'],
  },
  {
    title: '自然风光轻松游', icon: '🌿', color: '#2d8a7b',
    stops: ['jiulongguanyu', 'lingshandafo', 'manfeilongta', 'lingshanjingshe', 'fansong'],
  },
  {
    title: '亲子欢乐游', icon: '👨‍👩‍👧', color: '#e88b7e',
    stops: ['jiulongguanyu', 'fanshouguangchang', 'wuyintancheng', 'fansong'],
  },
]

function detectEmotion(text: string): Emotion {
  if (/欢迎|您好|壮观|宏伟|赞叹|震撼|美不胜收|最高|最大/.test(text)) return 'happy'
  if (/千年|古老|传承|历史|文化|精神|传说/.test(text)) return 'thinking'
  return 'neutral'
}

export default function TourPage() {
  const [searchParams] = useSearchParams()
  const persona = getPersona(DEFAULT_PERSONA)
  const [activeSpot, setActiveSpot] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [emotion, setEmotion] = useState<Emotion>('happy')
  const [showDetail, setShowDetail] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playIdRef = useRef(0)
  const mapRef = useRef<HTMLDivElement>(null)

  // 读取路线参数
  const routeIdx = parseInt(searchParams.get('route') || '', 10)
  const activeRoute: RouteDef | null = (routeIdx >= 0 && routeIdx < ROUTES.length) ? ROUTES[routeIdx] : null
  // 路线景点ID集合及序号映射
  const routeSpotOrder = activeRoute
    ? Object.fromEntries(activeRoute.stops.map((id, i) => [id, i + 1]))
    : {}
  const routeSpotSet = activeRoute ? new Set(activeRoute.stops) : null

  const selectedSpot = SCENIC_SPOTS.find((s) => s.id === activeSpot)

  const stopAudio = useCallback(() => {
    playIdRef.current++
    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speakText = useCallback((text: string, voice: string) => {
    playIdRef.current++
    const currentId = playIdRef.current
    setSpeaking(true)

    const browserVoice = findBestVoice(voice)
    if (browserVoice) {
      const u = new SpeechSynthesisUtterance(text)
      u.voice = browserVoice
      u.lang = 'zh-CN'
      u.rate = 1.05
      u.pitch = 1.0
      u.onend = () => { if (playIdRef.current === currentId) setSpeaking(false) }
      u.onerror = () => { if (playIdRef.current === currentId) speakViaEdgeTts(text, voice, currentId) }
      window.speechSynthesis.speak(u)
      return
    }
    speakViaEdgeTts(text, voice, currentId)
  }, [])

  const speakViaEdgeTts = useCallback(async (text: string, voice: string, currentId: number) => {
    try {
      const ab = await voiceApi.tts(text, voice)
      if (playIdRef.current !== currentId) return
      const url = URL.createObjectURL(ab)
      const a = new Audio(url)
      audioRef.current = a
      a.onended = () => { if (playIdRef.current === currentId) { setSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null } }
      a.onerror = () => { if (playIdRef.current === currentId) { setSpeaking(false); audioRef.current = null } }
      a.play()
    } catch {
      if (playIdRef.current !== currentId) return
      const fallback = findFallbackVoice()
      const u = new SpeechSynthesisUtterance(text)
      u.voice = fallback
      u.lang = 'zh-CN'; u.rate = 1.0
      u.onend = () => { if (playIdRef.current === currentId) setSpeaking(false) }
      window.speechSynthesis.speak(u)
    }
  }, [])

  const handleSpotClick = useCallback((spot: ScenicSpot) => {
    stopAudio()
    setActiveSpot(spot.id)
    setShowDetail(true)
    setEmotion(detectEmotion(spot.description))
    const text = spot.description + (spot.practicalInfo ? ' ' + spot.practicalInfo : '')
    speakText(text, persona.voice)
  }, [stopAudio, speakText, persona.voice])

  const handleCloseDetail = useCallback(() => {
    stopAudio()
    setShowDetail(false)
  }, [stopAudio])

  const handleReplay = useCallback(() => {
    if (!selectedSpot) return
    handleSpotClick(selectedSpot)
  }, [selectedSpot, handleSpotClick])

  // 地图点击：通过坐标计算最近景点，避开按钮定位/transform的移动端兼容问题
  const handleMapClick = useCallback((e: React.MouseEvent) => {
    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100
    let nearest: ScenicSpot | null = null
    let minDist = Infinity
    for (const spot of SCENIC_SPOTS) {
      // 路线模式下只响应路线内景点
      if (activeRoute && !activeRoute.stops.includes(spot.id)) continue
      const dx = spot.mapX - xPercent
      const dy = spot.mapY - yPercent
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < minDist) { minDist = dist; nearest = spot }
    }
    if (nearest && minDist < 12) handleSpotClick(nearest)
  }, [handleSpotClick, activeRoute])

  return (
    <div className={`page-enter tourist-tour ${showDetail ? 'has-detail' : 'no-detail'}`} style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Map header */}
      <div className="tourist-tour-header" style={{
        padding: '12px 16px', background: '#fff',
        borderBottom: '1px solid #f0ebe0',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8963e" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 600 }}>灵山胜境导览图</span>
        {activeRoute && (
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 12,
            background: `${activeRoute.color}18`, color: activeRoute.color,
            fontWeight: 600,
          }}>{activeRoute.icon} {activeRoute.title}</span>
        )}
        <span style={{ fontSize: 12, color: '#9c948c', marginLeft: 'auto' }}>
          {activeRoute ? '按序号游览' : '点击景点查看介绍'}
        </span>
      </div>

      {/* Map area - coordinate-based clicking avoids button positioning/touch issues */}
      <div className="tourist-tour-map" ref={mapRef} onClick={handleMapClick} style={{ flex: 1, position: 'relative', cursor: 'pointer' }}>
        {/* Clipped layer: background + decorative SVGs (pointerEvents:none passes clicks through) */}
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          background: 'linear-gradient(180deg, #e8f0e8 0%, #d5e8d0 15%, #eaf4e8 30%, #d8e8f0 50%, #e8f0e8 70%, #f0e8d8 100%)',
          pointerEvents: 'none',
        }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice">
              <polygon points="0,180 80,80 160,140 240,60 320,120 400,90 400,250 0,250" fill="rgba(180,200,170,0.3)" />
              <polygon points="0,200 100,140 180,170 280,120 400,150 400,280 0,280" fill="rgba(190,210,180,0.2)" />
              <ellipse cx="200" cy="620" rx="180" ry="40" fill="rgba(140,190,220,0.25)" />
              <ellipse cx="80" cy="460" rx="70" ry="55" fill="rgba(140,190,220,0.3)" />
              <path d="M200,600 L200,530 L200,470 L200,390 L200,280" stroke="rgba(180,160,140,0.5)" strokeWidth="2" strokeDasharray="6,4" fill="none"/>
              <path d="M200,470 L100,440 L60,430" stroke="rgba(180,160,140,0.5)" strokeWidth="2" strokeDasharray="6,4" fill="none"/>
              <path d="M200,470 L300,440 L340,430" stroke="rgba(180,160,140,0.5)" strokeWidth="2" strokeDasharray="6,4" fill="none"/>
              <path d="M60,430 L60,530" stroke="rgba(180,160,140,0.4)" strokeWidth="1.5" strokeDasharray="6,4" fill="none"/>
              <path d="M340,430 L340,530" stroke="rgba(180,160,140,0.4)" strokeWidth="1.5" strokeDasharray="6,4" fill="none"/>
              <text x="200" y="155" textAnchor="middle" fontSize="10" fill="rgba(0,0,0,0.2)">秦履峰</text>
              <text x="360" y="640" textAnchor="end" fontSize="9" fill="rgba(0,0,0,0.2)">香水海</text>
            </svg>
          </div>
          {activeRoute && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <svg style={{ width: '100%', height: '100%' }}>
                {activeRoute.stops.map((stopId, i) => {
                  if (i >= activeRoute.stops.length - 1) return null
                  const from = SCENIC_SPOTS.find(s => s.id === stopId)
                  const to = SCENIC_SPOTS.find(s => s.id === activeRoute.stops[i + 1])
                  if (!from || !to) return null
                  const x1 = from.mapX; const y1 = from.mapY
                  const x2 = to.mapX; const y2 = to.mapY
                  const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2
                  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI
                  return (
                    <g key={`arr-${stopId}`}>
                      <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                        stroke={activeRoute.color} strokeWidth="2.5" strokeDasharray="8,4"
                        opacity="0.6" strokeLinecap="round"
                      />
                      <polygon
                        points="-5,-3 5,0 -5,3"
                        fill={activeRoute.color}
                        opacity="0.7"
                        transform={`translate(${mx}%,${my}%) rotate(${angle})`}
                      />
                    </g>
                  )
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Visual spot markers (not clickable - map onClick handles all touches) */}
        {SCENIC_SPOTS.map((spot) => {
          const isActive = activeSpot === spot.id
          const routeOrder = routeSpotOrder[spot.id]
          const inRoute = !!routeOrder
          return (
            <div
              key={spot.id}
              style={{
                position: 'absolute',
                left: `${spot.mapX}%`,
                top: `${spot.mapY}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, pointerEvents: 'none',
                zIndex: 10,
                opacity: activeRoute && !inRoute ? 0.45 : 1,
              }}
            >
              <div style={{
                width: isActive ? 36 : inRoute ? 32 : 28,
                height: isActive ? 36 : inRoute ? 32 : 28,
                borderRadius: inRoute ? '50%' : '50% 50% 50% 0',
                transform: inRoute ? 'none' : 'rotate(-45deg)',
                background: inRoute ? activeRoute!.color : (isActive ? spot.color : '#fff'),
                border: inRoute ? `3px solid ${activeRoute!.color}` : `3px solid ${spot.color}`,
                boxShadow: inRoute
                  ? `0 4px 14px ${activeRoute!.color}50`
                  : (isActive ? `0 4px 16px ${spot.color}60` : '0 2px 8px rgba(0,0,0,0.12)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                position: 'relative',
              }}>
                {inRoute ? (
                  <span style={{
                    fontSize: 14, fontWeight: 800, color: '#fff',
                    textShadow: `0 1px 2px ${activeRoute!.color}80`,
                  }}>{routeOrder}</span>
                ) : (
                  <span style={{ transform: 'rotate(45deg)', fontSize: isActive ? 16 : 12 }}>
                    {spot.icon}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 10, fontWeight: isActive ? 700 : inRoute ? 600 : 500,
                color: inRoute ? activeRoute!.color : (isActive ? spot.color : '#5c5348'),
                background: inRoute ? `${activeRoute!.color}12` : 'rgba(255,255,255,0.85)',
                padding: '1px 6px', borderRadius: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}>{spot.name}</span>
            </div>
          )
        })}
      </div>

      {/* Digital human + detail panel */}
      {showDetail && selectedSpot && (
        <div className="tourist-tour-detail" style={{
          background: '#fff', borderTop: '1px solid #f0ebe0',
          animation: 'pageIn 0.3s ease-out',
          maxHeight: '42%', overflow: 'auto',
        }}>
          {/* Digital human row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            background: `linear-gradient(135deg, ${selectedSpot.color}12, ${selectedSpot.color}08)`,
          }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              {persona.image && (
                <img src={persona.image} alt={persona.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: selectedSpot.color }}>
                {selectedSpot.icon} {selectedSpot.name}
              </div>
              <div style={{ fontSize: 11, color: '#9c948c' }}>
                {speaking ? '正在讲解...' : selectedSpot.subtitle}
              </div>
            </div>
            <button onClick={handleReplay} style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: '#f5f1eb', color: selectedSpot.color,
              fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title="重播">🔄</button>
            <button onClick={handleCloseDetail} style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: '#f5f1eb', color: '#9c948c',
              fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title="关闭">✕</button>
          </div>

          {/* Description */}
          <div style={{ padding: '10px 14px 14px' }}>
            <p style={{
              fontSize: 13.5, lineHeight: 1.75, color: '#3d3630',
              margin: 0, textAlign: 'justify',
            }}>{selectedSpot.description}</p>
            {selectedSpot.practicalInfo && (
              <div style={{
                marginTop: 10, padding: '8px 12px',
                background: '#fef9f0', borderRadius: 10,
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

      {/* Bottom hint when nothing selected */}
      {!showDetail && (
        <div className="tourist-tour-hint" style={{
          padding: '8px', textAlign: 'center',
          background: 'rgba(255,255,255,0.9)',
          borderTop: '1px solid #f0ebe0',
        }}>
          <span style={{ fontSize: 12, color: '#9c948c' }}>
            👆 点击地图上的标记点，让AI导游为您介绍
          </span>
        </div>
      )}
    </div>
  )
}
