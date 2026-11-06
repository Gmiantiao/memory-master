/* ============================================================
   engine.js — 训练流程引擎
   阶段：setup → memorize → recall → result
   ============================================================ */
(function (M) {
  'use strict';

  var U = M.U, Store = M.Store;
  var E = {};

  /* ---------- 音效 ---------- */
  var actx = null;
  function beep(freq, dur, gain, type) {
    if (!Store.settings().sound) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator();
      var g = actx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, actx.currentTime);
      g.gain.linearRampToValueAtTime(gain || 0.06, actx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (dur || 0.12));
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + (dur || 0.12) + 0.02);
    } catch (e) {}
  }
  E.beep = beep;
  E.sfx = {
    tick: function () { beep(880, 0.05, 0.03, 'sine'); },
    start: function () { beep(520, 0.14, 0.07, 'sine'); setTimeout(function () { beep(780, 0.18, 0.07, 'sine'); }, 130); },
    end: function () { beep(400, 0.16, 0.07, 'triangle'); setTimeout(function () { beep(280, 0.28, 0.07, 'triangle'); }, 150); },
    ok: function () { beep(920, 0.1, 0.06, 'sine'); },
    pb: function () {
      beep(660, 0.12, 0.07); setTimeout(function () { beep(880, 0.12, 0.07); }, 110);
      setTimeout(function () { beep(1180, 0.22, 0.07); }, 220);
    }
  };

  /* ---------- 沉浸模式图标 ---------- */
  var ICON_FS_IN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
  var ICON_FS_OUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M16 3v3a2 2 0 0 0 2 2h3"/><path d="M8 21v-3a2 2 0 0 0-2-2H3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>';

  /* ---------- 全屏壳 ---------- */
  var host = null;     // .play
  var headEl = null;
  var bodyEl = null;
  var footEl = null;
  var clockEl = null;
  var progEl = null;
  var phaseEl = null;
  var fsBtnEl = null;
  var controlsTimer = null;

  var timer = null;    // {raf, start, duration, onTick, onEnd}
  var session = null;  // 当前会话

  function buildShell(game, phaseText) {
    if (host) host.remove();

    var fsBtn = U.el('button.icon-btn.fs-btn', {
      html: ICON_FS_IN,
      'aria-label': '全屏沉浸',
      title: '全屏沉浸',
      style: { display: 'none' },
      onclick: toggleImmersive
    });
    fsBtnEl = fsBtn;

    headEl = U.el('div.play-head', [
      U.el('button.icon-btn', {
        'aria-label': '返回',
        html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
        onclick: function () { E.confirmExit(); }
      }),
      U.el('div', [
        U.el('div.play-title', { text: game.name }),
        phaseEl = U.el('div.play-phase', { text: phaseText })
      ]),
      U.el('div.right', [
        fsBtn,
        clockEl = U.el('div.clock.mono', { text: '00:00' })
      ])
    ]);
    headEl.appendChild(progEl = U.el('div.progress-track', [U.el('div.progress-fill', { style: { width: '0%' } })]));

    bodyEl = U.el('div.play-body');
    footEl = U.el('div.play-foot');

    host = U.el('div.play', [headEl, bodyEl, footEl]);
    host.addEventListener('click', onHostClick);
    document.body.appendChild(host);
    return host;
  }

  function setPhase(text) { if (phaseEl) phaseEl.textContent = text; }

  function setProgress(p, level) {
    if (!progEl) return;
    var f = progEl.firstChild;
    f.style.width = Math.max(0, Math.min(100, p * 100)) + '%';
    f.className = 'progress-fill' + (level ? ' ' + level : '');
  }

  function setClock(text, level) {
    clockEl.textContent = text;
    clockEl.className = 'clock mono' + (level ? ' ' + level : '');
  }

  /* ---------- 计时器 ---------- */
  function stopTimer() {
    if (timer) { cancelAnimationFrame(timer.raf); timer = null; }
  }

  /**
   * startTimer({ duration, countdown, onTick(elapsed, remain, frac), onEnd(elapsed) })
   */
  function startTimer(opts) {
    stopTimer();
    var t0 = performance.now();
    var duration = opts.duration || 0;
    var lastSec = -1;
    var pausedTotal = 0;
    var pausedAt = 0;

    timer = { raf: 0, start: t0, duration: duration, getStop: null, pause: null, resume: null };

    function elapsed() {
      var now = performance.now();
      return now - t0 - pausedTotal - (pausedAt ? now - pausedAt : 0);
    }

    function frame() {
      if (!timer) return;
      var el = elapsed();
      var remain = duration ? Math.max(0, duration - el) : 0;
      var frac = duration ? remain / duration : 0;

      if (opts.onTick) opts.onTick(el, remain, frac);

      // 最后 10 秒每秒滴答
      var sec = Math.ceil(remain / 1000);
      if (duration && remain <= 10500 && sec !== lastSec && sec > 0) {
        lastSec = sec;
        E.sfx.tick();
      }

      if (duration && remain <= 0) {
        stopTimer();
        if (opts.onEnd) opts.onEnd(duration);
        return;
      }
      timer.raf = requestAnimationFrame(frame);
    }
    timer.raf = requestAnimationFrame(frame);
    timer.getStop = elapsed;

    timer.pause = function () {
      if (!timer || pausedAt) return;
      pausedAt = performance.now();
      cancelAnimationFrame(timer.raf);
      timer.raf = 0;
    };
    timer.resume = function () {
      if (!timer || !pausedAt) return;
      pausedTotal += performance.now() - pausedAt;
      pausedAt = 0;
      timer.raf = requestAnimationFrame(frame);
    };
  }

  function pauseTimer() { if (timer && timer.pause) timer.pause(); }
  function resumeTimer() { if (timer && timer.resume) timer.resume(); }

  function elapsedNow() { return timer && timer.getStop ? timer.getStop() : 0; }

  /* ---------- 屏幕常亮 ---------- */
  var wakeLock = null;

  function keepAwake() {
    if (!navigator.wakeLock || wakeLock) return;
    try {
      navigator.wakeLock.request('screen').then(function (lock) {
        wakeLock = lock;
        lock.addEventListener('release', function () { wakeLock = null; });
      }).catch(function () {});
    } catch (e) {}
  }

  function releaseWake() {
    if (!wakeLock) return;
    try { wakeLock.release(); } catch (e) {}
    wakeLock = null;
  }

  /* ---------- 沉浸模式 ---------- */
  function requestFullscreen() {
    var el = document.documentElement;
    var fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!fn) return;
    try {
      var p = fn.call(el);
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  function exitFullscreen() {
    var fn = document.exitFullscreen || document.webkitExitFullscreen;
    if (!fn) return;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) return;
    try { fn.call(document); } catch (e) {}
  }

  function showControlsTemporarily(ms) {
    if (!host || !session || !session.immersive) return;
    host.classList.add('controls-visible');
    if (controlsTimer) clearTimeout(controlsTimer);
    controlsTimer = setTimeout(function () {
      controlsTimer = null;
      if (host && session && session.immersive) host.classList.remove('controls-visible');
    }, ms || 2500);
  }

  function enterImmersive() {
    if (!session || !host) return;
    session.immersive = true;
    host.classList.add('immersive');
    if (fsBtnEl) {
      fsBtnEl.innerHTML = ICON_FS_OUT;
      fsBtnEl.setAttribute('aria-label', '退出全屏沉浸');
      fsBtnEl.setAttribute('title', '退出全屏沉浸');
    }
    requestFullscreen();
    showControlsTemporarily(2600);
    U.toast('沉浸模式：点击屏幕显示控制栏');
  }

  function exitImmersive(doExitFs) {
    if (session) session.immersive = false;
    if (host) host.classList.remove('immersive', 'controls-visible');
    if (controlsTimer) { clearTimeout(controlsTimer); controlsTimer = null; }
    if (fsBtnEl) {
      fsBtnEl.innerHTML = ICON_FS_IN;
      fsBtnEl.setAttribute('aria-label', '全屏沉浸');
      fsBtnEl.setAttribute('title', '全屏沉浸');
    }
    if (doExitFs !== false) exitFullscreen();
  }

  function toggleImmersive() {
    if (!session) return;
    if (session.phase === 'setup' || session.phase === 'result') return;
    if (session.immersive) exitImmersive();
    else enterImmersive();
  }

  function onHostClick(e) {
    if (!session || !session.immersive || !host) return;
    if (!host.classList.contains('controls-visible')) {
      host.classList.add('controls-visible');
      if (controlsTimer) { clearTimeout(controlsTimer); controlsTimer = null; }
      return;
    }
    var t = e.target;
    if (t && t.closest && t.closest('input, textarea, button, .slot, .pcard, .rank-btn, .numbtn, .pickable, .modal, .modal-back')) return;
    host.classList.remove('controls-visible');
  }

  function onFullscreenChange() {
    var active = document.fullscreenElement || document.webkitFullscreenElement;
    if (!active && session && session.immersive) exitImmersive(false);
  }

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  /* ---------- 打开游戏 ---------- */
  E.open = function (gameId) {
    var game = M.games[gameId];
    if (!game) { U.toast('未找到该项目'); return; }
    if (host) return; // a session is already open (e.g. deep link race)
    stopTimer();
    releaseWake();
    session = {
      game: game,
      preset: game.defaultPreset || 0,
      phase: 'setup',
      immersive: false,
      hid: 'mm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    };
    try { history.pushState({ mmPlay: session.hid }, ''); } catch (e) {}
    document.body.classList.add('playing');

    // A toast from the home page should not sit on top of the training UI
    var toast = document.getElementById('toast');
    if (toast) toast.classList.remove('show');

    buildShell(game, '设置');
    renderSetup();
  };

  E.close = function () {
    stopTimer();
    releaseWake();
    exitImmersive();
    if (session && session.memoView && session.memoView.cleanup) {
      try { session.memoView.cleanup(); } catch (e) {}
    }
    if (session && session.game && session.game.cleanup) {
      try { session.game.cleanup(); } catch (e) {}
    }
    var hid = session && session.hid;
    if (host) { host.remove(); host = null; }
    document.body.classList.remove('playing');
    session = null;

    // Drop the history entry pushed on open. If the user already went back
    // (popstate path), history.state no longer carries our id.
    if (hid && history.state && history.state.mmPlay === hid) {
      try { history.back(); } catch (e) {}
    }

    if (M.App && M.App.afterPlay) M.App.afterPlay();
  };

  var exitDialogOpen = false;

  E.confirmExit = function (fromHistory) {
    if (!session) return;
    if (session.phase === 'result' || session.phase === 'setup') {
      E.close();
      return;
    }
    if (exitDialogOpen) return;
    exitDialogOpen = true;
    pauseTimer(); // don't let the countdown fire behind the dialog

    U.confirm({
      title: '结束本次训练？',
      text: '当前训练尚未完成，中途退出不会保存成绩。',
      ok: '退出',
      cancel: '继续训练',
      danger: true
    }).then(function (yes) {
      exitDialogOpen = false;
      if (yes) { E.close(); return; }
      if (fromHistory && session) {
        try { history.pushState({ mmPlay: session.hid }, ''); } catch (e) {}
      }
      resumeTimer();
    });
  };

  window.addEventListener('popstate', function (e) {
    if (!host || !session) return;
    if (e.state && e.state.mmPlay === session.hid) return;
    E.confirmExit(true);
  });

  window.addEventListener('beforeunload', function (e) {
    if (host && session && session.phase !== 'result' && session.phase !== 'setup') {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  /* ---------- 设置阶段 ---------- */
  function renderSetup() {
    var game = session.game;
    U.clear(bodyEl);
    U.clear(footEl);
    setPhase('设置');
    setClock('—', '');
    if (progEl) progEl.style.display = '';
    if (fsBtnEl) fsBtnEl.style.display = 'none';
    setProgress(0);

    var wrap = U.el('div.setup');
    wrap.appendChild(U.el('h2.setup-h', { text: game.name }));
    wrap.appendChild(U.el('p.setup-d', { html: game.desc || '' }));

    if (game.presets && game.presets.length) {
      wrap.appendChild(U.el('div.field-label', { text: '选择强度' }));
      var list = U.el('div.preset-list');
      game.presets.forEach(function (p, i) {
        var btn = U.el('button.preset' + (i === session.preset ? '.on' : ''), {
          onclick: function () {
            session.preset = i;
            [].forEach.call(list.children, function (c) { c.classList.remove('on'); });
            btn.classList.add('on');
            updateFoot();
          }
        }, [
          U.el('div', [
            U.el('div.preset-name', { text: p.label }),
            U.el('div.preset-desc', { text: p.note || '' })
          ]),
          U.el('div.preset-meta', { html: p.meta || '' }),
          U.el('div.preset-radio')
        ]);
        list.appendChild(btn);
      });
      wrap.appendChild(list);
    }

    // 训练模式：全屏沉浸（全局设置，所有项目共用）
    var s = Store.settings();
    var immOn = !!s.immersive;
    var modeBtn = U.el('button.mode-toggle' + (immOn ? '.on' : ''), {
      type: 'button',
      onclick: function () {
        immOn = !immOn;
        s.immersive = immOn;
        Store.set('immersive', immOn);
        modeBtn.classList.toggle('on', immOn);
      }
    }, [
      U.el('div', { style: { flex: '1', minWidth: '0' } }, [
        U.el('div.mode-title', { text: '全屏沉浸模式' }),
        U.el('div.mode-desc', { text: '只显示题目，隐藏计时栏和按钮；点击屏幕显示控制栏' })
      ]),
      U.el('span.mode-knob')
    ]);
    wrap.appendChild(U.el('div.field-label', { text: '训练模式', style: { marginTop: '22px' } }));
    wrap.appendChild(modeBtn);

    if (game.setupExtra) {
      var ex = game.setupExtra(session.preset);
      if (ex) wrap.appendChild(ex);
    }

    bodyEl.appendChild(wrap);

    var startBtn = U.el('button.btn.btn-primary.btn-lg.btn-block', {
      text: '开始训练',
      onclick: startRound
    });
    footEl.appendChild(U.el('div.hint', { text: '数据保存在本机' }));
    footEl.appendChild(startBtn);
    updateFoot();

    function updateFoot() {
      var p = game.presets[session.preset];
      if (startBtn && p && p.memoSec) startBtn.textContent = '开始 · ' + U.duration(p.memoSec) + '记忆';
      else if (startBtn) startBtn.textContent = '开始训练';
    }
  }

  /* ---------- 开始一轮 ---------- */
  function startRound() {
    var game = session.game;
    var preset = game.presets[session.preset];
    var cfg = Object.assign({}, game.defaultConfig || {}, preset.config || {});
    cfg.memoSec = preset.memoSec || cfg.memoSec || 0;
    cfg.label = preset.label;

    session.cfg = cfg;
    session.data = game.generate(cfg);
    session.answer = null;
    session.phase = 'memorize';

    renderMemo();
    if (Store.settings().immersive) enterImmersive();
  }

  /* ---------- 记忆阶段 ---------- */
  function renderMemo() {
    var game = session.game, cfg = session.cfg, data = session.data;
    var memoSec = cfg.memoSec || 0;

    U.clear(bodyEl);
    U.clear(footEl);
    setPhase(memoSec ? '记忆阶段' : '记忆阶段 · 不限时');
    keepAwake();
    if (fsBtnEl) fsBtnEl.style.display = '';
    if (progEl) progEl.style.display = memoSec ? '' : 'none';

    var wrap = U.el('div.memo-wrap');
    var content = game.memo(data, cfg);
    var node = (content instanceof Node) ? content : (content && content.el);
    if (node) wrap.appendChild(node);
    bodyEl.appendChild(wrap);
    session.memoView = (content && content.el) ? content : null;

    var doneBtn = U.el('button.btn.btn-primary.btn-lg.btn-block', {
      text: '我记完了',
      onclick: function () { finishMemo(elapsedNow()); }
    });
    footEl.appendChild(doneBtn);

    function beginTimer() {
      E.sfx.start();
      startTimer({
        duration: memoSec * 1000,
        onTick: function (el, remain, frac) {
          if (memoSec) {
            setProgress(1 - frac);
            var level = remain <= 10000 ? 'crit' : (remain <= 60000 ? 'warn' : '');
            setClock(U.clock(remain), level);
          } else {
            setClock(U.clock(el));
          }
        },
        onEnd: function (el) { finishMemo(el); }
      });
    }

    // 需要用户手势才能开始的项目（如听记数字的语音播放）
    if (content && typeof content.ready === 'function') {
      doneBtn.disabled = true;
      setClock('—', '');
      content.ready(function () {
        doneBtn.disabled = false;
        beginTimer();
      });
    } else {
      beginTimer();
    }
  }

  function finishMemo(usedMs) {
    session.memoMs = usedMs || elapsedNow();
    stopTimer();
    if (session.memoView && session.memoView.cleanup) {
      try { session.memoView.cleanup(); } catch (e) {}
    }
    session.memoView = null;
    E.sfx.end();
    session.phase = 'recall';
    renderRecall();
  }

  /* ---------- 回忆阶段 ---------- */
  function renderRecall() {
    var game = session.game, cfg = session.cfg, data = session.data;

    U.clear(bodyEl);
    U.clear(footEl);
    setPhase('回忆阶段');
    keepAwake();
    if (fsBtnEl) fsBtnEl.style.display = '';
    if (progEl) progEl.style.display = 'none';
    if (session.immersive) showControlsTemporarily(2600);
    setClock('00:00');

    var wrap = U.el('div.recall-wrap');
    wrap.style.width = '100%';
    wrap.appendChild(U.el('p.recall-note', { html: game.recallNote || '按记忆顺序作答，完成后提交。' }));

    var view;
    try {
      view = game.recall(data, cfg);
    } catch (e) {
      console.error(e);
      U.toast('回忆界面加载失败');
      return;
    }
    wrap.appendChild(view.el);
    bodyEl.appendChild(wrap);
    bodyEl.scrollTop = 0;

    var submitBtn = U.el('button.btn.btn-primary.btn-lg.btn-block', {
      text: '提交',
      onclick: submit
    });
    footEl.appendChild(submitBtn);

    startTimer({
      duration: 0,
      onTick: function (el) { setClock(U.clock(el)); }
    });

    session.getAnswer = view.getAnswer;

    function submit() {
      var ans = view.getAnswer();
      var el = elapsedNow();
      stopTimer();
      session.recallMs = el;
      session.phase = 'result';
      E.sfx.end();
      renderResult(game.judge(data, ans, cfg));
    }
  }

  /* ---------- 结算 ---------- */
  function renderResult(result) {
    var game = session.game, cfg = session.cfg;

    exitImmersive();
    if (fsBtnEl) fsBtnEl.style.display = 'none';

    U.clear(bodyEl);
    U.clear(footEl);
    setPhase('结果');
    releaseWake();
    if (progEl) progEl.style.display = '';
    setProgress(1);
    setClock(U.clock(session.recallMs || 0));

    var fmt = game.formatScore || function (s) {
      return Math.abs(s % 1) < 0.001 ? String(Math.round(s)) : s.toFixed(1);
    };

    var saved = Store.add({
      gid: game.id,
      score: result.score,
      correct: result.correct,
      total: result.total,
      memoMs: session.memoMs || 0,
      recallMs: session.recallMs || 0,
      preset: cfg.label
    });

    var best = Store.best(game.id);
    var isNewPB = saved.isPB;

    var wrap = U.el('div.result');

    var sub;
    if (isNewPB && saved.prevBest !== null) sub = '新纪录 · 比之前高 <b>' + fmt(Math.round((result.score - saved.prevBest) * 10) / 10) + '</b>';
    else if (isNewPB) sub = '已记录你的第一个成绩';
    else sub = '个人最佳 <b>' + fmt(best.score) + '</b> · 还差 ' + fmt(Math.round((best.score - result.score) * 10) / 10);

    var scoreText = fmt(result.score);
    var hero = U.el('div.result-hero', [
      U.el('div.result-label', { text: game.scoreLabel || '得分' }),
      U.el('div.result-score' + (isNewPB ? '.gold' : ''), { text: scoreText }),
      U.el('div.result-sub', { html: sub })
    ]);
    wrap.appendChild(hero);

    // 指标
    var totalTime = (session.memoMs || 0) + (session.recallMs || 0);
    var metrics = U.el('div.metrics', [
      U.el('div.metric', [
        U.el('div.metric-k', { text: '正确 / 总数' }),
        U.el('div.metric-v', { text: result.correct + ' / ' + result.total })
      ]),
      U.el('div.metric', [
        U.el('div.metric-k', { text: '准确率' }),
        U.el('div.metric-v', { text: U.pct(result.correct, result.total) + '%' })
      ]),
      U.el('div.metric', [
        U.el('div.metric-k', { text: '记忆 + 回忆用时' }),
        U.el('div.metric-v', { text: U.clock(totalTime) })
      ])
    ]);
    wrap.appendChild(metrics);

    // 评语
    if (result.note) {
      wrap.appendChild(U.el('div.callout' + (isNewPB ? '.gold' : ''), [
        U.el('div.ci', { text: isNewPB ? '★' : '◆' }),
        U.el('div', { html: result.note })
      ]));
    }

    // 逐行复查
    if (result.rows && Store.settings().showReview) {
      var review = U.el('div.review');
      result.rows.slice(0, 60).forEach(function (r) {
        review.appendChild(U.el('div.rev-row' + (r.ok ? '.pass' : ''), [
          U.el('span.rn', { text: String(r.i + 1) }),
          U.el('span.ans', { text: r.answer || '—' }),
          r.ok ? U.el('span.tagp', { text: '✓' }) : U.el('span.cor', { text: r.correct })
        ]));
      });
      if (result.rows.length > 60) {
        review.appendChild(U.el('div.rev-row', [U.el('span.rn', { text: '…' }), U.el('span.ans.dim', { text: '仅显示前 60 条' })]));
      }
      wrap.appendChild(U.el('div.field-label', { text: '逐项复查 · 灰色为你写的，绿色为正确答案' }));
      wrap.appendChild(review);
    }

    // 自定义扩展
    if (game.resultExtra) {
      var ex = game.resultExtra(result, session.data, cfg);
      if (ex) wrap.appendChild(ex);
    }

    bodyEl.appendChild(wrap);

    if (isNewPB) E.sfx.pb();

    footEl.appendChild(U.el('button.btn.btn-ghost', { text: '返回', onclick: E.close }));
    footEl.appendChild(U.el('button.btn.btn-primary', { text: '再来一次', onclick: startRound }));
  }

  /* ---------- 键盘 ---------- */
  document.addEventListener('keydown', function (e) {
    if (!host) return;
    if (e.key === 'Escape') E.confirmExit();
  });

  /* ---------- 切回前台时重新申请屏幕常亮 ---------- */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && host && session &&
      (session.phase === 'memorize' || session.phase === 'recall')) {
      keepAwake();
    }
  });

  M.Engine = E;
})(window.MM);
