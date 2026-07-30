/**
 * 高德地图配置
 * 使用前请在高德开放平台 (https://console.amap.com) 申请 Key 和安全密钥
 */
export const AMAP_CONFIG = {
  /** 高德 Web端(JS API) Key */
  key: import.meta.env.VITE_AMAP_KEY || '你的高德Web端(JS API)Key',
  /** 高德安全密钥 */
  securityJsCode: import.meta.env.VITE_AMAP_SECRET || '你的高德安全密钥',
  /** 是否启用高德地图（为 false 时回退到静态地图） */
  enabled: !!(import.meta.env.VITE_AMAP_KEY),
}

/**
 * 灵山胜境景点经纬度（基于景区手绘地图的边界校准）
 * SW: [120.090382, 31.418255]  NE: [120.103986, 31.439811]
 */
export const SPOT_COORDS: Record<string, [number, number]> = {
// 1、2、3号位置非常完美，保持不动
  zhaobi:            [120.102426, 31.421250], 
  wumingqiao:       [120.102300,31.421900],
  xiangfuchansi:    [120.097790, 31.427900
], 

  // 🎯 4号 灵山大佛：大幅度降低纬度，让它从山顶荒地退回到“灵山大佛”文字标签右侧的建筑物图标处
  lingshandafo:      [120.0967000, 31.430180], 

  // 🎯 佛手广场（即那个黄色手掌图标）：同步向下移，卡在3号和4号正中间
  fanshouguangchang: [120.098700, 31.426300], 

  // 5号 灵山梵宫：位置已经基本正确，如果想微调让它更往屋顶中心靠，可以微调一点点纬度
  fansong:          [120.101800, 31.428200], 

  // 🎯 6号 五印坛城（城堡图标）：目前偏左上了，真正的坛城在高德底图那个环形水池右下角的灰色建筑阴影区，需要往右下移一点
  wuyintancheng:    [120.102826, 31.424550], 

  // 其它周边配套点位保持原状
  jiulongguanyu:     [120.100350, 31.424650], 
  manfeilongta:      [120.104800, 31.426000], 
  lingshanjingshe:   [120.105100, 31.428500],
}

/** 景区中心点 */
export const LINGSHAN_CENTER: [number, number] = [120.100950, 31.425800]
