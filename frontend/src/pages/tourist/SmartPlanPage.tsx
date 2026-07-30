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

/** 根据选择的标签生成路线方案（加入随机种子使每次不同） */
function generateRoute(selected: string[], customInput: string, seed: number) {
  const allText = [...selected, customInput].join(' ')

  const hasElder = /老人|轻松|慢/.test(allText)
  const hasChild = /小孩|亲子/.test(allText)
  const prefersHistory = /历史|文化|祈福|佛教/.test(allText)
  const prefersNature = /自然|风景|摄影/.test(allText)
  const prefersZen = /禅|静心|品茶/.test(allText)
  const prefersPhoto = /拍照|打卡|出片/.test(allText)
  const isSlow = /慢/.test(allText)

  // 基于 seed 生成变体序号
  const variantLabels = ['A', 'B', 'C']
  const variantLabel = variantLabels[seed % 3]
  const timeOffset = ['08:30', '09:00', '09:30'][seed % 3]
  const endOffset = ['15:00', '15:30', '16:00'][seed % 3]

  // 基础数据
  const base = hasChild
    ? { key: '亲子游', icon: '👨‍👩‍👧', image: '/spots/wumingqiao.png', color: '#e88b7e', tags: ['亲子', '智能定制'] as string[] }
    : hasElder
    ? { key: '轻松游', icon: '🌿', image: '/spots/lingshandafo.jpg', color: '#2d8a7b', tags: ['休闲', '智能定制'] as string[] }
    : prefersHistory || prefersBlessing(allText)
    ? { key: '文化祈福游', icon: '🏛️', image: '/spots/xiangfuchansi.jpg', color: '#8b5e3c', tags: ['文化', '智能定制'] as string[] }
    : prefersNature || prefersPhoto
    ? { key: '风光摄影游', icon: '📸', image: '/spots/manfeilongta.png', color: '#9b59b6', tags: ['摄影', '智能定制'] as string[] }
    : prefersZen
    ? { key: '禅意静心游', icon: '🧘', image: '/spots/linshanjingshe.jpg', color: '#1abc9c', tags: ['禅修', '智能定制'] as string[] }
    : { key: '经典全景游', icon: '🏯', image: '/spots/linshanfangong.jpg', color: '#c8963e', tags: ['全景', '智能定制'] as string[] }

  // 根据变体调整路线组合，使每次不同（每条路线有独立名称）
  const routeVariants: Record<string, {
    title: string; stops: string[]; spotTimes: string[]; tips: string; distance: string; duration: string
  }[]> = {
    '亲子游': [
      { title: '童趣灵山·亲子时光', stops: ['jiulongguanyu','fanshouguangchang','wuyintancheng','fansong'], spotTimes: ['20','20','15','35'], tips: '以亲子互动为主，含九龙灌浴和转经筒体验。', distance: '约2.5km', duration: '约4小时' },
      { title: '小小旅行家·文化探秘', stops: ['jiulongguanyu','xiangfuchansi','wuyintancheng','lingshanjingshe'], spotTimes: ['20','25','15','30'], tips: '兼顾文化与趣味，祥符禅寺听故事，精舍品茶歇脚。', distance: '约2.8km', duration: '约4.5小时' },
      { title: '全家总动员·灵山欢乐行', stops: ['jiulongguanyu','fanshouguangchang','lingshandafo','fansong'], spotTimes: ['20','15','30','40'], tips: '亲子精华游，看表演、摸佛手、登大佛、赏梵宫。', distance: '约2.5km', duration: '约4小时' },
    ],
    '轻松游': [
      { title: '悠然灵山·慢享时光', stops: ['jiulongguanyu','lingshandafo','lingshanjingshe','fansong'], spotTimes: ['20','40','30','25'], tips: '轻松步行，含九龙灌浴表演，大佛可乘电梯登顶。', distance: '约2.5km', duration: '约4小时' },
      { title: '闲庭信步·禅意漫步', stops: ['zhaobi','wumingqiao','jiulongguanyu','lingshanjingshe'], spotTimes: ['10','10','20','30'], tips: '慢游灵山，从照壁开始，重点游览精舍园林。', distance: '约2km', duration: '约3.5小时' },
      { title: '山水之间·自在灵山', stops: ['jiulongguanyu','manfeilongta','lingshanjingshe','fansong'], spotTimes: ['20','20','30','25'], tips: '自然与建筑交融，曼飞龙塔拍照，精舍静心。', distance: '约2.5km', duration: '约4小时' },
    ],
    '文化祈福游': [
      { title: '千年梵音·祈福之旅', stops: ['zhaobi','wumingqiao','xiangfuchansi','lingshandafo','fansong'], spotTimes: ['10','10','25','50','50'], tips: '深度文化游览，含大佛登顶和梵宫参观。', distance: '约3km', duration: '约5小时' },
      { title: '心诚则灵·祈福纳祥', stops: ['zhaobi','xiangfuchansi','lingshandafo','wuyintancheng'], spotTimes: ['10','25','50','25'], tips: '祈福主线：照壁祈福→祥符禅寺上香→登大佛抱佛脚→坛城转经。', distance: '约2.8km', duration: '约5小时' },
      { title: '古刹朝圣·文化溯源', stops: ['wumingqiao','xiangfuchansi','lingshandafo','fansong','wuyintancheng'], spotTimes: ['10','25','40','50','25'], tips: '完整文化路线，从五明桥到五印坛城，涵盖灵山精髓。', distance: '约3.5km', duration: '约6小时' },
    ],
    '风光摄影游': [
      { title: '光影灵山·摄影之旅', stops: ['jiulongguanyu','lingshandafo','fansong','manfeilongta','lingshanjingshe'], spotTimes: ['20','35','40','20','25'], tips: '精选最佳拍摄点，含大佛全景、梵宫穹顶和园林。', distance: '约3km', duration: '约5小时' },
      { title: '镜头下的灵山·光影随行', stops: ['jiulongguanyu','fansong','manfeilongta','lingshanjingshe'], spotTimes: ['20','40','20','25'], tips: '光影之旅，趁晨光拍九龙灌浴，午后拍梵宫内部。', distance: '约2.5km', duration: '约4.5小时' },
      { title: '一步一景·灵山映像', stops: ['lingshandafo','fansong','manfeilongta','lingshanjingshe'], spotTimes: ['40','40','15','25'], tips: '避开人流高峰，上午登大佛，下午梵宫和园林。', distance: '约2.5km', duration: '约4.5小时' },
    ],
    '禅意静心游': [
      { title: '静心之旅·禅意人生', stops: ['lingshanjingshe','xiangfuchansi','fansong','wuyintancheng'], spotTimes: ['30','25','30','25'], tips: '以禅修静心为主，含精舍抄经、禅寺听钟和梵宫静赏。', distance: '约2km', duration: '约4小时' },
      { title: '晨钟暮鼓·禅修净心', stops: ['xiangfuchansi','lingshanjingshe','wuyintancheng'], spotTimes: ['25','40','25'], tips: '清晨禅寺听晨钟，上午精舍抄经品茶，午后坛城登高。', distance: '约1.8km', duration: '约3.5小时' },
      { title: '一花一世界·灵山归真', stops: ['lingshanjingshe','fansong','wuyintancheng'], spotTimes: ['40','35','25'], tips: '精舍→梵宫→坛城的静谧之旅，避开喧闹景点。', distance: '约1.5km', duration: '约3.5小时' },
    ],
    '经典全景游': [
      { title: '全景灵山·一日尽览', stops: ['zhaobi','wumingqiao','jiulongguanyu','xiangfuchansi','lingshandafo','fansong'], spotTimes: ['10','10','25','25','50','50'], tips: '覆盖灵山胜境核心景点，合理安排游览顺序。', distance: '约3.5km', duration: '约6小时' },
      { title: '灵山大环线·精华全收录', stops: ['zhaobi','jiulongguanyu','xiangfuchansi','lingshandafo','fansong','wuyintancheng'], spotTimes: ['10','20','20','40','40','25'], tips: '经典大环线，从照壁到坛城一网打尽。', distance: '约3.5km', duration: '约6小时' },
      { title: '灵山精选·景景经典', stops: ['wumingqiao','jiulongguanyu','lingshandafo','fansong','manfeilongta'], spotTimes: ['10','20','40','40','20'], tips: '精选组合路线，含表演、大佛、梵宫和异域风情。', distance: '约3km', duration: '约5小时' },
    ],
  }

  const variants = routeVariants[base.key] || routeVariants['经典全景游']
  const chosen = variants[seed % variants.length]

  return {
    title: chosen.title,
    icon: base.icon,
    image: base.image,
    color: base.color,
    stops: chosen.stops,
    distance: chosen.distance,
    duration: chosen.duration,
    intensity: isSlow ? '轻松' : '适中',
    crowd: '适中',
    tags: base.tags,
    tips: `【方案${variantLabel}】${chosen.tips} 建议${timeOffset}前入园，${endOffset}左右结束。`,
    spotTimes: chosen.spotTimes,
  }
}

function prefersBlessing(text: string) {
  return /祈福|许愿|平安/.test(text)
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
    <div className="page-enter" style={{ minHeight: '100vh', padding: '20px 20px 60px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
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
