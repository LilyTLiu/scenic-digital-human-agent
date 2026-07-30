import { useState, useRef, useCallback, useEffect } from 'react'
import { voiceApi, reviewApi, checkinApi } from '../../services/api'
import { getPersona, DEFAULT_PERSONA } from '../../config/personas'
import { findBestVoice, findFallbackVoice } from '../../utils/voice'

/* ---- 辅助 ---- */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/* ---- 类型 ---- */
interface ScenicSpot {
  id: string
  name: string
  subtitle: string
  icon: string
  color: string
  description: string
  practicalInfo?: string
  image: string
  heroImage?: string  // Hero 轮播专用大图（仅大卡片景点）
  tags: string[]
  shortDesc: string
  guideTips?: string[]
}

interface VisitorReview {
  id: string
  author: string
  avatar: string
  rating: number
  text: string
  time: string
}

interface CheckIn {
  id: string
  author: string
  image: string
  caption: string
  time: string
}


/* ---- 景区数据 ---- */
const SCENIC_SPOTS: ScenicSpot[] = [
  {
    id: 'lingshandafo',
    name: '灵山大佛',
    subtitle: '88 米青铜立佛 · 世界之最',
    icon: '🪷',
    color: '#9b8465',
    description: '灵山大佛高88米（佛身79米+莲花瓣9米），连同基座总高达101.5米，是目前世界上最高的露天青铜释迦牟尼立像。大佛由725吨青铜铸成，采用2000块铸铜面板精密拼接，焊缝总长达30余公里。佛祖面相慈眉善目，右手施"无畏印"（表示拔除众生痛苦），左手施"与愿印"（表示给予众生快乐）。登216级台阶可近距离瞻仰佛容，俯瞰太湖万顷碧波和马山半岛的壮丽景色。大佛底部设有佛教文化博物馆，展示了灵山的历史渊源和建造历程。民间有"抱佛脚"的说法——抱住大佛的脚趾祈福，据说非常灵验。',
    practicalInfo: '开放时间 8:00–17:00，登顶需爬216级台阶（有电梯可供老人使用），建议游览 40–60 分钟。',
    image: '/images/spots/lingshandafo.jpg',
    heroImage: '/images/spots/lingshandafo_hero.jpg',
    tags: ['核心景点', '世界之最', '登高'],
    shortDesc: '世界最高露天青铜释迦牟尼立像，高88米，725吨青铜铸就',
    guideTips: [
      '建议早上8:00前到达，避开人流高峰，早晨光线最适合拍照',
      '登台阶可选择左侧电梯（免费），老人小孩推荐使用',
      '抱佛脚需脱鞋，建议穿易脱的鞋子；顺时针绕佛三圈祈福',
      '大佛底部博物馆免费参观，展示了建造历程和佛教文化',
      '最佳拍照点：广场中央水池前，可拍到大佛完整倒影',
    ],
  },
  {
    id: 'jiulongguanyu',
    name: '九龙灌浴',
    subtitle: '花开见佛 · 动态音乐群雕',
    icon: '🐉',
    color: '#4a9ec8',
    description: '九龙灌浴是国内最大的动态音乐群雕，再现了佛陀诞生时的祥瑞景象。雕塑主体由一座高达27.5米的莲花铜像和环绕四周的九条青铜巨龙组成。表演开始时，九条金龙同时向天空喷射出高达30多米的水柱，中央的巨大莲花在《佛诞》音乐的伴奏下缓缓绽放，幼年释迦牟尼佛从莲花中徐徐升起，一手指天、一手指地，寓意"天上天下，唯我独尊"。整个过程持续约15分钟，场面极其震撼。表演结束后，游客可在广场两侧的龙头处接取"八功德水"，据说能带来吉祥安康。',
    practicalInfo: '平日演出 10:00 / 11:30 / 13:30 / 15:00，周末节假日加演，每场约15分钟，建议提前10分钟到场。',
    image: '/images/spots/jiulongguanyu.jpg',
    heroImage: '/images/spots/jiulongguanyu_hero.jpg',
    tags: ['表演', '雕塑', '必看'],
    shortDesc: '国内最大动态音乐群雕，九龙喷水30米，莲花绽放见佛',
  },
  {
    id: 'fansong',
    name: '灵山梵宫',
    subtitle: '东方卢浮宫 · 非遗艺术殿堂',
    icon: '🏛️',
    color: '#9b8465',
    description: '灵山梵宫于2008年建成开放，总建筑面积达7万余平方米，被誉为"东方卢浮宫"。建筑外观呈"莲花环抱"之势，五座莲花圣塔矗立其上，塔刹采用鎏金工艺。梵宫内部汇集了东阳木雕、琉璃、壁画、漆画、石雕等数十种中国传统工艺，堪称一座"活态的非遗艺术博物馆"。廊厅两侧的12幅巨型油画《世界佛教传法图》，每幅高12米、宽3米，气势磅礴。中庭的星空穹顶以LED技术模拟浩瀚星河，变幻莫测，让人仿佛置身佛国天界。圣坛可容纳1500人，大型全息演出《灵山吉祥颂》以270度环形银幕呈现佛陀成道的故事。',
    practicalInfo: '开放时间 9:00–17:00（冬季 16:30），《吉祥颂》演出 10:35 / 11:30 / 14:00 / 16:00，每场约20分钟，凭大门票免费入场，建议提前30分钟排队。',
    image: '/images/spots/fansong.jpg',
    heroImage: '/images/spots/fansong_hero.jpg',
    tags: ['建筑', '艺术', '演出'],
    shortDesc: '建筑面积7万余平米，集东阳木雕、琉璃、壁画等非遗工艺',
  },
  {
    id: 'wuyintancheng',
    name: '五印坛城',
    subtitle: '藏传佛教 · 雪域文化体验',
    icon: '⛩️',
    color: '#9b7b6b',
    description: '五印坛城是灵山胜境中展现藏传佛教文化的核心建筑，与梵宫隔香水海相望。建筑群采用藏式风格，金顶红墙、经幡飘扬，庄严肃穆中透着神秘。坛城内部供奉着藏传佛教的佛像、唐卡和曼荼罗，展示了雪域高原的佛教艺术精华。最受欢迎的体验是转经筒——沿着坛城外围的转经廊，依次转动108个铜制转经筒，每转一圈相当于诵念一遍经文，据说能为家人祈福消灾。登上坛城顶层平台，可以俯瞰香水海全景，与对面的梵宫遥遥相对，一汉一藏、交相辉映。',
    practicalInfo: '开放时间 9:00–17:00，建议游览 30–40 分钟，转经筒体验免费。',
    image: '/images/spots/wuyintancheng.jpg',
    tags: ['藏传佛教', '转经筒', '体验'],
    shortDesc: '藏式金顶红墙建筑群，可转动108个铜制转经筒祈福',
  },
  {
    id: 'xiangfuchansi',
    name: '祥符禅寺',
    subtitle: '千年古刹 · 唐风遗韵',
    icon: '🏯',
    color: '#5d8a5e',
    description: '祥符禅寺始建于唐代贞观年间，距今已有1300多年历史。相传唐玄奘西天取经归来后，曾在此驻锡弘法。寺内有一口六角古井，是唐代名泉，曾被茶圣陆羽品鉴并列入江南名泉。大雄宝殿内供奉着释迦牟尼佛及迦叶、阿难两大弟子，香火千年不断。钟楼内悬挂着"祥符禅钟"，重达12.8吨，钟声浑厚悠远，响彻山谷。寺中还有一棵千年古银杏，枝繁叶茂，见证了寺院的兴衰与重生。祥符禅寺是灵山的精神之源，"小灵山"之名也由此而来。',
    practicalInfo: '开放时间 8:30–16:30，免费参观，建议游览 20–30 分钟。',
    image: '/images/spots/xiangfuchansi.jpg',
    tags: ['千年古刹', '唐玄奘', '古银杏'],
    shortDesc: '始建于唐贞观年间，玄奘曾驻锡，存千年古井与银杏',
  },
  {
    id: 'zhaobi',
    name: '灵山大照壁',
    subtitle: '华夏第一壁 · 景区入口',
    icon: '🧱',
    color: '#8b7355',
    description: '灵山大照壁位于景区入口广场，长39.8米，高7.2米，被誉为"华夏第一壁"。照壁正面镌刻着原中国佛教协会会长赵朴初先生题写的"灵山胜境"四个鎏金大字，笔力遒劲、气势恢宏。照壁背面刻有"诸恶莫作，众善奉行"的佛教偈语，提醒世人存善心、行善事。这里是游览灵山的第一站，几乎所有游客都会在此合影留念，寓意"祈福纳祥，平安吉祥"。照壁两侧种植着百年古樟，枝繁叶茂，与照壁共同构成了一幅庄严而宁静的画面。',
    practicalInfo: '全天开放，位于景区入口广场，建议游览 5–10 分钟。',
    image: '/images/spots/zhaobi.jpg',
    tags: ['地标', '祈福', '入口'],
    shortDesc: '长39.8米高7.2米，赵朴初题"灵山胜境"鎏金大字',
  },
  {
    id: 'wumingqiao',
    name: '五明桥 · 佛足坛',
    subtitle: '智慧渡彼岸 · 五明之学',
    icon: '🌉',
    color: '#7a9e7e',
    description: '五明桥横跨景区入口的香水河，桥名取自佛教"五明"之学——声明、工巧明、医方明、因明、内明，分别代表语言、技艺、医学、逻辑和佛学五种智慧。过桥寓意"以智慧渡彼岸"。桥北端是佛足坛，坛上雕刻着一对巨大的佛足印，足心刻有法轮图案，象征佛陀的足迹遍及四方、普度众生。佛足坛两侧设有十二座石灯幢，夜幕降临时灯火璀璨，更添庄严气氛。',
    practicalInfo: '全天开放，位于景区入口过桥即达，建议游览 10 分钟。',
    image: '/images/spots/wumingqiao.jpg',
    tags: ['佛教文化', '古迹', '夜景'],
    shortDesc: '横跨香水河，取佛教五明之学，佛足坛刻巨大佛足印',
  },
  {
    id: 'fanshouguangchang',
    name: '佛手广场',
    subtitle: '天下第一掌 · 与佛结缘',
    icon: '✋',
    color: '#a09080',
    description: '佛手广场位于祥符禅寺与大佛之间，核心景观是"天下第一掌"——一只按灵山大佛右手原比例复制的巨大铜掌，高11.7米、宽5.5米，重达13吨。铜掌的造型与大佛的右手完全一致，施"无畏印"，掌心刻有法轮图案。游客纷纷在此与铜掌合影，或者伸手与铜掌"击掌"，寓意"与佛结缘、祈福平安"。广场周围还设有百子戏弥勒雕塑群，弥勒佛笑容可掬，身上塑有100个形态各异的孩童，寓意"多子多福、皆大欢喜"。',
    practicalInfo: '全天开放，免费参观，建议游览 15–20 分钟。',
    image: '/images/spots/fanshouguangchang.jpg',
    tags: ['祈福', '雕塑', '亲子'],
    shortDesc: '按大佛右手1:1复制的巨型铜掌，高11.7米重13吨',
  },
  {
    id: 'manfeilongta',
    name: '曼飞龙塔',
    subtitle: '南传佛教 · 傣族白塔',
    icon: '🕌',
    color: '#a09878',
    description: '曼飞龙塔又称"白塔"，是灵山胜境中代表南传佛教（傣族佛教）文化的核心建筑，完全复刻了云南西双版纳曼飞龙白塔的形制。主塔矗立在圆形须弥座中央，塔身呈葫芦状，塔刹高耸，鎏金装饰熠熠生辉；八座小塔环绕主塔分布，形成"众星拱月"的格局。塔身表面采用浅浮雕工艺，刻有释迦牟尼佛成道图、阿罗汉像、莲花纹、卷草纹等南传佛教特色图案，工艺精湛、栩栩如生。塔周围的园林景观融合了傣族建筑风格，种植着棕榈、芭蕉等热带植物，让人仿佛置身彩云之南。',
    practicalInfo: '全天开放，建议游览 15–20 分钟。',
    image: '/images/spots/manfeilongta.jpg',
    tags: ['南传佛教', '傣族', '园林'],
    shortDesc: '复刻西双版纳白塔，一主八副众星拱月，南传佛教圣地',
  },
  {
    id: 'lingshanjingshe',
    name: '灵山精舍',
    subtitle: '禅意园林 · 静心之所',
    icon: '🌿',
    color: '#6b8d6e',
    description: '灵山精舍是一处融合了禅宗文化与古典园林艺术的静谧空间。精舍依山而建，曲径通幽，园内遍植翠竹、苍松、腊梅，叠石理水、亭台楼阁错落有致，处处体现着"天人合一"的造园理念。精舍设有茶室和禅修空间，游客可以在此品一杯清茶、抄一卷经文，体验"竹径通幽处，禅房花木深"的意境。这里是灵山胜境中最适合放慢脚步、静心思考的地方，远离尘世喧嚣，体味内心的宁静。许多游客评价说"到了灵山精舍，才真正懂得了什么叫放下"。',
    practicalInfo: '开放时间 9:00–16:30，茶室需另外消费，建议游览 20–30 分钟。',
    image: '/images/spots/lingshanjingshe.jpg',
    tags: ['禅修', '园林', '茶室'],
    shortDesc: '禅宗文化与古典园林融合，曲径通幽，可品茗抄经静心',
  },
  {
    id: 'nianhuawan',
    name: '拈花湾禅意小镇',
    subtitle: '唐风禅境 · 东方美学生活',
    icon: '🏘️',
    color: '#b0845a',
    description: '拈花湾禅意小镇坐落于灵山脚下、太湖之滨，是一座以唐风建筑和禅意美学为核心的大型文旅小镇。小镇名出"拈花一笑"的禅宗典故，整体依山面湖而建，青砖黛瓦、木格花窗、飞檐翘角，一步一景皆是禅意。白天可体验抄经、品茗、花道、香道等东方美学生活方式；夜幕降临后，万盏灯笼点亮街巷，《禅行》光影秀以3D mapping投影在建筑立面和湖面上，打造"人在画中游"的沉浸意境。小镇内设有精品民宿、素食餐厅、禅茶馆和非遗工坊，是灵山景区"白天看佛、晚上看灯"的完美延伸。',
    practicalInfo: '开放时间 9:00–21:00，《禅行》夜游 18:30–21:00，距灵山胜境约15分钟车程，建议下午入园游览至夜间，游览 3–4 小时。',
    image: '/images/spots/nianhuawan.jpg',
    tags: ['唐风小镇', '夜游', '禅修体验'],
    shortDesc: '依山面湖的唐风禅意小镇，抄经品茗赏灯，夜游光影秀',
    guideTips: [
      '建议下午3点后入园，既可赏日景又可观夜景，一举两得',
      '《禅行》光影秀每晚18:30开始，最佳观赏点在香月花街和五灯湖畔',
      '小镇内民宿需提前预订，节假日一房难求，建议周一至周四入住',
      '抄经体验在禅文化中心，约45分钟，费用含在门票内需预约',
      '素食餐厅推荐"一笑堂"和"浣月山房"，人均80-150元',
    ],
  },
]

/* ---- 筛选标签 ---- */
const FILTER_TAGS = ['全部', '建筑', '演出', '祈福', '禅修', '唐风小镇', '夜游']

/* ---- 景点分组 ---- */
const SPOT_GROUPS: { key: string; label: string; subtitle: string; ids: string[] }[] = [
  {
    key: 'core',
    label: '核心区',
    subtitle: '灵山胜境的标志性景观',
    ids: ['lingshandafo', 'jiulongguanyu', 'fansong', 'zhaobi'],
  },
  {
    key: 'culture',
    label: '文化体验',
    subtitle: '多元佛教文化与互动体验',
    ids: ['wuyintancheng', 'xiangfuchansi', 'wumingqiao', 'fanshouguangchang'],
  },
  {
    key: 'zen',
    label: '禅修静心',
    subtitle: '远离喧嚣，回归内心的宁静',
    ids: ['manfeilongta', 'lingshanjingshe', 'nianhuawan'],
  },
]

function getGroupedSpots() {
  const map = new Map(SCENIC_SPOTS.map(s => [s.id, s]))
  return SPOT_GROUPS.map(g => ({
    ...g,
    spots: g.ids.map(id => map.get(id)!).filter(Boolean),
  }))
}

/* ---- 景点 SVG 图标（替换 emoji） ---- */
function SpotIcon({ spotId, size = 24, color = 'var(--bronze)' }: { spotId: string; size?: number; color?: string }) {
  const s = size
  const w = 1.6
  const c = color
  switch (spotId) {
    case 'lingshandafo':
      /* 佛陀立像剪影 */
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="2" width="4" height="4" rx="1" />
          <path d="M8 6h8l-1 5H9l-1-5z" /><rect x="7" y="11" width="10" height="6" rx="0.5" />
          <line x1="12" y1="17" x2="12" y2="22" /><line x1="7" y1="20" x2="17" y2="20" />
        </svg>
      )
    case 'jiulongguanyu':
      /* 莲花与水滴 */
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2c-3 3-4 5-4 7a4 4 0 1 0 8 0c0-2-1-4-4-7z" />
          <path d="M6 12c1 1 2 1.5 3 1.5M18 12c-1 1-2 1.5-3 1.5M8 15c1 0.5 2.5 1 4 1s3-0.5 4-1" />
          <circle cx="12" cy="17" r="1" fill={c} stroke="none" />
        </svg>
      )
    case 'fansong':
      /* 宝塔/殿宇 */
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l8 6H4l8-6z" /><path d="M6 8v12h12V8" />
          <line x1="12" y1="10" x2="12" y2="20" /><line x1="8" y1="14" x2="16" y2="14" />
        </svg>
      )
    case 'wuyintancheng':
    case 'manfeilongta':
    case 'nianhuawan':
      /* 舍利塔/佛塔（拈花湾用塔形代表唐风小镇） */
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="14" width="16" height="8" rx="0.5" />
          <path d="M7 14l2-6h6l2 6" /><rect x="8" y="5" width="8" height="3" rx="1" />
          <ellipse cx="12" cy="3" rx="1.5" ry="2" />
        </svg>
      )
    case 'xiangfuchansi':
    case 'zhaobi':
      /* 寺庙/牌坊门 */
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 20h18" /><path d="M5 20V8l7-5 7 5v12" />
          <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="15" y2="16" />
        </svg>
      )
    case 'wumingqiao':
      /* 拱桥 */
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 20c4-3 8-5 12-5s8 2 12 5" /><path d="M5 18c4-2 6-2 10-2s6 0 10 2" />
          <line x1="12" y1="13" x2="12" y2="3" />
        </svg>
      )
    case 'fanshouguangchang':
      /* 佛手/掌印 */
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22V12" /><circle cx="12" cy="8" r="3.5" />
          <path d="M10 20c-3-1-4-3-4-5.5s2-2.5 2-2.5M14 20c3-1 4-3 4-5.5s-2-2.5-2-2.5" />
          <path d="M8 20c-2-1.5-2.5-3-2.5-5s1.5-3 1.5-3M16 20c2-1.5 2.5-3 2.5-5s-1.5-3-1.5-3" />
        </svg>
      )
    default:
      /* 禅室/茶亭（精舍等） */
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20l4-8h8l4 8H4z" /><line x1="12" y1="12" x2="12" y2="2" />
          <path d="M8 6l4-4 4 4" />
        </svg>
      )
  }
}

/* ---- 卡片组件 ---- */
function SpotCard({
  spot,
  index,
  onClick,
}: {
  spot: ScenicSpot
  index: number
  onClick: () => void
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [hovering, setHovering] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const tagBg = hexToRgba(spot.color, 0.10)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    cardRef.current.style.setProperty('--mx', `${x}%`)
    cardRef.current.style.setProperty('--my', `${y}%`)
  }

  const handleMouseEnter = () => setHovering(true)
  const handleMouseLeave = () => {
    setHovering(false)
    if (cardRef.current) {
      cardRef.current.style.setProperty('--mx', '50%')
      cardRef.current.style.setProperty('--my', '50%')
    }
  }

  return (
    <div
      ref={cardRef}
      className={`glass-card glass-card-enter${hovering ? ' glass-card--hover' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        animationDelay: `${index * 0.06}s`,
        '--spot': spot.color,
        '--mx': '50%',
        '--my': '50%',
      } as React.CSSProperties}
    >
      {/* 图片区 */}
      <div className="glass-card-image">
        <img
          src={spot.image}
          alt={spot.name}
          loading="lazy"
          className={imgLoaded ? 'loaded' : ''}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
        {imgError && (
          <div className="glass-card-image-fallback">
            <SpotIcon spotId={spot.id} size={40} />
          </div>
        )}
      </div>

      {/* 内容区 */}
      <div className="glass-card-body">
        <div className="card-name"><SpotIcon spotId={spot.id} size={18} /> {spot.name}</div>
        <div className="card-subtitle">{spot.subtitle}</div>
        <p className="card-desc">{spot.shortDesc}</p>

        <div className="glass-card-tags">
          {spot.tags.map((tag) => (
            <span
              key={tag}
              className="glass-card-tag"
              style={{ color: spot.color, background: tagBg }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---- 详情面板组件 ---- */

function DetailPanel({
  spot,
  speaking,
  audioError,
  onClose,
  onToggleAudio,
}: {
  spot: ScenicSpot
  speaking: boolean
  audioError: boolean
  onClose: () => void
  onToggleAudio: () => void
}) {
  const [reviews, setReviews] = useState<VisitorReview[]>([])
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showCheckinForm, setShowCheckinForm] = useState(false)
  const [newReview, setNewReview] = useState({ author: '', text: '', rating: 5 })
  const [newCheckin, setNewCheckin] = useState({ author: '', caption: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const rightRef = useRef<HTMLDivElement>(null)

  /* 从后端加载评价和打卡 */
  useEffect(() => {
    let cancelled = false
    setReviewsLoading(true)
    Promise.all([
      reviewApi.list(spot.id).catch(() => ({ items: [] })),
      checkinApi.list(spot.id).catch(() => ({ items: [] })),
    ]).then(([revData, ckData]) => {
      if (cancelled) return
      setReviews(revData.items || [])
      setCheckins(ckData.items || [])
      setReviewsLoading(false)
    })
    return () => { cancelled = true }
  }, [spot.id])

  /* 手风琴状态：默认只展开攻略 */
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['tips']))
  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const addReview = async () => {
    if (!newReview.author.trim() || !newReview.text.trim()) return
    setSubmitting(true)
    try {
      const r = await reviewApi.create({
        spot_id: spot.id,
        author: newReview.author.trim(),
        avatar: '😊',
        rating: newReview.rating,
        text: newReview.text.trim(),
      })
      setReviews((prev) => [r, ...prev])
      setNewReview({ author: '', text: '', rating: 5 })
      setShowReviewForm(false)
      setSubmitError('')
    } catch {
      setSubmitError('发布失败，请检查网络后重试')
    } finally { setSubmitting(false) }
  }

  const addCheckin = async () => {
    if (!newCheckin.author.trim() || !newCheckin.caption.trim()) return
    setSubmitting(true)
    try {
      const c = await checkinApi.create({
        spot_id: spot.id,
        author: newCheckin.author.trim(),
        image: '', // 后端会自动生成占位图
        caption: newCheckin.caption.trim(),
      })
      setCheckins((prev) => [c, ...prev])
      setNewCheckin({ author: '', caption: '' })
      setShowCheckinForm(false)
      setSubmitError('')
    } catch {
      setSubmitError('发布失败，请检查网络后重试')
    } finally { setSubmitting(false) }
  }

  const tips = spot.guideTips ?? [
    '建议预留充足时间游览，灵山景区面积较大',
    '关注景区广播获取演出时间，九龙灌浴和吉祥颂很值得看',
    '景区内有素斋餐厅，可以体验佛教素食文化',
    '春秋两季是最佳游览季节，天气宜人景色优美',
  ]

  /* Escape 键关闭 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="glass-detail-overlay" onClick={onClose}>
      <div
        className="detail-panel-v2"
        onClick={(e) => e.stopPropagation()}
        style={{ '--spot': spot.color } as React.CSSProperties}
      >
        {/* 关闭按钮 */}
        <button className="detail-close-v2" onClick={onClose} aria-label="关闭">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ======== 左栏 4.5：图片 + 简介 + 语音 ======== */}
        <div className="detail-left">
          <div className="detail-left-image">
            <img src={spot.image} alt={spot.name} />
          </div>
          <div className="detail-left-body">
            <h2 className="detail-left-name"><SpotIcon spotId={spot.id} size={22} color={spot.color} /> {spot.name}</h2>
            <p className="detail-left-subtitle">{spot.subtitle}</p>
            <p className="detail-left-desc">
              {spot.description.slice(0, 150)}…
            </p>
            {/* 播放/暂停按钮 — 提升优先级 */}
            <button
              className={`detail-audio-btn${audioError ? ' detail-audio-btn--error' : ''}`}
              onClick={onToggleAudio}
              aria-label={audioError ? '语音播放失败，点击重试' : speaking ? '暂停讲解' : '播放讲解'}
              style={{
                background: audioError
                  ? 'rgba(232, 139, 126, 0.14)'
                  : hexToRgba(spot.color, speaking ? 0.22 : 0.12),
                borderColor: audioError ? 'rgba(232, 139, 126, 0.28)' : hexToRgba(spot.color, 0.28),
                color: audioError ? 'var(--red-soft)' : spot.color,
              }}
            >
              {audioError ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01" />
                  </svg>
                  播放失败，点击重试
                </>
              ) : speaking ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  暂停讲解
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  播放语音讲解
                </>
              )}
            </button>
          </div>
        </div>

        {/* ======== 右栏 5.5：实用信息 + 渐进展示 ======== */}
        <div className="detail-right" ref={rightRef}>
          {/* 实用信息 — 始终可见 */}
          {spot.practicalInfo && (
            <div className="detail-practical-info">
              <div className="detail-practical-label">游览须知</div>
              <p className="detail-practical-text">{spot.practicalInfo}</p>
            </div>
          )}

          {/* 标签 — 始终可见 */}
          <div className="detail-tags-v2">
            {spot.tags.map((tag) => (
              <span
                key={tag}
                className="detail-tag-v2"
                style={{ color: spot.color, background: hexToRgba(spot.color, 0.10) }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 攻略 — 默认展开 */}
          <div className={`detail-accordion${openSections.has('tips') ? ' detail-accordion--open' : ''}`}>
            <button className="detail-accordion-header" onClick={() => toggleSection('tips')}>
              <h3 className="detail-accordion-title">游览攻略</h3>
              <span className="detail-accordion-arrow" />
            </button>
            <div className="detail-accordion-body">
              <ul className="detail-tips-list">
                {tips.map((tip, i) => (
                  <li key={i} className="detail-tip-item">
                    <span className="detail-tip-num">{i + 1}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 打卡 — 默认折叠 */}
          <div className={`detail-accordion${openSections.has('checkins') ? ' detail-accordion--open' : ''}`}>
            <button className="detail-accordion-header" onClick={() => toggleSection('checkins')}>
              <h3 className="detail-accordion-title">游客打卡 ({checkins.length})</h3>
              <span className="detail-accordion-arrow" />
            </button>
            <div className="detail-accordion-body">
              <div className="detail-section-header">
                <button className="detail-add-btn" onClick={() => setShowCheckinForm(!showCheckinForm)}>
                  + 上传打卡
                </button>
              </div>

              {showCheckinForm && (
                <div className="detail-form-card">
                  <input className="detail-input" placeholder="你的昵称" value={newCheckin.author}
                    onChange={(e) => setNewCheckin((p) => ({ ...p, author: e.target.value }))} />
                  <input className="detail-input" placeholder="打卡感言…" value={newCheckin.caption}
                    onChange={(e) => setNewCheckin((p) => ({ ...p, caption: e.target.value }))} />
                  {submitError && <p className="detail-form-error">{submitError}</p>}
                  <div className="detail-form-actions">
                    <button className="detail-submit-btn" onClick={addCheckin} disabled={submitting}>{submitting ? '发布中…' : '发布打卡'}</button>
                    <button className="detail-cancel-btn" onClick={() => { setShowCheckinForm(false); setSubmitError('') }}>取消</button>
                  </div>
                </div>
              )}

              <div className="detail-checkin-grid">
                {reviewsLoading ? (
                  <p className="detail-loading-hint">加载中…</p>
                ) : checkins.length === 0 ? (
                  <p className="detail-empty-hint">暂无打卡，成为第一个分享足迹的人吧</p>
                ) : (
                  checkins.map((c) => (
                    <div key={c.id} className="detail-checkin-card">
                      {c.image ? (
                        <img src={c.image} alt={c.caption} loading="lazy" />
                      ) : (
                        <div className="detail-checkin-placeholder" style={{ background: hexToRgba(spot.color, 0.12), color: spot.color }}>
                          {c.author.slice(0, 1)}
                        </div>
                      )}
                      <div className="detail-checkin-info">
                        <span className="detail-checkin-author">{c.author}</span>
                        <span className="detail-checkin-caption">{c.caption}</span>
                        <span className="detail-checkin-time">{c.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 评价 — 默认折叠 */}
          <div className={`detail-accordion${openSections.has('reviews') ? ' detail-accordion--open' : ''}`}>
            <button className="detail-accordion-header" onClick={() => toggleSection('reviews')}>
              <h3 className="detail-accordion-title">游客评价 ({reviews.length})</h3>
              <span className="detail-accordion-arrow" />
            </button>
            <div className="detail-accordion-body">
              <div className="detail-section-header">
                <button className="detail-add-btn" onClick={() => setShowReviewForm(!showReviewForm)}>
                  + 写评价
                </button>
              </div>

              {showReviewForm && (
                <div className="detail-form-card">
                  <input className="detail-input" placeholder="你的昵称" value={newReview.author}
                    onChange={(e) => setNewReview((p) => ({ ...p, author: e.target.value }))} />
                  <div className="detail-rating-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star}
                        className={`detail-star${star <= newReview.rating ? ' active' : ''}`}
                        onClick={() => setNewReview((p) => ({ ...p, rating: star }))}>
                        {star <= newReview.rating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                  <textarea className="detail-textarea" placeholder="分享你的游览感受…" rows={3}
                    value={newReview.text}
                    onChange={(e) => setNewReview((p) => ({ ...p, text: e.target.value }))} />
                  {submitError && <p className="detail-form-error">{submitError}</p>}
                  <div className="detail-form-actions">
                    <button className="detail-submit-btn" onClick={addReview} disabled={submitting}>{submitting ? '发布中…' : '发布评价'}</button>
                    <button className="detail-cancel-btn" onClick={() => { setShowReviewForm(false); setSubmitError('') }}>取消</button>
                  </div>
                </div>
              )}

              <div className="detail-reviews-list">
                {reviewsLoading ? (
                  <p className="detail-loading-hint">加载中…</p>
                ) : reviews.length === 0 ? (
                  <p className="detail-empty-hint">暂无评价，成为第一个留下足迹的人吧</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="detail-review-card">
                      <div className="detail-review-header">
                        <span className="detail-review-avatar">{r.avatar}</span>
                        <span className="detail-review-author">{r.author}</span>
                        <span className="detail-review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        <span className="detail-review-time">{r.time}</span>
                      </div>
                      <p className="detail-review-text">{r.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 底部留白 */}
          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  )
}

/* ---- 页面组件 ---- */
/* ---- 时间/天气感知 ---- */
type TimePeriod = 'dawn' | 'noon' | 'dusk' | 'night'
type WeatherType = 'clear' | 'rain' | 'snow' | 'mist'

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'noon'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}

function getWeatherType(code?: number): WeatherType {
  if (code === undefined) return 'clear'
  if (code >= 51 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 45 && code <= 48) return 'mist'
  return 'clear'
}

const TIME_LABELS: Record<TimePeriod, string> = { dawn: '晨', noon: '午', dusk: '暮', night: '夜' }
const WEATHER_LABELS: Record<WeatherType, string> = { clear: '晴', rain: '雨', snow: '雪', mist: '雾' }

async function fetchWuxiWeather(): Promise<{ code?: number; error?: string }> {
  /* 缓存：sessionStorage，30 分钟 TTL */
  const CACHE_KEY = 'lingshan_weather_cache'
  const TTL = 30 * 60 * 1000
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const { ts, data } = JSON.parse(cached)
      if (Date.now() - ts < TTL) return data as { code?: number }
    }
  } catch { /* 缓存解析失败则忽略 */ }

  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=31.48&longitude=120.28&current_weather=true&timezone=Asia/Shanghai'
    )
    if (!res.ok) return { error: `HTTP ${res.status}` }
    const data = await res.json()
    const result = { code: data.current_weather?.weathercode as number | undefined }
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result })) } catch { /* 存储满 */ }
    return result
  } catch (e) {
    return { error: (e as Error).message }
  }
}

/* ---- Canvas 水墨雨天（仅大卡片） ---- */
/*
 * 设计思路：三层纵深雨幕 — 远景淡而缓、中景清晰、近景微亮。
 * 每滴有微弱的正弦摆动和风力倾斜，底部泛起一层薄雾。
 * 速度放缓至原先 40%，模拟江南细雨的从容。
 */
function RainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dropsRef = useRef<any[]>([])
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const section = canvas.closest('.zen-hero') as HTMLElement
    if (!section) return

    /* 尊重用户动效偏好 */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let W = 0, H = 0
    /* 缓风：方向右偏，力度柔和 */
    const baseWind = 2.5

    /* 三层深度配置：[占比, 速度倍率, 透明度倍率, 长度倍率, 宽度区间] */
    const LAYERS = [
      { ratio: 0.40, spdMul: 0.7, opMul: 0.55, lenMul: 0.7, wMin: 0.6, wMax: 1.0 },   // 远景
      { ratio: 0.38, spdMul: 1.0, opMul: 1.0,  lenMul: 1.0, wMin: 1.0, wMax: 1.6 },   // 中景
      { ratio: 0.22, spdMul: 1.25, opMul: 1.3, lenMul: 1.2, wMin: 1.4, wMax: 2.2 },   // 近景
    ]

    class RainDrop {
      x = 0; y = 0; len = 0; spd = 0; op = 0; w = 0
      wobOff = 0; wobSpd = 0; wobAmp = 0; layer = 0
      constructor(layer: number) {
        this.layer = layer
        this.reset()
        this.y = Math.random() * H
      }
      reset() {
        const L = LAYERS[this.layer]
        this.x = Math.random() * (W + 80) - 40
        this.y = -20 - Math.random() * 60
        this.len = (18 + Math.random() * 30) * L.lenMul
        this.spd = (1.2 + Math.random() * 2.0) * L.spdMul
        this.op  = (0.10 + Math.random() * 0.18) * L.opMul
        this.w   = L.wMin + Math.random() * (L.wMax - L.wMin)
        this.wobAmp = 0.15 + Math.random() * 0.35
        this.wobSpd = 0.006 + Math.random() * 0.012
        this.wobOff = Math.random() * Math.PI * 2
      }
      update() {
        this.y += this.spd
        this.wobOff += this.wobSpd
        this.x += baseWind * 0.12 + Math.sin(this.wobOff) * this.wobAmp
        if (this.y > H + 30 || this.x < -60 || this.x > W + 60) {
          this.reset()
          this.x = Math.random() * (W + 80) - 40
        }
      }
      draw() {
        const windTilt = baseWind * 0.35
        const sinWob = Math.sin(this.wobOff + 0.5) * 0.4
        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(
          this.x + windTilt + sinWob,
          this.y + this.len
        )
        ctx.lineCap = 'round'
        ctx.lineWidth = this.w
        ctx.strokeStyle = `rgba(200,215,228,${this.op})`
        ctx.shadowColor = `rgba(180,205,225,${this.op * 0.25})`
        ctx.shadowBlur = this.w * 2.5
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    function resize() {
      const r = section!.getBoundingClientRect(); W = r.width; H = r.height
      canvas!.width = W; canvas!.height = H
    }

    function drawMist() {
      /* 底部薄雾：缓慢漂移的径向渐变 */
      const t = Date.now() / 40000
      const mists = [
        { x: W * 0.25 + Math.sin(t * 0.8) * 50, y: H * 0.85, rx: 220, ry: 60, a: 0.045 },
        { x: W * 0.72 + Math.cos(t * 0.6) * 70, y: H * 0.90, rx: 280, ry: 50, a: 0.035 },
        { x: W * 0.50 + Math.sin(t * 0.4) * 40, y: H * 0.95, rx: 340, ry: 40, a: 0.025 },
      ]
      mists.forEach(m => {
        const g = ctx.createRadialGradient(m.x, m.y, 10, m.x, m.y, m.rx)
        g.addColorStop(0, `rgba(190,210,225,${m.a})`)
        g.addColorStop(0.6, `rgba(180,200,218,${m.a * 0.4})`)
        g.addColorStop(1, 'rgba(190,210,225,0)')
        ctx.save()
        ctx.scale(1, m.ry / m.rx)
        ctx.fillStyle = g
        ctx.fillRect(m.x - m.rx, (m.y - m.rx) * (m.rx / m.ry), m.rx * 2, m.rx * 2)
        ctx.restore()
      })
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      drawMist()
      dropsRef.current.forEach(d => { d.update(); d.draw() })
      animRef.current = requestAnimationFrame(draw)
    }

    resize()
    /* 按层分配雨滴 */
    const total = 130
    const drops: any[] = []
    LAYERS.forEach((L, li) => {
      const count = Math.round(total * L.ratio)
      for (let i = 0; i < count; i++) drops.push(new RainDrop(li))
    })
    dropsRef.current = drops
    draw()

    const ro = new ResizeObserver(() => resize())
    ro.observe(section)
    return () => { ro.disconnect(); cancelAnimationFrame(animRef.current) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }} />
}

/* ---- Canvas 雪 ---- */
function SnowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const flakesRef = useRef<any[]>([])
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const section = canvas.closest('.zen-hero') as HTMLElement
    if (!section) return

    /* 尊重用户动效偏好 */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let W = 0, H = 0

    class SnowFlake {
      x = 0; y = 0; r = 0; spd = 0; op = 0
      drift = 0; driftSpd = 0; driftAmp = 0; phase = 0
      constructor() { this.reset(); this.y = Math.random() * H }
      reset() {
        this.x = Math.random() * W; this.y = -10
        this.r = 1.5 + Math.random() * 3.5
        this.spd = 0.4 + Math.random() * 1.2
        this.op = 0.18 + Math.random() * 0.40
        this.driftAmp = 0.3 + Math.random() * 1.5
        this.driftSpd = 0.005 + Math.random() * 0.015
        this.phase = Math.random() * Math.PI * 2
      }
      update() {
        this.y += this.spd
        this.phase += this.driftSpd
        this.x += Math.sin(this.phase) * this.driftAmp
        if (this.y > H + 20) { this.reset(); this.x = Math.random() * W }
        if (this.x < -20) this.x = W + 20
        if (this.x > W + 20) this.x = -20
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245,248,252,${this.op})`
        ctx.shadowColor = `rgba(220,230,245,${this.op * 0.5})`
        ctx.shadowBlur = this.r * 2
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    function resize() {
      const r = section!.getBoundingClientRect(); W = r.width; H = r.height
      canvas!.width = W; canvas!.height = H
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      flakesRef.current.forEach(f => { f.update(); f.draw() })
      animRef.current = requestAnimationFrame(draw)
    }

    resize()
    flakesRef.current = Array.from({ length: 100 }, () => new SnowFlake())
    draw()

    const ro = new ResizeObserver(() => resize())
    ro.observe(section)
    return () => { ro.disconnect(); cancelAnimationFrame(animRef.current) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }} />
}

/* ---- Hero 轮播：禅意 · 入境 ---- */
/* ---- 首次引导覆盖层 ---- */
function FirstVisitGuide({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  const steps = [
    {
      title: '探索景点',
      desc: '点击轮播图或任意景点卡片，查看详细的景点介绍、实用信息和语音讲解',
    },
    {
      title: '聆听讲解',
      desc: '在景点详情中，点击「播放语音讲解」按钮，由 AI 数字人导游为您讲述景点背后的故事',
    },
    {
      title: '发现更多',
      desc: '展开「游览攻略」查看贴士，下拉浏览游客评价与打卡，收藏喜欢的景点以便快速查找',
    },
  ]
  const s = steps[step]
  return (
    <div className="onboard-overlay" onClick={(e) => { if (e.target === e.currentTarget) onSkip() }}>
      <div className="onboard-card">
        <div className="onboard-step-dots">
          {steps.map((_, i) => (
            <span key={i} className={`onboard-dot${i === step ? ' onboard-dot--active' : ''}${i < step ? ' onboard-dot--done' : ''}`} />
          ))}
        </div>
        <p className="onboard-step-label">第 {step + 1} 步 / 共 {steps.length} 步</p>
        <h3 className="onboard-step-title">{s.title}</h3>
        <p className="onboard-step-desc">{s.desc}</p>
        <div className="onboard-actions">
          <button className="onboard-skip-btn" onClick={onSkip}>跳过引导</button>
          <button className="onboard-next-btn" onClick={onNext}>
            {step >= 2 ? '开始使用' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  )
}

const HERO_SPOTS = [SCENIC_SPOTS[0], SCENIC_SPOTS[1], SCENIC_SPOTS[2]]

function HeroCarousel({ onSpotClick, timePeriod, weather, weatherError, clockStr, onRetryWeather }: { onSpotClick: (spot: ScenicSpot) => void; timePeriod: TimePeriod; weather: WeatherType; weatherError: boolean; clockStr: string; onRetryWeather: () => void }) {
  const [active, setActive] = useState(0)
  const [fadeKey, setFadeKey] = useState(0)
  const [imgsLoaded, setImgsLoaded] = useState<Set<number>>(new Set())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % HERO_SPOTS.length)
    setFadeKey((k) => k + 1)
  }, [])

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(advance, 5000)
  }, [advance])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => { startTimer(); return stopTimer }, [startTimer, stopTimer])

  const goTo = (i: number) => {
    if (i === active) return
    stopTimer()
    setActive(i)
    setFadeKey((k) => k + 1)
    startTimer()
  }

  /* 暂停轮播 */
  const [paused, setPaused] = useState(false)

  return (
    <section
      className="zen-hero"
      onMouseEnter={() => { stopTimer(); setPaused(true) }}
      onMouseLeave={() => { startTimer(); setPaused(false) }}
      onTouchStart={() => { stopTimer(); setPaused(true) }}
      onTouchEnd={() => { startTimer(); setPaused(false) }}
    >
      {/* 轮播图层 — 最底层 */}
      {HERO_SPOTS.map((s, i) => (
        <div
          key={s.id}
          className={`zen-hero-slide${i === active ? ' active' : ''}${paused ? ' paused' : ''}`}
        >
          <img
            src={s.heroImage || s.image}
            alt=""
            className={imgsLoaded.has(i) ? 'loaded' : ''}
            onLoad={() => setImgsLoaded((prev) => new Set(prev).add(i))}
          />
        </div>
      ))}

      {/* 渐变蒙层 — 图像之上 */}
      <div className="zen-hero-veil" />
      {/* 时段色调 */}
      <div className={`zen-hero-tint zen-hero-tint--${timePeriod}`} />
      {/* Canvas 雨天（仅 rain 时渲染） */}
      {weather === 'rain' && <RainCanvas />}
      {weather === 'snow' && <SnowCanvas />}

      {/* 左下文字区 */}
      <div className="zen-hero-text" key={fadeKey}>
        <h2 className="zen-hero-title">入境</h2>
        <p className="zen-hero-pinyin">JING GUAN</p>
        <p className="zen-hero-verse">一步之内 · 万象俱寂</p>
        <div className="zen-hero-meta">
          <span className="zen-hero-meta-spot">
            <SpotIcon spotId={HERO_SPOTS[active].id} size={16} color="rgba(255,255,255,0.72)" /> {HERO_SPOTS[active].name}
          </span>
          <span className="zen-hero-meta-sub">
            {HERO_SPOTS[active].subtitle}
          </span>
        </div>
      </div>

      {/* 右上时间/天气 */}
      <div className="zen-hero-clock">
        <span className="zen-hero-time">{clockStr}</span>
        <span className="zen-hero-atmo">
          {TIME_LABELS[timePeriod]}
          {weatherError ? (
            <button
              className="zen-hero-atmo-error"
              onClick={(e) => { e.stopPropagation(); onRetryWeather() }}
              title="天气数据暂不可用，点击重试"
              aria-label="天气数据暂不可用，点击重试"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3 }}>
                <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.5A6.5 6.5 0 1 0 4 14.5" />
                <line x1="12" y1="12" x2="12" y2="18" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              天气未知
            </button>
          ) : (
            WEATHER_LABELS[weather] !== '晴' ? ` · ${WEATHER_LABELS[weather]}` : ''
          )}
        </span>
      </div>

      {/* 指示器 */}
      <div className="zen-hero-dots">
        {HERO_SPOTS.map((_, i) => (
          <button
            key={i}
            className={`zen-hero-dot${i === active ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`第${i + 1}张`}
          />
        ))}
      </div>

      {/* 点击热区 */}
      <button
        className="zen-hero-hotarea"
        onClick={() => onSpotClick(HERO_SPOTS[active])}
        aria-label={`查看${HERO_SPOTS[active].name}详情`}
      />
    </section>
  )
}

export default function SpotExplorePage() {
  const persona = getPersona(DEFAULT_PERSONA)
  const [activeSpot, setActiveSpot] = useState<ScenicSpot | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playIdRef = useRef(0)
  const groupedSpots = getGroupedSpots()

  /* ---- 搜索 / 筛选 / 收藏 / 分组展开 ---- */
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('全部')
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('lingshan_favorites'); return s ? new Set(JSON.parse(s)) : new Set() }
    catch { return new Set() }
  })
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['core']))

  const toggleFavorite = (spotId: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(spotId)) { next.delete(spotId) } else { next.add(spotId) }
      localStorage.setItem('lingshan_favorites', JSON.stringify([...next]))
      return next
    })
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  /* 筛选 + 搜索逻辑 */
  const filteredGroups = groupedSpots.map(g => {
    let spots = g.spots
    if (activeFilter === '收藏') {
      spots = spots.filter(s => favorites.has(s.id))
    } else if (activeFilter !== '全部') {
      spots = spots.filter(s => s.tags.some(t => t.includes(activeFilter)))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      spots = spots.filter(s => s.name.toLowerCase().includes(q) || s.shortDesc.toLowerCase().includes(q))
    }
    return { ...g, spots }
  }).filter(g => g.spots.length > 0)

  /* ---- 全页时间/天气 ---- */
  const now = new Date()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => getTimePeriod(now.getHours()))
  const [weather, setWeather] = useState<WeatherType>('clear')
  const [weatherError, setWeatherError] = useState(false)

  useEffect(() => {
    fetchWuxiWeather().then((result) => {
      if (result.error) {
        setWeatherError(true)
        return
      }
      setWeather(getWeatherType(result.code))
    })
  }, [])

  /* 实时时钟：每 30s 更新一次 */
  const [clockStr, setClockStr] = useState(() => {
    const n = new Date()
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
  })
  useEffect(() => {
    const i = setInterval(() => {
      const n = new Date()
      setClockStr(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`)
      setTimePeriod(getTimePeriod(n.getHours()))
    }, 30000)
    return () => clearInterval(i)
  }, [])

  /* 天气重试 */
  const handleRetryWeather = useCallback(async () => {
    setWeatherError(false)
    const result = await fetchWuxiWeather()
    if (result.error) {
      setWeatherError(true)
      return
    }
    setWeather(getWeatherType(result.code))
  }, [])

  /* ---- 首次使用引导 ---- */
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('lingshan_onboarding_done') } catch { return false }
  })
  const [onboardStep, setOnboardStep] = useState(0)

  const finishOnboarding = () => {
    localStorage.setItem('lingshan_onboarding_done', '1')
    setShowOnboarding(false)
  }
  const nextOnboardStep = () => {
    if (onboardStep >= 2) { finishOnboarding(); return }
    setOnboardStep(s => s + 1)
  }
  const stopAudio = useCallback(() => {
    playIdRef.current++
    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setAudioError(false)
  }, [])

  const speakText = useCallback((text: string, voice: string) => {
    playIdRef.current++
    const currentId = playIdRef.current
    setSpeaking(true)
    setAudioError(false)
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
      a.onerror = () => { if (playIdRef.current !== currentId) return; setSpeaking(false); setAudioError(true); audioRef.current = null }
      a.play()
    } catch {
      if (playIdRef.current !== currentId) return
      const fallback = findFallbackVoice()
      if (!fallback) { setSpeaking(false); setAudioError(true); return }
      const u = new SpeechSynthesisUtterance(text)
      u.voice = fallback
      u.lang = 'zh-CN'; u.rate = 1.0
      u.onend = () => { if (playIdRef.current === currentId) setSpeaking(false) }
      u.onerror = () => { if (playIdRef.current === currentId) { setSpeaking(false); setAudioError(true) } }
      window.speechSynthesis.speak(u)
    }
  }, [])

  const handleSpotClick = useCallback((spot: ScenicSpot) => {
    stopAudio()
    setActiveSpot(spot)
    // 不再自动播放，用户点击播放按钮后才开始
  }, [stopAudio])

  const handleCloseDetail = useCallback(() => {
    stopAudio()
    setActiveSpot(null)
  }, [stopAudio])

  const handleToggleAudio = useCallback(() => {
    if (!activeSpot) return
    if (speaking) {
      stopAudio()
    } else {
      const text = activeSpot.description + (activeSpot.practicalInfo ? ' ' + activeSpot.practicalInfo : '')
      speakText(text, 'zh-CN-XiaoxiaoNeural')
    }
  }, [activeSpot, speaking, stopAudio, speakText])

  return (
    <div className="tourist-tour">
      {/* 页面柔光背景 + 时段色调 */}
      <div className={`tour-page-bg tour-page-bg--${timePeriod}`} />

      {/* 头部 */}
      <header className="tour-page-header">
        <h1 className="tour-title">灵山胜境 · 十方揽胜</h1>
        <p className="tour-subtitle">一步一景，千年佛缘 — 点击卡片聆听讲解</p>
      </header>

      {/* Hero 轮播 */}
      <HeroCarousel onSpotClick={handleSpotClick} timePeriod={timePeriod} weather={weather} weatherError={weatherError} clockStr={clockStr} onRetryWeather={handleRetryWeather} />

      {/* 搜索 + 筛选栏 */}
      <div className="tour-filter-bar">
        <div className="tour-filter-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" className="tour-filter-search-icon">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="tour-filter-search-input"
            type="text"
            placeholder="搜索景点…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="搜索景点"
          />
          {searchQuery && (
            <button className="tour-filter-search-clear" onClick={() => setSearchQuery('')} aria-label="清除搜索">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <button
            onClick={() => {
              const cards = document.querySelectorAll('.glass-card-wrapper')
              if (cards.length > 0) cards[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            style={{
              flexShrink: 0, padding: '8px 14px', marginLeft: 4, borderRadius: 8,
              border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: 'linear-gradient(135deg, #c5a06b, #a88754)',
              color: '#fff', fontFamily: 'inherit',
            }}
          >
            搜索
          </button>
        </div>
        <div className="tour-filter-chips">
          {FILTER_TAGS.map(tag => (
            <button
              key={tag}
              className={`tour-filter-chip${activeFilter === tag ? ' tour-filter-chip--active' : ''}`}
              onClick={() => setActiveFilter(tag)}
            >
              {tag}
            </button>
          ))}
          <button
            className={`tour-filter-chip tour-filter-chip--fav${activeFilter === '收藏' ? ' tour-filter-chip--active' : ''}`}
            onClick={() => setActiveFilter(prev => prev === '收藏' ? '全部' : '收藏')}
            aria-label="只看收藏"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={activeFilter === '收藏' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            收藏{favorites.size > 0 ? ` · ${favorites.size}` : ''}
          </button>
        </div>
      </div>

      {/* 分组卡片 — 每组独立展开/折叠 */}
      {filteredGroups.length === 0 ? (
        <div className="tour-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1" strokeLinecap="round" opacity="0.35">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="tour-empty-text">未找到匹配的景点</p>
          <button className="tour-empty-reset" onClick={() => { setSearchQuery(''); setActiveFilter('全部') }}>清除筛选条件</button>
        </div>
      ) : (
        <div className="tour-card-groups">
          {filteredGroups.map((group, gi) => {
            const isExpanded = expandedGroups.has(group.key)
            return (
              <section key={group.key} className={`spot-group${gi > 0 ? ' spot-group--secondary' : ''}${isExpanded ? ' spot-group--expanded' : ''}`}>
                <button
                  className="spot-group-header spot-group-header--toggle"
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={isExpanded}
                >
                  <div>
                    <h2 className="spot-group-title">{group.label}</h2>
                    <p className="spot-group-subtitle">{group.subtitle}</p>
                  </div>
                  <span className={`spot-group-arrow${isExpanded ? ' spot-group-arrow--up' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                <div className={`spot-group-body${isExpanded ? ' spot-group-body--open' : ''}`}>
                  <div className="spot-group-grid">
                    {group.spots.map((spot, si) => (
                      <div key={spot.id} className="glass-card-wrapper">
                        <SpotCard
                          spot={spot}
                          index={gi * 4 + si}
                          onClick={() => handleSpotClick(spot)}
                        />
                        <button
                          className={`spot-fav-btn${favorites.has(spot.id) ? ' spot-fav-btn--active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(spot.id) }}
                          aria-label={favorites.has(spot.id) ? '取消收藏' : '收藏景点'}
                          title={favorites.has(spot.id) ? '取消收藏' : '收藏景点'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={favorites.has(spot.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* 详情浮层 */}
      {activeSpot && (
        <DetailPanel
          spot={activeSpot}
          speaking={speaking}
          audioError={audioError}
          onClose={handleCloseDetail}
          onToggleAudio={handleToggleAudio}
        />
      )}

      {/* 首次使用引导 */}
      {showOnboarding && (
        <FirstVisitGuide step={onboardStep} onNext={nextOnboardStep} onSkip={finishOnboarding} />
      )}
    </div>
  )
}
