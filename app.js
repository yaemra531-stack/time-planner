(() => {
  const C = window.CONFIG;
  const KEY = "timeLedger.v1";
  const UNITS = C.schedule.filter(b => b.unit);
  const ALL_SECS = C.books.flatMap(b => b.sections);
  let state = load();
  const app = document.getElementById("app");

  function load() {
    try { return Object.assign({ days: {}, methods: {} }, JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch { return { days: {}, methods: {} }; }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  const pad = n => String(n).padStart(2, "0");
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => keyOf(new Date());
  const day = k => (state.days[k] ||= { done: {} });
  const toMin = s => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const WEEK = "日一二三四五六";

  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
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
        stroke-dasharray="${c * pct} ${c}" transform="rotate(-90 28 28)"/></svg>`;
  }

  function sysLinks(ids = []) {
    if (!ids.length) return "";
    return `<div class="sys">${ids.map(id => {
      const s = C.systems[id];
      return s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>` : `<span>${esc(s.name)}</span>`;
    }).join("")}</div>`;
  }

  // ---------- 我的一天 ----------
  function renderDay() {
    const d = new Date(), k = today(), min = d.getHours() * 60 + d.getMinutes();
    const cur = blockAt(min), n = doneCount(k);
    let nowCard = "";
    if (cur) {
      const left = remaining(cur, min), total = (toMin(cur.end) - toMin(cur.start) + 1440) % 1440 || 1440;
      nowCard = `<section class="now" aria-live="polite">
        ${cur.unit ? ring(1 - left / total) : ""}
        <div><div class="label">现在 · ${cur.start}–${cur.end}</div>
        <div class="what">${cur.no ? cur.no + " " : ""}${esc(cur.title)}</div>
        ${cur.quota ? `<div class="small">${esc(cur.quota)}</div>` : ""}</div>
        <div class="left">还剩<b>${left} 分钟</b></div></section>`;
    }
    const items = C.schedule.map(b => {
      const on = b.unit && day(k).done[b.unit];
      const cls = ["tl", b.unit && "unit", on && "done", b === cur && "cur"].filter(Boolean).join(" ");
      const inner = `<div class="t-title">${b.no ? b.no + " " : ""}${esc(b.title)}</div>
        ${b.quota ? `<div class="quota">${esc(b.quota)}</div>` : ""}${sysLinks(b.systems)}`;
      return `<li class="${cls}"><div class="time">${b.start}–${b.end}</div>
        <div class="body">${b.unit ? `<div class="unitrow"><div style="flex:1;min-width:0">${inner}</div>
        <button class="check ${on ? "on" : ""}" data-unit="${b.unit}" aria-pressed="${!!on}" aria-label="完成 ${esc(b.title)}">✓</button></div>` : inner}</div></li>`;
    }).join("");
    app.innerHTML = `<h1>我的一天</h1>
      <p class="sub">${d.getMonth() + 1} 月 ${d.getDate()} 日 · 周${WEEK[d.getDay()]} · 今天完成 ${n}/${UNITS.length} 个单位</p>
      ${nowCard}<ol class="timeline">${items}</ol>
      <p class="rule"><b>两条规则：</b>每天在单位 ⑦ 里记一行数据；漏了不补，第二天照常。</p>`;
    app.querySelectorAll(".check").forEach(btn => btn.onclick = () => {
      const dd = day(k); dd.done[btn.dataset.unit] = !dd.done[btn.dataset.unit]; save(); renderDay();
    });
  }

  // ---------- 方法库 ----------
  const FIELDS = [["core", "核心观点"], ["how", "具体方法和步骤"], ["practice", "我打算怎么练"], ["quota", "每天的固定量"]];
  let openSec = null;
  function renderMethods() {
    const doneAll = ALL_SECS.filter(s => state.methods[s.id]?.done).length;
    app.innerHTML = `<h1>方法库</h1>
      <p class="sub">先把两本书的方法过一遍，每节整理成一张方法卡。已过 ${doneAll}/${ALL_SECS.length} 节。</p>
      <div class="books">${C.books.map(book => {
        const done = book.sections.filter(s => state.methods[s.id]?.done).length;
        return `<section class="book"><h3>${esc(book.name)}</h3>
          <p class="idea">${esc(book.idea)}</p>
          <div class="small">单位 ${book.unit} · 已过 ${done}/${book.sections.length}</div>
          <div class="bar green"><i style="width:${done / book.sections.length * 100}%"></i></div>
          <ul class="secs">${book.sections.map(s => {
            const m = state.methods[s.id] || {}, filled = FIELDS.some(([f]) => m[f]);
            const open = openSec === s.id;
            return `<li class="sec ${m.done ? "done" : ""} ${filled ? "filled" : ""}">
              <button class="head" data-sec="${s.id}" aria-expanded="${open}"><span class="dot" aria-hidden="true"></span>
              <span>${esc(s.title)}</span><span class="st">${m.done ? "已过" : filled ? "整理中" : "未开始"}</span></button>
              ${open ? `<div class="card">${FIELDS.map(([f, l]) => `<label>${l}<textarea data-f="${f}" data-id="${s.id}">${esc(m[f])}</textarea></label>`).join("")}
                <div><button class="btn ${m.done ? "ok" : "primary"}" data-done="${s.id}">${m.done ? "✓ 已过，点击撤销" : "标记为已过"}</button></div></div>` : ""}
            </li>`;
          }).join("")}</ul></section>`;
      }).join("")}</div>`;
    app.querySelectorAll("button.head").forEach(b => b.onclick = () => { openSec = openSec === b.dataset.sec ? null : b.dataset.sec; renderMethods(); });
    app.querySelectorAll("textarea[data-f]").forEach(t => t.oninput = () => {
      (state.methods[t.dataset.id] ||= {})[t.dataset.f] = t.value; save();
    });
    app.querySelectorAll("[data-done]").forEach(b => b.onclick = () => {
      const m = (state.methods[b.dataset.done] ||= {}); m.done = !m.done; save(); renderMethods();
    });
  }

  // ---------- 进度 ----------
  function streak() {
    let n = 0; const d = new Date();
    if (!doneCount(keyOf(d))) d.setDate(d.getDate() - 1);
    while (doneCount(keyOf(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function chart(rows) {
    const pts = rows.filter(r => r.listening != null || r.reading != null).slice(-14);
    if (pts.length < 2) return `<div class="chart"><div class="empty">记满两天的正确率后，这里会出现趋势图。</div></div>`;
    const W = 640, H = 220, L = 40, R = 16, T = 16, B = 32, iw = W - L - R, ih = H - T - B;
    const x = i => L + (pts.length === 1 ? iw / 2 : i * iw / (pts.length - 1));
    const y = v => T + ih - v / 100 * ih;
    const line = (f, color) => {
      const p = pts.map((r, i) => r[f] != null ? [x(i), y(r[f])] : null).filter(Boolean);
      return `<polyline fill="none" stroke="${color}" stroke-width="2.5" points="${p.map(q => q.join(",")).join(" ")}"/>` +
        p.map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="3.5" fill="${color}"/>`).join("");
    };
    const grid = [0, 50, 100].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="12" fill="var(--muted)">${v}</text>`).join("");
    const tgt = C.goals.listeningTarget;
    const labels = pts.map((r, i) => (i === 0 || i === pts.length - 1 || pts.length <= 7) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="12" fill="var(--muted)">${r.k.slice(5)}</text>` : "").join("");
    return `<div class="chart"><div class="legend"><span><i style="background:#5E9FE8"></i>听力</span><span><i style="background:#EAC26B"></i>阅读</span><span><i style="border-top:2px dashed var(--green);height:0"></i>目标 ${tgt}%</span></div>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="听力和阅读正确率趋势">${grid}
      <line x1="${L}" x2="${W - R}" y1="${y(tgt)}" y2="${y(tgt)}" stroke="var(--green)" stroke-dasharray="5 4"/>
      ${line("listening", "#5E9FE8")}${line("reading", "#EAC26B")}${labels}</svg></div>`;
  }
  function renderProgress() {
    const k = today(), t = day(k);
    const rows = Object.keys(state.days).sort().map(kk => ({ k: kk, ...state.days[kk] }));
    const anki = rows.reduce((s, r) => s + (Number(r.anki) || 0), 0);
    const methodsDone = ALL_SECS.filter(s => state.methods[s.id]?.done).length;
    const v = x => x == null || x === "" ? "" : x;
    app.innerHTML = `<h1>进度</h1><p class="sub">每天记一行，要不要延期、离 6.5 还差多少，看数据就知道。</p>
      <div class="stats">
        <div class="stat"><div class="k">连续打卡</div><div class="v">${streak()} <small>天</small></div></div>
        <div class="stat"><div class="k">今天完成</div><div class="v">${doneCount(k)}<small>/${UNITS.length}</small></div></div>
        <div class="stat"><div class="k">真经词汇</div><div class="v">${anki}<small>/${C.goals.ankiTotal}</small></div><div class="bar"><i style="width:${Math.min(100, anki / C.goals.ankiTotal * 100)}%"></i></div></div>
        <div class="stat"><div class="k">方法卡</div><div class="v">${methodsDone}<small>/${ALL_SECS.length}</small></div><div class="bar green"><i style="width:${methodsDone / ALL_SECS.length * 100}%"></i></div></div>
      </div>
      <h2>记录今天</h2>
      <form class="log" id="logForm">
        <label>听力正确率 %<input type="number" min="0" max="100" name="listening" value="${v(t.listening)}" placeholder="例如 82"></label>
        <label>阅读正确率 %<input type="number" min="0" max="100" name="reading" value="${v(t.reading)}" placeholder="例如 75"></label>
        <label>Anki 新词<input type="number" min="0" name="anki" value="${v(t.anki)}" placeholder="${C.goals.ankiDaily}"></label>
        <label class="note">一句话备注<input type="text" name="note" value="${esc(t.note)}" placeholder="今天最大的卡点是…"></label>
        <div class="act"><button class="btn primary" type="submit">保存</button><span class="small">完成单位在“我的一天”里打勾</span></div>
      </form>
      <h2>正确率趋势</h2>${chart(rows)}
      <h2>每日记录</h2>
      ${rows.length ? `<div class="tablebox"><table><thead><tr><th>日期</th><th>完成单位</th><th>听力</th><th>阅读</th><th>Anki</th><th>备注</th></tr></thead><tbody>
        ${rows.slice().reverse().slice(0, 30).map(r => `<tr><td>${r.k}</td><td>${doneCount(r.k)}/${UNITS.length}</td><td>${r.listening != null ? r.listening + "%" : "—"}</td><td>${r.reading != null ? r.reading + "%" : "—"}</td><td>${r.anki ?? "—"}</td><td>${esc(r.note) || "—"}</td></tr>`).join("")}
      </tbody></table></div>` : `<div class="tablebox"><div class="empty">还没有记录。</div></div>`}`;
    document.getElementById("logForm").onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target), num = n => f.get(n) === "" ? null : Number(f.get(n));
      Object.assign(t, { listening: num("listening"), reading: num("reading"), anki: num("anki"), note: f.get("note").trim() });
      save(); renderProgress(); toast("已保存");
    };
  }

  // ---------- 路由与备份 ----------
  const views = { day: renderDay, methods: renderMethods, progress: renderProgress };
  function route() {
    const tab = views[location.hash.slice(1)] ? location.hash.slice(1) : "day";
    document.querySelectorAll(".tabs a").forEach(a => a.classList.toggle("on", a.dataset.tab === tab));
    views[tab](); window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  setInterval(() => { if ((location.hash || "#day") === "#day") renderDay(); }, 30000);

  document.getElementById("exportBtn").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    a.download = `时间账本-备份-${today()}.json`; a.click();
  };
  document.getElementById("importInput").onchange = async e => {
    try { const s = JSON.parse(await e.target.files[0].text()); if (!s.days) throw 0; state = Object.assign({ days: {}, methods: {} }, s); save(); route(); toast("已导入"); }
    catch { toast("文件格式不对"); }
  };
  route();
})();
