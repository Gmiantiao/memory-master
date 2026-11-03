/* ============================================================
   words.js — 随机词语
   ============================================================ */
(function (M) {
  'use strict';
  var U = M.U;
  M.games = M.games || {};

  /* 意象清晰、无歧义的常用词库（约 400 词） */
  var WORD_BANK = (
    '森林 沙漠 河流 山谷 云朵 闪电 彩虹 雪原 火山 冰川 瀑布 洞穴 草原 沼泽 峡谷 礁石 岛屿 潮汐 台风 霜冻 ' +
    '老虎 大象 长颈鹿 企鹅 鲸鱼 孔雀 蜘蛛 蝴蝶 蜈蚣 骆驼 犀牛 猎豹 松鼠 刺猬 猫头鹰 章鱼 海豚 鳄鱼 斑马 袋鼠 ' +
    '钢琴 台灯 雨伞 镜子 闹钟 钥匙 钱包 相机 耳机 手表 剪刀 锤子 梯子 水桶 蜡烛 沙漏 罗盘 望远镜 显微镜 打字机 ' +
    '西瓜 火锅 面包 蜂蜜 柠檬 辣椒 冰淇淋 饺子 咖啡 寿司 巧克力 爆米花 煎饼 豆腐 蘑菇 荔枝 核桃 酸奶 泡菜 蛋糕 ' +
    '图书馆 医院 加油站 电影院 地铁站 银行 教堂 码头 机场 博物馆 超市 健身房 浴室 地下室 阁楼 阳台 走廊 车库 广场 剧院 ' +
    '医生 法官 飞行员 厨师 园丁 木匠 画家 侦探 魔术师 潜水员 邮差 裁缝 渔夫 牧羊人 僧侣 拳击手 建筑师 考古学家 摄影师 翻译官 ' +
    '奔跑 跳跃 潜水 攀爬 投掷 旋转 折叠 搅拌 雕刻 刺绣 焊接 演奏 烘焙 收割 编织 打磨 冲洗 悬挂 拆解 点燃 ' +
    '记忆 影子 回声 密码 童话 谣言 习俗 信仰 契约 遗迹 迷宫 漩涡 坐标 裂缝 幻觉 时差 倒影 尘埃 纤维 棱镜 ' +
    '霓虹 高架桥 便利店 广告牌 消防栓 邮筒 天桥 斑马线 售票机 出租屋 电话亭 报摊 菜市场 药房 洗衣店 理发店 五金店 花店 网吧 车库门 ' +
    '火车 轮船 热气球 滑翔伞 摩托车 拖拉机 救护车 消防车 潜水艇 直升机 独轮车 帆船 雪橇 缆车 电车 卡车 自行车 飞船 舢板 挖掘机 ' +
    '围巾 手套 帽子 风衣 靴子 皮带 纽扣 拉链 袖口 衣架 鞋带 口袋 领带 眼镜 戒指 项链 徽章 面具 头盔 护腕 ' +
    '春天 夏至 秋分 冬至 黎明 黄昏 午夜 正午 周末 假期 生日 婚礼 葬礼 考试 面试 搬家 旅行 聚餐 加班 迟到 ' +
    '勇气 嫉妒 孤独 幽默 耐心 偏见 承诺 遗憾 惊喜 厌倦 好奇 焦虑 温柔 固执 天真 沉默 喧闹 秩序 混乱 平衡 ' +
    '墨水 铅笔 橡皮 尺子 图纸 账本 便签 信封 邮票 印章 卷尺 水平仪 螺丝刀 扳手 钳子 电钻 砂纸 油漆 砖块 水泥 ' +
    '苹果 香蕉 葡萄 菠萝 芒果 柚子 柿子 石榴 樱桃 蓝莓 草莓 桃 梨 橘子 哈密瓜 榴莲 椰子 杨桃 枇杷 山楂 ' +
    '钢琴曲 交响乐 摇滚 民谣 爵士 合唱 独奏 节拍器 鼓面 琴弦 长笛 小号 大提琴 口琴 手鼓 铃铛 音叉 唱片 舞台 后台 ' +
    '沙漠绿洲 灯塔 风车 水塔 烟囱 篱笆 井盖 台阶 拱门 天窗 石门 铁桥 木栈道 石阶 围墙 门槛 屋檐 排水沟 晾衣绳 门牌号'
  ).trim().split(/\s+/);

  function pickWords(n) {
    return U.sample(WORD_BANK, Math.min(n, WORD_BANK.length));
  }

  /* ---------- 记忆视图 ---------- */
  function memoView(data, cfg) {
    var box = U.el('div', { style: { width: '100%' } });
    box.appendChild(U.el('div.memo-badge', {
      text: data.words.length + ' 个词 · 按顺序记忆'
    }));
    var grid = U.el('div.words-grid');
    data.words.forEach(function (w, i) {
      grid.appendChild(U.el('div.wordcell', [
        U.el('span.n', { text: String(i + 1) }),
        U.el('span', { text: w })
      ]));
    });
    box.appendChild(grid);
    return box;
  }

  /* ---------- 回忆视图 ---------- */
  function recallView(data, cfg) {
    var n = data.words.length;
    var inputs = [];
    var el = U.el('div', { style: { width: '100%' } });

    var info = U.el('div.memo-badge', { text: '已填 0 / ' + n });
    el.appendChild(info);

    var grid = U.el('div.inputgrid');
    for (var i = 0; i < n; i++) {
      (function (idx) {
        var inp = U.el('input.tinput', {
          type: 'text',
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          spellcheck: 'false',
          enterkeyhint: 'next',
          placeholder: '第 ' + (idx + 1) + ' 个词',
          style: { fontSize: '15px', letterSpacing: '0.02em', padding: '9px 11px' }
        });
        inp.addEventListener('input', function () {
          inp.value = inp.value.replace(/\s+/g, '');
          var filled = 0;
          inputs.forEach(function (x) { if (x.value.trim()) filled++; });
          info.textContent = '已填 ' + filled + ' / ' + n;
        });
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (idx + 1 < n) inputs[idx + 1].focus();
          }
        });
        inputs.push(inp);
        grid.appendChild(U.el('div.inputrow', [
          U.el('span.rowno', { text: String(idx + 1) }),
          inp
        ]));
      })(i);
    }
    el.appendChild(grid);

    return {
      el: el,
      getAnswer: function () {
        return inputs.map(function (x) { return x.value.trim().replace(/\s+/g, ''); });
      }
    };
  }

  /* ---------- 判分 ---------- */
  function judge(data, answers, cfg) {
    var rows = [], correct = 0;
    data.words.forEach(function (w, i) {
      var a = (answers[i] || '').trim();
      var ok = a === w;
      if (ok) correct++;
      rows.push({ i: i, ok: ok, answer: a || '—', correct: w });
    });

    var acc = correct / data.words.length;
    var note;
    if (acc === 1) note = '全部命中，词库容量可以再往上加。';
    else if (acc >= 0.85) note = '很稳。丢的通常是没有形成独特画面的那几个词。';
    else if (acc >= 0.5) note = '中段断裂常见于画面重复，试着让每个故事更夸张、有动作。';
    else note = '先把数量降到 20 个，把「词 → 画面」练成条件反射。';

    return {
      correct: correct,
      total: data.words.length,
      score: correct,
      note: note,
      rows: rows
    };
  }

  M.games.words = {
    id: 'words',
    name: '随机词语',
    icon: '词',
    color: '#5ad2e8',
    icbg: 'rgba(90,210,232,.13)',
    tagline: '故事法的训练场',
    desc: '在限定时间内记住一串随机词语，并按原顺序回忆。<br><br>这是最贴近日常的竞技项目——它训练的正是记忆术的核心：把抽象符号转成具体画面。',
    scoreLabel: '正确词数',
    defaultPreset: 1,
    defaultConfig: {},
    presets: [
      { label: '热身 · 20 词', note: '3 分钟', meta: '<b>20</b> 词', memoSec: 180, config: { count: 20 } },
      { label: '训练 · 40 词', note: '5 分钟 / 标准入门', meta: '<b>40</b> 词', memoSec: 300, config: { count: 40 } },
      { label: '标准赛制 · 100 词', note: '15 分钟', meta: '<b>100</b> 词', memoSec: 900, config: { count: 100 } },
      { label: '极限 · 200 词', note: '30 分钟，接近世界赛量级', meta: '<b>200</b> 词', memoSec: 1800, config: { count: 200 } }
    ],

    generate: function (cfg) {
      return { words: pickWords(cfg.count) };
    },
    memo: memoView,
    recall: recallView,
    recallNote: '按记忆顺序填出词语。填完一个按回车跳到下一个。',
    judge: judge
  };
})(window.MM);
