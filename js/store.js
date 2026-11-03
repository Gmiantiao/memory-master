/* ============================================================
   store.js — 本地持久化（localStorage）
   ============================================================ */
(function (M) {
  'use strict';

  var U = M.U;
  var KEY = 'memorymaster.v1';
  var MAX_RECORDS = 1200;

  var state = {
    v: 1,
    records: [],
    settings: {
      sound: true,
      haptics: true,
      showReview: true
    }
  };

  /* ---------- 读写 ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      if (Array.isArray(data.records)) state.records = data.records;
      if (data.settings && typeof data.settings === 'object') {
        Object.keys(data.settings).forEach(function (k) {
          state.settings[k] = data.settings[k];
        });
      }
    } catch (e) {
      console.warn('[store] 读取失败', e);
    }
  }

  var saveTimer = null;
  function persist(immediate) {
    clearTimeout(saveTimer);
    var doIt = function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('[store] 写入失败', e);
        U.toast('本地存储已满，写入失败');
      }
    };
    if (immediate) doIt();
    else saveTimer = setTimeout(doIt, 120);
  }

  /* ---------- 记录 ---------- */
  var S = {};

  S.all = function () { return state.records.slice(); };

  S.records = function (gid) {
    if (!gid) return state.records.slice();
    return state.records.filter(function (r) { return r.gid === gid; });
  };

  /** 某项目最近 N 条（时间正序） */
  S.recent = function (gid, n) {
    var list = S.records(gid);
    return n ? list.slice(-n) : list;
  };

  /**
   * 新增记录，返回 { isPB, prevBest, count }
   */
  S.add = function (rec) {
    rec.id = rec.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
    rec.at = rec.at || Date.now();

    var prev = S.best(rec.gid);
    var prevBest = prev ? prev.score : null;
    var isPB = prevBest === null || rec.score > prevBest;

    state.records.push(rec);

    // 超量裁剪：优先裁掉最早的、且不是该项目 PB 的记录
    if (state.records.length > MAX_RECORDS) {
      var excess = state.records.length - MAX_RECORDS;
      for (var i = 0; i < state.records.length && excess > 0; i++) {
        var r = state.records[i];
        if (!S.isPBRecord(r)) { state.records.splice(i, 1); i--; excess--; }
      }
    }

    persist(true);
    return { isPB: isPB, prevBest: prevBest, count: S.records(rec.gid).length };
  };

  S.isPBRecord = function (r) {
    var best = S.best(r.gid);
    return !best || best.id === r.id;
  };

  /** 某项目个人最佳 */
  S.best = function (gid) {
    var list = S.records(gid);
    if (!list.length) return null;
    var best = list[0];
    for (var i = 1; i < list.length; i++) if (list[i].score > best.score) best = list[i];
    return best;
  };

  S.bests = function () {
    var map = {};
    state.records.forEach(function (r) {
      if (!map[r.gid] || r.score > map[r.gid].score) map[r.gid] = r;
    });
    return map;
  };

  /* ---------- 统计 ---------- */
  S.stats = function () {
    var recs = state.records;
    var totalMs = 0, correct = 0, total = 0;
    recs.forEach(function (r) {
      totalMs += (r.memoMs || 0) + (r.recallMs || 0);
      correct += r.correct || 0;
      total += r.total || 0;
    });

    // 连续天数
    var days = {};
    recs.forEach(function (r) { days[U.dateKey(r.at)] = true; });
    var streak = 0;
    var cur = new Date();
    // 如果今天没练，从昨天开始算（避免断签显示 0）
    if (!days[U.dateKey(cur.getTime())]) cur.setDate(cur.getDate() - 1);
    while (days[U.dateKey(cur.getTime())]) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }

    return {
      count: recs.length,
      totalMs: totalMs,
      correct: correct,
      total: total,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      streak: streak,
      days: Object.keys(days).length
    };
  };

  /* ---------- 设置 ---------- */
  S.settings = function () { return state.settings; };
  S.set = function (k, v) { state.settings[k] = v; persist(); };

  /* ---------- 导入 / 导出 / 清空 ---------- */
  S.exportJSON = function () {
    return JSON.stringify({ app: 'memory-master', v: 1, exportedAt: new Date().toISOString(), records: state.records, settings: state.settings }, null, 2);
  };

  S.importJSON = function (text) {
    var data = JSON.parse(text);
    if (!data || !Array.isArray(data.records)) throw new Error('格式不正确：缺少 records 数组');
    var added = 0, seen = {};
    state.records.forEach(function (r) { seen[r.id] = true; });
    data.records.forEach(function (r) {
      if (!r || !r.gid || typeof r.score !== 'number') return;
      if (r.id && seen[r.id]) return;
      state.records.push(r);
      added++;
    });
    state.records.sort(function (a, b) { return a.at - b.at; });
    persist(true);
    return added;
  };

  S.clearAll = function () {
    state.records = [];
    persist(true);
  };

  S.storageInfo = function () {
    try {
      var raw = localStorage.getItem(KEY) || '';
      return { bytes: new Blob([raw]).size, count: state.records.length };
    } catch (e) { return { bytes: 0, count: state.records.length }; }
  };

  load();

  M.Store = S;
})(window.MM);
