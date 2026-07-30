"""Complete rebuild TourPage with ScenicMap, rich routes, and scroll fix"""
with open('frontend/src/pages/tourist/TourPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports
content = content.replace(
    "import { useState, useRef, useCallback } from 'react'",
    "import { useState, useRef, useCallback } from 'react'\nimport { useNavigate } from 'react-router-dom'"
)
content = content.replace(
    "import { findBestVoice, findFallbackVoice } from '../../utils/voice'",
    "import { findBestVoice, findFallbackVoice } from '../../utils/voice'\nimport ScenicMap from '../../components/ScenicMap'"
)

# 2. Add navigate hook
content = content.replace(
    'const persona = getPersona(DEFAULT_PERSONA)',
    'const persona = getPersona(DEFAULT_PERSONA)\n  const navigate = useNavigate()'
)

# 3. Update RouteDef interface
content = content.replace(
    'interface RouteDef { title: string; icon: string; color: string; stops: string[] }',
    'interface RouteDef { title: string; icon: string; color: string; stops: string[]; distance: string; duration: string; intensity: string; crowd: string; tags: string[]; tips: string; spotTimes: string[] }'
)

# 4. Replace routes
old_start = content.find("const ROUTES: RouteDef[] = [")
old_end = content.find("\n]", old_start) + 2
new_routes = """const ROUTES: RouteDef[] = [
  { title: '历史文化深度游', icon: '\u{1F3DB}', color: '#8b5e3c', distance: '约3.5km', duration: '约6小时', intensity: '适中', crowd: '较多', tags: ['历史','文化','佛教','建筑'], tips: '建议8:30前入园，先参观大照壁→祥符禅寺（上午光线好）→登大佛（中午前凉爽）→梵宫（下午室内参观）。祥符禅寺免费，梵宫16:30关门。', spotTimes: ['10','10','25','50','50','35'], stops: ['zhaobi','wumingqiao','xiangfuchansi','lingshandafo','fansong','wuyintancheng'] },
  { title: '自然风光轻松游', icon: '\u{1F33F}', color: '#2d8a7b', distance: '约3km', duration: '约5小时', intensity: '轻松', crowd: '中等', tags: ['自然','摄影','休闲','园林'], tips: '建议9:00后入园，先看九龙灌浴表演（10:00场）→菩提大道漫步→登大佛俯瞰太湖→精舍品茶歇脚。穿舒适平底鞋，带好防晒。', spotTimes: ['20','15','40','20','30'], stops: ['jiulongguanyu','lingshandafo','manfeilongta','lingshanjingshe','fansong'] },
  { title: '亲子欢乐游', icon: '\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}', color: '#e88b7e', distance: '约2.5km', duration: '约4小时', intensity: '轻松', crowd: '较多', tags: ['亲子','互动','体验','趣味'], tips: '建议9:00入园直奔九龙灌浴（10:00场）→佛手广场互动→午餐后看《吉祥颂》（14:00场）→五印坛城转经筒。带好水和小零食。', spotTimes: ['20','20','15','35','25'], stops: ['jiulongguanyu','fanshouguangchang','wuyintancheng','fansong'] },
  { title: '祈福纳祥游', icon: '\u{1F64F}', color: '#c8963e', distance: '约3km', duration: '约5小时', intensity: '适中', crowd: '较多', tags: ['祈福','文化','佛教','吉祥'], tips: '建议8:00入园（人少清净）→照壁祈福→佛足坛洗心→祥符禅寺上香→摸佛手→登大佛抱佛脚→五印坛城转经筒。准备零钱上香。', spotTimes: ['10','10','20','15','40','25'], stops: ['zhaobi','wumingqiao','xiangfuchansi','fanshouguangchang','lingshandafo','wuyintancheng'] },
  { title: '打卡拍照游', icon: '\u{1F4F8}', color: '#9b59b6', distance: '约3km', duration: '约5小时', intensity: '适中', crowd: '中等', tags: ['摄影','网红','打卡','出片'], tips: '最佳拍摄时段8:00-10:00。九龙灌浴抓拍水柱→大佛正面仰拍→梵宫穹顶超广角→曼飞龙塔人像→精舍园林静谧。带三脚架和偏光镜。', spotTimes: ['20','35','40','20','25'], stops: ['jiulongguanyu','lingshandafo','fansong','manfeilongta','lingshanjingshe'] },
  { title: '禅意静心游', icon: '\u{1F9D8}', color: '#1abc9c', distance: '约2km', duration: '约4小时', intensity: '轻松', crowd: '较少', tags: ['禅修','静心','文化','品茶'], tips: '建议9:00到精舍抄经（晨间人少）→祥符禅寺听晨钟→梵宫静赏→五印坛城登高望远。穿素色衣服更应景，精舍茶室可品茶。', spotTimes: ['30','25','30','25'], stops: ['lingshanjingshe','xiangfuchansi','fansong','wuyintancheng'] },
]"""
content = content[:old_start] + new_routes + content[old_end:]

# 5. Replace return block - read from external JSX template
import json
# Build new return block inline
new_return = """
  return (
    <div className="page-enter" style={{ height: '100%', background: '#f8f6f2' }}>
      <style>{'.app-shell--desktop .tourist-content{overflow:hidden!important;height:100vh!important}'}</style>
      <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0ebe0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c8963e" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 600 }}>灵山胜境导览图</span>
        {activeRoute && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: activeRoute.color + '18', color: activeRoute.color, fontWeight: 600 }}>{activeRoute.icon} {activeRoute.title}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ROUTES.map((r, i) => (
            <button key={r.title} onClick={() => navigate('/tourist/tour?route=' + i)}
              style={{ padding: '2px 7px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeRoute && activeRoute.title === r.title ? r.color : r.color + '12', color: activeRoute && activeRoute.title === r.title ? '#fff' : r.color, fontSize: 9, fontWeight: activeRoute && activeRoute.title === r.title ? 600 : 400, whiteSpace: 'nowrap' }}>
              {r.icon} {r.title}
            </button>
          ))}
          {activeRoute && <button onClick={() => navigate('/tourist/tour')} style={{ padding: '2px 7px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#f0ebe0', color: '#6b5a4a', fontSize: 9 }}>{'\u{1F4CD}'} 全景</button>}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ width: '65%', margin: '10px', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <ScenicMap spots={SCENIC_SPOTS} routes={ROUTES} activeRoute={activeRoute} activeSpot={activeSpot} onSpotClick={handleSpotClick} />
        </div>

        <div style={{ width: '35%', overflowY: 'auto', padding: '10px 12px 10px 6px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#3d3630', padding: '4px 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            路线推荐
            <span style={{ fontSize: 11, color: '#9c948c', fontWeight: 400, marginLeft: 'auto' }}>点击切换</span>
          </div>

          {ROUTES.map((route, ri) => {
            const isActive = activeRoute?.title === route.title
            return (
              <div key={route.title} style={{ borderRadius: 14, marginBottom: 10, overflow: 'hidden', border: isActive ? '2px solid ' + route.color : '1px solid #e8e3db', boxShadow: isActive ? '0 4px 16px ' + route.color + '25' : '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div onClick={() => navigate('/tourist/tour?route=' + ri)} style={{ padding: '12px 14px', cursor: 'pointer', background: isActive ? route.color + '06' : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{route.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: route.color }}>{route.title}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: '#9c948c' }}>{chr(9200)} {route.duration}</span>
                        <span style={{ fontSize: 10, color: '#9c948c' }}> {chr(128205)} {route.distance}</span>
                        <span style={{ fontSize: 10, padding: '0 5px', borderRadius: 4, background: route.color + '12', color: route.color, fontWeight: 500 }}>{chr(9889)} {route.intensity}</span>
                        <span style={{ fontSize: 10, padding: '0 5px', borderRadius: 4, background: '#f0ebe0', color: '#8a7a6a' }}>{chr(128101)} {route.crowd}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                        {route.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: route.color + '0E', color: route.color }}>{chr(35)}{t}</span>)}
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
                      <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}>{chr(127956)} 距离 {route.distance}</span>
                      <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}>{chr(9203)} 游览 {route.duration}</span>
                      <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}>{chr(128694)} 强度 {route.intensity}</span>
                      <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}>{chr(128101)} 客流 {route.crowd}</span>
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
                              <span style={{ fontSize: 9, color: '#b8a898', background: '#f5f1eb', padding: '2px 6px', borderRadius: 6 }}>{chr(9200)} {spotTime}min</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg, ' + route.color + '06, ' + route.color + '02)', border: '1px solid ' + route.color + '12' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: route.color, marginBottom: 4 }}>{chr(128203)} 游览贴士</div>
                      <div style={{ fontSize: 10, color: '#5c5348', lineHeight: 1.6 }}>{route.tips}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {showDetail && selectedSpot && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid ' + selectedSpot.color + '25', overflow: 'hidden', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'linear-gradient(135deg, ' + selectedSpot.color + '12, ' + selectedSpot.color + '08)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  {persona.image && <img src={persona.image} alt={persona.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selectedSpot.color }}>{selectedSpot.icon} {selectedSpot.name}</div>
                  <div style={{ fontSize: 11, color: '#9c948c' }}>{speaking ? '{chr(128264)} 正在讲解' : selectedSpot.subtitle}</div>
                </div>
                <button onClick={handleReplay} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#f5f1eb', color: selectedSpot.color, fontSize: 12, cursor: 'pointer' }}>{chr(128260)}</button>
                <button onClick={handleCloseDetail} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#f5f1eb', color: '#9c948c', fontSize: 14, cursor: 'pointer' }}>{chr(10005)}</button>
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
}"""

# Need to fix the emoji characters - bash is having issues with them
# Replace with simple text equivalents
new_return = new_return.replace('{chr(9200)}', '⏱')
new_return = new_return.replace('{chr(128205)}', '📍')
new_return = new_return.replace('{chr(9889)}', '⚡')
new_return = new_return.replace('{chr(128101)}', '👥')
new_return = new_return.replace('{chr(35)}', '#')
new_return = new_return.replace('{chr(127956)}', '🏔')
new_return = new_return.replace('{chr(9203)}', '⏳')
new_return = new_return.replace('{chr(128694)}', '🚶')
new_return = new_return.replace('{chr(128203)}', '📋')
new_return = new_return.replace("'{chr(128264)} 正在讲解'", '"🔊 正在讲解"')
new_return = new_return.replace('{chr(128260)}', '🔄')
new_return = new_return.replace('{chr(10005)}', '✕')

# Find and replace the return block
ret_idx = content.find('\n  return (')
# Find the matching close
depth = 0
end_idx = ret_idx + len('\n  return (')
for i in range(end_idx, len(content)):
    c = content[i]
    if c in '({':
        depth += 1
    elif c in ')}':
        depth -= 1
    if depth < 0:
        end_idx = i + 1
        break

content = content[:ret_idx] + new_return

with open('frontend/src/pages/tourist/TourPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('All done!')
