/* ============================================================
   faces.js — 人名头像
   头像用 SVG 程序化生成，保证记忆/回忆两阶段一致
   ============================================================ */
(function (M) {
  'use strict';
  var U = M.U;
  M.games = M.games || {};

  var SKIN = ['#f0c8a6', '#e5b18c', '#d59a72', '#b87a55', '#8f5b3c', '#f6d8c1', '#c98f6b', '#a06b48'];
  var HAIR = ['#241a14', '#3a2820', '#5c3d26', '#161616', '#7a5c3a', '#2f2f2f', '#8d4a20', '#b9b2a8'];
  var BG = ['#263c49', '#3a3050', '#3e2f38', '#2d3f36', '#35354f', '#453728', '#2b4450', '#3d3340'];
  var CLOTH = ['#3a6b8c', '#664b85', '#855747', '#45775c', '#77673a', '#48587a', '#7a4a5e'];
  var NAMES_SUR = '王李张刘陈杨黄赵周吴徐孙马朱胡林郭何高罗郑梁谢宋唐许韩冯邓曹彭曾田董袁潘蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛段雷侯龙史陶黎贺顾毛郝龚邵万钱严武戴莫孔向汤'.split('');
  var NAMES_GIVEN = (
    '伟 芳 娜 敏 静 丽 强 磊 军 洋 勇 艳 杰 娟 涛 明 超 霞 平 刚 ' +
    '建华 文博 子轩 浩然 雨欣 梓涵 思远 晨曦 嘉怡 若曦 博文 一鸣 佳琪 宇轩 欣怡 志远 沐辰 安然 语桐 启航 ' +
    '晓东 立群 海燕 秋月 冬阳 长风 松涛 竹青 石磊 山岚 江雪 云舒 星野 木易 青禾 白露 知遥 半山 听澜 望舒 ' +
    '书瑶 南星 亦舟 智尧 承宇 展鹏 涵予 沐阳 岚岚 珞珈'
  ).trim().split(/\s+/);

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /** 生成一个头像 SVG 字符串 */
  function makeFace() {
    var skin = pick(SKIN), hair = pick(HAIR), bg = pick(BG), cloth = pick(CLOTH);
    var style = Math.floor(Math.random() * 6);
    var eyeStyle = Math.floor(Math.random() * 3);
    var mouth = Math.floor(Math.random() * 4);
    var glasses = Math.random() < 0.22;
    var beard = Math.random() < 0.15;

    var p = [];
    p.push('<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">');
    p.push('<rect width="100" height="100" fill="' + bg + '"/>');
    // 肩部
    p.push('<path d="M8 100 Q10 74 34 68 L66 68 Q90 74 92 100 Z" fill="' + cloth + '"/>');
    // 脖子
    p.push('<rect x="41" y="55" width="18" height="18" rx="7" fill="' + shade(skin, -12) + '"/>');
    // 耳朵
    p.push('<ellipse cx="27" cy="46" rx="4.2" ry="6" fill="' + shade(skin, -8) + '"/>');
    p.push('<ellipse cx="73" cy="46" rx="4.2" ry="6" fill="' + shade(skin, -8) + '"/>');
    // 脸
    p.push('<ellipse cx="50" cy="43" rx="22.5" ry="26" fill="' + skin + '"/>');

    // 头发
    if (style === 0) {
      // 短发
      p.push('<path d="M26 44 Q24 14 50 14 Q76 14 74 44 Q73 26 50 26 Q27 26 26 44 Z" fill="' + hair + '"/>');
    } else if (style === 1) {
      // 长发
      p.push('<path d="M23 42 Q22 11 50 11 Q78 11 77 42 L78 66 Q74 44 71 34 Q62 27 50 27 Q38 27 29 34 Q26 44 22 66 Z" fill="' + hair + '"/>');
    } else if (style === 2) {
      // 卷发
      p.push('<circle cx="34" cy="26" r="9" fill="' + hair + '"/><circle cx="50" cy="20" r="11" fill="' + hair + '"/>' +
        '<circle cx="66" cy="26" r="9" fill="' + hair + '"/><circle cx="28" cy="38" r="7" fill="' + hair + '"/>' +
        '<circle cx="72" cy="38" r="7" fill="' + hair + '"/>');
    } else if (style === 3) {
      // 光头 + 高光
      p.push('<ellipse cx="42" cy="24" rx="9" ry="5" fill="#ffffff" opacity="0.12"/>');
    } else if (style === 4) {
      // 马尾
      p.push('<path d="M26 42 Q25 13 50 13 Q75 13 74 42 Q72 25 50 25 Q28 25 26 42 Z" fill="' + hair + '"/>');
      p.push('<ellipse cx="76" cy="46" rx="8" ry="12" fill="' + hair + '"/>');
    } else {
      // 中分
      p.push('<path d="M25 44 Q22 12 50 12 Q78 12 75 44 Q74 28 50 28 Q26 28 25 44 Z" fill="' + hair + '"/>');
      p.push('<path d="M50 14 L50 28" stroke="' + shade(hair, 18) + '" stroke-width="1.6"/>');
    }

    // 眉毛
    var browC = shade(hair, -6);
    p.push('<path d="M35 34 Q41 31 47 34" stroke="' + browC + '" stroke-width="2.1" fill="none" stroke-linecap="round"/>');
    p.push('<path d="M53 34 Q59 31 65 34" stroke="' + browC + '" stroke-width="2.1" fill="none" stroke-linecap="round"/>');

    // 眼睛
    var eyeC = '#20242c';
    if (eyeStyle === 0) {
      p.push('<ellipse cx="41" cy="42" rx="2.7" ry="3.2" fill="' + eyeC + '"/>');
      p.push('<ellipse cx="59" cy="42" rx="2.7" ry="3.2" fill="' + eyeC + '"/>');
    } else if (eyeStyle === 1) {
      p.push('<path d="M37 42 Q41 38 45 42" stroke="' + eyeC + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>');
      p.push('<path d="M55 42 Q59 38 63 42" stroke="' + eyeC + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>');
    } else {
      p.push('<ellipse cx="41" cy="42" rx="3.4" ry="3.8" fill="#ffffff"/><circle cx="41.6" cy="42" r="2" fill="' + eyeC + '"/>');
      p.push('<ellipse cx="59" cy="42" rx="3.4" ry="3.8" fill="#ffffff"/><circle cx="59.6" cy="42" r="2" fill="' + eyeC + '"/>');
    }

    // 鼻子
    p.push('<path d="M50 44 L47.5 50 Q50 51.6 52.5 50" stroke="' + shade(skin, -18) + '" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');

    // 嘴
    if (mouth === 0) p.push('<path d="M43 56 Q50 61 57 56" stroke="#b2585c" stroke-width="2.2" fill="none" stroke-linecap="round"/>');
    else if (mouth === 1) p.push('<path d="M44 57 L56 57" stroke="#b2585c" stroke-width="2.2" stroke-linecap="round"/>');
    else if (mouth === 2) p.push('<ellipse cx="50" cy="57" rx="5.5" ry="3.4" fill="#b2585c"/>');
    else p.push('<path d="M44 54 Q50 58 56 54 Q50 63 44 54 Z" fill="#b2585c"/>');

    // 胡子
    if (beard) {
      p.push('<path d="M33 50 Q35 66 50 68 Q65 66 67 50 Q62 60 50 60 Q38 60 33 50 Z" fill="' + hair + '" opacity="0.85"/>');
    }

    // 眼镜
    if (glasses) {
      p.push('<g fill="none" stroke="#1d2229" stroke-width="1.5" opacity="0.9">' +
        '<rect x="33" y="37.5" width="15" height="11" rx="4.5"/>' +
        '<rect x="52" y="37.5" width="15" height="11" rx="4.5"/>' +
        '<path d="M48 42.5 L52 42.5"/><path d="M33 41 L27 43"/><path d="M67 41 L73 43"/>' +
        '</g>');
    }

    p.push('</svg>');
    return p.join('');
  }

  /** 颜色明暗调整 */
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function makeName(used) {
    for (var t = 0; t < 40; t++) {
      var nm = pick(NAMES_SUR) + pick(NAMES_GIVEN);
      if (!used[nm]) { used[nm] = true; return nm; }
    }
    return pick(NAMES_SUR) + pick(NAMES_GIVEN) + '·' + (Object.keys(used).length);
  }

  /* ---------- 记忆视图 ---------- */
  function memoView(data, cfg) {
    var box = U.el('div', { style: { width: '100%' } });
    box.appendChild(U.el('div.memo-badge', { text: data.faces.length + ' 位 · 记住每张脸对应的名字' }));
    var grid = U.el('div.face-grid');
    data.faces.forEach(function (f, i) {
      grid.appendChild(U.el('div.face-card', [
        U.el('div.av', { html: f.svg }),
        U.el('div', { style: { minWidth: '0' } }, [
          U.el('div.nm', { text: f.name }),
          U.el('div.meta', { text: '#' + (i + 1) })
        ])
      ]));
    });
    box.appendChild(grid);
    return box;
  }

  /* ---------- 回忆视图 ---------- */
  function recallView(data, cfg) {
    var inputs = [];
    var el = U.el('div', { style: { width: '100%' } });

    var info = U.el('div.memo-badge', { text: '已填 0 / ' + data.faces.length });
    el.appendChild(info);

    var grid = U.el('div.face-grid');
    data.faces.forEach(function (f, i) {
      var inp = U.el('input.tinput', {
        type: 'text',
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
        enterkeyhint: 'next',
        placeholder: '姓名',
        style: { fontSize: '14px', letterSpacing: '0.02em', padding: '8px 10px', marginTop: '6px' }
      });
      inp.addEventListener('input', function () {
        var filled = 0;
        inputs.forEach(function (x) { if (x.value.trim()) filled++; });
        info.textContent = '已填 ' + filled + ' / ' + data.faces.length;
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); if (inputs[i + 1]) inputs[i + 1].focus(); }
      });
      inputs.push(inp);

      grid.appendChild(U.el('div.face-card', { style: { flexDirection: 'column', alignItems: 'stretch' } }, [
        U.el('div.row', [
          U.el('div.av', { html: f.svg }),
          U.el('div', { style: { minWidth: '0' } }, [
            U.el('div.meta', { text: '#' + (i + 1) }),
            U.el('div.nm', { text: '？', style: { color: 'var(--faint)' } })
          ])
        ]),
        inp
      ]));
    });
    el.appendChild(grid);

    return {
      el: el,
      getAnswer: function () { return inputs.map(function (x) { return x.value.trim().replace(/\s+/g, ''); }); }
    };
  }

  /* ---------- 判分 ---------- */
  function judge(data, answers, cfg) {
    var rows = [], correct = 0;
    data.faces.forEach(function (f, i) {
      var a = (answers[i] || '').trim();
      var ok = a === f.name;
      if (ok) correct++;
      rows.push({ i: i, ok: ok, answer: a || '—', correct: f.name });
    });

    var acc = correct / data.faces.length;
    var note;
    if (acc >= 0.9) note = '人名回忆非常稳，可以增加人数或压缩记忆时间。';
    else if (acc >= 0.65) note = '注意区分脸的特征点：发型、眼型、有无眼镜，比整体印象更可靠。';
    else note = '先固定一套「特征 → 熟悉人」的联想规则，别凭直觉记脸。';

    return {
      correct: correct,
      total: data.faces.length,
      score: correct,
      note: note,
      rows: rows
    };
  }

  M.games.faces = {
    id: 'faces',
    name: '人名头像',
    icon: '名',
    color: '#8fd96b',
    icbg: 'rgba(143,217,107,.13)',
    tagline: '社交场景的实战技能',
    desc: '记住一组陌生人像对应的姓名，然后看脸写名。<br><br>这是记忆术里最实用的一项——练熟之后，记客户、同事、同学的名字会变得毫不费力。',
    scoreLabel: '正确人数',
    defaultPreset: 1,
    defaultConfig: {},
    presets: [
      { label: '热身 · 10 人', note: '5 分钟', meta: '<b>10</b> 人', memoSec: 300, config: { count: 10 } },
      { label: '训练 · 20 人', note: '10 分钟', meta: '<b>20</b> 人', memoSec: 600, config: { count: 20 } },
      { label: '标准赛制 · 50 人', note: '15 分钟', meta: '<b>50</b> 人', memoSec: 900, config: { count: 50 } }
    ],

    generate: function (cfg) {
      var used = {}, faces = [];
      for (var i = 0; i < cfg.count; i++) {
        faces.push({ name: makeName(used), svg: makeFace() });
      }
      return { faces: faces };
    },
    memo: memoView,
    recall: recallView,
    recallNote: '看清每张脸，写出对应的姓名。中文姓名请完整填写。',
    judge: judge
  };
})(window.MM);
