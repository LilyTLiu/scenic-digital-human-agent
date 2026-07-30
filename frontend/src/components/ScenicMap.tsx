import React, { useEffect, useRef, useCallback } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'
import { AMAP_CONFIG, SPOT_COORDS, LINGSHAN_CENTER } from '../config/amap'

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string }
  }
}

interface ScenicSpot {
  id: string; name: string; subtitle: string; icon: string; color: string
  image: string
  description: string; practicalInfo?: string
}
interface RouteDef { title: string; icon: string; color: string; stops: string[] }

interface Props {
  spots: ScenicSpot[]
  routes: RouteDef[]
  activeRoute: RouteDef | null
  activeSpot: string | null
  onSpotClick: (spot: ScenicSpot) => void
  focusSpotId?: string | null
}

/**
 * 调用高德步行路径规划，获取两两景点间的真实道路路径
 * 失败时降级为直线连接
 */
async function fetchWalkingPath(
  AMap: any,
  stops: [number, number][],
): Promise<[number, number][]> {
  if (stops.length < 2) return stops

  const segmentPromises: Promise<[number, number][]>[] = []

  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i]
    const to = stops[i + 1]

    segmentPromises.push(
      new Promise((resolve) => {
        const walking = new AMap.Walking({
          hideMarkers: true,
          autoFitView: false,
        })
        walking.search(
          new AMap.LngLat(from[0], from[1]),
          new AMap.LngLat(to[0], to[1]),
          (status: string, result: any) => {
            if (status === 'complete' && result.routes?.[0]?.steps) {
              const path: [number, number][] = []
              for (const step of result.routes[0].steps) {
                for (const point of step.path) {
                  path.push([point.lng, point.lat])
                }
              }
              resolve(path)
            } else {
              // 降级：直线连接
              resolve([from, to])
            }
          },
        )
      }),
    )
  }

  const segments = await Promise.all(segmentPromises)

  // 拼接各段，去除重复的首点
  const fullPath: [number, number][] = [segments[0][0]]
  for (const seg of segments) {
    for (let j = 1; j < seg.length; j++) {
      fullPath.push(seg[j])
    }
  }

  return fullPath
}

/** 生成 InfoWindow 弹窗 HTML */
function createInfoWindowContent(spot: ScenicSpot): string {
  return `
    <div style="width: 300px; border-radius: 14px; overflow: hidden; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,0.15);">
      <div style="height: 180px; overflow: hidden; background: #f0ebe0; position: relative;">
        <img src="${spot.image}" alt="${spot.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'">
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.5)); padding: 20px 14px 10px;">
          <span style="font-size: 15px; font-weight: 700; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.3);">${spot.icon} ${spot.name}</span>
        </div>
      </div>
      <div style="padding: 14px;">
        <div style="font-size: 12px; color: #9c948c; margin-bottom: 10px;">${spot.subtitle}</div>
        ${spot.practicalInfo ? `<div style="font-size: 12px; color: #5c5348; background: #f8f6f2; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; line-height: 1.5;"><span style="font-weight: 600;">🕐</span> ${spot.practicalInfo}</div>` : ''}
        <p style="font-size: 13px; color: #5c5348; line-height: 1.7; margin: 0; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;">${spot.description}</p>
      </div>
    </div>
  `
}

const ScenicMap: React.FC<Props> = ({ spots, routes, activeRoute, activeSpot, onSpotClick, focusSpotId }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylinesRef = useRef<any[]>([])
  const routeRequestIdRef = useRef(0)
  const infoWindowRef = useRef<any>(null)

  /** 关闭当前弹窗 */
  const closeInfoWindow = useCallback(() => {
    if (infoWindowRef.current) {
      infoWindowRef.current.close()
      infoWindowRef.current = null
    }
  }, [])

  const createMarkerContent = useCallback((spot: ScenicSpot, isActive: boolean, routeOrder: number | null, routeColor: string | null) => {
    const div = document.createElement('div')
    div.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;transform:translate(-50%,-50%);-webkit-user-select:none;user-select:none'
    const size = isActive ? 50 : routeOrder ? 42 : 38
    const borderWidth = isActive ? 3 : routeOrder ? 3 : 2.5
    const borderColor = routeOrder ? (routeColor || spot.color) : spot.color

    const circle = document.createElement('div')
    circle.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:${borderWidth}px solid ${borderColor};box-shadow:${isActive ? `0 4px 20px ${spot.color}80` : '0 2px 8px rgba(0,0,0,0.18)'};position:relative;background:#f0ebe0;${isActive ? 'animation:amapMarkerFloat 2.5s ease-in-out infinite' : ''}`

    // 照片
    const img = document.createElement('img')
    img.src = spot.image || ''
    img.alt = spot.name
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block'
    img.onerror = function (this: HTMLImageElement) { this.style.display = 'none' }
    circle.appendChild(img)

    // 路线序号叠加层
    if (routeOrder && activeRoute) {
      const overlay = document.createElement('div')
      overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;border-radius:50%'
      overlay.innerHTML = `<span style="font-size:${size * 0.42}px;font-weight:800;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.6);line-height:1">${routeOrder}</span>`
      circle.appendChild(overlay)
    }

    div.appendChild(circle)

    // 名称标签
    const label = document.createElement('span')
    label.style.cssText = `font-size:11px;font-weight:${(isActive || routeOrder) ? 600 : 500};color:${(routeOrder && activeRoute) ? (routeColor || spot.color) : (isActive ? spot.color : '#5c5348')};background:${(routeOrder && activeRoute) ? `${routeColor}20` : 'rgba(255,255,255,0.92)'};padding:2px 8px;border-radius:8px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.08);max-width:80px;overflow:hidden;text-overflow:ellipsis;backdrop-filter:blur(4px)`
    label.textContent = spot.name
    div.appendChild(label)

    return div
  }, [activeRoute])

  // 初始化地图
  useEffect(() => {
    if (!mapRef.current || !AMAP_CONFIG.enabled) return
    window._AMapSecurityConfig = { securityJsCode: AMAP_CONFIG.securityJsCode }

    let map: any = null
    AMapLoader.load({
      key: AMAP_CONFIG.key,
      version: '2.0',
      plugins: ['AMap.Walking', 'AMap.ControlBar', 'AMap.Scale'],
    }).then((AMap: any) => {
      map = new AMap.Map(mapRef.current, {
        center: LINGSHAN_CENTER,
        zoom: 15,
        viewMode: '3D',
        pitch: 0,
        mapStyle: 'amap://styles/light',
        showIndoorMap: false,
        layers: [new AMap.TileLayer()],
      })

      // 点击地图空白处关闭 InfoWindow
      map.on('click', () => { closeInfoWindow() })

      // 3D 控制罗盘
      const controlBar = new AMap.ControlBar({
        position: 'RT',
        showZoomBar: true,
        showControlButton: true,
      })
      map.addControl(controlBar)

      // 比例尺
      const scale = new AMap.Scale({ position: 'LB' })
      map.addControl(scale)

      mapInstanceRef.current = map
    }).catch((e: any) => { console.error('高德地图加载失败:', e) })

    return () => { if (map) map.destroy(); mapInstanceRef.current = null }
  }, [closeInfoWindow])

  // 更新标记点
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !AMAP_CONFIG.enabled) return
    markersRef.current.forEach((m: any) => { m.off?.('click'); map.remove(m) })
    markersRef.current = []
    const AMap = (window as any).AMap
    if (!AMap) return

    const newMarkers = spots.map((spot) => {
      const coord = SPOT_COORDS[spot.id]
      if (!coord) return null
      const routeOrder = activeRoute ? (activeRoute.stops.indexOf(spot.id) + 1) || null : null
      const marker = new AMap.Marker({
        position: coord,
        content: createMarkerContent(spot, activeSpot === spot.id, routeOrder, activeRoute?.color || null),
        offset: new AMap.Pixel(0, 0),
        zIndex: activeSpot === spot.id ? 100 : 10,
      })

      // 点击标记 → 打开 InfoWindow + 回调父组件
      marker.on('click', () => {
        closeInfoWindow()

        // ----- 打开 InfoWindow（高德自动移动确保完全可见） -----
        const info = new AMap.InfoWindow({
          content: createInfoWindowContent(spot),
          offset: new AMap.Pixel(0, -24),
          closeWhenClickMap: false,
          isCustom: false,
          autoMove: true,
        })
        info.open(map, coord)
        infoWindowRef.current = info

        // 通知父组件（右侧面板）
        onSpotClick(spot)
      })

      return marker
    }).filter(Boolean) as any[]

    map.add(newMarkers)
    markersRef.current = newMarkers
    if (newMarkers.length > 0 && activeRoute) {
      map.setFitView(null, false, [80, 80, 80, 80])
    }

  }, [spots, activeRoute, activeSpot, createMarkerContent, onSpotClick, closeInfoWindow])

  // 更新路线
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !AMAP_CONFIG.enabled) return

    polylinesRef.current.forEach((p: any) => map.remove(p))
    polylinesRef.current = []

    const AMap = (window as any).AMap
    if (!AMap?.Walking) {
      console.warn('AMap.Walking 插件未加载，无法绘制步行路径')
      return
    }

    const requestId = ++routeRequestIdRef.current

    const routesToDraw = activeRoute ? [activeRoute] : routes
    if (routesToDraw.length === 0) return

    for (const route of routesToDraw) {
      const stops = route.stops
        .map((id) => SPOT_COORDS[id])
        .filter(Boolean) as [number, number][]
      if (stops.length < 2) continue

      const isActive = activeRoute?.title === route.title

      fetchWalkingPath(AMap, stops).then((walkingPath) => {
        if (!mapInstanceRef.current) return
        if (requestId !== routeRequestIdRef.current) return
        if (walkingPath.length < 2) return

        const width = isActive ? 6 : 3

        const glow = new AMap.Polyline({
          path: walkingPath,
          strokeColor: route.color,
          strokeWeight: width + 4,
          strokeOpacity: isActive ? 0.25 : 0.1,
          strokeStyle: 'solid',
          lineJoin: 'round',
          lineCap: 'round',
          zIndex: isActive ? 5 : 1,
        })

        const core = new AMap.Polyline({
          path: walkingPath,
          strokeColor: route.color,
          strokeWeight: width,
          strokeOpacity: isActive ? 0.8 : 0.25,
          strokeStyle: isActive ? 'solid' : 'dashed',
          lineJoin: 'round',
          lineCap: 'round',
          zIndex: isActive ? 6 : 2,
        })

        map.add([glow, core])
        polylinesRef.current.push(glow, core)
      })
    }
  }, [routes, activeRoute])

  // 浮动动画
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = '@keyframes amapMarkerFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}'
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  // 外部通知栏导向（focusSpotId）— 定位 + 弹窗
  useEffect(() => {
    if (!focusSpotId) return
    const map = mapInstanceRef.current
    const AMap = (window as any).AMap
    if (!map || !AMap) return

    const coord = SPOT_COORDS[focusSpotId]
    if (!coord) return

    const spot = spots.find(s => s.id === focusSpotId)
    if (!spot) return

    // 关闭上一个弹窗
    closeInfoWindow()

    // 平移地图到景点
    map.setCenter(coord, true)
    if (map.getZoom() < 16) map.setZoom(16)

    // 打开 InfoWindow
    const info = new AMap.InfoWindow({
      content: createInfoWindowContent(spot),
      offset: new AMap.Pixel(0, -30),
      closeWhenClickMap: false,
      isCustom: false,
      autoMove: true,
    })
    info.open(map, coord)
    infoWindowRef.current = info
  }, [focusSpotId, spots, closeInfoWindow])

  if (!AMAP_CONFIG.enabled) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f1eb', borderRadius: 12, color: '#9c948c', fontSize: 14, gap: 8 }}>
        <div style={{ fontSize: 32 }}>{'🗺️'}</div>
        <div>请配置高德地图 API Key</div>
        <div style={{ fontSize: 11, color: '#b8a898' }}>在 frontend/.env 中设置 VITE_AMAP_KEY</div>
      </div>
    )
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 400, borderRadius: 12, overflow: 'hidden' }} />
}

export default ScenicMap
