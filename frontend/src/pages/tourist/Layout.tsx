import { Outlet, useNavigate, useLocation } from 'react-router-dom'

interface Tab {
  key: string
  label: string
  icon: (active: boolean) => JSX.Element
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
    label: 'AI导游',
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
    label: '导览',
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
    label: '路线',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#c8963e' : '#9c948c'} strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    key: '/tourist/digital-human',
    label: 'AI数字人',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#c8963e' : '#9c948c'} strokeWidth="2">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
        <circle cx="18" cy="4" r="2" fill={active ? '#c8963e' : '#9c948c'} stroke="none"/>
        <circle cx="6" cy="4" r="2" fill={active ? '#c8963e' : '#9c948c'} stroke="none"/>
      </svg>
    ),
  },
]

export default function TouristLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeKey = '/' + location.pathname.split('/').slice(1, 3).join('/')

  return (
    <div className="app-shell">
      <div style={{ paddingBottom: 72 }}>
        <Outlet />
      </div>
      <nav className="tab-bar">
        {tabs.map((tab) => {
          const active = activeKey === tab.key
          return (
            <div
              key={tab.key}
              className={`tab-item${active ? ' active' : ''}`}
              onClick={() => navigate(tab.key)}
            >
              {tab.icon(active)}
              <span>{tab.label}</span>
            </div>
          )
        })}
      </nav>
    </div>
  )
}
