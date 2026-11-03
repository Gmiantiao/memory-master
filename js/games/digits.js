/* ============================================================
   digits.js — 随机数字 / 快速数字 / 二进制数字
   ============================================================ */
(function (M) {
  'use strict';
  var U = M.U;
  M.games = M.games || {};

  /* ---------- 数字网格渲染（每 chunk 位一组，组间留白） ---------- */
  function renderGrid(data, cfg) {
    var chunk = cfg.chunk || 4;
    var grid = U.el('div.numgrid');
    grid.style.setProperty('--row-gap', cfg.rows > 20 ? '6px' : '10px');

    data.rows.forEach(function (row) {
      var rowEl = U.el('div.numrow');
      rowEl.style.display = 'flex';
      rowEl.style.gap = '9px';
      for (var i = 0; i < row.length; i += chunk) {
        var seg = row.slice(i, i + chunk);
        var c = U.el('div');
        c.style.display = 'grid';
        c.style.flex = '1 1 0';
        c.style.minWidth = '0';
        c.style.gridTemplateColumns = 'repeat(' + seg.length + ', 1fr)';
        c.style.gap = '1px';
        for (var j = 0; j < seg.length; j++) {
          c.appendChild(U.el('span', { text: seg[j] }));
        }
        rowEl.appendChild(c);
      }
      grid.appendChild(rowEl);
    });

    // 自适应字号
    requestAnimationFrame(function () { fitGrid(grid, cfg.cols, chunk); });
    return grid;
  }

  function fitGrid(grid, cols, chunk) {
    var w = grid.clientWidth || 320;
    if (!w) return;
    var groups = Math.ceil(cols / chunk);
    var groupGap = 9;
    var groupW = (w - groupGap * (groups - 1)) / groups;
    var charW = (groupW - (chunk - 1)) / chunk;
    // 等宽字符宽约 0.62em
    var fs = Math.max(8, Math.min(30, charW / 0.62));
    grid.style.fontSize = fs.toFixed(1) + 'px';
  }

  /* ---------- 回忆输入 ---------- */
  function renderRecall(data, cfg, mode) {
    var el = U.el('div.inputgrid');
    var inputs = [];

    data.rows.forEach(function (row, i) {
      var input = U.el('input.tinput', {
        type: 'text',
        inputmode: mode === 'binary' ? 'numeric' : 'numeric',
        pattern: mode === 'binary' ? '[01]*' : '[0-9]*',
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
        placeholder: '第 ' + (i + 1) + ' 行 · ' + row.length + ' 位',
        maxlength: row.length,
        style: { fontSize: '13px', letterSpacing: '0.04em', padding: '9px 11px' }
      });
      inputs.push(input);

      U.bindSeqInput(input, {
        max: row.length,
        strip: mode === 'binary' ? /[^01]/g : /[^0-9]/g,
        next: function () {
          var n = inputs[i + 1];
          if (n) { n.focus(); try { n.select(); } catch (e) {} }
          return n;
        }
      });

      el.appendChild(U.el('div.inputrow', [
        U.el('span.rowno', { text: String(i + 1) }),
        input
      ]));
    });

    return {
      el: el,
      getAnswer: function () {
        return inputs.map(function (inp) {
          return inp.value.replace(mode === 'binary' ? /[^01]/g : /[^0-9]/g, '');
        });
      }
    };
  }

  /* ---------- 判分 ---------- */
  function judge(data, answers, cfg) {
    var rows = [];
    var correctRows = 0, correctChars = 0, score = 0;

    data.rows.forEach(function (row, i) {
      var a = (answers[i] || '');
      var ok = a === row;
      if (ok) { correctRows++; correctChars += row.length; score += row.length; }
      rows.push({ i: i, ok: ok, answer: a || '', correct: row });
    });

    var note;
    var acc = data.rows.length ? correctRows / data.rows.length : 0;
    if (acc === 1) note = '全部正确，可以试下一档强度了。';
    else if (acc >= 0.8) note = '稳定发挥，注意保持节奏和分组一致性。';
    else if (acc === 0) note = '别急，先从更少的行数开始建立图像编码。';
    else note = '错行集中在后半段，多半是编码不够熟练或编码冲突。';

    return {
      correct: correctRows,
      total: data.rows.length,
      score: score,
      note: note,
      rows: rows
    };
  }

  /* ---------- 工厂 ---------- */
  function makeDigitGame(opts) {
    return {
      id: opts.id,
      name: opts.name,
      icon: opts.icon,
      color: opts.color,
      icbg: opts.icbg,
      tagline: opts.tagline,
      desc: opts.desc,
      scoreLabel: '得分 · 正确位数',
      defaultPreset: opts.defaultPreset || 0,
      defaultConfig: { chunk: opts.chunk || 4 },
      presets: opts.presets,

      generate: function (cfg) {
        var rows = [];
        for (var i = 0; i < cfg.rows; i++) {
          rows.push(cfg.mode === 'binary' ? U.bits(cfg.cols) : U.digits(cfg.cols));
        }
        return { rows: rows, cols: cfg.cols };
      },

      memo: function (data, cfg) {
        var box = U.el('div', { style: { width: '100%' } });
        box.appendChild(U.el('div.memo-badge', {
          text: data.rows.length + ' 行 × ' + data.cols + ' 位 · 共 ' + (data.rows.length * data.cols) + ' 个' + (cfg.mode === 'binary' ? '二进制位' : '数字')
        }));
        box.appendChild(renderGrid(data, cfg));
        return box;
      },

      recallNote: '按行作答，每行必须完全正确才计分。输入满一行会自动跳到下一行。',
      recall: function (data, cfg) { return renderRecall(data, cfg, cfg.mode); },
      judge: judge
    };
  }

  /* ============================================================
     注册三个项目
     ============================================================ */

  M.games.digits = makeDigitGame({
    id: 'digits',
    name: '随机数字',
    icon: '数',
    color: '#35d6a0',
    icbg: 'rgba(53,214,160,.13)',
    tagline: '长时记忆的硬指标',
    desc: '世界记忆锦标赛的核心项目。选手在限定时间内记忆尽可能多的随机数字，回忆时按行作答。<br><br>每行必须完全正确才计分（1 位 = 1 分），这是最考验编码系统与地点桩稳定性的项目。',
    chunk: 4,
    presets: [
      { label: '热身 · 5 行 × 20 位', note: '100 位，适合日常热身', meta: '<b>5</b> 分钟', memoSec: 300, config: { rows: 5, cols: 20, mode: 'digits' } },
      { label: '训练 · 10 行 × 40 位', note: '400 位，进阶日常量', meta: '<b>15</b> 分钟', memoSec: 900, config: { rows: 10, cols: 40, mode: 'digits' } },
      { label: '标准赛制 · 25 行 × 40 位', note: '1000 位 / 1 小时', meta: '<b>60</b> 分钟', memoSec: 3600, config: { rows: 25, cols: 40, mode: 'digits' } }
    ],
    defaultPreset: 0
  });

  M.games.speednum = makeDigitGame({
    id: 'speednum',
    name: '快速数字',
    icon: '速',
    color: '#6b9cff',
    icbg: 'rgba(107,156,255,.13)',
    tagline: '5 分钟的速度极限',
    desc: '5 分钟内记忆 200 位随机数字（5 行 × 40 位），是世界纪录级别的速度项目。<br><br>考察的是编码的即时提取速度，而不是长期存储。',
    chunk: 4,
    presets: [
      { label: '入门 · 2 行 × 20 位', note: '40 位，先找手感', meta: '<b>2</b> 分钟', memoSec: 120, config: { rows: 2, cols: 20, mode: 'digits' } },
      { label: '训练 · 3 行 × 40 位', note: '120 位', meta: '<b>3</b> 分钟', memoSec: 180, config: { rows: 3, cols: 40, mode: 'digits' } },
      { label: '标准赛制 · 5 行 × 40 位', note: '200 位 / 5 分钟', meta: '<b>5</b> 分钟', memoSec: 300, config: { rows: 5, cols: 40, mode: 'digits' } }
    ],
    defaultPreset: 1
  });

  M.games.binary = makeDigitGame({
    id: 'binary',
    name: '二进制数字',
    icon: '01',
    color: '#a78bfa',
    icbg: 'rgba(167,139,250,.13)',
    tagline: '30 行的 0 与 1',
    desc: '标准赛制为 30 分钟记忆 30 行 × 30 位 = 900 个二进制位。<br><br>通常把 3 位二进制转成八进制数字再编码，是最主流的解法。',
    chunk: 5,
    presets: [
      { label: '热身 · 5 行 × 30 位', note: '150 位', meta: '<b>5</b> 分钟', memoSec: 300, config: { rows: 5, cols: 30, mode: 'binary' } },
      { label: '训练 · 15 行 × 30 位', note: '450 位', meta: '<b>15</b> 分钟', memoSec: 900, config: { rows: 15, cols: 30, mode: 'binary' } },
      { label: '标准赛制 · 30 行 × 30 位', note: '900 位 / 30 分钟', meta: '<b>30</b> 分钟', memoSec: 1800, config: { rows: 30, cols: 30, mode: 'binary' } }
    ],
    defaultPreset: 0
  });
})(window.MM);
