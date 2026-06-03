import { Card, Typography, Divider, Tag, Timeline } from 'antd'
import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

const routes = [
  {
    title: '历史文化爱好者路线',
    duration: '约6小时',
    type: '深度游',
    tags: ['历史', '文化', '佛教'],
    description: '适合对佛教历史和文化有浓厚兴趣的游客，全面了解灵山胜境的文化底蕴。',
    stops: [
      '南门入园 → 灵山大照壁（华夏第一壁）',
      '胜境广场 → 佛手广场（天下第一掌）',
      '祥符禅寺（千年古刹历史讲解）',
      '杏坛广场 → 佛前广场',
      '灵山大佛（佛教造像艺术解析）',
      '灵山梵宫（佛教艺术殿堂深度游）',
      '五印坛城（藏传佛教文化体验）',
      '三圣殿 → 出口',
    ],
  },
  {
    title: '自然风光爱好者路线',
    duration: '约5小时',
    type: '全景游',
    tags: ['自然', '摄影', '休闲'],
    description: '在感受佛教文化的同时，欣赏太湖风光和园林美景。',
    stops: [
      '南门入园 → 佛足坛',
      '九龙灌浴（观赏表演）',
      '菩提大道（欣赏太湖风光）',
      '灵山大佛（登顶俯瞰全景）',
      '曼飞龙塔（园林景观）',
      '灵山精舍（禅意园林）',
      '梵宫广场 → 出口',
    ],
  },
  {
    title: '亲子家庭路线',
    duration: '约4小时',
    type: '轻松游',
    tags: ['亲子', '互动', '体验'],
    description: '适合带小朋友的家庭，轻松愉快，寓教于乐。',
    stops: [
      '南门入园 → 九龙灌浴（观赏动态表演）',
      '佛手广场（摸"天下第一掌"祈福）',
      '百子戏弥勒（亲子互动拍照）',
      '梵宫（欣赏艺术作品）',
      '五印坛城（体验藏式文化）',
      '出口',
    ],
  },
]

export default function RecommendPage() {
  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>
      <Title level={4}>个性化路线推荐</Title>
      <Paragraph type="secondary">根据您的兴趣偏好，为您推荐以下游览路线</Paragraph>

      <Divider />

      {routes.map((route, i) => (
        <Card
          key={i}
          style={{ marginBottom: 16 }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined />
              {route.title}
            </div>
          }
        >
          <div style={{ marginBottom: 12 }}>
            <ClockCircleOutlined /> {route.duration} · {route.type}
            <div style={{ marginTop: 8 }}>
              {route.tags.map((tag) => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </div>
          </div>
          <Paragraph>{route.description}</Paragraph>
          <Divider orientation="left" plain style={{ fontSize: 13 }}>路线详情</Divider>
          <Timeline
            items={route.stops.map((stop) => ({
              children: stop,
            }))}
          />
        </Card>
      ))}
    </div>
  )
}
