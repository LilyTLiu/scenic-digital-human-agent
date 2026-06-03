import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  BookOutlined,
  UserOutlined,
  BarChartOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: '数据大屏' },
  { key: '/admin/knowledge', icon: <BookOutlined />, label: '知识库管理' },
  { key: '/admin/digital-human', icon: <UserOutlined />, label: '数字人管理' },
  { key: '/admin/reports', icon: <BarChartOutlined />, label: '反馈报告' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{ background: token.colorBgContainer }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 'bold',
          color: token.colorPrimary,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          AI导游管理台
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: token.colorBgContainer,
          padding: '0 24px',
          fontSize: 16,
          fontWeight: 500,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          管理后台
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
