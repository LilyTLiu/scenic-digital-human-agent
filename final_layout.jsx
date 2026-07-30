  return (
    <div className="page-enter" style={{ height: '100%', background: '#f8f6f2' }}>
      <style>{'.app-shell--desktop .tourist-content { overflow: hidden !important; min-height: 0 !important; height: 100vh !important; }'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0ebe0', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c8963e" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 600 }}>灵山胜境导览图</span>
        {activeRoute && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: activeRoute.color + '18', color: activeRoute.color, fontWeight: 600 }}>{activeRoute.icon} {activeRoute.title}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {ROUTES.map((r, i) => (
            <button key={r.title} onClick={() => navigate('/tourist/tour?route=' + i)}
              style={{ padding: '2px 7px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeRoute && activeRoute.title === r.title ? r.color : r.color + '12', color: activeRoute && activeRoute.title === r.title ? '#fff' : r.color, fontSize: 9, fontWeight: activeRoute && activeRoute.title === r.title ? 600 : 400, whiteSpace: 'nowrap' }}>
              {r.icon} {r.title}
            </button>
          ))}
          {activeRoute && <button onClick={() => navigate('/tourist/tour')} style={{ padding: '2px 7px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#f0ebe0', color: '#6b5a4a', fontSize: 9 }}>📍 全景</button>}
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
                        <span style={{ fontSize: 10, color: '#9c948c' }}>⏱ {route.duration}</span>
                        <span style={{ fontSize: 10, color: '#9c948c' }}> 📍 {route.distance}</span>
                        <span style={{ fontSize: 10, padding: '0 5px', borderRadius: 4, background: route.color + '12', color: route.color, fontWeight: 500 }}>⚡ {route.intensity}</span>
                        <span style={{ fontSize: 10, padding: '0 5px', borderRadius: 4, background: '#f0ebe0', color: '#8a7a6a' }}>👥 {route.crowd}</span>
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
                      <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}>🏔 距离 {route.distance}</span>
                      <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}>⏳ 游览 {route.duration}</span>
                      <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}>🚶 强度 {route.intensity}</span>
                      <span style={{ fontSize: 10, color: '#5c5348', background: '#f5f1eb', padding: '3px 8px', borderRadius: 6 }}>👥 客流 {route.crowd}</span>
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
                              <span style={{ fontSize: 9, color: '#b8a898', background: '#f5f1eb', padding: '2px 6px', borderRadius: 6 }}>⏱ {spotTime}min</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg, ' + route.color + '06, ' + route.color + '02)', border: '1px solid ' + route.color + '12' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: route.color, marginBottom: 4 }}>📋 游览贴士</div>
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
                  <div style={{ fontSize: 11, color: '#9c948c' }}>{speaking ? '🔊 正在讲解' : selectedSpot.subtitle}</div>
                </div>
                <button onClick={handleReplay} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#f5f1eb', color: selectedSpot.color, fontSize: 12, cursor: 'pointer' }}>🔄</button>
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
