/* ============================================================
   spoken.js — 听记数字
   用 Web Speech API 逐秒朗读
   ============================================================ */
(function (M) {
  'use strict';
  var U = M.U;
  M.games = M.games || {};

  var ttsOK = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
  var voice = null;

  function pickVoice() {
    if (!ttsOK) return null;
    var vs = window.speechSynthesis.getVoices() || [];
    var zh = vs.filter(function (v) { return /zh|cmn/i.test(v.lang); });
    // 优先本地中文女声，语速稳定
    voice = zh.find(function (v) { return /Ting|Mei|Xiaoxiao|Huihui|Chinese/i.test(v.name); }) || zh[0] || null;
    return voice;
  }

  function speakDigit(d, rate) {
    if (!ttsOK) return;
    var u = new window.SpeechSynthesisUtterance(String(d));
    u.lang = 'zh-CN';
    u.rate = rate || 1.05;
    u.pitch = 1;
    u.volume = 1;
    if (voice) u.voice = voice;
    try { window.speechSynthesis.speak(u); } catch (e) {}
  }

  /* ---------- 记忆视图（播放器） ---------- */
  function memoView(data, cfg) {
    var total = data.digits.length;
    var el = U.el('div', { style: { width: '100%', textAlign: 'center', paddingTop: '20px' } });

    el.appendChild(U.el('div.memo-badge', {
      text: total + ' 位 · 每秒 1 个数字 · 只能听，不能看',
      style: { justifyContent: 'center' }
    }));

    // 波形
    var wave = U.el('div.wave');
    for (var i = 0; i < 9; i++) wave.appendChild(U.el('i'));

    var counter = U.el('div.player-count.mono', { text: '0 / ' + total });
    var stateText = U.el('div.player-state', { text: ttsOK ? '准备好后点击开始' : '当前浏览器不支持语音合成' });

    var playBtn = U.el('button.btn.btn-primary.btn-lg', {
      text: '开始播放',
      onclick: start
    });

    el.appendChild(wave);
    el.appendChild(counter);
    el.appendChild(stateText);
    el.appendChild(U.el('div', { style: { marginTop: '22px' } }, [playBtn]));

    if (!ttsOK) {
      playBtn.disabled = true;
      el.appendChild(U.el('div.callout', {
        style: { marginTop: '20px', textAlign: 'left' },
        html: '你的浏览器不支持语音合成。建议用 Safari 或 Chrome 打开。'
      }));
    }

    var interval = 1000;
    var idx = 0;
    var timerId = null;
    var started = false;
    var startGate = null;

    function start() {
      if (started || !ttsOK) return;
      started = true;
      playBtn.disabled = true;
      playBtn.textContent = '播放中…';
      stateText.textContent = '专注听，别分心';
      wave.classList.add('on');

      if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
        pickVoice();
      }

      // 第一声稍作延迟，给用户准备时间
      setTimeout(function () {
        speakDigit(data.digits[0]);
        idx = 1;
        counter.textContent = idx + ' / ' + total;
        timerId = setInterval(function () {
          if (idx >= total) {
            clearInterval(timerId);
            wave.classList.remove('on');
            stateText.textContent = '播放结束';
            playBtn.textContent = '已播完';
            return;
          }
          speakDigit(data.digits[idx]);
          idx++;
          counter.textContent = idx + ' / ' + total;
        }, interval);
      }, 1600);

      // 通知引擎开始计时
      if (startGate) startGate();
    }

    return {
      el: el,
      ready: function (cb) { startGate = cb; },
      cleanup: function () {
        if (timerId) clearInterval(timerId);
        if (ttsOK && window.speechSynthesis) {
          try { window.speechSynthesis.cancel(); } catch (e) {}
        }
      }
    };
  }

  /* ---------- 回忆视图 ---------- */
  function recallView(data, cfg) {
    var total = data.digits.length;
    var el = U.el('div', { style: { width: '100%' } });

    var info = U.el('div.memo-badge', { text: '已输入 0 / ' + total + ' 位' });
    el.appendChild(info);

    var input = U.el('textarea.tinput', {
      rows: 4,
      inputmode: 'numeric',
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      placeholder: '按听到的顺序输入数字…',
      style: {
        width: '100%',
        resize: 'vertical',
        fontSize: '19px',
        lineHeight: '1.7',
        letterSpacing: '0.16em',
        padding: '16px',
        minHeight: '130px',
        fontFamily: 'var(--mono)'
      }
    });
    input.addEventListener('input', function () {
      var v = input.value.replace(/[^0-9]/g, '');
      if (v !== input.value) input.value = v;
      info.textContent = '已输入 ' + v.length + ' / ' + total + ' 位';
    });
    el.appendChild(input);

    el.appendChild(U.el('div.callout', {
      style: { marginTop: '16px' },
      html: '听记按「从头开始连续正确」计分。中途断掉之后，后面的正确位不重复计入连续成绩。'
    }));

    return {
      el: el,
      getAnswer: function () { return input.value.replace(/[^0-9]/g, ''); }
    };
  }

  /* ---------- 判分 ---------- */
  function judge(data, answer, cfg) {
    var truth = data.digits;
    var a = answer || '';
    var correct = 0, prefix = 0, broken = false;

    for (var i = 0; i < truth.length; i++) {
      if (a[i] === truth[i]) {
        correct++;
        if (!broken) prefix++;
      } else {
        broken = true;
      }
    }

    var rows = [];
    var chunk = 20;
    for (var s = 0; s < truth.length; s += chunk) {
      var tseg = truth.slice(s, s + chunk);
      var aseg = a.slice(s, s + chunk);
      rows.push({
        i: s / chunk,
        ok: aseg === tseg,
        answer: aseg || '—',
        correct: tseg
      });
    }

    var note;
    if (correct === truth.length) note = '全对。可以试试更快的语速或更多位数。';
    else if (prefix >= truth.length * 0.8) note = '前段非常稳，断点通常在注意力下滑的地方，注意保持均匀节奏。';
    else if (prefix >= truth.length * 0.4) note = '前半段可靠，后半段开始丢。可以用「三位一组」在脑内打拍子。';
    else note = '听记依赖节律感。先试 10-20 位，把「听 → 图像」的转换练顺。';

    return {
      correct: correct,
      total: truth.length,
      score: correct,
      note: note + (prefix !== correct ? '（最长连续 ' + prefix + ' 位）' : ''),
      rows: rows,
      prefix: prefix
    };
  }

  M.games.spoken = {
    id: 'spoken',
    name: '听记数字',
    icon: '听',
    color: '#f472b6',
    icbg: 'rgba(244,114,182,.13)',
    tagline: '只靠耳朵的纯粹记忆',
    desc: '数字以每秒 1 个的速度被朗读出来，你不能看，只能听，然后按顺序写下来。<br><br>这是唯一完全依赖听觉通道的项目，也是很多人最容易崩的一项。',
    scoreLabel: '正确位数',
    defaultPreset: 0,
    defaultConfig: {},
    presets: [
      { label: '入门 · 20 位', note: '约 20 秒', meta: '<b>20</b> 位', memoSec: 23, config: { count: 20 } },
      { label: '训练 · 50 位', note: '约 50 秒', meta: '<b>50</b> 位', memoSec: 53, config: { count: 50 } },
      { label: '标准赛制 · 100 位', note: '约 100 秒，世界赛用 200 位', meta: '<b>100</b> 位', memoSec: 103, config: { count: 100 } }
    ],

    generate: function (cfg) {
      return { digits: U.digits(cfg.count), count: cfg.count };
    },
    memo: memoView,
    recall: recallView,
    recallNote: '按听到的顺序写出数字。不确定的地方也要填，连续正确才算长。',
    judge: judge,
    cleanup: function () {
      if (ttsOK && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    }
  };
})(window.MM);
