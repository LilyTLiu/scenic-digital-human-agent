import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface TagRow {
  label: string
  options: { key: string; label: string }[]
}

const TAG_ROWS: TagRow[] = [
  {
    label: '游览时长',
    options: [{ key: 'halfDay', label: '⛅ 半日' }, { key: 'fullDay', label: '🌼 一日' }],
  },
  {
    label: '偏好主题',
    options: [
      { key: 'blessing', label: '🧘 经典祈福' },
      { key: 'history', label: '📜 历史文化' },
      { key: 'nature', label: '🌿 山水自然' },
      { key: 'family', label: '👨‍👩‍👧 亲子轻松' },
      { key: 'zen', label: '🎑 舒缓禅意' },
    ],
  },
  {
    label: '步调节奏',
    options: [{ key: 'slow', label: '🍃 慢节奏' }, { key: 'normal', label: '🏃 常规' }],
  },
  {
    label: '同行人群',
    options: [
      { key: 'solo', label: '🧑 独自' },
      { key: 'couple', label: '👫 情侣' },
      { key: 'elder', label: '👴 有老人' },
      { key: 'child', label: '👶 带小孩' },
      { key: 'group', label: '👥 朋友结伴' },
    ],
  },
]

interface SpotKnowledge {
  id: string
  order: number
  minutes: number
  themes: string[]
  crowd: number
  distanceWeight: number
  note: string
}

const SPOT_KNOWLEDGE: SpotKnowledge[] = [
  { id: 'zhaobi', order: 1, minutes: 10, themes: ['blessing', 'history', 'photo'], crowd: 1, distanceWeight: 0.3, note: '灵山大照壁是入园第一站，适合祈福合影和理解“灵山胜境”题字。' },
  { id: 'wumingqiao', order: 2, minutes: 10, themes: ['history', 'blessing', 'family'], crowd: 1, distanceWeight: 0.3, note: '五明桥与佛足坛适合做文化开场，步行压力小。' },
  { id: 'jiulongguanyu', order: 3, minutes: 20, themes: ['family', 'nature', 'photo', 'classic'], crowd: 3, distanceWeight: 0.5, note: '九龙灌浴有固定演出时段，适合亲子、摄影和首次游览。' },
  { id: 'xiangfuchansi', order: 4, minutes: 25, themes: ['history', 'blessing', 'zen'], crowd: 2, distanceWeight: 0.5, note: '祥符禅寺承载小灵山历史，适合文化祈福与安静参访。' },
  { id: 'fanshouguangchang', order: 5, minutes: 15, themes: ['family', 'blessing', 'classic'], crowd: 2, distanceWeight: 0.4, note: '佛手广场互动性强，适合带小孩和祈福拍照。' },
  { id: 'lingshandafo', order: 6, minutes: 40, themes: ['blessing', 'history', 'photo', 'classic'], crowd: 3, distanceWeight: 0.8, note: '灵山大佛是核心景点，有台阶与登高内容，老人同行时建议乘电梯并缩短停留。' },
  { id: 'fansong', order: 7, minutes: 40, themes: ['history', 'photo', 'family', 'classic'], crowd: 3, distanceWeight: 0.7, note: '梵宫包含建筑艺术和演出内容，适合文化、摄影和室内休息。' },
  { id: 'wuyintancheng', order: 8, minutes: 25, themes: ['history', 'family', 'blessing', 'zen'], crowd: 2, distanceWeight: 0.6, note: '五印坛城有转经筒体验，兼顾文化、祈福与互动。' },
  { id: 'manfeilongta', order: 9, minutes: 20, themes: ['nature', 'photo'], crowd: 1, distanceWeight: 0.6, note: '曼飞龙塔适合异域风格拍照和轻松观景。' },
  { id: 'lingshanjingshe', order: 10, minutes: 30, themes: ['zen', 'nature', 'elder'], crowd: 1, distanceWeight: 0.5, note: '灵山精舍适合慢节奏、禅修、品茶和老人休息。' },
]

const THEME_META: Record<string, { title: string; icon: string; image: string; color: string; tags: string[] }> = {
  blessing: { title: '祈福纳祥', icon: '🙏', image: '/spots/xiangfuchansi.jpg', color: '#c8963e', tags: ['祈福', '佛教', '智能定制'] },
  history: { title: '历史文化', icon: '🏛️', image: '/spots/linshandafo.jpg', color: '#8b5e3c', tags: ['历史', '文化', '智能定制'] },
  nature: { title: '山水风物', icon: '🌿', image: '/spots/manfeilongta.png', color: '#2d8a7b', tags: ['自然', '摄影', '智能定制'] },
  family: { title: '亲子轻松', icon: '👨‍👩‍👧', image: '/spots/wumingqiao.png', color: '#e88b7e', tags: ['亲子', '互动', '智能定制'] },
  zen: { title: '禅意静心', icon: '🧘', image: '/spots/linshanjingshe.jpg', color: '#1abc9c', tags: ['禅修', '静心', '智能定制'] },
  classic: { title: '灵山精选', icon: '🏯', image: '/spots/linshanfangong.jpg', color: '#c8963e', tags: ['全景', '经典', '智能定制'] },
}

const SPOT_NAME_KEYS: Record<string, string[]> = {
  zhaobi: ['照壁', '大照壁'],
  wumingqiao: ['五明桥', '佛足坛', '佛足印'],
  jiulongguanyu: ['九龙灌浴', '表演', '花开见佛'],
  xiangfuchansi: ['祥符禅寺', '禅寺', '寺庙'],
  fanshouguangchang: ['佛手', '佛手广场', '击掌'],
  lingshandafo: ['灵山大佛', '大佛', '抱佛脚'],
  fansong: ['梵宫', '吉祥颂'],
  wuyintancheng: ['五印坛城', '坛城', '转经筒'],
  manfeilongta: ['曼飞龙塔', '白塔'],
  lingshanjingshe: ['灵山精舍', '精舍', '禅修', '品茶'],
}

function generateRoute(selected: string[], customInput: string, seed: number) {
  const allText = customInput.trim()
  const selectedSet = new Set(selected)
  const hasHalfDay = selectedSet.has('halfDay') || /半日|半天|下午.*离园|三点前|3点前/.test(allText)
  const hasFullDay = selectedSet.has('fullDay') || /一日|全天|一天/.test(allText)
  const isSlow = selectedSet.has('slow') || selectedSet.has('elder') || /老人|慢|少走|少台阶|轻松/.test(allText)
  const hasChild = selectedSet.has('child') || selectedSet.has('family') || /小孩|孩子|亲子|儿童/.test(allText)

  const themeScores: Record<string, number> = {
    blessing: selectedSet.has('blessing') ? 5 : 0,
    history: selectedSet.has('history') ? 5 : 0,
    nature: selectedSet.has('nature') ? 5 : 0,
    family: hasChild ? 6 : 0,
    zen: selectedSet.has('zen') ? 5 : 0,
    classic: 1,
  }
  if (/祈福|许愿|平安|抱佛脚|上香/.test(allText)) themeScores.blessing += 4
  if (/历史|文化|佛教|建筑|典故|艺术/.test(allText)) themeScores.history += 4
  if (/自然|山水|风景|太湖|园林/.test(allText)) themeScores.nature += 4
  if (/拍照|打卡|摄影|出片/.test(allText)) themeScores.nature += 3
  if (/禅|静心|抄经|品茶|安静/.test(allText)) themeScores.zen += 4
  if (/亲子|小孩|孩子|互动/.test(allText)) themeScores.family += 4

  const primaryTheme = Object.entries(themeScores).sort((a, b) => b[1] - a[1])[0][0]
  const meta = THEME_META[primaryTheme] || THEME_META.classic
  const requestedSpots = Object.entries(SPOT_NAME_KEYS)
    .filter(([, keys]) => keys.some((key) => allText.includes(key)))
    .map(([id]) => id)

  const scored = SPOT_KNOWLEDGE.map((spot) => {
    let score = 0
    for (const theme of spot.themes) score += themeScores[theme] || 0
    if (requestedSpots.includes(spot.id)) score += 12
    if (hasChild && spot.themes.includes('family')) score += 4
    if (isSlow && (spot.themes.includes('elder') || spot.crowd <= 1)) score += 3
    if (isSlow && spot.id === 'lingshandafo') score -= 2
    if (hasHalfDay && spot.minutes <= 25) score += 2
    if (spot.themes.includes('classic') && !hasHalfDay) score += 1
    return { ...spot, score }
  })

  const maxStops = hasHalfDay || isSlow ? 4 : hasFullDay ? 6 : 5
  const mustHave = new Set<string>(requestedSpots)
  if (hasChild) {
    mustHave.add('jiulongguanyu')
    mustHave.add('fanshouguangchang')
  }
  if (primaryTheme === 'blessing') {
    mustHave.add('zhaobi')
    mustHave.add('xiangfuchansi')
  }
  if (primaryTheme === 'zen') {
    mustHave.add('lingshanjingshe')
  }
  if (primaryTheme === 'history') {
    mustHave.add('xiangfuchansi')
    mustHave.add('fansong')
  }

  const chosenIds = new Set<string>()
  for (const id of mustHave) {
    if (SPOT_KNOWLEDGE.some((spot) => spot.id === id) && chosenIds.size < maxStops) chosenIds.add(id)
  }
  scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .forEach((spot) => {
      if (chosenIds.size < maxStops) chosenIds.add(spot.id)
    })

  const chosenSpots = SPOT_KNOWLEDGE
    .filter((spot) => chosenIds.has(spot.id))
    .sort((a, b) => a.order - b.order)
  const totalMinutes = chosenSpots.reduce((sum, spot) => sum + spot.minutes, 0)
  const walkMinutes = Math.max(35, Math.round(chosenSpots.reduce((sum, spot) => sum + spot.distanceWeight * 18, 0)))
  const totalHours = Math.max(3, Math.min(7, Math.round((totalMinutes + walkMinutes) / 60 + 1)))
  const variantLabels = ['A', 'B', 'C']
  const variantLabel = variantLabels[seed % 3]
  const startTime = hasHalfDay ? '09:30' : isSlow ? '09:00' : '08:30'
  const intensity = isSlow || hasHalfDay ? '轻松' : chosenSpots.length >= 6 ? '适中' : '轻松'
  const crowd = chosenSpots.some((spot) => spot.crowd >= 3) ? '较多' : '适中'
  const titleSuffix = hasHalfDay ? '半日线' : isSlow ? '慢游线' : '精选线'
  const notes = chosenSpots.slice(0, 3).map((spot) => spot.note).join(' ')
  const extraTip = hasChild
    ? '亲子同行建议优先卡九龙灌浴演出时间，并在佛手广场、坛城安排互动停留。'
    : isSlow
    ? '老人或慢节奏同行建议减少登高，灵山大佛可乘电梯，途中在精舍或梵宫安排休息。'
    : '按景点空间顺序串联，减少折返，并保留核心讲解与拍照时间。'

  return {
    title: `${meta.title}·${titleSuffix}`,
    icon: meta.icon,
    image: meta.image,
    color: meta.color,
    stops: chosenSpots.map((spot) => spot.id),
    distance: `约${(1.6 + chosenSpots.length * 0.32 + chosenSpots.reduce((sum, spot) => sum + spot.distanceWeight, 0) * 0.12).toFixed(1)}km`,
    duration: `约${totalHours}小时`,
    intensity,
    crowd,
    tags: meta.tags,
    tips: `【方案${variantLabel}】AI 已根据您的选项和景点知识匹配路线。建议${startTime}前入园。${notes} ${extraTip}`,
    spotTimes: chosenSpots.map((spot) => String(spot.minutes)),
  }
}

export default function SmartPlanPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [customInput, setCustomInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const toggleTag = useCallback((key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleGenerate = useCallback(() => {
    if (selected.size === 0 && !customInput.trim()) return
    setIsGenerating(true)

    setTimeout(() => {
      const seed = Date.now()
      const route = generateRoute([...selected], customInput, seed)
      // 每次替换（而非追加），避免重复累积
      sessionStorage.setItem('customRoutes', JSON.stringify([route]))

      setIsGenerating(false)
      navigate('/tourist/tour?custom=0')
    }, 800)
  }, [selected, customInput, navigate])

  return (
    <div className="page-enter" style={{ minHeight: 'calc(100vh - 40px)', padding: '20px 20px 60px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
      <div style={{
        maxWidth: 700, width: '100%',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        border: '1px solid rgba(184,166,135,0.25)',
        boxShadow: '0 20px 50px rgba(184,166,135,0.10)',
        padding: '32px 36px',
        textAlign: 'center',
      }}>
        {/* AI 徽章 */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(135deg, #e4c18e, #c5a06b)',
          color: '#fff', fontSize: 13,
          padding: '6px 18px', borderRadius: 20,
          marginBottom: 24,
          boxShadow: '0 4px 10px rgba(197,160,107,0.3)',
        }}>
          ✨ AI 智能伴游
        </div>

        {/* 标题 */}
        <h1 className="guofeng-title" style={{ fontSize: 28, color: '#4a3c31', marginBottom: 8, letterSpacing: '0.05em' }}>
          为您智能定制专属路线
        </h1>
        <p style={{ fontSize: 14, color: '#8c7c6e', marginBottom: 32, lineHeight: 1.6 }}>
          轻点标签或输入需求，AI 立刻为您编排最佳行程
        </p>

        {/* 输入卡片 */}
        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid rgba(184,166,135,0.3)',
          boxShadow: '0 8px 24px rgba(74,60,49,0.04)',
          padding: 20, marginBottom: 32, textAlign: 'left',
        }}>
          <textarea
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            placeholder="例如：带小孩和老人一起，下午三点前要离园，想看九龙灌浴表演，最好少走台阶……"
            style={{
              width: '100%', height: 90, border: 'none', resize: 'none', outline: 'none',
              fontSize: 15, color: '#4a3c31', fontFamily: 'inherit', lineHeight: 1.6,
            }}
          />

          {/* 底部栏 */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 12, borderTop: '1px dashed rgba(184,166,135,0.2)', paddingTop: 12,
          }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              {[...selected].map(key => {
                const tag = TAG_ROWS.flatMap(r => r.options).find(o => o.key === key)
                return tag ? (
                  <span key={key} style={{
                    background: 'rgba(197,160,107,0.10)',
                    border: '1px solid rgba(197,160,107,0.3)',
                    color: '#a88754', padding: '3px 10px', borderRadius: 14,
                    fontSize: 12,
                  }}>
                    {tag.label}
                  </span>
                ) : null
              })}
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (selected.size === 0 && !customInput.trim())}
              style={{
                flexShrink: 0, padding: '10px 24px', border: 'none', borderRadius: 24,
                fontSize: 14, cursor: isGenerating ? 'wait' : 'pointer',
                fontFamily: 'inherit', fontWeight: 600,
                background: isGenerating ? '#b8a687' : '#4a3c31',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(74,60,49,0.2)',
                transition: 'all 0.3s',
                opacity: (selected.size === 0 && !customInput.trim()) ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!isGenerating) (e.target as HTMLButtonElement).style.background = '#c5a06b'
              }}
              onMouseLeave={e => {
                if (!isGenerating) (e.target as HTMLButtonElement).style.background = '#4a3c31'
              }}
            >
              {isGenerating ? '✨ 智能规划中…' : '✨ 智能定制行程'}
            </button>
          </div>
        </div>

        {/* 标签选择器 */}
        <div style={{ textAlign: 'left', padding: '0 4px' }}>
          {TAG_ROWS.map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 18, gap: 12 }}>
              <span style={{ fontSize: 13, color: '#8c7c6e', width: 72, flexShrink: 0, marginTop: 6 }}>{row.label}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {row.options.map(opt => {
                  const isActive = selected.has(opt.key)
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleTag(opt.key)}
                      style={{
                        padding: '6px 16px', borderRadius: 18,
                        border: '1px solid',
                        borderColor: isActive ? '#c5a06b' : 'rgba(184,166,135,0.25)',
                        background: isActive ? '#ebdcc5' : '#fbf9f5',
                        color: isActive ? '#4a3c31' : '#6b5b4f',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: 13, cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s',
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
