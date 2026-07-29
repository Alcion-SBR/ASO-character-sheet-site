import {
  CATEGORY_LABELS,
  SLOT_LABELS,
  allClassTechniques,
  classes,
  consumables,
  findClass,
  findConsumable,
  findOrigin,
  findPart,
  findWeapon,
  origins,
  parts,
  weapons,
} from "./data.js";
import { buildStandaloneHtml } from "./exporter.js";
import { buildCocofoliaCharacter } from "./cocofolia.js";
import {
  buildSheetText,
  calculate,
  createDefaultState,
  exportFilename,
  hydrateState,
  searchText,
} from "./logic.js";

const app = document.querySelector("#app");
const importInput = document.querySelector("#json-import");
const STORAGE_KEY = "aso-character-sheet-draft-v1";
let mode = "edit";
let exportFormat = "json";
let state = loadDraft();

function loadDraft() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? hydrateState(JSON.parse(saved)) : createDefaultState();
  } catch {
    return createDefaultState();
  }
}

function saveDraft() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const indicator = document.querySelector("#save-indicator");
  if (indicator) indicator.textContent = "下書き保存済み";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

function setPath(path, value) {
  const keys = path.split(".");
  let target = state;
  keys.slice(0, -1).forEach((key) => { target = target[key]; });
  target[keys.at(-1)] = value;
}

function getPartEntry(slot) { return state.parts[slot]; }
function getWeaponEntry(index) { return state.weapons[index]; }
function getConsumableEntry(index) { return state.consumables[index]; }
function partDisplay(slot) { const entry = getPartEntry(slot); return entry.id ? findPart(entry.id)?.name ?? entry.custom.name : entry.custom.name; }
function weaponDisplay(index) { const entry = getWeaponEntry(index); return entry.id ? findWeapon(entry.id)?.name ?? entry.custom.name : entry.custom.name; }
function consumableDisplay(index) { const entry = getConsumableEntry(index); return entry.id ? findConsumable(entry.id)?.name ?? entry.custom.name : entry.custom.name; }
function selectedClassTechniqueIds() { return [state.techniques.passive, ...state.techniques.active].filter(Boolean); }
function exportFormatOption(value, label) { return `<option value="${value}" ${exportFormat === value ? "selected" : ""}>${label}</option>`; }

function header(result) {
  const pilot = state.meta.pilotName || "新規キャラクター";
  const cocofoliaExport = exportFormat === "cocofolia";
  return `
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">A.S.O</span>
        <div><h1>A.S.OTRPGキャラクターシート</h1><p>${escapeHtml(pilot)}</p></div>
      </div>
      <div class="topbar-actions" aria-label="シート操作">
        <span id="save-indicator" class="save-indicator">${state.updatedAt ? "下書き保存済み" : "新規下書き"}</span>
        <button class="mode-button ${mode === "edit" ? "active" : ""}" type="button" data-action="switch-mode" data-mode="edit">編集</button>
        <button class="mode-button ${mode === "view" ? "active" : ""}" type="button" data-action="switch-mode" data-mode="view">閲覧</button>
        <button class="icon-button" type="button" data-action="import-json" title="JSONを読み込む" aria-label="JSONを読み込む">↥</button>
        <label class="export-picker"><span class="sr-only">書き出し形式</span><select class="export-select" data-export-format aria-label="書き出し形式">${exportFormatOption("template", "テンプレート（.txt）")}${exportFormatOption("html", "共有用HTML（.html）")}${exportFormatOption("json", "JSON（再編集用）")}${exportFormatOption("cocofolia", "ココフォリア用JSON（コピー）")}</select></label>
        <button class="icon-button" type="button" data-action="export-selected" title="${cocofoliaExport ? "ココフォリア用JSONをコピー" : "選択した形式で書き出す"}" aria-label="${cocofoliaExport ? "ココフォリア用JSONをコピー" : "選択した形式で書き出す"}">${cocofoliaExport ? "⧉" : "↓"}</button>
        <button class="icon-button danger" type="button" data-action="new-sheet" title="新しいシートを作る" aria-label="新しいシートを作る">＋</button>
      </div>
    </header>`;
}

function section(title, body, options = {}) {
  return `<section class="editor-section ${options.className ?? ""}"><div class="section-heading"><h2>${title}</h2>${options.meta ? `<span>${options.meta}</span>` : ""}</div>${body}</section>`;
}

function field(label, path, value, options = {}) {
  const type = options.type ?? "text";
  const extra = options.extra ?? "";
  if (type === "textarea") return `<label class="field field-wide"><span>${label}</span><textarea data-path="${path}" rows="${options.rows ?? 3}" placeholder="${options.placeholder ?? ""}">${escapeHtml(value)}</textarea></label>`;
  return `<label class="field ${options.wide ? "field-wide" : ""}"><span>${label}</span><input type="${type}" data-path="${path}" value="${escapeHtml(value)}" placeholder="${options.placeholder ?? ""}" ${extra} /></label>`;
}

function selectField(label, path, value, choices, options = {}) {
  return `<label class="field ${options.wide ? "field-wide" : ""}"><span>${label}</span><select data-path="${path}">${choices.map((choice) => `<option value="${escapeHtml(choice.value)}" ${choice.value === value ? "selected" : ""}>${escapeHtml(choice.label)}</option>`).join("")}</select></label>`;
}

function combo({ kind, key, value, placeholder, entries, label }) {
  const keyData = escapeHtml(key);
  const list = entries.map((entry) => {
    const labelText = kind === "part" ? `${entry.company} / ${SLOT_LABELS[entry.slot]} / 『${entry.name}』` : kind === "weapon" ? `${entry.company} / ${CATEGORY_LABELS[entry.category]} / 【${entry.type}】『${entry.name}』` : `${entry.name} / ${entry.price}C`;
    return `<button type="button" class="suggestion" data-action="choose-${kind}" data-key="${keyData}" data-id="${entry.id}" data-search="${escapeHtml(searchText(entry))}">${escapeHtml(labelText)}</button>`;
  }).join("");
  return `<div class="combo-wrap"><label class="field field-wide"><span>${label}</span><input class="combo-input" autocomplete="off" data-combo-kind="${kind}" data-key="${keyData}" value="${escapeHtml(value ?? "")}" placeholder="${escapeHtml(placeholder)}" /></label><div class="suggestions" role="listbox">${list}<p class="no-suggestion" hidden>一致するデータはありません。入力内容はカスタム扱いで保存できます。</p></div></div>`;
}

function selectedPartInfo(slot) {
  const entry = getPartEntry(slot);
  const item = entry.id ? findPart(entry.id) : null;
  if (item) return `<div class="selected-info"><b>${escapeHtml(item.company)} 『${escapeHtml(item.name)}』</b><span>${escapeHtml(formatPartInfo(item))}</span>${item.traits ? `<small>${escapeHtml(item.traits)}</small>` : ""}</div>`;
  if (!entry.custom.name) return "";
  return `<details class="custom-details" open><summary>カスタム値を入力</summary><div class="custom-grid">${field("企業", `parts.${slot}.custom.company`, entry.custom.company)}${field("価格 (C)", `parts.${slot}.custom.price`, entry.custom.price, { type: "number" })}${field("AP", `parts.${slot}.custom.ap`, entry.custom.ap, { type: "number" })}${field("行動値", `parts.${slot}.custom.action`, entry.custom.action, { type: "number" })}${field("命中", `parts.${slot}.custom.hit`, entry.custom.hit, { type: "number" })}${field("回避", `parts.${slot}.custom.evade`, entry.custom.evade, { type: "number" })}${field("出力", `parts.${slot}.custom.output`, entry.custom.output, { type: "number" })}${field("積載", `parts.${slot}.custom.load`, entry.custom.load, { type: "number" })}${field("装甲", `parts.${slot}.custom.armor`, entry.custom.armor, { type: "number" })}${field("脚部タイプ", `parts.${slot}.custom.type`, entry.custom.type)}${field("特性", `parts.${slot}.custom.traits`, entry.custom.traits, { wide: true })}</div></details>`;
}

function formatPartInfo(item) {
  const labels = { ap: "AP", action: "行動", hit: "命中", evade: "回避", output: "出力", load: "積載", armor: "装甲" };
  const modifier = Object.entries(item.modifiers).filter(([, value]) => value).map(([key, value]) => `${labels[key]}${value > 0 ? "+" : ""}${value}`).join(" / ") || "修正なし";
  return `${modifier} / ${item.price}C${item.type ? ` / ${item.type}` : ""}`;
}

function partsEditor() {
  const body = ["head", "torso", "legs", "generator"].map((slot) => {
    const candidates = parts.filter((item) => item.slot === slot);
    return `<div class="assemble-row">${combo({ kind: "part", key: slot, value: partDisplay(slot), label: SLOT_LABELS[slot], placeholder: `${SLOT_LABELS[slot]}を検索`, entries: candidates })}${selectedPartInfo(slot)}</div>`;
  }).join("");
  return section("アセンブル", body, { meta: "4部位" });
}

function selectedWeaponInfo(index) {
  const entry = getWeaponEntry(index);
  const item = entry.id ? findWeapon(entry.id) : null;
  if (item) return `<div class="selected-info compact"><b>${escapeHtml(CATEGORY_LABELS[item.category])} / 【${escapeHtml(item.type)}】</b><span>威力 ${escapeHtml(item.power)} / 射程 ${escapeHtml(item.range)} / ${escapeHtml(item.attribute)} / 重量 ${item.weight} / 出力 ${item.output} / ${item.price}C</span>${item.traits ? `<small>${escapeHtml(item.traits)}</small>` : ""}</div>`;
  if (!entry.custom.name) return "";
  return `<details class="custom-details" open><summary>カスタム値を入力</summary><div class="custom-grid">${field("企業", `weapons.${index}.custom.company`, entry.custom.company)}${selectField("分類", `weapons.${index}.custom.category`, entry.custom.category, Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })))}${field("種別", `weapons.${index}.custom.type`, entry.custom.type)}${field("価格 (C)", `weapons.${index}.custom.price`, entry.custom.price, { type: "number" })}${field("威力", `weapons.${index}.custom.power`, entry.custom.power)}${field("重量", `weapons.${index}.custom.weight`, entry.custom.weight, { type: "number" })}${field("消費出力", `weapons.${index}.custom.output`, entry.custom.output, { type: "number" })}${field("射程", `weapons.${index}.custom.range`, entry.custom.range)}${field("属性", `weapons.${index}.custom.attribute`, entry.custom.attribute)}${field("特性", `weapons.${index}.custom.traits`, entry.custom.traits, { wide: true })}</div></details>`;
}

function weaponEditor() {
  const body = state.weapons.map((_, index) => `<div class="weapon-row"><span class="row-index">${index + 1}</span><div>${combo({ kind: "weapon", key: String(index), value: weaponDisplay(index), label: "武装", placeholder: "武装名・企業・分類で検索", entries: weapons })}${selectedWeaponInfo(index)}</div><button type="button" class="remove-row" data-action="clear-weapon" data-index="${index}" title="この武装枠を空にする" aria-label="この武装枠を空にする">×</button></div>`).join("");
  return section("武装", body, { meta: "4枠 / 入力で候補を絞り込み" });
}

function techniqueOptions(kind) {
  const main = findClass(state.classes.main)?.techniques ?? [];
  const sub = findClass(state.classes.sub)?.techniques ?? [];
  const ids = new Set();
  return [...main, ...sub].filter((item) => item.timing === kind || (kind === "アクティブ" && item.timing !== "パッシブ")).filter((item) => !ids.has(item.id) && ids.add(item.id));
}

function techniqueSelect(label, path, value, candidates) {
  const choices = [{ value: "", label: "選択してください" }, ...candidates.map((item) => ({ value: item.id, label: `【${item.timing}】${item.name}` }))];
  return selectField(label, path, value, choices, { wide: true });
}

function techniqueChoiceInputs() {
  const selected = selectedClassTechniqueIds().map((id) => allClassTechniques().find((item) => item.id === id)).filter(Boolean);
  return selected.filter((item) => item.options?.length).map((item) => selectField(`${item.name} の選択`, `techniques.choices.${item.id}`, state.techniques.choices[item.id] ?? "", [{ value: "", label: "効果を選択" }, ...item.options.map((option) => ({ value: option.id, label: option.label }))], { wide: true })).join("");
}

function classEditor() {
  const classChoices = [{ value: "", label: "選択してください" }, ...classes.map((item) => ({ value: item.id, label: item.name }))];
  const passive = techniqueOptions("パッシブ");
  const active = techniqueOptions("アクティブ");
  const body = `<div class="form-grid">
    ${selectField("出自", "origin", state.origin, origins.map((item) => ({ value: item.id, label: item.name })))}
    ${state.origin === "human" ? selectField("人間の補正", "humanBonus", state.humanBonus, [{ value: "hit", label: "命中+1" }, { value: "evade", label: "回避+1" }]) : `<div class="field muted-field"><span>出自補正</span><b>行動値+1 / 出力+2</b></div>`}
    ${selectField("メインクラス", "classes.main", state.classes.main, classChoices)}
    ${selectField("サブクラス", "classes.sub", state.classes.sub, classChoices)}
    ${state.classes.main === "vanguard" ? selectField("ヴァンガード補正", "classes.vanguardBonus", state.classes.vanguardBonus, [{ value: "evade", label: "回避+1" }, { value: "armor", label: "装甲+1" }]) : ""}
  </div>
  <div class="technique-grid">
    ${techniqueSelect("パッシブ技巧", "techniques.passive", state.techniques.passive, passive)}
    ${techniqueSelect("アクティブ技巧 1", "techniques.active.0", state.techniques.active[0], active)}
    ${techniqueSelect("アクティブ技巧 2", "techniques.active.1", state.techniques.active[1], active)}
    ${techniqueChoiceInputs()}
  </div>`;
  return section("出自・クラス・技巧", body, { meta: "クラス技巧: パッシブ1 / アクティブ2" });
}

function consumableInfo(index) {
  const entry = getConsumableEntry(index);
  const item = entry.id ? findConsumable(entry.id) : null;
  if (item) return `<div class="selected-info compact"><b>${item.price}C / ${escapeHtml(item.timing)}</b><small>${escapeHtml(item.effect)}</small></div>`;
  if (!entry.custom.name) return "";
  return `<details class="custom-details" open><summary>カスタム値を入力</summary><div class="custom-grid">${field("価格 (C)", `consumables.${index}.custom.price`, entry.custom.price, { type: "number" })}${field("タイミング", `consumables.${index}.custom.timing`, entry.custom.timing)}${field("効果", `consumables.${index}.custom.effect`, entry.custom.effect, { wide: true })}</div></details>`;
}

function consumableEditor() {
  const body = `<div class="consumable-grid">${state.consumables.map((_, index) => `<div class="consumable-row">${combo({ kind: "consumable", key: String(index), value: consumableDisplay(index), label: `所持アイテム ${index + 1}`, placeholder: "アイテム名で検索", entries: consumables })}${consumableInfo(index)}<button type="button" class="remove-row" data-action="clear-consumable" data-index="${index}" title="このアイテム枠を空にする" aria-label="このアイテム枠を空にする">×</button></div>`).join("")}</div>`;
  return section("消耗品", body, { meta: "4枠" });
}

function statCard(label, base, modifier, total, note = "") {
  return `<div class="stat-card"><span>${label}</span><strong>${total}</strong><small>${base} ${modifier >= 0 ? "+" : ""}${modifier}${note ? ` / ${note}` : ""}</small></div>`;
}

function summaryPanel(result) {
  const warningList = result.warnings.length ? result.warnings.map((warning) => `<li><b>${escapeHtml(warning.title)}</b><span>${escapeHtml(warning.detail)}</span></li>`).join("") : `<li class="good"><b>判定上の警告はありません</b><span>未確定ルールは閲覧時にも確認できます。</span></li>`;
  const body = `<div class="status-grid">
      ${statCard("AP", 30, result.statAdjustments.ap, result.stats.ap)}
      ${statCard("行動値", 5, result.statAdjustments.action, result.stats.action)}
      ${statCard("命中", 6, result.statAdjustments.hit, result.stats.hit)}
      ${statCard("回避", 7, result.statAdjustments.evade, result.stats.evade)}
      ${statCard("出力", 4, result.statAdjustments.output, result.stats.output, `回復 ${result.outputRecovery}`)}
      ${statCard("装甲", 0, result.stats.armor, result.stats.armor)}
    </div>
    <div class="summary-numbers"><div><span>残積載</span><strong class="${result.remainingLoad < 0 ? "negative" : ""}">${result.remainingLoad}</strong><small>${result.totalWeight} / ${result.stats.load}</small></div><div><span>残金</span><strong class="${result.remainingCredits < 0 ? "negative" : ""}">${result.remainingCredits}C</strong><small>購入 ${result.totalCost}C</small></div></div>
    <div class="warning-panel"><h3>確認事項</h3><ul>${warningList}</ul></div>`;
  return `<aside class="summary-panel">${body}</aside>`;
}

function textOutput(result) {
  return section("テキスト出力", `<textarea id="sheet-text" class="sheet-text" readonly rows="18">${escapeHtml(buildSheetText(state, result))}</textarea><div class="output-actions"><button type="button" class="secondary-button" data-action="copy-text">テキストをコピー</button></div>`);
}

function renderEdit(result) {
  const personal = section("パーソナルデータ", `<div class="form-grid">${field("パイロット名", "meta.pilotName", state.meta.pilotName, { placeholder: "例: ジョン・ドゥ" })}${field("機体名", "meta.machineName", state.meta.machineName, { placeholder: "例: UNKNOWN:LUCK" })}${field("プレイヤー名", "meta.playerName", state.meta.playerName)}${field("メモ", "meta.memo", state.meta.memo, { type: "textarea", rows: 3, wide: true })}</div>`);
  return `<main class="app-layout edit-layout"><div class="editor-column">${personal}${classEditor()}${partsEditor()}${weaponEditor()}${consumableEditor()}${textOutput(result)}</div>${summaryPanel(result)}</main>`;
}

function viewHeader(title, detail = "") { return `<div class="view-section-heading"><h2>${title}</h2>${detail ? `<span>${detail}</span>` : ""}</div>`; }
function viewPartRows(result) { return Object.entries(result.parts).map(([slot, item]) => `<tr><th>${SLOT_LABELS[slot]}</th><td>${item ? `『${escapeHtml(item.name)}』` : "未選択"}</td><td>${escapeHtml(item?.company ?? "-")}</td><td>${item ? escapeHtml(formatPartInfo(item)) : "-"}</td></tr>`).join(""); }
function viewWeaponRows(result) { return result.weapons.map((item, index) => `<tr><th>${index + 1}</th><td>${item ? `${escapeHtml(CATEGORY_LABELS[item.category])} / 【${escapeHtml(item.type)}】『${escapeHtml(item.name)}』` : "未選択"}</td><td>${item ? `${escapeHtml(item.attribute)} / ${escapeHtml(item.range)}` : "-"}</td><td>${item ? `${escapeHtml(item.power)}${item.damageBonus ? ` + ${item.damageBonus}` : ""} / 出力${item.output ?? "-"} / 重量${item.weight ?? "-"}` : "-"}</td></tr>`).join(""); }

function renderView(result) {
  const techniqueCards = [...result.origin.techniques, ...result.selectedClassTechniques].map((item) => {
    const choice = item.options?.find((option) => option.id === state.techniques.choices[item.id]);
    return `<article class="technique-card ${item.strength === "W" ? "weakness" : ""}"><span>技巧・${item.strength} / ${escapeHtml(item.timing)}</span><h3>『${escapeHtml(item.name)}』</h3><p>${escapeHtml(item.description)}</p>${choice ? `<b>選択: ${escapeHtml(choice.label)}</b>` : ""}</article>`;
  }).join("");
  const itemRows = result.consumables.filter(Boolean).map((item) => `<li><b>${escapeHtml(item.name)}</b><span>${item.price ?? "未設定"}C / ${escapeHtml(item.effect)}</span></li>`).join("") || "<li><span>なし</span></li>";
  const warnings = result.warnings.length ? result.warnings.map((warning) => `<li><b>${escapeHtml(warning.title)}</b><span>${escapeHtml(warning.detail)}</span></li>`).join("") : "<li class=\"good\"><b>判定上の警告はありません</b></li>";
  return `<main class="view-shell"><section class="sheet-identity"><div><span>パイロット</span><h2>${escapeHtml(state.meta.pilotName || "未入力")}</h2></div><div><span>A･K</span><h2>${escapeHtml(state.meta.machineName || "未入力")}</h2></div><dl><div><dt>出自</dt><dd>${escapeHtml(result.origin.name)}</dd></div><div><dt>メイン</dt><dd>${escapeHtml(result.mainClass?.name ?? "未選択")}</dd></div><div><dt>サブ</dt><dd>${escapeHtml(result.subClass?.name ?? "未選択")}</dd></div></dl></section>
    <section class="view-section">${viewHeader("A･Kステータス", `出力回復: 毎ターン ${result.outputRecovery}`)}<div class="view-stats">${statCard("AP", 30, result.statAdjustments.ap, result.stats.ap)}${statCard("行動値", 5, result.statAdjustments.action, result.stats.action)}${statCard("命中", 6, result.statAdjustments.hit, result.stats.hit)}${statCard("回避", 7, result.statAdjustments.evade, result.stats.evade)}${statCard("出力", 4, result.statAdjustments.output, result.stats.output)}${statCard("装甲", 0, result.stats.armor, result.stats.armor)}</div></section>
    <section class="view-section">${viewHeader("アセンブル")}<div class="table-scroll"><table><tbody>${viewPartRows(result)}</tbody></table></div></section>
    <section class="view-section">${viewHeader("武装", `積載 ${result.totalWeight} / ${result.stats.load}（残 ${result.remainingLoad}）`)}<div class="table-scroll"><table><thead><tr><th>枠</th><th>武装</th><th>属性 / 射程</th><th>性能</th></tr></thead><tbody>${viewWeaponRows(result)}</tbody></table></div></section>
    <section class="view-section">${viewHeader("所持技巧")}<div class="technique-cards">${techniqueCards || "<p>未選択</p>"}</div></section>
    <section class="view-section view-bottom"><div><div class="view-section-heading"><h2>消耗品・所持金</h2><span>購入 ${result.totalCost}C / 残金 ${result.remainingCredits}C</span></div><ul class="item-list">${itemRows}</ul></div><div class="warning-panel view-warnings"><h3>確認事項</h3><ul>${warnings}</ul></div></section>
    ${state.meta.memo.trim() ? `<section class="view-section"><div class="view-section-heading"><h2>メモ</h2></div><p class="memo-view">${escapeHtml(state.meta.memo)}</p></section>` : ""}
  </main>`;
}

function render() {
  const result = calculate(state);
  app.innerHTML = `${header(result)}${mode === "edit" ? renderEdit(result) : renderView(result)}<footer class="page-footer">非公式MVP / ルール解釈・公開範囲は製作者確認前です</footer>`;
  bindEvents();
}

function updateComboSuggestions(input) {
  const query = input.value.trim().toLocaleLowerCase("ja");
  const root = input.closest(".combo-wrap");
  const choices = [...root.querySelectorAll(".suggestion")];
  let shown = 0;
  for (const choice of choices) {
    const matches = !query || choice.dataset.search.includes(query);
    const visible = matches && shown < 8;
    choice.hidden = !visible;
    if (visible) shown += 1;
  }
  root.classList.add("is-open");
  root.querySelector(".no-suggestion").hidden = shown !== 0;
}

function updateComboCustom(kind, key, value) {
  if (kind === "part") { state.parts[key].id = ""; state.parts[key].custom.name = value; }
  if (kind === "weapon") { state.weapons[Number(key)].id = ""; state.weapons[Number(key)].custom.name = value; }
  if (kind === "consumable") { state.consumables[Number(key)].id = ""; state.consumables[Number(key)].custom.name = value; }
  saveDraft();
}

function selectCombo(kind, key, id) {
  if (kind === "part") { state.parts[key].id = id; state.parts[key].custom.name = ""; }
  if (kind === "weapon") { state.weapons[Number(key)].id = id; state.weapons[Number(key)].custom.name = ""; }
  if (kind === "consumable") { state.consumables[Number(key)].id = id; state.consumables[Number(key)].custom.name = ""; }
  saveDraft();
  render();
}

function bindEvents() {
  document.querySelectorAll("[data-path]").forEach((element) => {
    const apply = () => {
      setPath(element.dataset.path, element.value);
      saveDraft();
    };
    element.addEventListener("input", apply);
    element.addEventListener("change", () => { apply(); render(); });
    element.addEventListener("blur", () => { apply(); render(); });
  });
  document.querySelectorAll("[data-combo-kind]").forEach((input) => {
    input.addEventListener("input", () => { updateComboCustom(input.dataset.comboKind, input.dataset.key, input.value); updateComboSuggestions(input); });
    input.addEventListener("focus", () => updateComboSuggestions(input));
    input.addEventListener("blur", () => window.setTimeout(() => input.closest(".combo-wrap")?.classList.remove("is-open"), 120));
  });
  document.querySelectorAll("[data-export-format]").forEach((select) => select.addEventListener("change", () => { exportFormat = select.value; render(); }));
  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", handleAction));
}

async function copyText() {
  const text = buildSheetText(state);
  try {
    await navigator.clipboard.writeText(text);
    const button = document.querySelector('[data-action="copy-text"]');
    if (button) { button.textContent = "コピーしました"; window.setTimeout(() => { button.textContent = "テキストをコピー"; }, 1600); }
  } catch {
    const area = document.querySelector("#sheet-text");
    area?.select();
    document.execCommand("copy");
  }
}

async function copyCocofoliaJson() {
  const content = JSON.stringify(buildCocofoliaCharacter({ state, result: calculate(state) }), null, 2);
  let copied = false;
  try {
    await navigator.clipboard.writeText(content);
    copied = true;
  } catch {
    const area = document.createElement("textarea");
    area.value = content;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    copied = document.execCommand("copy");
    area.remove();
  }
  if (!copied) {
    window.alert("ココフォリア用JSONをコピーできませんでした。ブラウザのクリップボード許可を確認してください。");
    return;
  }
  const button = document.querySelector('[data-action="export-selected"]');
  if (button) {
    button.textContent = "✓";
    window.setTimeout(() => { button.textContent = "⧉"; }, 1600);
  }
}

function downloadFile(content, type, filename) {
  const blob = new Blob([content], { type });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(anchor.href);
}

function sharedFilename(extension) {
  return exportFilename(state).replace(/\.json$/, `.${extension}`);
}

function exportJson() {
  downloadFile(JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2), "application/json", exportFilename(state));
}

function exportTemplate() {
  downloadFile(`\uFEFF${buildSheetText(state)}`, "text/plain;charset=utf-8", sharedFilename("txt"));
}

function exportHtml() {
  const sheetText = buildSheetText(state);
  const title = state.meta.pilotName.trim() || state.meta.machineName.trim() || "無名パイロット";
  downloadFile(buildStandaloneHtml({ title, sheetText }), "text/html;charset=utf-8", sharedFilename("html"));
}

function exportSelected() {
  if (exportFormat === "cocofolia") { copyCocofoliaJson(); return; }
  if (exportFormat === "template") { exportTemplate(); return; }
  if (exportFormat === "html") { exportHtml(); return; }
  exportJson();
}

function handleAction(event) {
  const button = event.currentTarget;
  const action = button.dataset.action;
  if (action === "switch-mode") { mode = button.dataset.mode; render(); return; }
  if (action.startsWith("choose-")) { selectCombo(action.replace("choose-", ""), button.dataset.key, button.dataset.id); return; }
  if (action === "clear-weapon") { state.weapons[Number(button.dataset.index)] = createDefaultState().weapons[0]; saveDraft(); render(); return; }
  if (action === "clear-consumable") { state.consumables[Number(button.dataset.index)] = createDefaultState().consumables[0]; saveDraft(); render(); return; }
  if (action === "copy-text") { copyText(); return; }
  if (action === "export-selected") { exportSelected(); return; }
  if (action === "import-json") { importInput.click(); return; }
  if (action === "new-sheet") {
    if (window.confirm("現在の下書きを新しい空のシートに置き換えます。JSONを書き出していない内容は戻せません。続けますか？")) { state = createDefaultState(); saveDraft(); mode = "edit"; render(); }
  }
}

importInput.addEventListener("change", async () => {
  const [file] = importInput.files;
  if (!file) return;
  try {
    state = hydrateState(JSON.parse(await file.text()));
    saveDraft();
    mode = "edit";
    render();
  } catch {
    window.alert("JSONを読み込めませんでした。A.S.OTRPGキャラクターシートのJSONか確認してください。");
  } finally {
    importInput.value = "";
  }
});

render();

function wireframeValue(value, fallback = "-") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function wireframeSigned(value) {
  return (value >= 0 ? "+" : "") + value;
}

function wireframePartModifiers(item, custom) {
  const labels = { ap: "AP", action: "行動", hit: "命中", evade: "回避", output: "出力", load: "積載", armor: "装甲" };
  const source = item ? item.modifiers : custom;
  const values = Object.entries(source ?? {}).filter(([key, value]) => key in labels && value !== "" && Number(value) !== 0);
  return values.length ? values.map(([key, value]) => labels[key] + wireframeSigned(Number(value))).join(" / ") : "修正なし";
}

function wireframePartTraits(item, custom) {
  const source = item ?? custom;
  return [source?.type, source?.traits].filter(Boolean).join(" / ") || "-";
}

function wireframePrice(value) {
  return value === null || value === undefined || value === "" ? "-" : value + "C";
}

function wireframeCombo({ kind, key, value, placeholder, entries, label, compact = false }) {
  const keyData = escapeHtml(key);
  const fieldClass = compact ? "table-combo-field" : "field-wide";
  const labelClass = compact ? "sr-only" : "";
  const list = entries.map((entry) => {
    const labelText = kind === "part"
      ? entry.company + " / " + SLOT_LABELS[entry.slot] + " / 『" + entry.name + "』"
      : kind === "weapon"
        ? entry.company + " / " + CATEGORY_LABELS[entry.category] + " / 【" + entry.type + "】『" + entry.name + "』"
        : entry.name + " / " + entry.price + "C";
    return '<button type="button" class="suggestion" data-action="choose-' + kind + '" data-key="' + keyData + '" data-id="' + entry.id + '" data-search="' + escapeHtml(searchText(entry)) + '">' + escapeHtml(labelText) + '</button>';
  }).join("");
  return '<div class="combo-wrap ' + (compact ? "table-combo-wrap" : "") + '"><label class="field ' + fieldClass + '"><span class="' + labelClass + '">' + label + '</span><input class="combo-input" autocomplete="off" data-combo-kind="' + kind + '" data-key="' + keyData + '" value="' + escapeHtml(value ?? "") + '" placeholder="' + escapeHtml(placeholder) + '" /></label><div class="suggestions" role="listbox">' + list + '<p class="no-suggestion" hidden>一致するデータはありません。入力内容はカスタム扱いで保存できます。</p></div></div>';
}

function wireframePartRow(slot) {
  const entry = getPartEntry(slot);
  const item = entry.id ? findPart(entry.id) : null;
  const customDetails = item || !entry.custom.name ? "" : selectedPartInfo(slot);
  const candidates = parts.filter((candidate) => candidate.slot === slot);
  const company = item?.company ?? entry.custom.company;
  const price = item?.price ?? entry.custom.price;
  return '<tr><th scope="row">' + SLOT_LABELS[slot] + '</th><td class="part-name">' + wireframeCombo({ kind: "part", key: slot, value: partDisplay(slot), label: SLOT_LABELS[slot], placeholder: SLOT_LABELS[slot] + "を検索", entries: candidates, compact: true }) + customDetails + '</td><td>' + escapeHtml(wireframeValue(company)) + '</td><td class="compact">' + escapeHtml(wireframePartModifiers(item, entry.custom)) + '</td><td class="number">' + escapeHtml(wireframePrice(price)) + '</td><td class="traits">' + escapeHtml(wireframePartTraits(item, entry.custom)) + '</td></tr>';
}

function wireframePartsEditor() {
  const rows = ["head", "torso", "legs", "generator"].map(wireframePartRow).join("");
  const body = '<div class="table-wrap"><table class="assemble-table"><thead><tr><th>部位</th><th>パーツ</th><th>企業</th><th>修正</th><th>価格</th><th>タイプ・特性</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  return section("アセンブル", body, { meta: "パーツ名で候補を検索" });
}

function wireframeWeaponRow(index) {
  const entry = getWeaponEntry(index);
  const item = entry.id ? findWeapon(entry.id) : null;
  const custom = entry.custom;
  const type = item ? CATEGORY_LABELS[item.category] + " / " + item.type : custom.name ? (CATEGORY_LABELS[custom.category] ?? custom.category) + (custom.type ? " / " + custom.type : "") : "未選択";
  const power = item ? String(item.power) + (item.damageBonus ? " + " + item.damageBonus : "") : wireframeValue(custom.power);
  const traits = [item?.attribute ?? custom.attribute, item?.traits ?? custom.traits].filter(Boolean).join(" / ") || "-";
  const customDetails = item || !custom.name ? "" : selectedWeaponInfo(index);
  return '<tr><th scope="row">' + (index + 1) + '</th><td class="weapon-name">' + wireframeCombo({ kind: "weapon", key: String(index), value: weaponDisplay(index), label: "武装 " + (index + 1), placeholder: "武装名を検索", entries: weapons, compact: true }) + customDetails + '</td><td class="compact">' + escapeHtml(type) + '</td><td class="number">' + escapeHtml(power) + '</td><td>' + escapeHtml(wireframeValue(item?.range ?? custom.range)) + '</td><td>' + escapeHtml(wireframeValue(item?.output ?? custom.output)) + '</td><td>' + escapeHtml(wireframeValue(item?.weight ?? custom.weight)) + '</td><td class="number">' + escapeHtml(wireframePrice(item?.price ?? custom.price)) + '</td><td class="traits">' + escapeHtml(traits) + '</td><td><button type="button" class="remove-row table-remove" data-action="clear-weapon" data-index="' + index + '" title="この武装枠を空にする" aria-label="武装 ' + (index + 1) + ' を外す">×</button></td></tr>';
}

function wireframeWeaponEditor() {
  const rows = state.weapons.map((_, index) => wireframeWeaponRow(index)).join("");
  const body = '<div class="table-wrap"><table class="weapon-table"><thead><tr><th>#</th><th>武装</th><th>種別</th><th>威力</th><th>射程</th><th>消費</th><th>重量</th><th>価格</th><th>特性</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  return section("武装", body, { meta: "選択した性能を行内へ反映" });
}

function wireframeIdentity(result) {
  const pilot = state.meta.pilotName || "未入力";
  const machine = state.meta.machineName || "機体名未設定";
  const classesText = "出自: " + result.origin.name + " / メイン: " + (result.mainClass?.name ?? "未選択") + " / サブ: " + (result.subClass?.name ?? "未選択");
  return '<section class="sheet-identity edit-identity"><div class="portrait-slot" aria-label="A.K.識別枠">A.K.</div><div class="identity-copy"><p class="eyebrow">パイロット</p><h2>' + escapeHtml(pilot) + '</h2><p class="machine-name">' + escapeHtml(machine) + '</p><p class="identity-detail">' + escapeHtml(classesText) + '</p></div></section>';
}

function wireframeStat(label, value, detail, tone = "") {
  return '<div class="inline-stat"><dt>' + label + '</dt><dd class="' + tone + '">' + value + '</dd><small>' + detail + '</small></div>';
}

function wireframeStats(result) {
  const stats = result.stats;
  const cards = [
    wireframeStat("AP", stats.ap, "30 " + wireframeSigned(result.statAdjustments.ap)),
    wireframeStat("行動値", stats.action, "5 " + wireframeSigned(result.statAdjustments.action)),
    wireframeStat("命中", stats.hit, "6 " + wireframeSigned(result.statAdjustments.hit)),
    wireframeStat("回避", stats.evade, "7 " + wireframeSigned(result.statAdjustments.evade)),
    wireframeStat("出力", stats.output, "4 " + wireframeSigned(result.statAdjustments.output) + " / 回復 " + result.outputRecovery),
    wireframeStat("装甲", stats.armor, "0 " + wireframeSigned(stats.armor)),
    wireframeStat("残積載", result.remainingLoad, result.totalWeight + " / " + stats.load, result.remainingLoad < 0 ? "negative" : "teal"),
    wireframeStat("残金", result.remainingCredits + "C", "購入 " + result.totalCost + "C", result.remainingCredits < 0 ? "negative" : "teal"),
  ];
  return '<dl class="inline-stats">' + cards.join("") + '</dl>';
}

function wireframePersonalClassEditor() {
  const classChoices = [{ value: "", label: "選択してください" }, ...classes.map((item) => ({ value: item.id, label: item.name }))];
  const passive = techniqueOptions("パッシブ");
  const active = techniqueOptions("アクティブ");
  const originControl = state.origin === "human"
    ? selectField("人間の補正", "humanBonus", state.humanBonus, [{ value: "hit", label: "命中+1" }, { value: "evade", label: "回避+1" }])
    : '<div class="field muted-field"><span>出自補正</span><b>行動値+1 / 出力+2</b></div>';
  const vanguardControl = state.classes.main === "vanguard"
    ? selectField("ヴァンガード補正", "classes.vanguardBonus", state.classes.vanguardBonus, [{ value: "evade", label: "回避+1" }, { value: "armor", label: "装甲+1" }])
    : "";
  const body = '<div class="form-grid identity-form">' +
    field("パイロット名", "meta.pilotName", state.meta.pilotName, { placeholder: "例: ジョン・ドゥ" }) +
    field("機体名", "meta.machineName", state.meta.machineName, { placeholder: "例: UNKNOWN:LUCK" }) +
    field("プレイヤー名", "meta.playerName", state.meta.playerName) +
    selectField("出自", "origin", state.origin, origins.map((item) => ({ value: item.id, label: item.name }))) +
    originControl +
    selectField("メインクラス", "classes.main", state.classes.main, classChoices) +
    selectField("サブクラス", "classes.sub", state.classes.sub, classChoices) +
    vanguardControl +
    field("メモ", "meta.memo", state.meta.memo, { type: "textarea", rows: 3, wide: true }) +
    '</div><div class="technique-grid">' +
    techniqueSelect("パッシブ技巧", "techniques.passive", state.techniques.passive, passive) +
    techniqueSelect("アクティブ技巧 1", "techniques.active.0", state.techniques.active[0], active) +
    techniqueSelect("アクティブ技巧 2", "techniques.active.1", state.techniques.active[1], active) +
    techniqueChoiceInputs() +
    '</div>';
  return section("パーソナルデータ・クラス", body, { meta: "入力内容は自動保存" });
}

function wireframeConfirmation(result) {
  const message = result.warnings.length
    ? '<ul>' + result.warnings.map((warning) => '<li><b>' + escapeHtml(warning.title) + '</b><span>' + escapeHtml(warning.detail) + '</span></li>').join("") + '</ul>'
    : '<span>判定上の警告はありません。</span>';
  const stateClass = result.warnings.length ? "notice warning-notice" : "notice";
  return '<section class="editor-section confirmation-section"><div class="' + stateClass + '"><strong>確認事項</strong><div>' + message + '</div></div></section>';
}

function wireframeRenderEdit(result) {
  return '<main class="app-layout wireframe-layout">' + wireframeIdentity(result) + wireframeStats(result) + '<div class="editor-column">' + wireframePersonalClassEditor() + wireframePartsEditor() + wireframeWeaponEditor() + consumableEditor() + wireframeConfirmation(result) + '</div></main>';
}

combo = wireframeCombo;
partsEditor = wireframePartsEditor;
weaponEditor = wireframeWeaponEditor;
classEditor = wireframePersonalClassEditor;
renderEdit = wireframeRenderEdit;
render();
