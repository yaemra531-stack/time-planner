// 作息、任务卡、方法库、关联系统的配置。改这里就能改网站内容。
// 任务卡里的“保底量 / 第一步 / 熟练度”也可以在网页上直接改，网页上的修改优先。
window.CONFIG = {
  systems: {
    radar:     { name: "雅思见闻", url: "https://yaemra531-stack.github.io/ielts-radar/" },
    s100:      { name: "顾家北100句", url: "https://yaemra531-stack.github.io/ielts-100-sentences/" },
    reading:   { name: "阅读真经5（本地）", url: "" },
    listening: { name: "听写回合", url: "https://ielts-listening-rounds.amber-lemon-4035.chatgpt.site/" },
    blog:      { name: "博客随笔", url: "https://yaemra531-stack.github.io/ink-thought-blog/" },
    diary:     { name: "雅思日记", url: "https://ielts-diary.yaemra531.workers.dev/" },
    overview:  { name: "总览（Notion）", url: "https://app.notion.com/p/e16526980d194d13b2e764e9bcd6837b" }
  },

  // 每日固定作息。带 unit 的是 45 分钟单位：可计时、可打勾、可复盘。
  // quota = 保底量（明确数字），range = 还没定死时的范围（填了就显示“试行中”），first = 第一步（第一秒能动手）
  // level = 熟练度（熟练 / 摸索中 / 新手），metrics = 定量页里每天记的数据
  // baseDays = 网站上线前已经坚持的天数
  schedule: [
    { start: "07:00", end: "07:30", title: "起床、洗漱、早餐" },
    { start: "07:30", end: "08:30", title: "给 agent 派活", note: "按前一晚的派活单分发（低谷价）", systems: ["radar"] },
    { start: "08:30", end: "10:30", title: "球场", rest: true },
    { start: "10:30", end: "11:20", title: "洗漱、午饭" },
    { start: "11:20", end: "12:05", unit: "u1", no: "①", title: "单词",
      quota: "Anki 60 个", first: "打开 Anki，点开真经词库，开始复习", level: "熟练", baseDays: 30,
      metrics: [{ key: "anki", label: "今天 Anki", suffix: "个", sum: true, total: 3600, totalLabel: "真经词汇" }] },
    { start: "12:15", end: "13:00", unit: "u2", no: "②", title: "内容", systems: ["radar", "diary"],
      quota: "挑 1～2 条候选，写 1 张选题卡", first: "把今天的雅思见闻 JSON 导入网站，从第 1 条读起", level: "摸索中",
      range: "选题卡 1～2 张，摸索一周再定",
      metrics: [{ key: "cards", label: "选题卡", suffix: "张", sum: true }] },
    { start: "13:30", end: "15:00", title: "午睡", rest: true },
    { start: "15:00", end: "15:45", unit: "u3", no: "③", title: "听力", systems: ["listening"],
      quota: "王陆 2 节，记下正确率", first: "打开王陆，从上次的章节第 1 题开始播放", level: "摸索中",
      metrics: [{ key: "listening", label: "听力正确率", suffix: "%", trend: true, target: 90 }] },
    { start: "15:55", end: "16:40", unit: "u4", no: "④", title: "阅读", systems: ["reading"],
      quota: "先学 1 段阅读方法，再做 1 篇真经 5", first: "复制阅读提示词发给 AI，同时翻开方法书", level: "新手",
      range: "新手期先摸底一周，再定 1 篇还是 2 篇",
      metrics: [{ key: "reading", label: "阅读正确率", suffix: "%", trend: true }] },
    { start: "17:00", end: "19:00", title: "晚饭、休息", rest: true },
    { start: "19:00", end: "19:45", unit: "u5", no: "⑤", title: "写作 · 顾家北", systems: ["s100", "overview"],
      quota: "至少 5 个学习要点", first: "复制写作提示词，填上“从学习要点 21 开始”，发给 AI", level: "摸索中",
      range: "5～8 个，看难度",
      metrics: [{ key: "gjb", label: "学到第几个要点", suffix: "", latest: true, base: 20, total: 110, totalLabel: "顾家北学习要点" }] },
    { start: "19:55", end: "20:40", unit: "u6", no: "⑥", title: "口语 · 慎小嶷", systems: ["overview"],
      quota: "至少 1 个 Day", first: "复制口语提示词，填上今天的 Day，发给 AI", level: "新手",
      range: "半个～1 个 Day，太重就只做半个",
      metrics: [{ key: "sxy", label: "学到 Day", suffix: "", latest: true, base: 0, total: 10, totalLabel: "慎小嶷 Day" }] },
    { start: "20:40", end: "21:10", title: "彻底休息", note: "散步、洗澡，不碰手机", rest: true },
    { start: "21:10", end: "21:40", unit: "u7", no: "⑦", title: "收尾整理", systems: ["blog", "diary"], minutes: 30,
      quota: "收尾卡 5 项 + 在这里复盘", first: "打开收尾对话，把白天的东西一股脑贴进去", level: "摸索中" },
    { start: "21:40", end: "22:30", title: "不看屏幕", note: "洗漱、听音频、纸质书" },
    { start: "22:30", end: "07:00", title: "睡觉", rest: true }
  ],

  // 方法库暂时不在导航里显示，章节配置先留着，以后要用再加回来
  books: [
    {
      id: "gjb", name: "顾家北《手把手教你雅思写作（6.0 版）》", unit: "⑤",
      idea: "按学习要点学：每节是“学习要点 + 全文翻译练习”。只学第 3 章图表，不学第 4 章书信。",
      sections: [
        { id: "gjb-1", title: "第 1 章 · 简介及学习方法（要点 1–9）" },
        { id: "gjb-21", title: "2.1 写作完成步骤 + 范文（要点 10–11）" },
        { id: "gjb-22", title: "2.2 题目类型和审题：ABC 法" },
        { id: "gjb-221", title: "2.2.1 优缺点类 1 · 老龄化" },
        { id: "gjb-222", title: "2.2.2 优缺点类 2 · 进口产品" },
        { id: "gjb-223", title: "2.2.3 观点类 1 · 立法" },
        { id: "gjb-224", title: "2.2.4 观点类 2 · 看电视" },
        { id: "gjb-225", title: "2.2.5 观点类 3 · 刑期" },
        { id: "gjb-226", title: "2.2.6 观点类 4 · 学费" },
        { id: "gjb-227", title: "2.2.7 观点类 5 · 远离父母生活" },
        { id: "gjb-228", title: "2.2.8 观点类 6 · 理论知识" },
        { id: "gjb-229", title: "2.2.9 观点类 7 · 交税" },
        { id: "gjb-2210", title: "2.2.10 审题的其他要素 · 快餐" },
        { id: "gjb-2211", title: "2.2.11 如何思考观点 · 志愿者的工作" },
        { id: "gjb-2212", title: "2.2.12 开头段怎么写 · 远程教育" },
        { id: "gjb-2213", title: "2.2.13 论述方式 + 句子要素 · 国际通用语言" },
        { id: "gjb-2214", title: "2.2.14 句子连接 + 结尾段 · 广告" },
        { id: "gjb-2215", title: "2.2.15 论述类 · 学校的规则" },
        { id: "gjb-2216", title: "2.2.16 语言风格 · 分辨对错" },
        { id: "gjb-2217", title: "2.2.17 如何换词 · 艺术" },
        { id: "gjb-2218", title: "2.2.18 减少中式英文 · 生活方式" },
        { id: "gjb-2219", title: "2.2.19 句子结构变化 · 廉价航空" },
        { id: "gjb-2220", title: "2.2.20 报告类 · 消费社会" },
        { id: "gjb-2221", title: "2.2.21 标点和常见语法错误 · 工作" },
        { id: "gjb-2222", title: "2.2.22 混合类 · 城乡转移" },
        { id: "gjb-2223", title: "2.2.23 逻辑的问题 · 老建筑" },
        { id: "gjb-31", title: "3.1–3.2 图表简介 + 动态图（7 个练习）" },
        { id: "gjb-33", title: "3.3 静态图（3 个练习）" },
        { id: "gjb-34", title: "3.4 流程图（3 个练习）" },
        { id: "gjb-35", title: "3.5 地图（3 个练习）" }
      ]
    },
    {
      id: "sxy", name: "慎小嶷《十天突破雅思口语（剑 20 版）》", unit: "⑥",
      idea: "按 Day 1～10 过方法。Day 5～7 不背答案，只看题型和结构。实践期用《雅口有言》《短语速记本》。",
      sections: [
        { id: "sxy-1",  title: "Day 1 · 最真实的谎言：五个问题（重点第 2 个）" },
        { id: "sxy-2",  title: "Day 2 · 口语三个部分的本质" },
        { id: "sxy-3",  title: "Day 3 · 5 类语法错误 + 10 大词汇雷区" },
        { id: "sxy-4",  title: "Day 4 · 评分标准 + 母语者常用连接词" },
        { id: "sxy-5",  title: "Day 5 · Part 1：短兵相接" },
        { id: "sxy-6",  title: "Day 6 · Part 2：清晰度 > 难度" },
        { id: "sxy-7",  title: "Day 7 · Part 3：自然地把答案说长" },
        { id: "sxy-8",  title: "Day 8 · 20 个实用句型" },
        { id: "sxy-9",  title: "Day 9 · 容易听懂的发音" },
        { id: "sxy-10", title: "Day 10 · 口语高分考生的共同点" }
      ]
    }
  ],

  goals: { ankiTotal: 3600, ankiDaily: 60, listeningTarget: 90 }
};
