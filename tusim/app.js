// Тусим · календарь в Telegram
const API = "https://gqlslscpxehonlyajssy.supabase.co/functions/v1/tusim-bot?api=calendar";
const API_CREATE = API.replace("api=calendar", "api=create");
const API_DELETE = API.replace("api=calendar", "api=delete");
const API_UPDATE = API.replace("api=calendar", "api=update");
const API_STATUS = API.replace("api=calendar", "api=status");
const BOT = "@calasisbot";
const DAY_START = 10, DAY_END = 23, MIN_FREE = 60;

const WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WD_FULL = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const CAT = { meet: "Встреча", game: "Игры", call: "Созвон", trip: "Поездка", other: "Другое" };
const RSVP = { going: "Иду", maybe: "Возможно", pending: "Ждёт ответа", declined: "Не смогу" };
const RSVP_COLOR = { going: "#FFFFFF", maybe: "#A1A1AA", pending: "#3F3F46", declined: "#27272A" };
const STATUS = { free: "свободен", busy: "занят", travel: "в поездке", online: "онлайн" };
const STATUS_COLOR = { free: "var(--free)", online: "var(--online)", busy: "var(--busy)", travel: "var(--travel)" };

const svg = (d) => `<svg viewBox="0 0 24 24">${d}</svg>`;
const ICON = {
  left: svg('<path d="M15 6l-6 6 6 6"/>'),
  right: svg('<path d="M9 6l6 6-6 6"/>'),
  pin: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  cal: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  link: svg('<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'),
  wifi: svg('<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r=".8"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
  edit: svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
};
const CAT_ICON = {
  meet: svg('<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M21 19v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8"/>'),
  game: svg('<rect x="2" y="7" width="20" height="10" rx="5"/><path d="M7 10v4M5 12h4"/><path d="M16 11h.01M18 13h.01"/>'),
  call: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  trip: svg('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>'),
  other: svg('<path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z"/>'),
};

const tg = window.Telegram && window.Telegram.WebApp;
const $app = document.getElementById("app");
const state = { view: "month", cursor: dayStart(new Date()), sel: dayStart(new Date()), onlyMine: false, data: null, loading: true, animate: true };
const cache = new Map();

// ---------- даты ----------
function dayStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function key(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function same(a, b) { return key(a) === key(b); }
function wdIdx(d) { return (d.getDay() + 6) % 7; }
function monday(d) { return addDays(dayStart(d), -wdIdx(d)); }
function at(d, h) { const x = dayStart(d); x.setHours(h); return x; }
function hm(d) { return new Date(d).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); }
function longDay(d) { return `${WD_FULL[wdIdx(d)]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; }
function shortDay(d) { return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; }

function relDay(d) {
  const diff = Math.round((dayStart(d) - dayStart(new Date())) / 864e5);
  return diff === 0 ? "Сегодня" : diff === 1 ? "Завтра" : diff === -1 ? "Вчера" : null;
}

function dur(ms) {
  const m = Math.max(1, Math.round(ms / 6e4)), h = Math.floor(m / 60), r = m % 60;
  if (h >= 24) { const d = Math.floor(h / 24); return `${d} ${plural(d, "день", "дня", "дней")}`; }
  return h ? (r ? `${h} ч ${r} мин` : `${h} ч`) : `${r} мин`;
}

function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many;
}

function range() {
  if (state.view === "week") { const m = monday(state.cursor); return [m, addDays(m, 7)]; }
  const first = new Date(state.cursor.getFullYear(), state.cursor.getMonth(), 1);
  const start = monday(first);
  return [start, addDays(start, 42)];
}

// ---------- утилиты ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const haptic = () => tg && tg.HapticFeedback && tg.HapticFeedback.selectionChanged();
const colorOf = (e) => esc(e.author?.color || "#FFFFFF");
const nameOf = (p) => (p?.display_name || p?.username || "").trim();
const firstName = (p) => nameOf(p).split(" ")[0];
const sheetOpen = () => document.body.classList.contains("open");

function avatar(p, cls = "", style = "") {
  if (!p) return "";
  const letter = esc((nameOf(p)[0] || "?").toUpperCase());
  return `<div class="av ${cls}" style="background:${esc(p.color || "#60A5FA")};${style}">${letter}</div>`;
}

// ---------- данные ----------
async function load(from, to) {
  const k = from.toISOString() + to.toISOString();
  if (cache.has(k)) return cache.get(k);
  const res = await fetch(`${API}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`, {
    headers: { "x-init-data": tg.initData },
  });
  if (res.status === 403) throw Object.assign(new Error("not linked"), { code: "not_linked" });
  if (res.status === 401) throw Object.assign(new Error("unauthorized"), { code: "unauthorized" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const byId = new Map(data.profiles.map((p) => [p.id, p]));
  for (const e of data.events) {
    e.start = new Date(e.starts_at);
    e.end = new Date(e.ends_at);
    e.my = e.participants.find((x) => x.user_id === data.me.id && x.rsvp !== "declined");
    e.author = byId.get(e.created_by);
  }
  data.byId = byId;
  cache.set(k, data);
  return data;
}

function eventsByDay(data) {
  const map = new Map();
  for (const e of data.events) {
    if (state.onlyMine && !e.my) continue;
    if (!(e.end > e.start)) continue;
    for (let d = dayStart(e.start); d < e.end; d = addDays(d, 1)) {
      const k = key(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(e);
    }
  }
  for (const list of map.values()) list.sort((a, b) => a.start - b.start);
  return map;
}

function freeWindows(data, day) {
  const busy = [];
  for (const e of data.events) if (e.my && e.my.rsvp !== "pending") busy.push([+e.start, +e.end]);
  for (const s of data.slots) {
    if (s.user_id === data.me.id && s.kind !== "free") busy.push([Date.parse(s.starts_at), Date.parse(s.ends_at)]);
  }
  busy.sort((a, b) => a[0] - b[0]);
  const end = +at(day, DAY_END);
  let cur = Math.max(+at(day, DAY_START), Math.ceil(Date.now() / 9e5) * 9e5);
  const out = [];
  for (const [s, f] of busy) {
    if (Math.min(s, end) - cur >= MIN_FREE * 6e4) out.push([cur, Math.min(s, end)]);
    cur = Math.max(cur, f);
  }
  if (end - cur >= MIN_FREE * 6e4) out.push([cur, end]);
  return out;
}

function nextEvent(data) {
  const now = Date.now();
  return data.events
    .filter((e) => e.my && e.my.rsvp !== "pending" && +e.end > now)
    .sort((a, b) => a.start - b.start)[0];
}

// ---------- отрисовка ----------
function header(data) {
  const name = data ? esc(firstName(data.byId.get(data.me.id))) : "";
  const h = new Date().getHours();
  const hello = h < 5 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер";
  let title;
  if (state.view === "week") {
    const m = monday(state.cursor), s = addDays(m, 6);
    title = m.getMonth() === s.getMonth()
      ? `${m.getDate()}–${s.getDate()} <span>${MONTHS_GEN[s.getMonth()].slice(0, 3)}</span>`
      : `${m.getDate()} ${MONTHS_GEN[m.getMonth()].slice(0, 3)} – ${s.getDate()} <span>${MONTHS_GEN[s.getMonth()].slice(0, 3)}</span>`;
  } else {
    title = `${MONTHS[state.cursor.getMonth()]} <span>${state.cursor.getFullYear()}</span>`;
  }
  return `<header class="top">
    <div><div class="eyebrow">${hello}${name ? `, <b>${name}</b>` : ""}</div><h1>${title}</h1></div>
    <div class="nav">
      <button class="icon-btn" data-act="prev" aria-label="Назад">${ICON.left}</button>
      <button class="pill" data-act="today">Сегодня</button>
      <button class="icon-btn" data-act="next" aria-label="Вперёд">${ICON.right}</button>
      ${data ? `<button class="pill add desk" data-act="new">${ICON.plus}Событие</button>` : ""}
    </div>
  </header>`;
}

function renderNext(data) {
  const e = data && nextEvent(data);
  if (!e) return "";
  const now = Date.now();
  const live = +e.start <= now;
  const label = live ? "Идёт сейчас" : relDay(e.start) ? `${relDay(e.start)} · ${hm(e.start)}` : `${shortDay(e.start)} · ${hm(e.start)}`;
  const cd = live ? `ещё ${dur(+e.end - now)}` : `через ${dur(+e.start - now)}`;
  const going = e.participants.filter((p) => p.rsvp === "going").length;
  return `<button class="next" style="--c:${colorOf(e)}" data-act="event" data-id="${e.id}">
    <div class="k"><i></i>${live ? "Сейчас" : "Ближайшее"}</div>
    <span class="cd">${cd}</span>
    <div class="t">${esc(e.title)}</div>
    <div class="m"><span>${ICON.clock}${label}</span>${e.location ? `<span>${ICON.pin}${esc(e.location)}</span>` : ""}<span>${ICON.user}${going}</span></div>
  </button>`;
}

function renderFriends(data) {
  if (!data) return `<div class="friends" style="height:84px"></div>`;
  const ppl = [data.byId.get(data.me.id), ...data.profiles.filter((p) => p.id !== data.me.id)].filter(Boolean);
  const free = ppl.filter((p) => p.status === "free" || p.status === "online").length;
  return `<div class="sec-h"><h2>Компания</h2><em><b>${free}</b> из ${ppl.length} свободны</em></div>
  <div class="friends">${ppl.map((p) => {
    const me = p.id === data.me.id;
    const tag = me ? "button" : "div";
    return `<${tag} class="friend ${me ? "me" : ""}" ${me ? `data-act="status"` : ""} title="${esc(p.status_note || "")}">
    ${avatar(p, "ring", `--ring:${STATUS_COLOR[p.status] || "transparent"}`)}
    <span class="nm">${me ? "Вы" : esc(firstName(p))}</span>
    <span class="st">${esc(STATUS[p.status] || (me ? "статус" : ""))}</span></${tag}>`;
  }).join("")}</div>`;
}

function dayCell(d, byDay, opts = {}) {
  const list = byDay.get(key(d)) || [];
  const dots = list.slice(0, 3).map((e) => `<i class="${e.my ? "mine" : ""}" style="--c:${colorOf(e)}"></i>`).join("");
  // На широком экране вместо точек — названия событий
  const max = state.view === "week" ? 6 : 3;
  const shown = list.length > max ? max - 1 : max;
  const evs = list.slice(0, shown).map((e) => `<em class="${e.my ? "mine" : ""}" style="--c:${colorOf(e)}">${esc(e.title)}</em>`).join("")
    + (list.length > shown ? `<em class="more">ещё ${list.length - shown}</em>` : "");
  const cls = ["cell",
    opts.out ? "out" : "", wdIdx(d) > 4 ? "wkend" : "", dayStart(d) < dayStart(new Date()) ? "past" : "",
    same(d, new Date()) ? "today" : "", same(d, state.sel) ? "sel" : ""].join(" ");
  return `<button class="${cls}" data-act="day" data-d="${key(d)}">${opts.label || ""}<span>${d.getDate()}</span><div class="dots">${dots}</div><div class="evs">${evs}</div></button>`;
}

function renderCalendar(byDay) {
  if (state.view === "week") {
    const m = monday(state.cursor);
    let cells = "";
    for (let i = 0; i < 7; i++) cells += dayCell(addDays(m, i), byDay, { label: `<small>${WD[i]}</small>` });
    return `<div class="panel"><div class="week">${cells}</div></div>`;
  }
  const [start] = range();
  const month = state.cursor.getMonth();
  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    if (i === 35 && d.getMonth() !== month) break; // не рисуем лишнюю шестую неделю
    cells += dayCell(d, byDay, { out: d.getMonth() !== month });
  }
  return `<div class="panel"><div class="wd">${WD.map((w) => `<div>${w}</div>`).join("")}</div><div class="grid">${cells}</div></div>`;
}

function renderEvent(e, data) {
  const now = Date.now();
  const live = +e.start <= now && +e.end > now;
  const ppl = e.participants.filter((p) => p.rsvp !== "declined");
  const going = e.participants.filter((p) => p.rsvp === "going").length;
  const stack = ppl.slice(0, 5).map((p) => avatar(data.byId.get(p.user_id), `sm ${p.rsvp}`)).join("");
  const badge = live ? `<span class="badge now">Сейчас</span>`
    : e.my ? `<span class="badge ${e.my.rsvp}">${RSVP[e.my.rsvp]}</span>` : "";
  return `<button class="tl-item ${e.my ? "" : "other"} ${live ? "now" : ""}" style="--c:${colorOf(e)}" data-act="event" data-id="${e.id}">
    <div class="tl-time">${hm(e.start)}<small>${hm(e.end)}</small></div>
    <div class="tl-rail"><i></i></div>
    <div class="tl-card">
      <div class="cat">${CAT_ICON[e.category] || CAT_ICON.other}${CAT[e.category] || ""}</div>
      <div class="title">${esc(e.title)}</div>
      ${e.location ? `<div class="meta">${ICON.pin}${esc(e.location)}</div>` : ""}
      <div class="foot"><div class="stack">${stack}<em>${going} ${plural(going, "идёт", "идут", "идут")}</em></div>${badge}</div>
    </div></button>`;
}

function renderAgenda(byDay, data) {
  const d = state.sel;
  const rel = relDay(d);
  let html = `<div class="agenda"><div class="agenda-h"><h2>${rel || longDay(d).split(",")[0]}</h2><span>${rel ? longDay(d) : shortDay(d)}</span></div>`;
  if (state.loading) return html + `<div class="skel"></div><div class="skel"></div></div>`;
  if (dayStart(d) >= dayStart(new Date())) {
    const free = freeWindows(data, d);
    if (free.length) html += `<div class="free">${free.map(([s, f]) => `<b>${ICON.check}${hm(s)}–${hm(f)}</b>`).join("")}</div>`;
  }
  const list = byDay.get(key(d)) || [];
  if (list.length) return html + list.map((e) => renderEvent(e, data)).join("") + "</div>";
  const future = dayStart(d) >= dayStart(new Date());
  return html + `<div class="empty">${ICON.cal}<b>${future ? "Свободный день" : "Планов не было"}</b>
    ${future ? `<span>Самое время что-нибудь придумать</span><button class="pill" data-act="new">Создать событие</button>` : ""}</div></div>`;
}

function render() {
  const data = state.loading ? null : state.data;
  const byDay = data ? eventsByDay(data) : new Map();
  const anim = state.animate && data ? "in" : "";
  if (data) state.animate = false;
  $app.innerHTML = `
    ${header(data)}
    <div class="layout">
      <div class="col-main">
        <div class="${anim}">${renderNext(data)}</div>
        <div class="toolbar">
          <div class="seg">
            <button class="${state.view === "month" ? "on" : ""}" data-act="view" data-v="month">Месяц</button>
            <button class="${state.view === "week" ? "on" : ""}" data-act="view" data-v="week">Неделя</button>
          </div>
          <button class="chip ${state.onlyMine ? "on" : ""}" data-act="mine">${state.onlyMine ? ICON.check : ""}Только мои</button>
        </div>
        <div class="${anim}">${renderFriends(data)}</div>
        ${renderCalendar(byDay)}
      </div>
      <aside class="col-side"><div class="${anim}">${renderAgenda(byDay, data)}</div></aside>
    </div>
    ${data ? `<button class="fab" data-act="new" aria-label="Создать событие">${ICON.plus}Событие</button>` : ""}
    <div class="spacer" style="height:84px"></div>`;
}

function screen(icon, title, text) {
  $app.innerHTML = `<div class="screen in"><div class="ic">${icon}</div><h2>${title}</h2><p>${text}</p></div>`;
}

// ---------- нижний лист ----------
function openSheet(html) {
  const sheet = document.getElementById("sheet");
  const wasOpen = document.body.classList.contains("open");
  const scroll = sheet.scrollTop;
  document.getElementById("sheet-body").innerHTML = html;
  sheet.scrollTop = wasOpen ? scroll : 0; // при перерисовке формы остаёмся на месте
  document.body.classList.add("open");
  tg.BackButton?.show();
}

function closeSheet() {
  document.body.classList.remove("open");
  tg.BackButton?.hide();
}

function openEvent(id) {
  const data = state.data;
  const e = data && data.events.find((x) => x.id === id);
  if (!e) return;
  closeSheet(); // открываем карточку с начала, даже если до этого была открыта форма
  const oneDay = same(e.start, e.end) || +e.end === +addDays(dayStart(e.start), 1);
  const when = oneDay
    ? `${relDay(e.start) || longDay(e.start)} · ${hm(e.start)}–${hm(e.end)}`
    : `${shortDay(e.start)} ${hm(e.start)} – ${shortDay(e.end)} ${hm(e.end)}`;

  const order = { going: 0, maybe: 1, pending: 2, declined: 3 };
  const ppl = [...e.participants].sort((a, b) => order[a.rsvp] - order[b.rsvp]);
  const count = (r) => ppl.filter((p) => p.rsvp === r).length;
  const total = ppl.length || 1;
  const bar = ["going", "maybe", "pending", "declined"]
    .map((r) => count(r) ? `<i style="width:${(count(r) / total) * 100}%;background:${RSVP_COLOR[r]}"></i>` : "").join("");
  const legend = [["going", "идут"], ["maybe", "возможно"], ["pending", "ждём"], ["declined", "не смогут"]]
    .filter(([r]) => count(r)).map(([r, l]) => `<span style="--c:${RSVP_COLOR[r]}">${count(r)} ${l}</span>`).join("");

  openSheet(`
    <div class="hero" style="--c:${colorOf(e)}">
      <div class="cat">${CAT_ICON[e.category] || CAT_ICON.other}${CAT[e.category] || ""}</div>
      <h3>${esc(e.title)}</h3>
      <div class="row">${ICON.clock}${when} · ${dur(+e.end - +e.start)}</div>
      ${e.location ? `<div class="row">${ICON.pin}${esc(e.location)}</div>` : ""}
    </div>
    ${e.author ? `<div class="author">${avatar(e.author, "sm")}Позвал(а) ${esc(nameOf(e.author))}</div>` : ""}
    ${e.description ? `<div class="sec"><div class="sec-t">Описание</div><div class="desc">${esc(e.description)}</div></div>` : ""}
    <div class="sec"><div class="sec-t"><span>Участники</span><span>${ppl.length}</span></div>
      <div class="bar">${bar}</div><div class="legend">${legend}</div>
      ${ppl.map((p) => {
        const pr = data.byId.get(p.user_id);
        return pr ? `<div class="person">${avatar(pr, `md ${p.rsvp}`)}<div class="name">${p.user_id === data.me.id ? "Вы" : esc(nameOf(pr))}<small>@${esc(pr.username)}</small></div>
          <span class="badge ${p.rsvp}">${RSVP[p.rsvp]}</span></div>` : "";
      }).join("")}
    </div>
    ${canDelete(e) && +e.end > Date.now() ? `<button class="ghost" data-act="edit" data-id="${e.id}">${ICON.edit}Изменить</button>` : ""}
    ${canDelete(e) ? `<button class="danger" data-act="del" data-id="${e.id}">${ICON.trash}Удалить событие</button>` : ""}`);
  haptic();
}

const canDelete = (e) => e.created_by === state.data.me.id || state.data.me.role === "admin";

async function deleteEvent(btn) {
  // Первое нажатие — предупреждение, второе — удаление
  if (!btn.classList.contains("confirm")) {
    btn.classList.add("confirm");
    btn.innerHTML = `${ICON.trash}Точно удалить? Нажмите ещё раз`;
    tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("warning");
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.classList.remove("confirm"); btn.innerHTML = `${ICON.trash}Удалить событие`; }, 4000);
    return;
  }
  clearTimeout(btn._t);
  btn.disabled = true;
  btn.innerHTML = "Удаляю…";
  try {
    const res = await fetch(API_DELETE, {
      method: "POST",
      headers: { "x-init-data": tg.initData, "content-type": "application/json" },
      body: JSON.stringify({ event_id: btn.dataset.id }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error && body.error !== "server" ? body.error : "Не получилось удалить");
    tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("success");
    closeSheet();
    cache.clear();
    toast("Событие удалено");
    refresh();
  } catch (e) {
    tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("error");
    btn.disabled = false;
    btn.classList.remove("confirm");
    btn.innerHTML = `${ICON.trash}${esc(e.message)}`;
  }
}

// ---------- свой статус ----------
let statusDraft = null;

function renderStatus(err = "") {
  openSheet(`<div class="form">
    <h3>Мой статус</h3>
    <div class="lead">Его видит вся компания в календаре и в /friends</div>
    <label>Сейчас я</label>
    <div class="opts">${Object.entries(STATUS).map(([k, v]) => `<button type="button" class="opt ${statusDraft.status === k ? "on" : ""}" data-act="st" data-v="${k}">
      <i class="st-dot" style="background:${STATUS_COLOR[k]}"></i>${v}</button>`).join("")}</div>
    <label>Подпись</label>
    <input name="note" maxlength="80" placeholder="Например: до 18:00 на работе" value="${esc(statusDraft.note)}" autocomplete="off">
    <div class="err">${esc(err)}</div>
    <button type="button" class="submit" data-act="st-save">Сохранить</button>
  </div>`);
}

function openStatus() {
  const me = state.data.byId.get(state.data.me.id);
  statusDraft = { status: me?.status || "free", note: me?.status_note || "" };
  closeSheet();
  renderStatus();
}

async function saveStatus(btn) {
  if (btn.disabled) return;
  btn.disabled = true;
  btn.textContent = "Сохраняю…";
  try {
    const res = await fetch(API_STATUS, {
      method: "POST",
      headers: { "x-init-data": tg.initData, "content-type": "application/json" },
      body: JSON.stringify({ status: statusDraft.status, note: statusDraft.note }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error && body.error !== "server" ? body.error : "Не получилось сохранить");
    // Обновляем себя во всех загруженных месяцах, чтобы не грузить заново
    for (const d of cache.values()) {
      const me = d.byId.get(d.me.id);
      if (me) { me.status = body.status; me.status_note = body.status_note; }
    }
    tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("success");
    closeSheet();
    toast("Статус обновлён");
    render();
  } catch (e) {
    tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("error");
    renderStatus(e.message);
  }
}

// ---------- создание события ----------
const DURATIONS = [[60, "1 ч"], [120, "2 ч"], [180, "3 ч"], [240, "4 ч"], [480, "Весь вечер"]];
let draft = null;

function newDraft() {
  const d = dayStart(state.sel) < dayStart(new Date()) ? dayStart(new Date()) : state.sel;
  return { title: "", category: "meet", date: key(d), time: "19:00", minutes: 120, location: "", description: "", guests: new Set(), all: false, poll: true };
}

/** Черновик из существующего события — для правки. */
function editDraft(e) {
  return {
    id: e.id, startedAt: +e.start,
    title: e.title, category: CAT[e.category] ? e.category : "other", date: key(e.start), time: hm(e.start),
    minutes: Math.round((+e.end - +e.start) / 6e4), location: e.location || "", description: e.description || "",
    guests: new Set(), all: false,
  };
}

function renderForm(err = "") {
  const data = state.data;
  const edit = !!draft.id;
  const friends = data.profiles.filter((p) => p.id !== data.me.id);
  const opt = (act, val, on, label) => `<button type="button" class="opt ${on ? "on" : ""}" data-act="${act}" data-v="${esc(val)}">${label}</button>`;
  const n = draft.all ? friends.length : draft.guests.size;
  // У старого события может быть своя длительность (например, поездка на 10 ч) — показываем и её
  const durations = DURATIONS.some(([m]) => m === draft.minutes) ? DURATIONS : [...DURATIONS, [draft.minutes, dur(draft.minutes * 6e4)]];
  const minDate = edit && draft.startedAt < Date.now() ? key(new Date(draft.startedAt)) : key(new Date());
  openSheet(`<div class="form">
    <h3>${edit ? "Изменить событие" : "Новое событие"}</h3>
    <div class="lead">${edit ? "Голоса сохранятся, в группе появится короткая заметка об изменениях" : draft.poll ? "Друзья получат приглашение, а в группе появится опрос" : "Без опроса — гостям придёт личное приглашение"}</div>
    <label>Что делаем</label>
    <input class="big" name="title" maxlength="120" placeholder="Квиз в баре" value="${esc(draft.title)}" autocomplete="off">
    <label>Тип</label>
    <div class="opts">${Object.entries(CAT).map(([k, v]) => opt("cat", k, draft.category === k, `${CAT_ICON[k]}${v}`)).join("")}</div>
    <div class="two">
      <div><label>Дата</label><input name="date" type="date" min="${minDate}" value="${draft.date}"></div>
      <div><label>Начало</label><input name="time" type="time" step="300" value="${draft.time}"></div>
    </div>
    <label>Сколько по времени</label>
    <div class="opts">${durations.map(([m, l]) => opt("dur", m, draft.minutes === m, l)).join("")}</div>
    <label>Где</label>
    <input name="location" maxlength="120" placeholder="Бар, адрес или ссылка на созвон" value="${esc(draft.location)}" autocomplete="off">
    <label>Подробности</label>
    <textarea name="description" maxlength="1000" placeholder="Что взять, сколько стоит, кто за рулём…">${esc(draft.description)}</textarea>
    ${edit ? "" : `<label>Кого позвать${n ? ` · ${n}` : ""}</label>
    <div class="opts">${opt("all", "1", draft.all, "Всех")}${friends.map((p) =>
      opt("guest", p.id, draft.all || draft.guests.has(p.id), `${avatar(p)}${esc(nameOf(p))}`)).join("")}</div>
    <button type="button" class="toggle ${draft.poll ? "on" : ""}" data-act="poll">
      <span><b>Опрос в группе</b><small>${draft.poll ? "Иду / Возможно / Не смогу — голос сразу идёт в Тусим" : "В группу ничего не отправится"}</small></span><i></i>
    </button>`}
    <div class="err">${esc(err)}</div>
    <button type="button" class="submit" data-act="submit">${edit ? "Сохранить" : "Создать событие"}</button>
  </div>`);
}

function openForm(e) {
  draft = e ? editDraft(e) : newDraft();
  closeSheet();
  renderForm();
  if (!e) setTimeout(() => document.querySelector(".form input.big")?.focus(), 350);
}

async function submitForm(btn) {
  if (btn.disabled) return;
  const edit = !!draft.id;
  const start = new Date(`${draft.date}T${draft.time}`);
  if (!draft.title.trim()) return renderForm("Напишите, что делаем");
  if (isNaN(+start)) return renderForm("Укажите дату и время");
  const keepsStart = edit && +start === draft.startedAt;
  if (!keepsStart && +start < Date.now() - 5 * 6e4) return renderForm("Это время уже прошло");
  btn.disabled = true;
  btn.textContent = edit ? "Сохраняю…" : "Создаю…";
  try {
    const fields = {
      title: draft.title, category: draft.category, starts_at: start.toISOString(), minutes: draft.minutes,
      location: draft.location, description: draft.description,
    };
    const res = await fetch(edit ? API_UPDATE : API_CREATE, {
      method: "POST",
      headers: { "x-init-data": tg.initData, "content-type": "application/json" },
      body: JSON.stringify(edit ? { ...fields, event_id: draft.id } : { ...fields, guests: draft.all ? "all" : [...draft.guests], poll: draft.poll }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error && body.error !== "server" ? body.error : edit ? "Не получилось сохранить" : "Не получилось создать, попробуйте ещё раз");
    tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("success");
    closeSheet();
    cache.clear();
    state.sel = dayStart(start);
    state.cursor = state.view === "week" ? state.sel : new Date(start.getFullYear(), start.getMonth(), 1);
    toast(edit ? "Изменения сохранены" : "Событие создано");
    draft = null;
    refresh();
  } catch (e) {
    tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("error");
    renderForm(e.message);
  }
}

function toast(text) {
  const el = document.getElementById("toast");
  el.innerHTML = `${ICON.check}${esc(text)}`;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}

document.addEventListener("input", (ev) => {
  const name = ev.target.name;
  if (name === "note" && statusDraft) statusDraft.note = ev.target.value;
  else if (draft && name in draft) draft[name] = ev.target.value;
});

// ---------- навигация ----------
let reqId = 0;

async function refresh() {
  const [from, to] = range();
  const k = from.toISOString() + to.toISOString();
  const my = ++reqId;
  state.loading = !cache.has(k);
  if (state.loading) state.animate = true;
  render();
  try {
    const data = await load(from, to);
    if (my !== reqId) return; // пока грузили, уже перелистнули дальше
    state.data = data;
    state.loading = false;
    render();
  } catch (e) {
    if (my !== reqId) return;
    if (e.code === "not_linked") screen(ICON.link, "Привяжите аккаунт", `Отправьте ${BOT} команду <code>/link ник пароль</code> и откройте календарь снова.`);
    else if (e.code === "unauthorized") screen(ICON.clock, "Сессия устарела", `Закройте окно и снова отправьте боту <code>/calendar</code>.`);
    else screen(ICON.wifi, "Нет связи", `Проверьте интернет и попробуйте ещё раз.<br><br><button class="pill" data-act="retry">Повторить</button>`);
  }
}

function shift(dir) {
  if (state.view === "week") {
    state.cursor = addDays(state.cursor, 7 * dir);
    state.sel = addDays(state.sel, 7 * dir);
  } else {
    state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() + dir, 1);
    const now = new Date();
    state.sel = state.cursor.getMonth() === now.getMonth() && state.cursor.getFullYear() === now.getFullYear() ? dayStart(now) : state.cursor;
  }
  refresh();
}

document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  if (act !== "close") haptic();
  if (act === "prev") shift(-1);
  else if (act === "next") shift(1);
  else if (act === "today") { state.cursor = state.sel = dayStart(new Date()); refresh(); }
  else if (act === "view") { state.view = el.dataset.v; state.cursor = state.sel; refresh(); }
  else if (act === "mine") { state.onlyMine = !state.onlyMine; render(); }
  else if (act === "event") openEvent(el.dataset.id);
  else if (act === "close") closeSheet();
  else if (act === "retry") refresh();
  else if (act === "new") openForm();
  else if (act === "edit") { const e = state.data?.events.find((x) => x.id === el.dataset.id); if (e) openForm(e); }
  else if (act === "cat") { draft.category = el.dataset.v; renderForm(); }
  else if (act === "dur") { draft.minutes = Number(el.dataset.v); renderForm(); }
  else if (act === "all") { draft.all = !draft.all; draft.guests.clear(); renderForm(); }
  else if (act === "poll") { draft.poll = !draft.poll; renderForm(); }
  else if (act === "guest") {
    const id = el.dataset.v;
    if (draft.all) { draft.all = false; state.data.profiles.forEach((p) => p.id !== state.data.me.id && draft.guests.add(p.id)); }
    draft.guests.has(id) ? draft.guests.delete(id) : draft.guests.add(id);
    renderForm();
  }
  else if (act === "submit") submitForm(el);
  else if (act === "del") deleteEvent(el);
  else if (act === "status") openStatus();
  else if (act === "st") { statusDraft.status = el.dataset.v; renderStatus(); }
  else if (act === "st-save") saveStatus(el);
  else if (act === "day") {
    const [y, m, d] = el.dataset.d.split("-").map(Number);
    state.sel = new Date(y, m - 1, d);
    if (state.view === "month" && state.sel.getMonth() !== state.cursor.getMonth()) {
      state.cursor = new Date(y, m - 1, 1);
      refresh();
    } else render();
  }
});

// свайп влево/вправо по календарю листает месяцы и недели
let touchX = null;
document.addEventListener("touchstart", (e) => { touchX = e.target.closest(".panel") ? e.touches[0].clientX : null; }, { passive: true });
document.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 60) { haptic(); shift(dx < 0 ? 1 : -1); }
  touchX = null;
}, { passive: true });

// клавиатура на ноутбуке: Esc закрывает окно, стрелки листают
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sheetOpen()) { closeSheet(); return; }
  if (sheetOpen() || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
  if (e.key === "ArrowLeft") shift(-1);
  else if (e.key === "ArrowRight") shift(1);
  else if (e.key === "t" || e.key === "е") { state.cursor = state.sel = dayStart(new Date()); refresh(); }
});

// раз в минуту обновляем отсчёт «через N мин» и «Сейчас»
setInterval(() => { if (state.data && !state.loading && !sheetOpen()) render(); }, 60_000);

// ---------- старт ----------
if (!tg || !tg.initData) {
  screen(ICON.cal, "Откройте в Telegram", `Этот календарь работает внутри бота ${BOT}. Отправьте ему <code>/calendar</code>.`);
} else {
  tg.ready();
  tg.expand();
  try { tg.setHeaderColor("#0B0B0D"); tg.setBackgroundColor("#0B0B0D"); tg.setBottomBarColor && tg.setBottomBarColor("#0B0B0D"); } catch (_) {}
  tg.BackButton?.onClick(closeSheet);
  refresh();
}
