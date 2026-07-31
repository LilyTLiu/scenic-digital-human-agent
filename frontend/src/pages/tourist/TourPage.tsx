import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import type { Emotion } from '../../components/DigitalHuman'
import { voiceApi } from '../../services/api'
import { getPersona, DEFAULT_PERSONA } from '../../config/personas'
import { findBestVoice, findFallbackVoice } from '../../utils/voice'
import ScenicMap from '../../components/ScenicMap'

interface ScenicSpot {
  id: string
  name: string
  subtitle: string
  icon: string
  color: string
  mapX: number  // percentage position on map
  mapY: number
  image: string  // 景点照片 URL
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
    image: '/spots/linshandazhaobi.png',
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
    image: '/spots/wumingqiao.png',
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
    image: '/spots/jiulongguanyu.png',
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
    image: '/spots/xiangfuchansi.jpg',
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
    image: '/spots/linshandafo.jpg',
    description: '灵山大佛高88米（佛身79米+莲花瓣9米），连同基座总高达101.5米，是目前世界上最高的露天青铜释迦牟尼立像。大佛由725吨青铜铸成，采用2000块铸铜面板精密拼接，焊缝总长达30余公里。佛祖面相慈眉善目，右手施"无畏印"（表示拔除众生痛苦），左手施"与愿印"（表示给予众生快乐）。登216级台阶可近距离瞻仰佛容，俯瞰太湖万顷碧波和马山半岛的壮丽景色。大佛底部设有佛教文化博物馆，展示了灵山的历史渊源 and 建造历程。民间有"抱佛脚"的说法——抱住大佛的脚趾祈福，据说非常灵验。',
    practicalInfo: '开放时间8:00-17:00，登顶需爬216级台阶（有电梯可供老人使用），建议游览时长40-60分钟。',
  },
  {
    id: 'fanshouguangchang',
    name: '佛手广场',
    subtitle: '天下第一掌 · 祈福纳祥',
    icon: '✋',
    color: '#d4a84b',
    mapX: 50, mapY: 45,
    image: '/spots/foshouguangchang.png',
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
    image: '/spots/linshanfangong.jpg',
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
    image: '/spots/wuyintancheng.jpg',
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
    image: '/spots/manfeilongta.png',
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
    image: '/spots/linshanjingshe.jpg',
    description: '灵山精舍是一处融合了禅宗文化与古典园林艺术的静谧空间。精舍依山而建，曲径通幽，园内遍植翠竹、苍松、腊梅，叠石理水、亭台楼阁错落有致，处处体现着"天人合一"的造园理念。精舍设有茶室和禅修空间，游客可以在此品一杯清茶、抄一卷经文，体验"竹径通幽处，禅房花木深"的意境。这里是灵山胜境中最适合放慢脚步、静心思考的地方，远离尘世喧嚣，体味内心的宁静。许多游客评价说"到了灵山精舍，才真正懂得了什么叫放下"。',
    practicalInfo: '开放时间9:00-16:30，茶室需另外消费，建议游览时长20-30分钟。',
  },
]

interface RouteDef { title: string; icon: string; image?: string; color: string; stops: string[]; distance: string; duration: string; intensity: string; crowd: string; tags: string[]; tips: string; spotTimes: string[] }
const ROUTES: RouteDef[] = [
  { title: '历史文化深度游', icon: '🏛️', image: '/spots/linshandafo.jpg', color: '#8b5e3c', distance: '约3.5km', duration: '约6小时', intensity: '适中', crowd: '较多', tags: ['历史','文化','佛教','建筑'], tips: '建议8:30前入园，先参观大照壁→祥符禅寺（上午光线好）→登大佛（中午前凉爽）→梵宫（下午室内参观）。祥符禅寺免费，梵宫16:30关门。', spotTimes: ['10','10','25','50','50','35'], stops: ['zhaobi','wumingqiao','xiangfuchansi','lingshandafo','fansong','wuyintancheng'] },
  { title: '自然风光轻松游', icon: '🌿', image: '/spots/wuyintancheng.jpg', color: '#2d8a7b', distance: '约3km', duration: '约5小时', intensity: '轻松', crowd: '中等', tags: ['自然','摄影','休闲','园林'], tips: '建议9:00后入园，先看九龙灌浴表演（10:00场）→菩提大道漫步→登大佛俯瞰太湖→精舍品茶歇脚。穿舒适平底鞋，带好防晒。', spotTimes: ['20','15','40','20','30'], stops: ['jiulongguanyu','lingshandafo','manfeilongta','lingshanjingshe','fansong'] },
  { title: '亲子欢乐游', icon: '👨‍👩‍👧', image: '/spots/wumingqiao.png', color: '#e88b7e', distance: '约2.5km', duration: '约4小时', intensity: '轻松', crowd: '较多', tags: ['亲子','互动','体验','趣味'], tips: '建议9:00入园直奔九龙灌浴（10:00场）→佛手广场互动→午餐后看《吉祥颂》（14:00场）→五印坛城转经筒。带好水和小零食。', spotTimes: ['20','20','15','35','25'], stops: ['jiulongguanyu','fanshouguangchang','wuyintancheng','fansong'] },
  { title: '祈福纳祥游', icon: '🙏', image: '/spots/xiangfuchansi.jpg', color: '#c8963e', distance: '约3km', duration: '约5小时', intensity: '适中', crowd: '较多', tags: ['祈福','文化','佛教','吉祥'], tips: '建议8:00入园（人少清净）→照壁祈福→佛足坛洗心→祥符禅寺上香→摸佛手→登大佛抱佛脚→五印坛城转经筒。准备零钱上香。', spotTimes: ['10','10','20','15','40','25'], stops: ['zhaobi','wumingqiao','xiangfuchansi','fanshouguangchang','lingshandafo','wuyintancheng'] },
  { title: '打卡拍照游', icon: '📸', image: '/spots/manfeilongta.png', color: '#9b59b6', distance: '约3km', duration: '约5小时', intensity: '适中', crowd: '中等', tags: ['摄影','网红','打卡','出片'], tips: '最佳拍摄时段8:00-10:00。九龙灌浴抓拍水柱→大佛正面仰拍→梵宫穹顶超广角→曼飞龙塔人像→精舍园林静谧。带三脚架和偏光镜。', spotTimes: ['20','35','40','20','25'], stops: ['jiulongguanyu','lingshandafo','fansong','manfeilongta','lingshanjingshe'] },
  { title: '禅意静心游', icon: '🧘', image: '/spots/linshanjingshe.jpg', color: '#1abc9c', distance: '约2km', duration: '约4小时', intensity: '轻松', crowd: '较少', tags: ['禅修','静心','文化','品茶'], tips: '建议9:00到精舍抄经（晨间人少）→祥符禅寺听晨钟→梵宫静赏→五印坛城登高望远。穿素色衣服更应景，精舍茶室可品茶。', spotTimes: ['30','25','30','25'], stops: ['lingshanjingshe','xiangfuchansi','fansong','wuyintancheng'] },
]

function detectEmotion(text: string): Emotion {
  if (/欢迎|您好|壮观|宏伟|赞叹|震撼|美不胜收|最高|最大/.test(text)) return 'happy'
  if (/千年|古老|传承|历史|文化|精神|传说/.test(text)) return 'thinking'
  return 'neutral'
}

export default function TourPage() {
  const [searchParams] = useSearchParams()
  const persona = getPersona(DEFAULT_PERSONA)
  const navigate = useNavigate()
  const [activeSpot, setActiveSpot] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [emotion, setEmotion] = useState<Emotion>('happy')
  const [showDetail, setShowDetail] = useState(false)
  const [weather, setWeather] = useState<{temp:string;weather:string;wind:string} | null>(null)
  const [routeFilter, setRouteFilter] = useState<string>('全部')
  const [focusSpotId, setFocusSpotId] = useState<string | null>(null)
  // 强制在 custom 参数变化时重渲染，保证实时读取 sessionStorage
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    forceUpdate(n => n + 1)
  }, [searchParams.get('custom')])
  const customRoutes: RouteDef[] = (() => {
    try { return JSON.parse(sessionStorage.getItem('customRoutes') || '[]') }
    catch { return [] }
  })()

  // 演出通知数据
  const performances = [
    { spotId: 'jiulongguanyu', name: '九龙灌浴', time: '10:00 / 11:30 / 13:30 / 15:00', desc: '大型动态音乐群雕，花开见佛' },
    { spotId: 'fansong', name: '灵山吉祥颂', time: '10:35 / 11:30 / 14:00 / 16:00', desc: '全息演出，讲述佛陀成道故事' },
  ]

  // 获取天气
  useEffect(() => {
    // 使用 Open-Meteo 免费天气 API（无需 API Key，支持 CORS）
    fetch('https://api.open-meteo.com/v1/forecast?latitude=31.42&longitude=120.10&current=temperature_2m,weather_code,wind_speed_10m')
      .then(r => r.json())
      .then(d => {
        if (d.current) {
          // 将 WMO weather code 转为中文描述
          const code = d.current.weather_code
          const weatherMap: Record<number, string> = {
            0: '晴天', 1: '晴', 2: '多云', 3: '阴天',
            45: '雾', 48: '雾凇',
            51: '小雨', 53: '小雨', 55: '中雨',
            61: '小雨', 63: '中雨', 65: '大雨',
            71: '小雪', 73: '中雪', 75: '大雪',
            80: '阵雨', 81: '阵雨', 82: '暴雨',
            95: '雷暴', 96: '雷暴', 99: '雷暴',
          }
          setWeather({
            temp: d.current.temperature_2m.toFixed(0),
            weather: weatherMap[code] || '未知',
            wind: d.current.wind_speed_10m.toFixed(0),
          })
        }
      })
      .catch(() => {})
  }, [])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playIdRef = useRef(0)

  // 读取路线参数（支持内置路线和智能定制路线）
  const routeIdx = parseInt(searchParams.get('route') || '', 10)
  const customIdx = parseInt(searchParams.get('custom') || '', 10)
  const allRoutes = [...customRoutes, ...ROUTES] as RouteDef[]
  const activeRoute: RouteDef | null = customIdx >= 0 && customIdx < customRoutes.length
    ? customRoutes[customIdx]
    : (routeIdx >= 0 && routeIdx < ROUTES.length ? ROUTES[routeIdx] : null)

  // 智能定制路线：自动展开第一个景点
  const isCustomActive = customIdx >= 0 && customIdx < customRoutes.length
  useEffect(() => {
    if (isCustomActive && activeRoute && activeRoute.stops.length > 0 && !activeSpot) {
      const firstSpot = SCENIC_SPOTS.find(s => s.id === activeRoute.stops[0])
      if (firstSpot) handleSpotClick(firstSpot)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomActive])
  
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

    // 直接使用后端 Edge TTS（云端伴游同款），音质更好
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
    speakText(text, 'zh-CN-XiaoxiaoNeural')
  }, [stopAudio, speakText])

  const handleCloseDetail = useCallback(() => {
    stopAudio()
    setShowDetail(false)
  }, [stopAudio])

  const handleReplay = useCallback(() => {
    if (!selectedSpot) return
    handleSpotClick(selectedSpot)
  }, [selectedSpot, handleSpotClick])

  return (
    <div className="page-enter" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* 顶栏：统一国风标题 */}
      <header className="tour-page-header" style={{ margin: '6px 30px 0', flexShrink: 0, padding: '8px 14px' }}>
        <h1 className="tour-title">灵山胜境 · 游园导览</h1>
        <p className="tour-subtitle">一图在手，步移景异 — 点击标记聆听讲解</p>
      </header>

      {/* 🛠️ 关键修改点1：锁定舞台视口高度，禁止外层全局滚动 */}
      <div style={{ display: 'flex', height: 'calc(100vh - 90px)', overflow: 'hidden', boxSizing: 'border-box' }}>
        
        {/* 🛠️ 关键修改点2：左侧容器设置相同的高宽控制以稳固弹性空间 */}
        <div style={{ width: '65%', height: '100%', display: 'flex', flexDirection: 'column', gap: 0, boxSizing: 'border-box' }}>
          {/* 通知栏 + 全景（同行） */}
          <div style={{ margin: '8px 8px 0 30px', display: 'flex', gap: 6, flexShrink: 0 }}>
            {(() => {
              const nearest = performances[0]
              return (
                <div className="glass-warm" style={{ flex: 1, minWidth: 0, padding: '5px 10px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      display: 'inline-block', whiteSpace: 'nowrap',
                      fontSize: 12, color: '#4a3c31', lineHeight: 1.5,
                      animation: 'scrollLeft 22s linear infinite',
                      paddingLeft: '100%',
                    }}>
                      <span style={{ fontWeight: 600, color: '#c8963e' }}>🌸 温馨提醒：</span>
                      下一场【{nearest.name}】即将开始，{nearest.desc}，建议提前前往广场前排等候观赏
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFocusSpotId(nearest.spotId)
                      setTimeout(() => setFocusSpotId(null), 500)
                      const spot = SCENIC_SPOTS.find(s => s.id === nearest.spotId)
                      if (spot) handleSpotClick(spot)
                    }}
                    style={{
                      flexShrink: 0, padding: '4px 14px', borderRadius: 14,
                      border: 'none', cursor: 'pointer', fontSize: 12,
                      background: 'linear-gradient(135deg, #c5a06b, #a88754)',
                      color: '#fff', fontWeight: 600, whiteSpace: 'nowrap',
                    }}
                  >
                    前往 ›
                  </button>
                </div>
              )
            })()}
            <div
              className="glass-warm"
              onClick={() => navigate('/tourist/tour')}
              style={{ padding: '5px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, color: '#4a3c31', flexShrink: 0 }}
            >
              📍 全景
            </div>
          </div>
          {/* 地图区域 */}
          <div className="tourist-tour-map" style={{ flex: 1, margin: '6px 8px 6px 30px', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minHeight: 0, minWidth: 0 }}>
            <ScenicMap spots={SCENIC_SPOTS} routes={ROUTES} activeRoute={activeRoute} activeSpot={activeSpot} onSpotClick={(spot: any) => handleSpotClick(spot)} focusSpotId={focusSpotId} />
          </div>

          {/* 温馨提示 + 跳转按钮 */}
          <div style={{ margin: '0 8px 30px 30px', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <div className="glass-warm" style={{ borderRadius: 12, padding: '8px 12px', border: '1px solid rgba(200,150,62,0.12)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 10, color: '#8a7a6a', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 600, color: '#c8963e' }}>💡 出行提示：</span>
                {weather?.weather.includes('雨') ? '今日有雨，建议携带雨具，部分室外演出可能调整。' : weather?.weather.includes('晴') ? '今日晴好，注意防晒补水，建议携带遮阳帽和饮用水。' : '天气适宜出行。'}
                <br />
                <span style={{ fontWeight: 600, color: '#c8963e' }}>🎭 九龙灌浴：</span>平日 10:00 / 11:30 / 13:30 / 15:00
                <br />
                <span style={{ fontWeight: 600, color: '#c8963e' }}>⏱ 路线说明：</span>按正常步行与短暂停留估算，节假日可适当预留排队时间。
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => navigate('/tourist/recommend')} style={{
                flex: 1, padding: '6px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #c8963e, #a0722a)', color: '#fff',
                fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                🏛️ 查看景点
              </button>
              <button onClick={() => navigate('/tourist/chat')} style={{
                flex: 1, padding: '6px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: '#f5f1eb', color: '#5c5348',
                fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                💬 问AI导游
              </button>
            </div>
          </div>
        </div>

        {/* 🛠️ 关键修改点3：右侧面板 */}
        <div style={{
          width: '35%',
          height: '100%',
          padding: '0 30px 30px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 5px !important; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent !important; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(139,115,85,0.3) !important; border-radius: 4px !important; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(139,115,85,0.5) !important; }
            @keyframes scrollLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
          `}</style>

          {/* 今日天气 — 固定顶部，与左侧标题对齐 */}
          <div className="glass-warm" style={{ borderRadius: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginTop: '-2px' }}>
            <div style={{ fontSize: 26, lineHeight: 1 }}>
              {weather ? (weather.weather.includes('晴') ? '☀️' : weather.weather.includes('云') ? '⛅' : weather.weather.includes('阴') ? '☁️' : weather.weather.includes('雨') ? '🌧️' : '🌤️') : '🌤️'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3d3630' }}>
                {weather ? `${weather.temp}°C ${weather.weather}` : '加载天气...'}
              </div>
              <div style={{ fontSize: 10, color: '#9c948c', marginTop: 1 }}>
                无锡灵山 · {weather ? `风速 ${weather.wind} km/h` : ''}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: '#b8a898', textAlign: 'right' }}>实时更新</div>
          </div>

          {/* 胜境风物标题 + 筛选 */}
          <div style={{ flexShrink: 0 }}>
            <div className="guofeng-title" style={{ fontSize: 16, padding: '4px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              路线推荐
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 8 }}>
              {(() => {
                const categories = ['全部', ...new Set(ROUTES.flatMap(r => r.tags.slice(0, 1)))]
                return categories.map(cat => (
                  <button key={cat} onClick={() => setRouteFilter(cat)} style={{
                    padding: '3px 12px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: routeFilter === cat ? 600 : 400,
                    background: routeFilter === cat ? '#c8963e' : 'rgba(200,150,62,0.10)',
                    color: routeFilter === cat ? '#fff' : '#4a3c31', transition: 'all 0.2s',
                  }}>
                    {cat}
                  </button>
                ))
              })()}
            </div>
          </div>

          {/* 滚动区：智能定制 + 路线卡片 */}
          <div className="custom-scrollbar" style={{
            flex: 1, overflowY: 'auto', display: 'flex',
            flexDirection: 'column', gap: 10, paddingRight: '4px'
          }}>
            {/* 智能定制入口卡 — 始终置顶 */}
            <div className="card" style={{ flexShrink: 0, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(197,160,107,0.08), rgba(200,150,62,0.04))', border: '1.5px dashed rgba(197,160,107,0.4)' }}
              onClick={() => navigate('/tourist/plan')}
            >
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, #e4c18e, #c5a06b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  ✨
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#c5a06b' }}>智能定制游</div>
                  <div style={{ fontSize: 11, color: '#8c7c6e', marginTop: 2 }}>AI 根据您的偏好生成专属路线</div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, padding: '1px 8px', borderRadius: 6, background: 'rgba(197,160,107,0.12)', color: '#a88754' }}>AI 智能</span>
                    <span style={{ fontSize: 9, padding: '1px 8px', borderRadius: 6, background: 'rgba(197,160,107,0.12)', color: '#a88754' }}>个性定制</span>
                    <span style={{ fontSize: 9, padding: '1px 8px', borderRadius: 6, background: 'rgba(197,160,107,0.12)', color: '#a88754' }}>一键生成</span>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c5a06b" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>

            {allRoutes.map((route, ri) => {
              if (routeFilter !== '全部' && !route.tags.includes(routeFilter)) return null
              const isBuiltin = ri >= customRoutes.length
              const navPath = isBuiltin ? `/tourist/tour?route=${ri - customRoutes.length}` : `/tourist/tour?custom=${ri}`
              const isActive = activeRoute?.title === route.title
              return (
                <div key={route.title + ri} className="card" style={{ flexShrink: 0, border: isActive ? '2px solid ' + route.color : '1px solid rgba(200,150,62,0.10)' }}>
                  <div onClick={() => navigate(navPath)} style={{ padding: '12px 14px', cursor: 'pointer', background: isActive ? route.color + '06' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {route.image ? (
                        <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid ' + route.color + '25' }}>
                          <img src={route.image} alt={route.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                      ) : (
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{route.icon}</span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: route.color }}>{route.title}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, color: '#9c948c' }}>  {route.duration}</span>
                          <span style={{ fontSize: 10, color: '#9c948c' }}>  {route.distance}</span>
                          <span style={{ fontSize: 10, padding: '0 5px', borderRadius: 4, background: route.color + '12', color: route.color, fontWeight: 500 }}>  {route.intensity}</span>
                          <span style={{ fontSize: 10, padding: '0 5px', borderRadius: 4, background: '#f0ebe0', color: '#8a7a6a' }}>  {route.crowd}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                          {route.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: route.color + '0E', color: route.color }}>#{t}</span>)}
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9c948c" strokeWidth="2" style={{ transform: isActive ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {isActive && (
                    <div style={{ borderTop: '1px solid ' + route.color + '12', padding: '0 14px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, margin: '10px 0', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}> 距离 {route.distance}</span>
                        <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}> 游览 {route.duration}</span>
                        <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}> 强度 {route.intensity}</span>
                        <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}> 客流 {route.crowd}</span>
                      </div>

                      <div style={{ position: 'relative', paddingLeft: 20, marginBottom: 12 }}>
                        <div style={{ position: 'absolute', left: 7, top: 6, bottom: 6, width: 2, background: route.color + '20', borderRadius: 1 }} />
                        {route.stops.map((stopId, i) => {
                          const spot = SCENIC_SPOTS.find(s => s.id === stopId)
                          if (!spot) return null
                          const spotTime = route.spotTimes[i] || '20'
                          const isActiveSpot = activeSpot === spot.id
                          return (
                            <div key={stopId} onClick={() => handleSpotClick(spot)} style={{ position: 'relative', marginBottom: 8, cursor: 'pointer', padding: '8px 10px', borderRadius: 10, background: isActiveSpot ? spot.color + '08' : '#faf8f5', border: isActiveSpot ? '1px solid ' + spot.color + '25' : '1px solid transparent' }}>
                              <div style={{ position: 'absolute', left: -16, top: 10, width: 16, height: 16, borderRadius: '50%', background: route.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, border: '2px solid #fff' }}>{i + 1}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 16 }}>{spot.icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: isActiveSpot ? spot.color : '#3d3630' }}>{spot.name}</div>
                                  <div style={{ fontSize: 10, color: '#9c948c' }}>{spot.subtitle.length > 22 ? spot.subtitle.slice(0, 22) + '...' : spot.subtitle}</div>
                                </div>
                                <span style={{ fontSize: 9, color: '#b8a898', background: '#f5f1eb', padding: '2px 6px', borderRadius: 6 }}> {spotTime}min</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div style={{ padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg, ' + route.color + '06, ' + route.color + '02)', border: '1px solid ' + route.color + '12' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: route.color, marginBottom: 4 }}> 游览贴士</div>
                        <div style={{ fontSize: 10, color: '#5c5348', lineHeight: 1.6 }}>{route.tips}</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 固定底部的讲解详情浮窗 */}
          {showDetail && selectedSpot && (
            <div className="glass-warm" style={{ borderRadius: 14, border: '1px solid ' + selectedSpot.color + '25', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'linear-gradient(135deg, ' + selectedSpot.color + '12, ' + selectedSpot.color + '08)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  {persona.image && <img src={persona.image} alt={persona.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selectedSpot.color }}>{selectedSpot.icon} {selectedSpot.name}</div>
                  <div style={{ fontSize: 11, color: '#9c948c' }}>{speaking ? ' 正在讲解' : selectedSpot.subtitle}</div>
                </div>
                <button onClick={handleReplay} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#f5f1eb', color: selectedSpot.color, fontSize: 12, cursor: 'pointer' }}>🔊</button>
                <button onClick={handleCloseDetail} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#f5f1eb', color: '#9c948c', fontSize: 14, cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ padding: '8px 14px 12px' }}>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: '#3d3630', margin: 0 }}>{selectedSpot.description.slice(0, 150)}...</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}