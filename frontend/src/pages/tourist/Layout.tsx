import { Outlet } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import { HomeOutlined, MessageOutlined, CompassOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Content, Footer } = Layout

const menuItems = [
  { key: '/tourist', icon: <HomeOutlined />, label: '首页' },
  { key: '/tourist/chat', icon: <MessageOutlined />, label: 'AI导游' },
  { key: '/tourist/recommend', icon: <CompassOutlined />, label: '路线推荐' },
]

export default function TouristLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ paddingBottom: 56 }}>
        <Outlet />
      </Content>
      <Footer style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        padding: 0,
        zIndex: 100,
      }}>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            borderTop: '1px solid #f0f0f0',
          }}
        />
      </Footer>
    </Layout>
  )
}
