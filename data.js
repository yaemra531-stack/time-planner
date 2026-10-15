// 作息、方法库、关联系统的配置。改这里就能改网站内容。
window.CONFIG = {
  // 关联的已有系统（没有线上地址的留空）
  systems: {
    radar:     { name: "雅思见闻", url: "https://yaemra531-stack.github.io/ielts-radar/" },
    s100:      { name: "顾家北100句", url: "https://yaemra531-stack.github.io/ielts-100-sentences/" },
    reading:   { name: "阅读真经5（本地）", url: "" },
    listening: { name: "听写回合", url: "https://ielts-listening-rounds.amber-lemon-4035.chatgpt.site/" },
    blog:      { name: "博客随笔", url: "https://yaemra531-stack.github.io/ink-thought-blog/" },
    diary:     { name: "雅思日记", url: "https://ielts-diary.yaemra531.workers.dev/" }
  },

  // 每日固定作息。unit 为 45 分钟学习/工作单位，可打勾。
  schedule: [
    { start: "07:00", end: "07:30", title: "起床、洗漱、早餐" },
    { start: "07:30", end: "08:30", title: "给 agent 派活", quota: "按前一晚的清单分发（低谷价）", tag: "agent", systems: ["radar"] },
    { start: "08:30", end: "10:30", title: "球场" },
    { start: "10:30", end: "11:20", title: "洗漱、午饭" },
    { start: "11:20", end: "12:05", unit: "u1", no: "①", title: "单词", quota: "Anki 60 词" },
    { start: "12:15", end: "13:00", unit: "u2", no: "②", title: "内容", quota: "处理 agent 产出：选题、文章、视频", systems: ["radar"] },
    { start: "13:30", end: "15:00", title: "午睡" },
    { start: "15:00", end: "15:45", unit: "u3", no: "③", title: "听力", quota: "王陆 2 节，目标正确率 90%+", systems: ["listening"] },
    { start: "15:55", end: "16:40", unit: "u4", no: "④", title: "阅读", quota: "真经 5 做 2 篇", systems: ["reading"] },
    { start: "17:00", end: "19:00", title: "晚饭、休息" },
    { start: "19:00", end: "19:45", unit: "u5", no: "⑤", title: "写作 · 顾家北", quota: "先过方法，再按方法练", systems: ["s100"] },
    { start: "19:55", end: "20:40", unit: "u6", no: "⑥", title: "口语 · 慎小嶷", quota: "每天一个 Day，过完再按方法练" },
    { start: "20:50", end: "21:35", unit: "u7", no: "⑦", title: "整理", quota: "读书笔记、待办、方法卡、明天的 agent 清单、记一行数据", systems: ["blog", "diary"] },
    { start: "21:35", end: "22:00", title: "放松" },
    { start: "22:00", end: "07:00", title: "睡觉" }
  ],

  // 方法库：每节一张方法卡
  books: [
    {
      id: "gjb", name: "顾家北《手把手教你雅思写作》", unit: "⑤",
      idea: "从评分标准倒推；先写准确，再求高级；用翻译练习纠正中式英语。",
      sections: [
        { id: "gjb-1",  title: "第 1 章 · 雅思写作及学习方法" },
        { id: "gjb-2a", title: "第 2 章 · Task 2 评分标准" },
        { id: "gjb-2b", title: "第 2 章 · 考官范文分析" },
        { id: "gjb-2c", title: "第 2 章 · 学习要点与本书用法" },
        { id: "gjb-2d", title: "第 2 章 · 高分范文精炼（上）" },
        { id: "gjb-2e", title: "第 2 章 · 高分范文精炼（下）" },
        { id: "gjb-2f", title: "第 2 章 · 常见语法错误与句型" },
        { id: "gjb-2g", title: "第 2 章 · 句子翻译练习（100 句）" },
        { id: "gjb-2h", title: "第 2 章 · 常问问题与十大误区" },
        { id: "gjb-3a", title: "第 3 章 · Task 1 评分标准与考官范文" },
        { id: "gjb-3b", title: "第 3 章 · 图表写作要点和顺序" },
        { id: "gjb-3c", title: "第 3 章 · 流程图与常问问题" }
      ]
    },
    {
      id: "sxy", name: "慎小嶷《十天突破雅思口语》", unit: "⑥",
      idea: "清楚、自然比难更重要；准备一套素材，合理串到多个话题。",
      sections: [
        { id: "sxy-1",  title: "Day 1 · 最真实的谎言：六个常见问题" },
        { id: "sxy-2",  title: "Day 2 · 三个部分的体验，Part 2 合并（串题）" },
        { id: "sxy-3",  title: "Day 3 · 真实高分答案的用词风格" },
        { id: "sxy-4",  title: "Day 4 · 母语者真正使用的连接词" },
        { id: "sxy-5",  title: "Day 5 · 基础语法错误" },
        { id: "sxy-6",  title: "Day 6 · 练出 decent 的发音" },
        { id: "sxy-7",  title: "Day 7 · Part 1 素材语料库" },
        { id: "sxy-8",  title: "Day 8 · Part 2：清晰度 > 难度" },
        { id: "sxy-9",  title: "Day 9 · Part 3：自然地把答案说长" },
        { id: "sxy-10", title: "Day 10 · 按你手上的版本填写" }
      ]
    }
  ],

  goals: { ankiTotal: 3600, ankiDaily: 60, listeningTarget: 90 }
};
