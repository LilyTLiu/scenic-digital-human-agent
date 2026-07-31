import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useMediaQuery } from '../../hooks/useMediaQuery'

interface Tab {
  key: string
  label: string
  icon: (active: boolean) => JSX.Element
}

type TouristLayoutMode = 'mobile' | 'desktop'

interface TouristLayoutContextValue {
  mode: TouristLayoutMode
  isDesktop: boolean
}

const TouristLayoutContext = createContext<TouristLayoutContextValue>({
  mode: 'mobile',
  isDesktop: false,
})

export function useTouristLayoutMode() {
  return useContext(TouristLayoutContext)
}

const tabs: Tab[] = [
  {
    key: '/tourist',
    label: '首页',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#c8963e' : '#9c948c'} strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    key: '/tourist/chat',
    label: '云端伴游',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#c8963e' : '#9c948c'} strokeWidth="2">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
        <circle cx="18" cy="4" r="2" fill={active ? '#c8963e' : '#9c948c'} stroke="none"/>
        <circle cx="6" cy="4" r="2" fill={active ? '#c8963e' : '#9c948c'} stroke="none"/>
      </svg>
    ),
  },
  {
    key: '/tourist/tour',
    label: '游园地图',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#c8963e' : '#9c948c'} strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <polygon points="9,21 15,21 17,17 7,17"/>
        <circle cx="12" cy="9" r="2" fill={active ? '#c8963e' : '#9c948c'} stroke="none"/>
      </svg>
    ),
  },
  {
    key: '/tourist/recommend',
    label: '胜境风物',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#c8963e' : '#9c948c'} strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
]

function TouristNav({
  activeKey,
  onNavigate,
}: {
  activeKey: string
  onNavigate: (path: string) => void
}) {
  return (
    <nav className="tab-bar" aria-label="游客端导航">
      {tabs.map((tab) => {
        const active = activeKey === tab.key
        return (
          <div
            key={tab.key}
            className={`tab-item${active ? ' active' : ''}`}
            onClick={() => onNavigate(tab.key)}
          >
            {tab.icon(active)}
            <span>{tab.label}</span>
          </div>
        )
      })}
    </nav>
  )
}

function TouristShell({
  mode,
  activeKey,
  onNavigate,
  children,
}: {
  mode: TouristLayoutMode
  activeKey: string
  onNavigate: (path: string) => void
  children: ReactNode
}) {
  return (
    <div className={`app-shell app-shell--${mode}`} data-layout={mode}>
      <div className="tourist-content" style={{ paddingBottom: 72 }}>
        {children}
      </div>
      <TouristNav activeKey={activeKey} onNavigate={onNavigate} />
    </div>
  )
}

export default function TouristLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 900px)')
  const mode: TouristLayoutMode = isDesktop ? 'desktop' : 'mobile'
  const activeKey = '/' + location.pathname.split('/').slice(1, 3).join('/')

  useEffect(() => {
    document.body.classList.toggle('tourist-desktop-layout', isDesktop)
    return () => {
      document.body.classList.remove('tourist-desktop-layout')
    }
  }, [isDesktop])

  return (
    <TouristLayoutContext.Provider value={{ mode, isDesktop }}>
      <TouristShell mode={mode} activeKey={activeKey} onNavigate={navigate}>
        <Outlet />
      </TouristShell>
    </TouristLayoutContext.Provider>
  )
}
