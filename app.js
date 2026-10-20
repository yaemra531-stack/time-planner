(() => {
  const C = window.CONFIG;
  const KEY = "timeLedger.v1";
  const UNITS = C.schedule.filter(b => b.unit);
  const LEVELS = ["熟练", "摸索中", "新手"];
  const DEFAULTS = () => ({ days: {}, methods: {}, units: {}, review: {}, ideas: [], timer: null, journal: {} });
  let state = load();
  let timerEndShown = false;
  const app = document.getElementById("app");

  function load() {
    try { return Object.assign(DEFAULTS(), JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch { return DEFAULTS(); }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  const pad = n => String(n).padStart(2, "0");
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => keyOf(new Date());
  const day = k => (state.days[k] ||= { done: {} });
  const rev = k => (state.review[k] ||= { units: {} });
  const toMin = s => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const WEEK = "日一二三四五六";
  const isSunday = () => new Date().getDay() === 0;

  // 单位信息：data.js 的默认值 + 网页上的修改
  const unitOf = uid => {
    const b = UNITS.find(u => u.unit === uid);
    const u = Object.assign({}, b, state.units[uid] || {});
    if (u.rule === "listening") u.plan = listeningPlan(u);
    return u;
  };
  // 听力二选一：数据决定今天做什么
  function listeningPlan(u) {
    const k = today(), ks = Object.keys(state.days).filter(x => x <= k).sort();
    const total = u.chapters || 3;
    // 沿用最近填写的大章；每次换章重置达标次数，旧版未填章号时从默认第 1 章开始。
    let cur = 1;
    const rates = [];
    for (const x of ks) {
      const d = state.days[x];
      const chapter = Number(d.lchap) || cur;
      if (chapter !== cur) { cur = chapter; rates.length = 0; }
      if (x < k && d.listening != null && d.listening !== "") rates.push(Number(d.listening));
    }
    if (!rates.length) return `默写第 ${cur} 大章，记下正确率`;
    const last = rates[rates.length - 1], two = rates.slice(-2);
    if (two.length === 2 && two.every(v => v >= 90)) {
      return cur < total ? `开第 ${cur + 1} 大章（连续 2 次 ≥ 90%）。开了就把“正在练第几大章”改成 ${cur + 1}`
        : `${total} 大章都过了：挑正确率最低的一章默写`;
    }
    return `继续默写第 ${cur} 大章（上次 ${last}%，${last >= 90 ? "再来 1 次 ≥ 90% 就开新章" : "还没到 90%"}）`;
  }
  const stepAt = (b, min) => (b.steps || []).find(s => min >= toMin(s.start) && min < toMin(s.end));
  function stepsHtml(b, curStep) {
    return `<ol class="steps">${b.steps.map(s => `<li class="${s === curStep ? "cur" : ""}"><span class="st-time">${s.start}–${s.end}</span>
      <div><b>${esc(s.title)}</b> <span class="small">${esc(s.what)}</span><div class="st-q">${esc(s.quota)}</div></div></li>`).join("")}</ol>`;
  }
  const doneDays = uid => Object.values(state.days).filter(d => d.done?.[uid]).length;
  const keptDays = uid => (unitOf(uid).baseDays || 0) + doneDays(uid);
  const unitMinutes = uid => unitOf(uid).minutes || 45;

  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }
  function beep() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.45, 0.9].forEach(t => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.2, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.35);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.4);
      });
    } catch {}
  }

  function blockAt(min) {
    return C.schedule.find(b => {
      const s = toMin(b.start), e = toMin(b.end);
      return s < e ? min >= s && min < e : min >= s || min < e;
    });
  }
  function remaining(b, min) {
    let e = toMin(b.end); if (e <= min) e += 1440; return e - min;
  }
  const doneCount = k => UNITS.filter(u => state.days[k]?.done?.[u.unit]).length;

  function ring(pct) {
    const r = 22, c = 2 * Math.PI * r;
    return `<svg class="ring" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r="${r}" fill="none" stroke="var(--border)" stroke-width="5"/>
      <circle cx="28" cy="28" r="${r}" fill="none" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"
        stroke-dasharray="${c * Math.max(0, Math.min(1, pct))} ${c}" transform="rotate(-90 28 28)"/></svg>`;
  }

  function sysLinks(ids = []) {
    if (!ids.length) return "";
    return `<div class="sys">${ids.map(id => {
      const s = C.systems[id];
      return s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>` : `<span>${esc(s.name)}</span>`;
    }).join("")}</div>`;
  }
  const levelCls = l => ({ "熟练": "lv-ok", "摸索中": "lv-mid", "新手": "lv-new" }[l] || "lv-mid");

  // ---------- 计时器 ----------
  const timerLeft = () => state.timer ? Math.max(0, Math.round((state.timer.endAt - Date.now()) / 1000)) : 0;
  const fmt = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  function startTimer(uid) {
    state.timer = { unit: uid, endAt: Date.now() + unitMinutes(uid) * 60000, total: unitMinutes(uid) * 60 };
    timerEndShown = false; save(); renderDay();
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
  }
  function stopTimer(ask) {
    const uid = state.timer?.unit;
    state.timer = null; save();
    if ((location.hash || "#day") === "#day") renderDay();
    if (ask && uid) showStop(uid);
  }
  function tick() {
    if (!state.timer) return;
    const s = timerLeft();
    document.querySelectorAll("[data-countdown]").forEach(el => el.textContent = fmt(s));
    const rg = document.querySelector(".now .ring circle:last-child");
    if (rg) {
      const c = 2 * Math.PI * 22, pct = 1 - s / (state.timer.total || 2700);
      rg.setAttribute("stroke-dasharray", `${c * pct} ${c}`);
    }
    document.title = `${fmt(s)} · ${unitOf(state.timer.unit).title}`;
    if (s === 0 && !timerEndShown) {
      timerEndShown = true; beep();
      const u = unitOf(state.timer.unit);
      if ("Notification" in window && Notification.permission === "granted") {
        try { new Notification("时间到，停。", { body: `${u.no} ${u.title}：写下卡在哪，然后休息。` }); } catch {}
      }
      stopTimer(true);
    }
  }
  setInterval(tick, 1000);

  // 闹钟响了就停：写下卡在哪 + 下次第一步
  function showStop(uid) {
    const u = unitOf(uid), dd = day(today());
    document.title = "时间账本 · 我的一天";
    const m = document.createElement("div");
    m.className = "modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    m.innerHTML = `<div class="sheet">
      <div class="label">${u.no} ${esc(u.title)}</div>
      <h3>时间到，停。</h3>
      <p class="small">没干完也停。写两句话，下次接着干就不用犹豫。</p>
      <label class="chk"><input type="checkbox" id="mDone" ${dd.done[uid] ? "checked" : ""}> 保底量「${esc(u.quota)}」做完了</label>
      <label>卡在哪（做完了可以不填）<input type="text" id="mStuck" placeholder="例如：要点 24 的翻译练习做到第 3 句"></label>
      <label>下次第一步<input type="text" id="mNext" placeholder="例如：从第 4 句开始翻译"></label>
      <div class="row"><button class="btn primary" id="mSave">保存，去休息</button><button class="btn" id="mSkip">跳过</button></div>
    </div>`;
    document.body.appendChild(m);
    m.querySelector("#mStuck").focus();
    const close = () => { m.remove(); if ((location.hash || "#day") === "#day") renderDay(); };
    m.querySelector("#mSave").onclick = () => {
      dd.done[uid] = m.querySelector("#mDone").checked;
      const stuck = m.querySelector("#mStuck").value.trim(), first = m.querySelector("#mNext").value.trim();
      const o = (state.units[uid] ||= {});
      o.next = stuck || first ? { stuck, first, at: today() } : null;
      save(); close(); toast("已记下。彻底歇一会儿。");
    };
    m.querySelector("#mSkip").onclick = close;
  }

  // ---------- 我的一天 ----------
  function unitCard(b, k) {
    const uid = b.unit, u = unitOf(uid), on = day(k).done[uid];
    const running = state.timer?.unit === uid;
    const next = u.next && (u.next.stuck || u.next.first) ? `<div class="next"><b>下次从这里开始</b>
      ${u.next.stuck ? `<div>卡在：${esc(u.next.stuck)}</div>` : ""}${u.next.first ? `<div>第一步：${esc(u.next.first)}</div>` : ""}
      <button class="link" data-clearnext="${uid}">已接上，清掉</button></div>` : "";
    return `<div class="unitrow"><div class="ucol">
        <div class="t-title">${u.no} ${esc(u.title)}
          <span class="badge ${levelCls(u.level)}">${esc(u.level)}</span>
          <span class="kept">${keptDays(uid) ? `已坚持 ${keptDays(uid)} 天` : "刚开始"}</span></div>
        <dl class="facts">${u.plan ? `<dt>今天</dt><dd class="plan">${esc(u.plan)}</dd>` : ""}<dt>保底</dt><dd>${esc(u.quota)}</dd>${next ? "" : `<dt>第一步</dt><dd>${esc(u.first)}</dd>`}</dl>
        ${next}
        ${sysLinks(b.systems)}
        <div class="row">
          ${running ? `<button class="btn run" data-stop>■ 停止 <span data-countdown>${fmt(timerLeft())}</span></button>`
                    : `<button class="btn" data-start="${uid}" ${state.timer ? "disabled" : ""}>▶ 开始 ${unitMinutes(uid)} 分钟</button>`}
        </div></div>
      <button class="check ${on ? "on" : ""}" data-unit="${uid}" aria-pressed="${!!on}" aria-label="完成 ${esc(u.title)}">✓</button></div>`;
  }

  function renderDay() {
    const d = new Date(), k = today(), min = d.getHours() * 60 + d.getMinutes();
    const cur = blockAt(min), n = doneCount(k);
    let nowCard = "";
    if (state.timer) {
      const u = unitOf(state.timer.unit), s = timerLeft();
      nowCard = `<section class="now timer" aria-live="off">${ring(1 - s / (state.timer.total || 2700))}
        <div><div class="label">计时中 · 时间是上限，数字是下限</div>
        <div class="what">${u.no} ${esc(u.title)}</div>
        <div class="small">保底：${esc(u.quota)}。做完了可以继续做同一件事，直到闹钟响。</div></div>
        <div class="left">还剩<b data-countdown>${fmt(s)}</b><button class="link" data-stop>提前停止</button></div></section>`;
    } else if (cur && cur.steps) {
      const st = stepAt(cur, min) || cur.steps[0], left = remaining(st, min);
      nowCard = `<section class="now" aria-live="polite">
        <div><div class="label">现在 · ${st.start}–${st.end} · ${esc(cur.title)}</div>
        <div class="what">${esc(st.title)}</div>
        <div class="small">${esc(st.quota)}</div></div>
        <div class="left">这一步还剩<b>${left} 分钟</b></div></section>`;
    } else if (cur) {
      const u = cur.unit ? unitOf(cur.unit) : cur;
      const left = remaining(cur, min), total = (toMin(cur.end) - toMin(cur.start) + 1440) % 1440 || 1440;
      const nf = u.next?.first || u.first;
      nowCard = `<section class="now ${cur.rest ? "rest" : ""}" aria-live="polite">
        ${cur.unit ? ring(1 - left / total) : ""}
        <div><div class="label">现在 · ${cur.start}–${cur.end}</div>
        <div class="what">${cur.no ? cur.no + " " : ""}${esc(cur.title)}</div>
        ${cur.unit ? `${u.plan ? `<div class="small"><b>今天：</b>${esc(u.plan)}</div>` : ""}<div class="small">第一步：${esc(nf)}</div>` : cur.note ? `<div class="small">${esc(cur.note)}</div>` : ""}
        ${cur.unit && !day(k).done[cur.unit] ? `<button class="btn primary go" data-start="${cur.unit}">▶ 开始 ${unitMinutes(cur.unit)} 分钟</button>` : ""}</div>
        <div class="left">这一段还剩<b>${left} 分钟</b></div></section>`;
    }
    const items = C.schedule.map(b => {
      const on = b.unit && day(k).done[b.unit];
      const cls = ["tl", b.unit && "unit", b.rest && "rest", on && "done", b === cur && "cur"].filter(Boolean).join(" ");
      const body = b.unit ? unitCard(b, k)
        : `<div class="t-title">${esc(b.title)}${b.rest ? ` <span class="badge lv-rest">休息</span>` : ""}</div>
           ${b.note ? `<div class="quota">${esc(b.note)}</div>` : ""}${b.steps ? stepsHtml(b, b === cur ? stepAt(b, min) : null) : ""}${sysLinks(b.systems)}`;
      return `<li class="${cls}"><div class="time">${b.start}–${b.end}</div><div class="body">${body}</div></li>`;
    }).join("");
    app.innerHTML = `<h1>我的一天</h1>
      <p class="sub">${d.getMonth() + 1} 月 ${d.getDate()} 日 · 周${WEEK[d.getDay()]} · 今天完成 ${n}/${UNITS.length} 个单位
        ${d.getHours() >= 21 ? ` · <a href="#review">去复盘 →</a>` : ""}</p>
      ${nowCard}<ol class="timeline">${items}</ol>
      <section class="rules"><h2>三条红线</h2><ol>
        <li><b>闹钟响了就停。</b>没干完也停，写下卡在哪和下次第一步。</li>
        <li><b>连续两个 45 分钟后，彻底歇 30 分钟。</b>离开屏幕。</li>
        <li><b>新想法先放 48 小时。</b>要加一件，先划掉一件。<a href="#review">放进冷却区 →</a></li>
      </ol><p class="small">平时埋头干，规则周日再改。漏了不补，第二天照常。</p></section>`;
    bindDay(k);
  }

  function bindDay(k) {
    const on = (sel, fn) => app.querySelectorAll(sel).forEach(el => el.onclick = () => fn(el));
    on(".check", btn => { const dd = day(k); dd.done[btn.dataset.unit] = !dd.done[btn.dataset.unit]; save(); renderDay(); });
    on("[data-start]", b => startTimer(b.dataset.start));
    on("[data-stop]", () => stopTimer(true));
    on("[data-clearnext]", b => { if (state.units[b.dataset.clearnext]) state.units[b.dataset.clearnext].next = null; save(); renderDay(); });
  }

  // ---------- 定量 ----------
  const lastDays = n => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return keyOf(d); });
  const num = v => v === "" || v == null ? null : Number(v);
  function metricInfo(m) {
    const rows = Object.keys(state.days).sort().map(k => ({ k, v: state.days[k][m.key] })).filter(r => r.v != null && r.v !== "");
    if (m.sum) { const t = rows.reduce((s, r) => s + Number(r.v), 0); return { text: m.total ? `${m.totalLabel} ${t}/${m.total}` : `累计 ${t} ${m.suffix}`, pct: m.total ? t / m.total : null }; }
    if (m.latest) { const v = rows.length ? Math.max(...rows.map(r => Number(r.v))) : m.base; return { text: `${m.totalLabel} ${v}/${m.total}`, pct: v / m.total }; }
    if (m.trend) { const last = rows.slice(-7).map(r => r.v + m.suffix); return { text: last.length ? `最近 ${last.length} 次：${last.join(" · ")}${m.target ? `（目标 ${m.target}%）` : ""}` : "还没有记录", pct: null }; }
    return { text: "", pct: null };
  }
  let editingQ = null;
  function morning() {
    const b = C.schedule.find(x => x.steps);
    if (!b) return "";
    return `<div class="tablebox"><table class="mt"><thead><tr><th>时间</th><th>类别</th><th>放什么</th><th>定量</th></tr></thead><tbody>
      ${b.steps.map(s => `<tr><td>${s.start}–${s.end}</td><td><b>${esc(s.title)}</b></td><td>${esc(s.what)}</td><td>${esc(s.quota)}</td></tr>`).join("")}
      </tbody></table></div><p class="small">顺序固定 ①→②→③。感悟白天随时记，早上统一搬。</p>`;
  }
  function renderQuota() {
    const k = today(), dd = day(k), sun = isSunday();
    const cards = UNITS.map(b => {
      const uid = b.unit, u = unitOf(uid), o = state.units[uid] || {}, log = (o.log || []).slice().reverse();
      const week = lastDays(7).filter(x => state.days[x]?.done?.[uid]).length;
      const metrics = (u.metrics || []).map(m => {
        const info = metricInfo(m);
        return `<div class="metric"><label>${m.label}<span class="inline"><input type="number" min="0" data-metric="${m.key}" value="${dd[m.key] ?? ""}" placeholder="${m.latest ? "例如 " + (metricInfo(m).text.match(/\d+/)?.[0] || "") : ""}">${m.suffix ? `<span>${m.suffix}</span>` : ""}</span></label>
          <div class="small">${esc(info.text)}</div>${info.pct != null ? `<div class="bar green"><i style="width:${Math.min(100, info.pct * 100)}%"></i></div>` : ""}</div>`;
      }).join("");
      const edit = editingQ === uid ? `<div class="edit qedit" data-qedit="${uid}">
          <label>保底量（明确数字）<input type="text" data-k="quota" value="${esc(u.quota)}"></label>
          <label>范围（还没定死就写个范围；定死了就清空）<input type="text" data-k="range" value="${esc(u.range)}"></label>
          <label>熟练度<select data-k="level">${LEVELS.map(l => `<option ${l === u.level ? "selected" : ""}>${l}</option>`).join("")}</select></label>
          <label>为什么改（一句话）<input type="text" data-k="why" placeholder="例如：连续 4 天提前完成"></label>
          <div class="row"><button class="btn primary" data-qsave="${uid}">保存</button><button class="btn" data-qcancel>取消</button></div></div>` : "";
      return `<section class="qcard" id="q-${uid}">
        <div class="qhead"><div class="t-title">${u.no} ${esc(u.title)}
          <span class="badge ${levelCls(u.level)}">${esc(u.level)}</span>
          <span class="badge ${u.range ? "lv-try" : "lv-fix"}">${u.range ? "试行中" : "已确定"}</span></div>
          <div class="small">${b.start}–${b.end} · ${keptDays(uid) ? `已坚持 ${keptDays(uid)} 天` : "刚开始"} · 近 7 天完成 ${week}/7</div></div>
        <dl class="facts big">${u.plan ? `<dt>今天</dt><dd class="plan">${esc(u.plan)}</dd>` : ""}<dt>保底</dt><dd><b>${esc(u.quota)}</b></dd>
          ${u.range ? `<dt>范围</dt><dd>${esc(u.range)}</dd>` : ""}</dl>
        ${editingQ === uid ? edit : `<button class="link" data-qedit-open="${uid}">改保底量 / 范围 / 熟练度</button>`}
        <label class="first">第一步（随时改，下次照着做）<input type="text" data-first="${uid}" value="${esc(u.first)}"></label>
        ${metrics ? `<div class="metrics">${metrics}</div>` : ""}
        ${log.length ? `<details class="qlog"><summary>调整记录（${log.length}）</summary><ul>${log.map(l => `<li><span class="small">${l.date}</span> ${esc(l.what)}${l.why ? `<div class="small">原因：${esc(l.why)}</div>` : ""}</li>`).join("")}</ul></details>` : ""}
      </section>`;
    }).join("");
    app.innerHTML = `<h1>定量</h1>
      <p class="sub">每块干多少。能定的写死，定不了的先给个范围，用着再收紧。今天的数据也在这里记。</p>
      <div class="banner ${sun ? "sun" : ""}">${sun ? "<b>今天周日：可以改规则。</b>每块最多改一处，改完写一句原因。"
        : "<b>第一步随时改；保底量、范围、熟练度最好留到周日改。</b>真要改也行，写一句原因。"}</div>
      <h2>早间 7:30–8:30 · 提醒事项三类</h2>${morning()}
      <h2>45 分钟单位</h2>
      <div class="qgrid">${cards}</div>
      <h2>以后再定量 <span class="small">（先放着，别忘了）</span></h2>
      <ul class="later">${(C.later || []).map(l => `<li><b>${esc(l.title)}</b><div>${esc(l.what)}</div><div class="small">什么时候：${esc(l.when)}</div></li>`).join("")}</ul>`;
    bindQuota(k);
  }
  function bindQuota(k) {
    const on = (sel, fn) => app.querySelectorAll(sel).forEach(el => el.onclick = () => fn(el));
    app.querySelectorAll("[data-metric]").forEach(i => i.onchange = () => { day(k)[i.dataset.metric] = num(i.value); save(); toast("已记下"); renderQuota(); });
    app.querySelectorAll("[data-first]").forEach(i => i.onchange = () => {
      const uid = i.dataset.first, v = i.value.trim(), o = (state.units[uid] ||= {});
      if (!v) { i.value = unitOf(uid).first; return; }
      o.first = v; save(); toast("第一步已更新");
    });
    on("[data-qedit-open]", b => { editingQ = b.dataset.qeditOpen; renderQuota(); document.querySelector(`#q-${editingQ} input`)?.focus(); });
    on("[data-qcancel]", () => { editingQ = null; renderQuota(); });
    on("[data-qsave]", b => {
      const uid = b.dataset.qsave, box = app.querySelector(`[data-qedit="${uid}"]`), u = unitOf(uid), o = (state.units[uid] ||= {});
      const val = key => box.querySelector(`[data-k="${key}"]`).value.trim();
      const why = val("why"), changes = [];
      [["quota", "保底"], ["range", "范围"], ["level", "熟练度"]].forEach(([key, name]) => {
        const v = val(key); if (key === "quota" && !v) return;
        if ((u[key] || "") !== v) { changes.push(`${name}：${u[key] || "（无）"} → ${v || "（无，已确定）"}`); o[key] = v; }
      });
      if (changes.length) { (o.log ||= []).push({ date: today(), what: changes.join("；"), why }); save(); toast("已改，记进调整记录"); }
      editingQ = null; renderQuota();
    });
  }

  // ---------- 复盘 ----------
  const jr = k => (state.journal[k] ||= {});
  function aiText(k) {
    const d = new Date(), dd = day(k), j = jr(k);
    const lines = [`【时间账本 · ${d.getMonth() + 1}月${d.getDate()}日 周${WEEK[d.getDay()]} · 今晚复盘】`, `完成 ${doneCount(k)}/${UNITS.length} 个单位`, ""];
    UNITS.forEach(b => {
      const u = unitOf(b.unit), week = lastDays(7).filter(x => state.days[x]?.done?.[b.unit]).length;
      const data = (u.metrics || []).filter(m => dd[m.key] != null).map(m => `${m.label} ${dd[m.key]}${m.suffix}`).join("，");
      lines.push(`${u.no} ${u.title}：${dd.done[b.unit] ? "✓ 完成" : "✗ 没完成"}｜${u.plan ? `今天 ${u.plan}｜` : ""}保底 ${u.quota}${u.range ? `（范围：${u.range}）` : ""}｜${u.level}｜近7天 ${week}/7${data ? `｜今天 ${data}` : ""}`);
      if (u.next && (u.next.stuck || u.next.first) && u.next.at === k) lines.push(`   卡在：${u.next.stuck || "—"}；下次第一步：${u.next.first || "—"}`);
    });
    lines.push("", "我的想法：", j.text?.trim() || "（今天没写，直接看数据）", "",
      "请帮我：1）用几句话看看今天的执行情况；2）指出一个可以改进的地方；3）如果某块定量需要调整，只建议一处，我周日再改。");
    return lines.join("\n");
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); t.remove(); return ok; }
  }
  function renderReview() {
    const d = new Date(), k = today(), j = jr(k);
    const past = Object.keys(state.journal).filter(x => x !== k && (state.journal[x].text || state.journal[x].ai)).sort().reverse().slice(0, 30);
    const now = Date.now(), H48 = 48 * 3600000;
    const ideas = state.ideas.filter(i => !i.status).map(i => {
      const left = i.at + H48 - now, ready = left <= 0;
      return `<li class="idea ${ready ? "ready" : ""}"><div class="itext">${esc(i.text)}
        <div class="small">${ready ? "满 48 小时了。还想做：先划掉一件，再加进来。" : `还要放 ${Math.ceil(left / 3600000)} 小时`}</div></div>
        <button class="link" data-giveup="${i.at}">删掉</button></li>`;
    }).join("");
    app.innerHTML = `<h1>复盘</h1>
      <p class="sub">${d.getMonth() + 1} 月 ${d.getDate()} 日 · 周${WEEK[d.getDay()]} · 想到哪说到哪，不想写也行。</p>
      <label class="jbox">今天的想法（可不写）
        <textarea id="jText" rows="5" placeholder="哪里顺、哪里卡、有什么感悟……">${esc(j.text)}</textarea></label>
      <div class="row"><button class="btn primary" id="copyAI">📋 复制今晚复盘，发给 AI</button>
        <span class="small">会带上今天的完成情况、卡点和定量数据。</span></div>
      <label class="jbox">和 AI 聊完的结论（可不写）
        <textarea id="jAI" rows="3" placeholder="把 AI 说的、你认同的一两句贴在这里">${esc(j.ai)}</textarea></label>
      <h2>以前的复盘</h2>
      ${past.length ? `<ul class="jlist">${past.map(x => { const e = state.journal[x], dt = new Date(x + "T00:00");
        return `<li><div class="small">${x.slice(5).replace("-", "/")} 周${WEEK[dt.getDay()]} · 完成 ${doneCount(x)}/${UNITS.length}</div>
          ${e.text ? `<p>${esc(e.text)}</p>` : ""}${e.ai ? `<p class="ai">AI：${esc(e.ai)}</p>` : ""}</li>`; }).join("")}</ul>`
        : `<div class="empty small">写过的复盘会按日期列在这里，攒一段时间再回头找规律。</div>`}
      <h2>想法冷却区</h2>
      <p class="small">新想法先放这里，不马上做。48 小时后还想做，先划掉一件再加。</p>
      <form class="ideaform" id="ideaForm"><input type="text" name="idea" placeholder="写下新想法…" aria-label="新想法"><button class="btn">放进去</button></form>
      ${ideas ? `<ul class="ideas">${ideas}</ul>` : ""}`;
    const t1 = document.getElementById("jText"), t2 = document.getElementById("jAI");
    t1.oninput = () => { j.text = t1.value; save(); };
    t2.oninput = () => { j.ai = t2.value; save(); };
    document.getElementById("copyAI").onclick = async () => toast(await copy(aiText(k)) ? "已复制，粘贴给 AI 就行" : "复制失败，请手动选择");
    document.getElementById("ideaForm").onsubmit = e => {
      e.preventDefault(); const v = e.target.idea.value.trim(); if (!v) return;
      state.ideas.push({ text: v, at: Date.now() }); save(); renderReview(); toast("已放进冷却区");
    };
    app.querySelectorAll("[data-giveup]").forEach(b => b.onclick = () => { state.ideas.find(i => String(i.at) === b.dataset.giveup).status = "删掉"; save(); renderReview(); });
  }

  // ---------- 路由与备份 ----------
  const views = { day: renderDay, quota: renderQuota, review: renderReview };
  function route() {
    const tab = views[location.hash.slice(1)] ? location.hash.slice(1) : "day";
    document.querySelectorAll(".tabs a").forEach(a => a.classList.toggle("on", a.dataset.tab === tab));
    editingQ = null; views[tab](); window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  setInterval(() => {
    const busy = document.querySelector(".modal") || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
    if ((location.hash || "#day") === "#day" && !busy) renderDay();
  }, 30000);
  if (state.timer && timerLeft() === 0) setTimeout(tick, 300);

  document.getElementById("exportBtn").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    a.download = `时间账本-备份-${today()}.json`; a.click();
  };
  document.getElementById("importInput").onchange = async e => {
    try { const s = JSON.parse(await e.target.files[0].text()); if (!s.days) throw 0; state = Object.assign(DEFAULTS(), s); save(); route(); toast("已导入"); }
    catch { toast("文件格式不对"); }
  };
  route();
})();
