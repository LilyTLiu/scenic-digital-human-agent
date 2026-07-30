import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import './admin.css'

/* SVG Icons */
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)
const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  </svg>
)
const IconGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconCamera = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const menuItems = [
  { key: '/admin', icon: <IconDashboard />, label: '数据大屏' },
  { key: '/admin/knowledge', icon: <IconBook />, label: '知识库' },
  { key: '/admin/scenic-spots', icon: <IconGlobe />, label: '景区管理' },
  { key: '/admin/digital-human', icon: <IconUsers />, label: '数字人' },
  { key: '/admin/reviews', icon: <IconStar />, label: '游客评价' },
  { key: '/admin/checkins', icon: <IconCamera />, label: '游客打卡' },
  { key: '/admin/reports', icon: <IconChart />, label: '反馈报告' },
]

const pageTitles: Record<string, string> = {
  '/admin': '数据大屏',
  '/admin/knowledge': '知识库管理',
  '/admin/scenic-spots': '景区管理',
  '/admin/digital-human': '数字人管理',
  '/admin/reviews': '游客评价管理',
  '/admin/checkins': '游客打卡管理',
  '/admin/reports': '反馈报告',
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [siderOpen, setSiderOpen] = useState(false)
  const currentTitle = pageTitles[location.pathname] || '管理后台'

  const closeSider = () => setSiderOpen(false)
  const handleNav = (key: string) => { navigate(key); closeSider() }

  return (
    <div className="admin-shell">
      {/* 侧栏 */}
      {/* 移动端遮罩 */}
      {siderOpen && <div className="admin-sider-overlay" onClick={closeSider} />}
      <aside className={`admin-sider${siderOpen ? ' admin-sider--open' : ''}`}>
        <div className="admin-sider-brand">
          <h1>灵山胜境</h1>
          <span>ADMIN CONSOLE</span>
        </div>
        <nav className="admin-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`admin-nav-item${location.pathname === item.key ? ' admin-nav-item--active' : ''}`}
              onClick={() => handleNav(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* 主区域 */}
      <main className="admin-main">
        <header className="admin-header">
          <button className="admin-hamburger" onClick={() => setSiderOpen(true)} aria-label="打开菜单">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="admin-header-title">{currentTitle}</span>
          <div className="admin-header-actions">
            <span>灵山胜境 AI 数字人导游系统</span>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
