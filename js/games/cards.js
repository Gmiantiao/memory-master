/* ============================================================
   cards.js — 快速扑克 / 随机扑克牌
   ============================================================ */
(function (M) {
  'use strict';
  var U = M.U;
  M.games = M.games || {};

  var SUITS = [
    { s: '♠', c: 'black' },
    { s: '♥', c: 'red' },
    { s: '♦', c: 'red' },
    { s: '♣', c: 'black' }
  ];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  /** 标准 52 张牌，index 0-51 */
  function fullDeck() {
    var out = [];
    for (var si = 0; si < 4; si++) {
      for (var ri = 0; ri < 13; ri++) {
        out.push({ i: si * 13 + ri, r: RANKS[ri], s: SUITS[si].s, c: SUITS[si].c });
      }
    }
    return out;
  }
  var DECK = fullDeck();

  function cardEl(card, extra) {
    return U.el('div.pcard' + (card.c === 'red' ? '.red' : '.black') + (extra ? '.' + extra : ''), [
      U.el('span.r', { text: card.r }),
      U.el('span.s', { text: card.s })
    ]);
  }

  /** 按容器宽度自适应牌面字号 */
  function fitFont(root) {
    requestAnimationFrame(function () {
      var probe = root.querySelector('.pcard');
      if (!probe) return;
      var w = probe.getBoundingClientRect().width;
      if (!w) return;
      root.style.fontSize = Math.max(7, Math.min(20, w * 0.52)).toFixed(1) + 'px';
    });
  }

  /* ---------- 记忆视图 ---------- */
  function memoView(data, cfg) {
    var box = U.el('div', { style: { width: '100%' } });
    box.appendChild(U.el('div.memo-badge', {
      text: data.decks + ' 副牌 · ' + data.cards.length + ' 张 · 按顺序记忆'
    }));

    var cols = cfg.cols || 13;
    for (var d = 0; d < data.decks; d++) {
      var sub = data.cards.slice(d * 52, d * 52 + 52);
      var grid = U.el('div.rows-grid');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
      grid.style.gap = '4px';
      sub.forEach(function (cid) {
        grid.appendChild(cardEl(DECK[cid]));
      });
      box.appendChild(grid);
      if (d < data.decks - 1) {
        box.appendChild(U.el('div', { style: { height: '14px' } }));
      }
    }
    fitFont(box);
    return box;
  }

  /* ---------- 回忆视图 ---------- */
  function recallView(data, cfg) {
    var n = data.cards.length;
    var slots = new Array(n).fill(null);
    var cursor = 0;
    var cols = cfg.cols || 13;

    var deckCount = data.decks;
    var poolLeft = {};
    DECK.forEach(function (c) { poolLeft[c.i] = deckCount; });

    var el = U.el('div', { style: { width: '100%' } });

    /* 工具条 */
    var info = U.el('div.memo-badge', { text: '已填 0 / ' + n + ' 张' });
    var clearBtn = U.el('button.btn.btn-sm.btn-ghost', {
      text: '清空',
      onclick: function () {
        for (var i = 0; i < n; i++) { slots[i] = null; }
        DECK.forEach(function (c) { poolLeft[c.i] = deckCount; });
        cursor = 0;
        renderAll();
      }
    });
    var undoBtn = U.el('button.btn.btn-sm.btn-ghost', {
      text: '撤销',
      onclick: function () {
        // 找最后一个已填的槽
        for (var i = Math.min(cursor, n) - 1; i >= 0; i--) {
          if (slots[i] !== null) { removeAt(i); cursor = i; renderAll(); return; }
        }
      }
    });
    el.appendChild(U.el('div.row', { style: { marginBottom: '14px' } }, [
      info,
      U.el('div', { style: { marginLeft: 'auto', display: 'flex', gap: '6px' } }, [undoBtn, clearBtn])
    ]));

    /* 槽位 */
    var slotWrap = U.el('div.card-slots');
    slotWrap.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    var slotEls = [];
    for (var i = 0; i < n; i++) {
      (function (idx) {
        var s = U.el('div.slot', { text: String(idx + 1) });
        s.addEventListener('click', function () { onSlotClick(idx); });
        slotEls.push(s);
        slotWrap.appendChild(s);
      })(i);
    }
    el.appendChild(slotWrap);

    /* 牌池 */
    el.appendChild(U.el('div.field-label', { text: '点牌 → 填入当前位置；点已填的格子可取回', style: { marginTop: '20px' } }));
    var poolWrap = U.el('div.card-deck');
    poolWrap.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    var poolEls = {};
    U.shuffle(DECK).forEach(function (c) {
      var pe = cardEl(c, 'pickable');
      pe.addEventListener('click', function () { place(c.i); });
      poolEls[c.i] = pe;
      poolWrap.appendChild(pe);
    });
    el.appendChild(poolWrap);

    fitFont(el);

    /* ---------- 逻辑 ---------- */
    function removeAt(idx) {
      var cid = slots[idx];
      if (cid === null) return;
      poolLeft[cid]++;
      slots[idx] = null;
    }

    function place(cid) {
      if (!poolLeft[cid]) { U.buzz(12); return; }
      var at = cursor >= n ? n - 1 : cursor;
      // 若目标已有牌，先归还
      if (slots[at] !== null) removeAt(at);
      slots[at] = cid;
      poolLeft[cid]--;
      cursor = Math.min(n, at + 1);
      U.buzz(6);
      renderAll();
    }

    function onSlotClick(idx) {
      if (slots[idx] !== null) {
        removeAt(idx);
      }
      cursor = idx;
      renderAll();
    }

    function renderAll() {
      var filled = 0;
      for (var i = 0; i < n; i++) {
        var s = slotEls[i];
        U.clear(s);
        if (slots[i] !== null) {
          filled++;
          s.className = 'slot filled' + (i === cursor ? ' cursor' : '');
          s.appendChild(cardEl(DECK[slots[i]]));
        } else {
          s.className = 'slot' + (i === cursor ? ' cursor' : '');
          s.textContent = String(i + 1);
        }
      }
      info.textContent = '已填 ' + filled + ' / ' + n + ' 张';

      DECK.forEach(function (c) {
        var pe = poolEls[c.i];
        var left = poolLeft[c.i];
        pe.classList.toggle('used', left <= 0);
        pe.style.opacity = left <= 0 ? '' : (left === 1 ? '1' : '0.68');
      });
      fitFont(el);
    }

    renderAll();

    return {
      el: el,
      getAnswer: function () { return slots.slice(); }
    };
  }

  /* ---------- 判分 ---------- */
  function judge(data, answers, cfg) {
    var rows = [];
    var correct = 0, streak = 0, bestStreak = 0, firstWrong = -1;

    data.cards.forEach(function (cid, i) {
      var a = answers[i];
      var ok = a === cid;
      if (ok) {
        correct++;
        streak++;
        if (streak > bestStreak) bestStreak = streak;
      } else {
        if (firstWrong < 0) firstWrong = i;
        streak = 0;
      }
      var ca = DECK[cid], aa = a === null ? null : DECK[a];
      rows.push({
        i: i,
        ok: ok,
        answer: aa ? aa.s + aa.r : '—',
        correct: ca.s + ca.r
      });
    });

    var note;
    if (correct === data.cards.length) note = '整副无误，这是完整通关。';
    else if (firstWrong < 5) note = '开头就断了，多半是第一次图像还没成形，先放慢速度。';
    else if (bestStreak >= 26) note = '最长连续 ' + bestStreak + ' 张，中段记忆是可靠的，短板在衔接处。';
    else note = '最长连续 ' + bestStreak + ' 张。建议固定每 13 张一个地点，减少跨地点断点。';

    return {
      correct: correct,
      total: data.cards.length,
      score: correct,
      note: note,
      rows: rows,
      bestStreak: bestStreak
    };
  }

  /* ---------- 注册 ---------- */
  M.games.speedcards = {
    id: 'speedcards',
    name: '快速扑克',
    icon: '快',
    color: '#f3b74a',
    icbg: 'rgba(243,183,74,.13)',
    tagline: '5 分钟一副牌',
    desc: '5 分钟内记忆一副打乱的扑克牌（52 张），然后按顺序还原。<br><br>这是观赏性最强的项目——世界顶尖选手能在 15 秒左右完成一整副。',
    scoreLabel: '准确张数',
    defaultPreset: 0,
    defaultConfig: { cols: 13 },
    presets: [
      { label: '标准 · 1 副 / 5 分钟', note: '52 张', meta: '<b>5</b> 分钟', memoSec: 300, config: { decks: 1, cols: 13 } },
      { label: '训练 · 1 副 / 3 分钟', note: '压缩时间练速度', meta: '<b>3</b> 分钟', memoSec: 180, config: { decks: 1, cols: 13 } },
      { label: '入门 · 1 副 / 10 分钟', note: '先求完整还原', meta: '<b>10</b> 分钟', memoSec: 600, config: { decks: 1, cols: 13 } }
    ],

    generate: function (cfg) {
      var cards = [];
      for (var d = 0; d < cfg.decks; d++) {
        U.shuffle(DECK).forEach(function (c) { cards.push(c.i); });
      }
      return { cards: cards, decks: cfg.decks };
    },
    memo: memoView,
    recall: recallView,
    recallNote: '按顺序还原整副牌。点牌池填入当前格，点已填的格子可取回。',
    judge: judge,

    resultExtra: function (result, data) {
      var box = U.el('div.callout', [
        U.el('div.ci', { text: '♠' }),
        U.el('div', {
          html: '最长连续正确 <b>' + result.bestStreak + '</b> 张。' +
            (result.correct === result.total ? '整副完成，下次可以尝试压缩记忆时间。' : '连续段越长，说明地点桩之间的衔接越稳。')
        })
      ]);
      return box;
    }
  };

  M.games.cards = {
    id: 'cards',
    name: '随机扑克',
    icon: '牌',
    color: '#ff8fab',
    icbg: 'rgba(255,143,171,.13)',
    tagline: '多副牌的长时记忆',
    desc: '在 1 小时内记忆尽可能多的扑克牌（每副 52 张）。<br><br>与快速扑克不同，这里的难点是数量——需要大量稳定的地点桩和清晰的编码。',
    scoreLabel: '准确张数',
    defaultPreset: 0,
    defaultConfig: { cols: 13 },
    presets: [
      { label: '训练 · 1 副 / 10 分钟', note: '52 张', meta: '<b>10</b> 分钟', memoSec: 600, config: { decks: 1, cols: 13 } },
      { label: '进阶 · 3 副 / 30 分钟', note: '156 张', meta: '<b>30</b> 分钟', memoSec: 1800, config: { decks: 3, cols: 13 } },
      { label: '标准赛制 · 5 副 / 60 分钟', note: '260 张', meta: '<b>60</b> 分钟', memoSec: 3600, config: { decks: 5, cols: 13 } }
    ],

    generate: function (cfg) {
      var cards = [];
      for (var d = 0; d < cfg.decks; d++) {
        U.shuffle(DECK).forEach(function (c) { cards.push(c.i); });
      }
      return { cards: cards, decks: cfg.decks };
    },
    memo: memoView,
    recall: recallView,
    recallNote: '按顺序还原全部牌。每副都是完整 52 张，同一张牌可能出现多次。',
    judge: judge
  };
})(window.MM);
