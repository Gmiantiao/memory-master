/* ============================================================
   abstract.js — 抽象图形
   ============================================================ */
(function (M) {
  'use strict';
  var U = M.U;
  M.games = M.games || {};

  var ACCENT = ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a', '#2b6cb0', '#c53030', '#2f855a', '#b7791f'];
  var BG = ['#ffffff', '#ffffff', '#f7f8fa', '#eef1f5'];

  /** 生成一张抽象图形 */
  function makeAbstract() {
    var ink = ACCENT[U.rndInt(ACCENT.length)];
    var bg = BG[U.rndInt(BG.length)];
    var p = ['<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'];
    p.push('<rect width="100" height="100" fill="' + bg + '"/>');

    // 3x3 网格中的随机位置
    var cells = [];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) cells.push([16 + c * 34, 16 + r * 34]);
    }
    var n = 2 + U.rndInt(3);           // 2-4 个元素
    var chosen = U.sample(cells, n);

    chosen.forEach(function (pos) {
      var cx = pos[0] + U.rndRange(-5, 5);
      var cy = pos[1] + U.rndRange(-5, 5);
      var sz = U.rndRange(7, 13);
      var rot = U.rndRange(-40, 40);
      var filled = Math.random() < 0.5;
      var kind = U.rndInt(8);
      var col = Math.random() < 0.18 ? ACCENT[4 + U.rndInt(4)] : ink;
      var w = U.rndRange(2, 3);

      if (kind === 0) {
        p.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + sz + '" fill="' +
          (filled ? col : 'none') + '" stroke="' + col + '" stroke-width="' + w + '"/>');
      } else if (kind === 1) {
        p.push('<rect x="' + (cx - sz) + '" y="' + (cy - sz) + '" width="' + sz * 2 + '" height="' + sz * 2 +
          '" fill="' + (filled ? col : 'none') + '" stroke="' + col + '" stroke-width="' + w +
          '" transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"/>');
      } else if (kind === 2) {
        var pts = (cx) + ',' + (cy - sz) + ' ' + (cx + sz) + ',' + (cy + sz * 0.8) + ' ' + (cx - sz) + ',' + (cy + sz * 0.8);
        p.push('<polygon points="' + pts + '" fill="' + (filled ? col : 'none') + '" stroke="' + col +
          '" stroke-width="' + w + '" transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"/>');
      } else if (kind === 3) {
        p.push('<line x1="' + (cx - sz) + '" y1="' + (cy - sz) + '" x2="' + (cx + sz) + '" y2="' + (cy + sz) +
          '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>');
      } else if (kind === 4) {
        p.push('<path d="M' + (cx - sz) + ' ' + (cy + sz * 0.6) + ' Q' + cx + ' ' + (cy - sz * 1.3) + ' ' +
          (cx + sz) + ' ' + (cy + sz * 0.6) + '" fill="none" stroke="' + col + '" stroke-width="' + w +
          '" stroke-linecap="round"/>');
      } else if (kind === 5) {
        for (var i = 0; i < 3; i++) {
          p.push('<circle cx="' + (cx - sz * 0.7 + i * sz * 0.7) + '" cy="' + cy + '" r="2.2" fill="' + col + '"/>');
        }
      } else if (kind === 6) {
        p.push('<path d="M' + (cx - sz) + ' ' + cy + ' A' + sz + ' ' + sz + ' 0 0 1 ' + (cx + sz) + ' ' + cy + '" fill="none" stroke="' +
          col + '" stroke-width="' + (w + 0.6) + '" stroke-linecap="round"/>');
        p.push('<line x1="' + (cx - sz) + '" y1="' + cy + '" x2="' + (cx + sz) + '" y2="' + cy + '" stroke="' + col +
          '" stroke-width="' + w + '"/>');
      } else {
        p.push('<rect x="' + (cx - sz * 0.55) + '" y="' + (cy - sz) + '" width="' + sz * 1.1 + '" height="' + sz * 2 +
          '" rx="' + sz * 0.55 + '" fill="' + col + '"/>');
      }
    });

    p.push('</svg>');
    return p.join('');
  }

  /* ---------- 记忆视图 ---------- */
  function memoView(data, cfg) {
    var box = U.el('div', { style: { width: '100%' } });
    box.appendChild(U.el('div.memo-badge', { text: data.shapes.length + ' 张图 · 记住每张图对应的编号' }));
    var grid = U.el('div.abstract-grid');
    data.shapes.forEach(function (s, i) {
      grid.appendChild(U.el('div.abstract-cell', [
        U.el('div.idx', { text: String(i + 1) }),
        U.el('div', { html: s.svg, style: { width: '100%', height: '100%' } })
      ]));
    });
    box.appendChild(grid);
    return box;
  }

  /* ---------- 回忆视图 ---------- */
  function recallView(data, cfg) {
    var el = U.el('div', { style: { width: '100%' } });
    var byId = {};
    var order = U.shuffle(data.shapes.map(function (_, i) { return i; }));

    var info = U.el('div.memo-badge', { text: '已填 0 / ' + data.shapes.length });
    el.appendChild(info);

    var grid = U.el('div.abstract-grid');
    var inputs = [];

    order.forEach(function (shapeIdx) {
      var s = data.shapes[shapeIdx];
      var inp = U.el('input.tinput', {
        type: 'text',
        inputmode: 'numeric',
        pattern: '[0-9]*',
        autocomplete: 'off',
        placeholder: '编号',
        maxlength: 3,
        style: { fontSize: '14px', padding: '7px 6px', textAlign: 'center', letterSpacing: '0.05em', marginTop: '6px' }
      });
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/[^0-9]/g, '').slice(0, 3);
        var filled = 0;
        inputs.forEach(function (x) { if (x.value.trim()) filled++; });
        info.textContent = '已填 ' + filled + ' / ' + data.shapes.length;
      });
      inputs.push(inp);
      byId[s.id] = inp;

      grid.appendChild(U.el('div', [
        U.el('div.abstract-cell', { style: { aspectRatio: '1' } }, [
          U.el('div', { html: s.svg, style: { width: '100%', height: '100%' } })
        ]),
        inp
      ]));
    });

    el.appendChild(grid);

    return {
      el: el,
      getAnswer: function () {
        var out = {};
        data.shapes.forEach(function (s) {
          var v = parseInt(byId[s.id].value, 10);
          out[s.id] = isNaN(v) ? null : v;
        });
        return out;
      }
    };
  }

  /* ---------- 判分 ---------- */
  function judge(data, answer, cfg) {
    var rows = [], correct = 0;
    data.shapes.forEach(function (s, i) {
      var guess = answer[s.id];
      var ok = guess === i + 1;
      if (ok) correct++;
      rows.push({
        i: i,
        ok: ok,
        answer: guess === null ? '—' : '#' + guess,
        correct: '#' + (i + 1)
      });
    });

    var acc = correct / data.shapes.length;
    var note;
    if (acc >= 0.9) note = '辨形能力很强。下一步可以缩短记忆时间，而不是加数量。';
    else if (acc >= 0.6) note = '相似图形容易串号。试着给每张图编一个「关键词」，而不是直接记形态。';
    else note = '抽象图形靠的是转译能力：把形状说成一个具体名词，再串成故事。';

    return {
      correct: correct,
      total: data.shapes.length,
      score: correct,
      note: note,
      rows: rows
    };
  }

  M.games.abstract = {
    id: 'abstract',
    name: '抽象图形',
    icon: '形',
    color: '#c084fc',
    icbg: 'rgba(192,132,252,.13)',
    tagline: '把形状翻译成语言',
    desc: '记忆一组编号的抽象图形，回忆时图形会打乱顺序，需要写出各自的原编号。<br><br>难点在于图形没有语义——必须先转译成词，才能进入记忆系统。',
    scoreLabel: '正确张数',
    defaultPreset: 1,
    defaultConfig: {},
    presets: [
      { label: '热身 · 15 张', note: '5 分钟', meta: '<b>15</b> 张', memoSec: 300, config: { count: 15 } },
      { label: '训练 · 30 张', note: '10 分钟', meta: '<b>30</b> 张', memoSec: 600, config: { count: 30 } },
      { label: '标准赛制 · 50 张', note: '15 分钟', meta: '<b>50</b> 张', memoSec: 900, config: { count: 50 } }
    ],

    generate: function (cfg) {
      var shapes = [];
      var seen = {};
      var guard = 0;
      while (shapes.length < cfg.count && guard < cfg.count * 30) {
        guard++;
        var svg = makeAbstract();
        // 以 svg 字符串做去重（同一图形几乎不可能重复，但保险）
        if (seen[svg]) continue;
        seen[svg] = true;
        shapes.push({ id: shapes.length, svg: svg });
      }
      return { shapes: shapes };
    },
    memo: memoView,
    recall: recallView,
    recallNote: '图形顺序已被打乱。为每张图填写它在记忆阶段的编号。',
    judge: judge
  };
})(window.MM);
