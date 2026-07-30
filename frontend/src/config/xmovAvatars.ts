export interface XmovAvatarProfile {
  key: string
  name: string
  standbyImage: string
  appId?: string
  appSecret?: string
}

export const XMOV_AVATAR_STORAGE_KEY = 'lingshan_selected_xmov_avatar'

export const XMOV_AVATAR_PROFILES: XmovAvatarProfile[] = [
  {
    key: 'default',
    name: '导游小文',
    standbyImage: '/avatars/guide-xiaowen.png',
    appId: import.meta.env.VITE_XMOV_APP_ID,
    appSecret: import.meta.env.VITE_XMOV_APP_SECRET,
  },
  {
    key: 'guide-yun',
    name: '导游小云',
    standbyImage: '/avatars/guide-xiaoyun.png',
    appId: import.meta.env.VITE_XMOV_AVATAR_2_ID,
    appSecret: import.meta.env.VITE_XMOV_AVATAR_2_SECRET,
  },
  {
    key: 'guide-ling',
    name: '导游小灵',
    standbyImage: '/avatars/guide-xiaoling.png',
    appId: import.meta.env.VITE_XMOV_AVATAR_3_ID,
    appSecret: import.meta.env.VITE_XMOV_AVATAR_3_SECRET,
  },
]

export function getXmovAvatarProfile(key?: string | null) {
  return XMOV_AVATAR_PROFILES.find((profile) => profile.key === key) ?? XMOV_AVATAR_PROFILES[0]
}
