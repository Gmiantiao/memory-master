/* ============================================================
   app.js — 路由 / 首页 / 记录 / 设置
   ============================================================ */
(function (M) {
  'use strict';
  var U = M.U, Store = M.Store, Engine = M.Engine;

  var GROUPS = [
    { title: '数字', sub: 'DIGITS', ids: ['digits', 'speednum', 'binary', 'spoken'] },
    { title: '牌与图形', sub: 'CARDS & SHAPES', ids: ['cards', 'speedcards', 'abstract'] },
    { title: '语义记忆', sub: 'SEMANTIC', ids: ['words', 'faces', 'dates'] }
  ];

  var appEl = document.getElementById('app');
  var currentRoute = '/';

  var ICON_REC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>';
  var ICON_SET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.28.61.86 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';

  /* ---------- 外壳 ---------- */
  function shell(opts) {
    U.clear(appEl);
    var bar = U.el('header.topbar', [
      U.el('div.brand', [
        U.el('div.brand-mark', { text: 'M' }),
        U.el('div', [
          U.el('div.brand-name', { text: '记忆大师' }),
          U.el('div.brand-sub', { text: 'Memory Master' })
        ])
      ]),
      opts && opts.back
        ? U.el('button.icon-btn', { html: ICON_BACK, 'aria-label': '返回', onclick: function () { location.hash = '#/'; } })
        : null,
      U.el('button.icon-btn', { html: ICON_REC, 'aria-label': '记录', onclick: function () { location.hash = '#/records'; } }),
      U.el('button.icon-btn', { html: ICON_SET, 'aria-label': '设置', onclick: openSettings })
    ]);

    var page = U.el('div.page');
    appEl.appendChild(bar);
    appEl.appendChild(page);

    window.addEventListener('scroll', function () {
      bar.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });

    return page;
  }

  /* ---------- 首页 ---------- */
  function renderHome() {
    var page = shell();
    var stats = Store.stats();
    var bests = Store.bests();

    var hero = U.el('section.hero', [
      U.el('div.eyebrow', [U.el('span.dot'), '世界记忆锦标赛 · 十大项目']),
      U.el('h1', { html: '用竞技的方式<br><em>训练你的记忆</em>' }),
      U.el('p', {
        html: '补上官方 App 缺失的那一半：iOS 也能用，数据只存在你自己的浏览器里。' +
          '十大正式项目、记忆与回忆双阶段计时、逐项判分。'
      })
    ]);

    var hours = U.hoursText(stats.totalMs);
    hero.appendChild(U.el('div.stat-strip', [
      U.el('div.stat', [
        U.el('div.stat-k', { text: '练习次数' }),
        U.el('div.stat-v', { text: String(stats.count) })
      ]),
      U.el('div.stat', [
        U.el('div.stat-k', { text: '累计训练' }),
        U.el('div.stat-v', { text: String(hours.v), html: hours.v + '<small>' + hours.u + '</small>' })
      ]),
      U.el('div.stat', [
        U.el('div.stat-k', { text: '连续天数' }),
        U.el('div.stat-v', { html: stats.streak + '<small>天</small>' })
      ])
    ]));

    page.appendChild(hero);

    GROUPS.forEach(function (g) {
      var head = U.el('div.section-head', [
        U.el('h2', { text: g.title }),
        U.el('span.tiny', { text: g.sub }),
        U.el('div.line'),
        U.el('span.count', { text: String(g.ids.length) })
      ]);
      page.appendChild(head);

      var grid = U.el('div.grid');
      g.ids.forEach(function (id) {
        grid.appendChild(gameCard(M.games[id], bests[id]));
      });
      page.appendChild(grid);
    });

    page.appendChild(U.el('div', {
      style: { marginTop: '44px', textAlign: 'center' },
      class: 'tiny'
    }, [
      U.el('div', { text: 'DATA STAYS ON THIS DEVICE' }),
      U.el('div', {
        style: { marginTop: '6px', color: 'var(--faint)', letterSpacing: '0.02em', textTransform: 'none', fontSize: '11.5px' },
        text: '成绩保存在浏览器 localStorage，不会上传到任何服务器'
      })
    ]));
  }

  function gameCard(game, best) {
    var card = U.el('button.gcard', {
      style: { '--glow': game.color + '2e' },
      onclick: function () { Engine.open(game.id); }
    });

    card.appendChild(U.el('div.gcard-top', [
      U.el('div.gicon', {
        text: game.icon,
        style: { '--ic': game.color, '--icbg': game.icbg, '--icbd': game.color + '40' }
      }),
      U.el('div.gcard-pb', [
        best ? U.el('b', { text: formatScore(game, best.score) }) : null,
        best ? U.el('span', { text: 'PB' }) : U.el('span', { text: '—' })
      ])
    ]));

    card.appendChild(U.el('h3', { text: game.name }));
    card.appendChild(U.el('div.sub', { text: game.tagline }));

    var pbCount = Store.records(game.id).length;
    card.appendChild(U.el('div.gcard-foot', [
      pbCount ? U.el('span.pill', { text: pbCount + ' 次' }) : U.el('span.pill', { text: '未开始' }),
      pbCount ? U.el('span', { text: best ? U.ago(best.at) : '' }) : null
    ]));

    return card;
  }

  function formatScore(game, s) {
    if (game && game.formatScore) return game.formatScore(s);
    return Math.abs(s % 1) < 0.001 ? String(Math.round(s)) : s.toFixed(1);
  }

  /* ---------- 记录页 ---------- */
  function renderRecords() {
    var page = shell({ back: true });
    var bests = Store.bests();
    var all = Store.all();

    page.appendChild(U.el('div.records-wrap', [
      U.el('div.rec-head', [
        U.el('h1', { text: '训练记录' }),
        U.el('span.tiny', { text: all.length + ' RECORDS' })
      ])
    ]));

    var wrap = page.querySelector('.records-wrap');

    if (!all.length) {
      wrap.appendChild(U.el('div.empty-state', [
        U.el('div.ico', { text: '◷' }),
        U.el('div', { text: '还没有训练记录' }),
        U.el('div', { style: { marginTop: '16px' } }, [
          U.el('button.btn.btn-primary', { text: '开始第一次训练', onclick: function () { location.hash = '#/'; } })
        ])
      ]));
      return;
    }

    // 近 14 天活动
    wrap.appendChild(dailyChart(all));

    // PB
    wrap.appendChild(U.el('div.field-label', { text: '个人最佳' }));
    var pbGrid = U.el('div.pb-grid');
    Object.keys(M.games).forEach(function (id) {
      var g = M.games[id];
      var b = bests[id];
      pbGrid.appendChild(U.el('button.pb-item', {
        onclick: function () { Engine.open(id); },
        style: { textAlign: 'left', cursor: 'pointer' }
      }, [
        U.el('div.k', [
          U.el('span', {
            text: g.icon,
            style: { color: g.color, fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: '700' }
          }),
          U.el('span', { text: g.name })
        ]),
        b
          ? U.el('div.v', { text: formatScore(g, b.score) })
          : U.el('div.v.empty', { text: '未开始' }),
        b
          ? U.el('div.d', { text: b.preset + ' · ' + U.ago(b.at) })
          : U.el('div.d', { text: ' ' })
      ]));
    });
    wrap.appendChild(pbGrid);

    // 时间线
    wrap.appendChild(U.el('div.field-label', { text: '最近记录' }));
    var list = U.el('div.rec-list');
    var bestIds = {};
    Object.keys(bests).forEach(function (k) { bestIds[bests[k].id] = true; });

    all.slice().reverse().slice(0, 60).forEach(function (r) {
      var g = M.games[r.gid];
      if (!g) return;
      list.appendChild(U.el('div.rec-item' + (bestIds[r.id] ? '.pb' : ''), [
        U.el('div.gi', {
          text: g.icon,
          style: { color: g.color, background: g.icbg }
        }),
        U.el('div.nm', [
          U.el('b', { text: g.name }),
          U.el('span', { text: r.preset + ' · ' + U.ago(r.at) })
        ]),
        U.el('div', { style: { textAlign: 'right' } }, [
          U.el('div.sc', { text: formatScore(g, r.score) }),
          U.el('div', {
            text: Math.round((r.correct / Math.max(1, r.total)) * 100) + '%',
            style: { fontSize: '10.5px', color: 'var(--faint)', fontFamily: 'var(--mono)' }
          })
        ])
      ]));
    });
    wrap.appendChild(list);
  }

  function dailyChart(all) {
    var days = 14;
    var bucket = {};
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    for (var i = 0; i < days; i++) {
      var d = new Date(now.getTime() - i * 86400000);
      bucket[U.dateKey(d.getTime())] = 0;
    }
    all.forEach(function (r) {
      var k = U.dateKey(r.at);
      if (k in bucket) bucket[k]++;
    });

    var keys = Object.keys(bucket).sort();
    var max = Math.max(1, Math.max.apply(null, keys.map(function (k) { return bucket[k]; })));

    var bars = U.el('div.chart-bars');
    keys.forEach(function (k) {
      var v = bucket[k];
      var h = v ? Math.max(6, (v / max) * 100) : 3;
      var bar = U.el('div.chart-bar' + (v === max && v > 0 ? '.top' : ''));
      bar.style.height = h + '%';
      bar.title = k + ' · ' + v + ' 次';
      bars.appendChild(bar);
    });

    var total = keys.reduce(function (s, k) { return s + bucket[k]; }, 0);
    return U.el('div.chart-box', [
      U.el('div.chart-title', [
        U.el('span', { text: '近 14 天练习量' }),
        U.el('span', { style: { marginLeft: 'auto', fontFamily: 'var(--mono)' }, text: total + ' 次' })
      ]),
      bars
    ]);
  }

  /* ---------- 设置 ---------- */
  function openSettings() {
    var root = document.getElementById('modal-root');
    var s = Store.settings();
    var info = Store.storageInfo();

    function toggleRow(label, key, desc) {
      var on = !!s[key];
      var btn = U.el('button', {
        style: {
          display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
          padding: '13px 0', background: 'none', borderBottom: '1px solid var(--line)', textAlign: 'left'
        },
        onclick: function () {
          s[key] = !s[key];
          Store.set(key, s[key]);
          on = !on;
          knob.style.background = on ? 'var(--accent)' : 'rgba(255,255,255,.14)';
          knob.firstChild.style.transform = on ? 'translateX(16px)' : 'translateX(2px)';
        }
      }, [
        U.el('div', { style: { flex: '1' } }, [
          U.el('div', { text: label, style: { fontSize: '13.5px' } }),
          U.el('div', { text: desc, style: { fontSize: '11px', color: 'var(--faint)', marginTop: '3px' } })
        ])
      ]);
      var knob = U.el('div', {
        style: {
          width: '38px', height: '22px', borderRadius: '20px', flex: 'none',
          background: on ? 'var(--accent)' : 'rgba(255,255,255,.14)',
          transition: '0.2s', position: 'relative'
        }
      }, [
        U.el('div', {
          style: {
            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
            position: 'absolute', top: '2px', left: '0',
            transform: on ? 'translateX(16px)' : 'translateX(2px)',
            transition: '0.2s'
          }
        })
      ]);
      btn.appendChild(knob);
      return btn;
    }

    var back = U.el('div.modal-back');
    var box = U.el('div.modal', { style: { maxWidth: '440px' } });

    box.appendChild(U.el('h3', { text: '设置' }));
    box.appendChild(U.el('p', { text: '所有数据保存在这台设备的浏览器中（localStorage），换设备或清理缓存前请先导出备份。' }));

    // 备份
    box.appendChild(U.el('div.field-label', { text: '数据 · ' + info.count + ' 条 / ' + (info.bytes / 1024).toFixed(1) + ' KB' }));
    var row = U.el('div.row.wrap', { style: { marginBottom: '18px', gap: '8px' } });

    row.appendChild(U.el('button.btn.btn-sm', {
      text: '导出备份',
      onclick: function () {
        var blob = new Blob([Store.exportJSON()], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'memory-master-' + U.dateKey(Date.now()) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        U.toast('已导出备份文件');
      }
    }));

    var fileInput = U.el('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
    fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var n = Store.importJSON(String(rd.result));
          U.toast('已导入 ' + n + ' 条记录');
          close();
          renderRecords();
        } catch (e) {
          U.toast('导入失败：' + e.message);
        }
      };
      rd.readAsText(f);
    });
    row.appendChild(fileInput);
    row.appendChild(U.el('button.btn.btn-sm', {
      text: '导入备份',
      onclick: function () { fileInput.click(); }
    }));
    row.appendChild(U.el('button.btn.btn-sm.btn-danger', {
      text: '清空全部',
      onclick: function () {
        close();
        U.confirm({
          title: '清空所有训练记录？',
          text: '此操作不可撤销。建议先导出备份。',
          ok: '确认清空',
          danger: true
        }).then(function (yes) {
          if (!yes) return;
          Store.clearAll();
          U.toast('已清空');
          renderRecords();
        });
      }
    }));
    box.appendChild(row);

    // 开关
    box.appendChild(U.el('div.field-label', { text: '偏好' }));
    box.appendChild(toggleRow('音效', 'sound', '阶段切换与倒计时的提示音'));
    box.appendChild(toggleRow('震动反馈', 'haptics', '填牌等操作时的轻震（支持的设备）'));
    box.appendChild(toggleRow('显示逐项复查', 'showReview', '结算页列出每一行的对错对照'));

    box.appendChild(U.el('div', {
      style: { marginTop: '20px', fontSize: '11px', color: 'var(--faint)', lineHeight: '1.7' },
      html: '项目规则依据世界记忆锦标赛（World Memory Championships）公开赛制整理。' +
        '本应用为训练工具，与赛事组委会无隶属关系。'
    }));

    var actions = U.el('div.modal-actions', { style: { marginTop: '20px' } }, [
      U.el('button.btn.btn-primary', { text: '完成', onclick: function () { close(); } })
    ]);
    box.appendChild(actions);

    back.appendChild(box);
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    root.appendChild(back);

    function close() { if (back.parentNode) root.removeChild(back); }
  }

  /* ---------- 路由 ---------- */
  function route() {
    var h = location.hash.replace(/^#/, '') || '/';
    currentRoute = h;
    window.scrollTo(0, 0);
    if (h === '/records') renderRecords();
    else renderHome();
  }

  window.addEventListener('hashchange', route);

  M.App = {
    afterPlay: function () {
      // 训练结束后刷新当前视图，让 PB 立即更新
      if (currentRoute === '/records') renderRecords();
      else renderHome();
    }
  };

  route();

  /* 深链接：?g=digits 直达某个项目 */
  (function () {
    try {
      var params = new URLSearchParams(location.search);
      var gid = params.get('g');
      if (gid && M.games[gid]) {
        setTimeout(function () { Engine.open(gid); }, 260);
      }
    } catch (e) {}
  })();

  /* 首次进入的提示 */
  if (!Store.all().length) {
    setTimeout(function () { U.toast('选一个项目，开始第一次训练'); }, 700);
  }
})(window.MM);
