/* ============================================================
   utils.js — 通用工具
   ============================================================ */
window.MM = window.MM || {};

(function (M) {
  'use strict';

  var U = {};

  /* ---------- 随机 ---------- */
  U.rndInt = function (n) { return Math.floor(Math.random() * n); };
  U.rndRange = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  U.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  U.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /** 不重复抽样 */
  U.sample = function (arr, n) {
    if (n >= arr.length) return U.shuffle(arr);
    var pool = arr.slice(), out = [];
    for (var i = 0; i < n; i++) {
      var j = Math.floor(Math.random() * pool.length);
      out.push(pool[j]);
      pool.splice(j, 1);
    }
    return out;
  };

  /** 随机数字串 */
  U.digits = function (n) {
    var s = '';
    for (var i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
    return s;
  };

  /** 随机二进制串 */
  U.bits = function (n) {
    var s = '';
    for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? '0' : '1';
    return s;
  };

  /* ---------- 格式化 ---------- */
  U.pad = function (n, w) {
    var s = String(n);
    while (s.length < w) s = '0' + s;
    return s;
  };

  /** 毫秒 -> mm:ss 或 h:mm:ss */
  U.clock = function (ms) {
    if (ms < 0) ms = 0;
    var total = Math.floor(ms / 1000);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    return h > 0 ? h + ':' + U.pad(m, 2) + ':' + U.pad(s, 2) : U.pad(m, 2) + ':' + U.pad(s, 2);
  };

  /** 毫秒 -> 1:23.45（带百分秒） */
  U.stopwatch = function (ms) {
    var m = Math.floor(ms / 60000);
    var s = Math.floor((ms % 60000) / 1000);
    var cs = Math.floor((ms % 1000) / 10);
    return m + ':' + U.pad(s, 2) + '.' + U.pad(cs, 2);
  };

  /** 秒 -> 人类可读时长 */
  U.duration = function (sec) {
    if (sec < 60) return sec + ' 秒';
    var m = Math.floor(sec / 60);
    if (m < 60) return m + ' 分钟';
    var h = Math.floor(m / 60);
    return h + ' 小时' + (m % 60 ? ' ' + (m % 60) + ' 分' : '');
  };

  /** 毫秒 -> 分钟数值（用于累计） */
  U.hoursText = function (ms) {
    var h = ms / 3600000;
    if (h < 1) return { v: Math.round(ms / 60000), u: '分钟' };
    return { v: (h < 10 ? h.toFixed(1) : Math.round(h)), u: '小时' };
  };

  U.pct = function (a, b) {
    if (!b) return 0;
    return Math.round((a / b) * 100);
  };

  /** 相对时间 */
  U.ago = function (ts) {
    var d = Date.now() - ts;
    if (d < 60000) return '刚刚';
    if (d < 3600000) return Math.floor(d / 60000) + ' 分钟前';
    if (d < 86400000) return Math.floor(d / 3600000) + ' 小时前';
    if (d < 7 * 86400000) return Math.floor(d / 86400000) + ' 天前';
    var dt = new Date(ts);
    return (dt.getMonth() + 1) + '月' + dt.getDate() + '日';
  };

  U.dateKey = function (ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + U.pad(d.getMonth() + 1, 2) + '-' + U.pad(d.getDate(), 2);
  };

  /* ---------- DOM ---------- */
  /**
   * el('div.cls#id', {attr:...}, [children | text])
   */
  U.el = function (sel, attrs, children) {
    var m = /^([a-zA-Z0-9]+)?((?:[.#][\w-]+)*)$/.exec(sel || 'div');
    var tag = (m && m[1]) || 'div';
    var node = document.createElement(tag);
    if (m && m[2]) {
      m[2].split(/(?=[.#])/).forEach(function (tok) {
        if (!tok) return;
        if (tok[0] === '.') node.classList.add(tok.slice(1));
        else if (tok[0] === '#') node.id = tok.slice(1);
      });
    }
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
      children = attrs; attrs = null;
    }
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') {
          Object.keys(v).forEach(function (p) {
            if (p.indexOf('--') === 0) node.style.setProperty(p, v[p]);
            else node.style[p] = v[p];
          });
        }
        else if (k === 'class') node.className += ' ' + v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (v === true) node.setAttribute(k, '');
        else node.setAttribute(k, v);
      });
    }
    if (children !== undefined && children !== null) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c === null || c === undefined || c === false) return;
        node.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
      });
    }
    return node;
  };

  U.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };

  U.$ = function (sel, root) { return (root || document).querySelector(sel); };

  /** 手机震动反馈（遵守设置里的开关） */
  U.buzz = function (ms) {
    try {
      var st = M.Store && M.Store.settings ? M.Store.settings() : null;
      if (st && st.haptics === false) return;
      if (navigator.vibrate) navigator.vibrate(ms || 8);
    } catch (e) {}
  };

  /* ---------- Toast ---------- */
  var toastTimer = null;
  U.toast = function (msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  };

  /* ---------- Modal ---------- */
  U.confirm = function (opts) {
    return new Promise(function (resolve) {
      var root = document.getElementById('modal-root');
      var back = U.el('div.modal-back');
      var box = U.el('div.modal', [
        U.el('h3', { text: opts.title || '确认' }),
        U.el('p', { text: opts.text || '' }),
        U.el('div.modal-actions', [
          U.el('button.btn.btn-ghost', {
            text: opts.cancel || '取消',
            onclick: function () { close(false); }
          }),
          U.el('button.btn' + (opts.danger ? '.btn-danger' : '.btn-primary'), {
            text: opts.ok || '确定',
            onclick: function () { close(true); }
          })
        ])
      ]);
      back.appendChild(box);
      back.addEventListener('click', function (e) { if (e.target === back) close(false); });
      function close(v) {
        root.removeChild(back);
        resolve(v);
      }
      root.appendChild(back);
    });
  };

  /* ---------- 数字键盘输入辅助 ---------- */
  /** 让输入框只接受数字/0-1，并在填满后自动跳到下一个 */
  U.bindSeqInput = function (input, opts) {
    opts = opts || {};
    var max = opts.max || 40;
    var charset = opts.charset || /[0-9]/;
    input.addEventListener('input', function () {
      var v = input.value.replace(opts.strip || /[^0-9]/g, '').slice(0, max);
      input.value = v;
      if (v.length >= max && opts.next) {
        var n = opts.next();
        if (n) { n.focus(); try { n.select(); } catch (e) {} }
      }
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && opts.next) { e.preventDefault(); var n = opts.next(); if (n) n.focus(); }
    });
  };

  /* ---------- 排序小工具 ---------- */
  U.maxBy = function (arr, fn) {
    var best = null, bv = -Infinity;
    arr.forEach(function (x) { var v = fn(x); if (v > bv) { bv = v; best = x; } });
    return best;
  };

  M.U = U;
})(window.MM);
