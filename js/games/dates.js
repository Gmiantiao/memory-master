/* ============================================================
   dates.js — 虚拟历史事件
   ============================================================ */
(function (M) {
  'use strict';
  var U = M.U;
  M.games = M.games || {};

  var PEOPLE = ['汉斯·穆勒', '艾琳·福斯特', '卡洛斯·门德斯', '尤里·佩特罗夫', '安娜·贝克尔',
    '田中健二', '路易斯·奥尔蒂斯', '玛尔塔·诺瓦克', '阿米尔·哈桑', '索菲亚·里奇',
    '约翰·凯尔', '英格丽德·宋', '拉斐尔·科斯塔', '内田美咲', '保罗·维吉尔'];
  var PLACES = ['里斯本', '布拉格', '布宜诺斯艾利斯', '京都', '开普敦', '伊斯坦布尔',
    '赫尔辛基', '蒙特利尔', '塔林', '瓦伦西亚', '卑尔根', '卢布尔雅那', '魁北克', '热那亚'];
  var OBJECTS = ['蒸汽洗衣机', '铜制望远镜', '折叠自行车', '玻璃钢琴', '磁力摆钟',
    '水力磨粉机', '手摇电梯', '木制潜艇', '太阳能烤箱', '机械算盘',
    '双层马车', '纸质雨伞', '气压咖啡壶', '滑轮起重机'];
  var EVENTS = ['国际风筝节', '世界钟表博览会', '极地摄影展', '蒸汽机车竞速赛',
    '国际象棋邀请赛', '手工艺市集', '冰上芭蕾巡演', '夜间天文讲座'];
  var ORGS = ['极地探险协会', '城市照明委员会', '国际气象观测站', '海洋生物研究社',
    '古代地图修复所', '铁路信号标准局'];
  var DEEDS = ['首次徒步穿越沙漠', '独自横渡海峡', '连续观测彗星三百天',
    '在洞穴中居住一年', '完成环球骑行', '徒手攀登冰瀑'];
  var BOOKS = ['海洋的另一侧', '沉默的钟楼', '城市的第九条街', '铁与雾', '四季植物图鉴', '北方来信'];

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function makeEvent() {
    var t = U.rndInt(7);
    var s;
    if (t === 0) s = pick(PEOPLE) + '在' + pick(PLACES) + '发明了' + pick(OBJECTS);
    else if (t === 1) s = pick(PLACES) + '首次举办' + pick(EVENTS);
    else if (t === 2) s = pick(PEOPLE) + '出版了《' + pick(BOOKS) + '》';
    else if (t === 3) s = pick(OBJECTS) + '在' + pick(PLACES) + '首次投入使用';
    else if (t === 4) s = pick(ORGS) + '在' + pick(PLACES) + '成立';
    else if (t === 5) s = pick(PEOPLE) + '完成了' + pick(DEEDS);
    else s = pick(PLACES) + '的' + pick(ORGS) + '迁入新址';
    return s;
  }

  /* ---------- 记忆视图 ---------- */
  function memoView(data, cfg) {
    var box = U.el('div', { style: { width: '100%' } });
    box.appendChild(U.el('div.memo-badge', { text: data.items.length + ' 个事件 · 记住每个事件的年份' }));
    var grid = U.el('div.date-grid');
    data.items.forEach(function (it, i) {
      grid.appendChild(U.el('div.date-row', [
        U.el('span.n', { text: String(i + 1) }),
        U.el('span.ev', { text: it.text }),
        U.el('span.mono', { text: String(it.year), style: { color: 'var(--gold)', fontWeight: '600', fontSize: '14px' } })
      ]));
    });
    box.appendChild(grid);
    return box;
  }

  /* ---------- 回忆视图 ---------- */
  function recallView(data, cfg) {
    var inputs = [];
    var el = U.el('div', { style: { width: '100%' } });

    var info = U.el('div.memo-badge', { text: '已填 0 / ' + data.items.length });
    el.appendChild(info);

    var grid = U.el('div.date-grid');
    data.items.forEach(function (it, i) {
      var inp = U.el('input', {
        type: 'text',
        inputmode: 'numeric',
        pattern: '[0-9]*',
        autocomplete: 'off',
        placeholder: '年份',
        maxlength: 4
      });
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/[^0-9]/g, '').slice(0, 4);
        var filled = 0;
        inputs.forEach(function (x) { if (x.value.trim()) filled++; });
        info.textContent = '已填 ' + filled + ' / ' + data.items.length;
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && inputs[i + 1]) { e.preventDefault(); inputs[i + 1].focus(); }
      });
      inputs.push(inp);

      grid.appendChild(U.el('div.date-row', [
        U.el('span.n', { text: String(i + 1) }),
        U.el('span.ev', { text: it.text }),
        inp
      ]));
    });
    el.appendChild(grid);

    return {
      el: el,
      getAnswer: function () {
        return inputs.map(function (x) {
          var v = parseInt(x.value.trim(), 10);
          return isNaN(v) ? null : v;
        });
      }
    };
  }

  /* ---------- 判分 ---------- */
  function judge(data, answers, cfg) {
    var rows = [], correct = 0, wrongList = [];

    data.items.forEach(function (it, i) {
      var a = answers[i];
      var ok = a === it.year;
      if (ok) correct++;
      else wrongList.push({ text: it.text, year: it.year, guess: a });
      rows.push({
        i: i,
        ok: ok,
        answer: a === null ? '—' : String(a),
        correct: String(it.year)
      });
    });

    var acc = correct / data.items.length;
    var note;
    if (acc === 1) note = '全部命中，时间轴编码非常稳固。';
    else if (acc >= 0.75) note = '错的年份多在相邻区间，注意区分同一时代的几个事件。';
    else note = '建议给每个事件绑定一个「画面 + 世纪」双层锚点，而不是死记数字。';

    return {
      correct: correct,
      total: data.items.length,
      score: correct,
      note: note,
      rows: rows,
      wrongList: wrongList
    };
  }

  M.games.dates = {
    id: 'dates',
    name: '虚拟历史事件',
    icon: '年',
    color: '#f59e6b',
    icbg: 'rgba(245,158,107,.13)',
    tagline: '把数字钉在时间轴上',
    desc: '记忆一组虚构的历史事件及其发生的年份，然后为每个事件写出年份。<br><br>所有事件都是编造的，你无法依赖真实历史知识——只能靠记忆本身。',
    scoreLabel: '正确事件数',
    defaultPreset: 1,
    defaultConfig: {},
    presets: [
      { label: '热身 · 20 事件', note: '5 分钟', meta: '<b>20</b> 条', memoSec: 300, config: { count: 20 } },
      { label: '训练 · 40 事件', note: '10 分钟', meta: '<b>40</b> 条', memoSec: 600, config: { count: 40 } },
      { label: '标准赛制 · 80 事件', note: '15 分钟', meta: '<b>80</b> 条', memoSec: 900, config: { count: 80 } }
    ],

    generate: function (cfg) {
      var items = [], seen = {};
      var guard = 0;
      while (items.length < cfg.count && guard < cfg.count * 40) {
        guard++;
        var text = makeEvent();
        if (seen[text]) continue;
        seen[text] = true;
        items.push({ text: text, year: U.rndRange(1000, 2099) });
      }
      return { items: items };
    },
    memo: memoView,
    recall: recallView,
    recallNote: '为每个事件填写它对应的年份（4 位数字）。年份需要完全准确。',
    judge: judge,

    resultExtra: function (result) {
      if (!result.wrongList || !result.wrongList.length) return null;
      var box = U.el('div');
      box.appendChild(U.el('div.field-label', { text: '答错的事件' }));
      var list = U.el('div.review');
      result.wrongList.slice(0, 25).forEach(function (w) {
        list.appendChild(U.el('div.rev-row', [
          U.el('span.ans', { text: w.text, style: { fontSize: '11.5px' } }),
          U.el('span.cor', { text: String(w.guess === null ? '—' : w.guess) + ' → ' + w.year, style: { flex: 'none', fontSize: '11.5px' } })
        ]));
      });
      box.appendChild(list);
      return box;
    }
  };
})(window.MM);
