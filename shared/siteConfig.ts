export const siteConfig = {
  defaultImage: 'https://bee-reg-ab.imagency.cn/e/355377101f1f5236d827ba89a1caeace.jpg',

  buildDate: '2026-06-23T00:00:00',
  navTitle: '倚肆',
  navSuffix: '的',
  navAfter: '小屋',
  authorName: '倚肆',
  bio: '一杯咖啡，半块曲奇。',

  avatarUrl: 'https://bee-reg-ab.imagency.cn/e/fca41c0134dbe2580f52766e4ad21078.jpg',

  social: {
    github: 'https://github.com/yisi-code',
    gitee: 'https://gitee.com/yisi-code',
    email: 'xiejing0520@petalmail.com',
    wechat: 'm1751250104'
  },

  gitalkConfig: {
    clientID: 'Ov23li1uPRwrJKYM0UIa',
    clientSecret: '',
    repo: '',
    owner: '',
    admin: ['']
  },

  friendLinkApplyFormat: '名称：倚肆\n简介：一杯咖啡，半块曲奇。\n链接：待补充\n头像：https://profile-avatar.csdnimg.cn/bc6ec50c316146d891836d4d476c3842_m1751250104.jpg!1',

  aiAssistantPrompt: '你是站点里的轻量 AI 助手小狐，回答问题简短、友好。'
}

export type SiteConfig = typeof siteConfig
