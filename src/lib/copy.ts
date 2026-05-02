// Chinese copy constants — voice tone: 你 not 您, signature 「我早就说过」
// Reference: GDD §9 + README

export const COPY = {
  // Brand
  brand: '猜吧',
  tagline: '来猜吧 · 历史会替你说话',
  signature: '我早就说过',

  // Auth
  loginTitle: '登录',
  signupTitle: '注册',
  emailLabel: '邮箱',
  passwordLabel: '密码',
  nameLabel: '昵称',
  loginBtn: '登录',
  signupBtn: '注册',
  switchToSignup: '没有账号？注册',
  switchToLogin: '已有账号？登录',
  signupSuccess: '注册成功，去邮箱看看确认链接',
  loginWelcome: '来吧，看你这次能不能猜对',

  // Issue
  stancePending: '记下了，等结果',
  stanceCommitNote: '提交后窗口期内可改 · 闭窗后冻结',
  changeStanceBtn: '修改立场',
  changeStanceWarning: '改一改？时间权重靠的是你的速度，晚改会更晚记。',
  supportBtn: '支持',
  opposeBtn: '反对',
  yourTake: '你怎么看？',
  friendsTitle: '朋友们怎么看',
  relatedPosts: '相关观点',

  // Settlement
  settledCorrect: '你猜对了。这条进了履历。',
  settledWrong: '这次看走眼了 — 别紧张，留着下次扳回来。',
  shareCardTitle: '我早就说过',
  downloadCard: '下载图片',

  // Profile
  accuracyHero: '准确率',
  accumulating: '积累中',
  scopeAll: '通用',
  rankUnranked: '白衣',
  emptyHistory: '还没押过 · 去首页出第一招',
  emptyPosts: '还没写过观点 · 写第一条试试 →',

  // Home
  homeTitle: '首页议题',
  emptyHome: '还没人开火，你来出第一招？',
  loading: '正在算账…',

  // Compose
  composeTitle: '写观点',
  composePublish: '发布',
  composeTitlePlaceholder: '一句话说出你的判断',
  composeBodyPlaceholder: '说说为什么…',

  // Square
  squareTitle: '广场',
  tabRecommend: '推荐',
  tabFollowing: '关注',
  tabHot: '热榜',

  // Errors
  errEmailExists: '这邮箱已经注册过了 · 直接登录吧',
  errWrongPassword: '邮箱或密码不对',
  errEmailNotConfirmed: '邮箱还没确认 · 去收件箱点链接',
  errWeakPassword: '密码至少 6 位',
  errGeneric: '出错了，再试一次',

  // Phases
  phaseWarmup: '预热中',
  phaseWindow: '判断窗口',
  phaseLate: '围观期',
  phaseSettled: '已结算',
  phaseCancelled: '已作废',
  lateNotice: '现在表态不计段位（围观）',
  windowLockedNotice: '窗口已闭 · 立场锁定',
} as const;
