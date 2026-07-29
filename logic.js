import {
  BASE_STATS,
  STARTING_CREDITS,
  CATEGORY_LABELS,
  SLOT_LABELS,
  allClassTechniques,
  findClass,
  findConsumable,
  findOrigin,
  findPart,
  findWeapon,
} from "./data.js";

const PART_SLOTS = ["head", "torso", "legs", "generator"];
const num = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const valueOr = (value, fallback = 0) => num(value) ?? fallback;
const clone = (value) => JSON.parse(JSON.stringify(value));
const customPart = () => ({ name: "", company: "", price: "", ap: "", action: "", hit: "", evade: "", output: "", load: "", armor: "", type: "", traits: "" });
const customWeapon = () => ({ name: "", company: "", category: "light", type: "", price: "", power: "", weight: "", output: "", range: "", attribute: "", traits: "" });
const customConsumable = () => ({ name: "", price: "", timing: "", effect: "" });

export function createDefaultState() {
  return {
    schemaVersion: 1,
    updatedAt: "",
    meta: { pilotName: "", machineName: "", playerName: "", memo: "" },
    origin: "human",
    humanBonus: "evade",
    classes: { main: "", sub: "", vanguardBonus: "evade" },
    parts: Object.fromEntries(PART_SLOTS.map((slot) => [slot, { id: "", custom: customPart() }])),
    weapons: Array.from({ length: 4 }, () => ({ id: "", custom: customWeapon() })),
    consumables: Array.from({ length: 4 }, () => ({ id: "", custom: customConsumable() })),
    techniques: { passive: "", active: ["", ""], choices: {} },
  };
}

export function hydrateState(candidate) {
  const base = createDefaultState();
  if (!candidate || typeof candidate !== "object") return base;
  const state = clone(base);
  state.schemaVersion = 1;
  state.updatedAt = typeof candidate.updatedAt === "string" ? candidate.updatedAt : "";
  state.meta = { ...base.meta, ...(candidate.meta ?? {}) };
  state.origin = typeof candidate.origin === "string" ? candidate.origin : base.origin;
  state.humanBonus = candidate.humanBonus === "hit" ? "hit" : "evade";
  state.classes = { ...base.classes, ...(candidate.classes ?? {}) };
  for (const slot of PART_SLOTS) {
    const source = candidate.parts?.[slot] ?? {};
    state.parts[slot] = { id: typeof source.id === "string" ? source.id : "", custom: { ...customPart(), ...(source.custom ?? {}) } };
  }
  state.weapons = Array.from({ length: 4 }, (_, index) => {
    const source = candidate.weapons?.[index] ?? {};
    return { id: typeof source.id === "string" ? source.id : "", custom: { ...customWeapon(), ...(source.custom ?? {}) } };
  });
  state.consumables = Array.from({ length: 4 }, (_, index) => {
    const source = candidate.consumables?.[index] ?? {};
    return { id: typeof source.id === "string" ? source.id : "", custom: { ...customConsumable(), ...(source.custom ?? {}) } };
  });
  state.techniques = { ...base.techniques, ...(candidate.techniques ?? {}), choices: { ...(candidate.techniques?.choices ?? {}) } };
  state.techniques.active = Array.from({ length: 2 }, (_, index) => candidate.techniques?.active?.[index] ?? "");
  return state;
}

export function resolvePart(entry, slot) {
  const selected = entry?.id ? findPart(entry.id) : null;
  if (selected) return selected;
  const custom = entry?.custom ?? customPart();
  if (!custom.name.trim()) return null;
  return {
    id: `custom-${slot}`,
    slot,
    company: custom.company || "カスタム",
    name: custom.name,
    price: num(custom.price),
    modifiers: {
      ap: valueOr(custom.ap), action: valueOr(custom.action), hit: valueOr(custom.hit), evade: valueOr(custom.evade),
      output: valueOr(custom.output), load: valueOr(custom.load), armor: valueOr(custom.armor),
    },
    traits: custom.traits,
    type: custom.type,
    isCustom: true,
  };
}

export function resolveWeapon(entry) {
  const selected = entry?.id ? findWeapon(entry.id) : null;
  if (selected) return selected;
  const custom = entry?.custom ?? customWeapon();
  if (!custom.name.trim()) return null;
  return {
    id: "custom-weapon",
    company: custom.company || "カスタム",
    category: custom.category || "light",
    type: custom.type || "未設定",
    name: custom.name,
    price: num(custom.price),
    power: custom.power || "未設定",
    weight: num(custom.weight),
    output: num(custom.output),
    range: custom.range || "未設定",
    attribute: custom.attribute || "未設定",
    traits: custom.traits,
    flags: [],
    isCustom: true,
  };
}

export function resolveConsumable(entry) {
  const selected = entry?.id ? findConsumable(entry.id) : null;
  if (selected) return selected;
  const custom = entry?.custom ?? customConsumable();
  if (!custom.name.trim()) return null;
  return { id: "custom-item", name: custom.name, price: num(custom.price), timing: custom.timing || "未設定", effect: custom.effect || "", isCustom: true };
}

const findTechnique = (id) => allClassTechniques().find((item) => item.id === id) ?? null;
const selectedTechniqueIds = (state) => [state.techniques.passive, ...state.techniques.active].filter(Boolean);
const hasTechnique = (state, id) => selectedTechniqueIds(state).includes(id);
const addWarning = (list, code, title, detail) => list.push({ code, title, detail });
const formatSigned = (value) => (value > 0 ? `+${value}` : String(value));

export function calculate(state) {
  const warnings = [];
  const notices = [
    { title: "未確定ルール", detail: "脚部制限の意味とメイン/サブ同一クラスの可否は、現時点では確定していません。" },
    { title: "ローカル下書き", detail: "このブラウザ内に自動保存します。JSON出力は明示操作のときだけ行います。" },
  ];
  const resolvedParts = Object.fromEntries(PART_SLOTS.map((slot) => [slot, resolvePart(state.parts[slot], slot)]));
  const resolvedWeapons = state.weapons.map(resolveWeapon);
  const resolvedConsumables = state.consumables.map(resolveConsumable);
  const origin = findOrigin(state.origin) ?? findOrigin("human");
  const mainClass = findClass(state.classes.main);
  const subClass = findClass(state.classes.sub);

  const statAdjustments = { ap: 0, action: 0, hit: 0, evade: 0, output: 0, armor: 0, load: 0 };
  const breakdown = Object.fromEntries(Object.keys(statAdjustments).map((key) => [key, []]));
  const add = (key, amount, label) => {
    if (!amount) return;
    statAdjustments[key] += amount;
    breakdown[key].push({ label, amount });
  };

  for (const [slot, item] of Object.entries(resolvedParts)) {
    if (!item) continue;
    for (const [key, amount] of Object.entries(item.modifiers ?? {})) add(key, amount, `${SLOT_LABELS[slot]}: ${item.name}`);
    if (item.isCustom) {
      for (const key of ["price", "ap", "action", "hit", "evade", "output", "load", "armor"]) {
        if (key === "price" ? item.price === null : state.parts[slot].custom[key] === "") {
          addWarning(warnings, `custom-part-${slot}-${key}`, "カスタムパーツの数値が不足", `${SLOT_LABELS[slot]}「${item.name}」の${key === "price" ? "価格" : key}が未入力です。`);
        }
      }
    }
  }
  if (resolvedParts.generator?.id === "generator-kurogane" && resolvedParts.torso) {
    const torsoOutput = resolvedParts.torso.modifiers.output ?? 0;
    if (torsoOutput) {
      statAdjustments.output -= torsoOutput;
      breakdown.output = breakdown.output.filter((item) => item.label !== `胴体: ${resolvedParts.torso.name}`);
      breakdown.output.push({ label: "黒鉄: 胴体出力修正を0", amount: -torsoOutput });
    }
  }
  for (const [key, amount] of Object.entries(origin.modifiers ?? {})) add(key, amount, `出自: ${origin.name}`);
  if (origin.id === "human") add(state.humanBonus, 1, "人間の選択補正");
  if (mainClass?.id === "operator") add("hit", 2, "メイン: オペレーター");
  if (mainClass?.id === "vanguard") add(state.classes.vanguardBonus === "armor" ? "armor" : "evade", 1, "メイン: ヴァンガード");
  if (hasTechnique(state, "class-assaulter-rapid")) {
    const option = state.techniques.choices["class-assaulter-rapid"];
    if (option === "short") add("evade", -2, "ラピッド・ファイア（近距離特化）");
    if (option === "long") add("action", -1, "ラピッド・ファイア（遠距離特化）");
  }
  if (hasTechnique(state, "class-vanguard-defense")) {
    const option = state.techniques.choices["class-vanguard-defense"];
    if (option === "ap") add("ap", 10, "ディフェンス・セッティング（AP）");
    if (option === "evade") add("evade", 1, "ディフェンス・セッティング（回避）");
  }
  for (const item of resolvedWeapons.filter(Boolean)) {
    if (item.flags?.includes("action-minus-2")) add("action", -2, `${item.name}: 装備中修正`);
    if (item.flags?.includes("action-minus-1")) add("action", -1, `${item.name}: 装備中修正`);
    if (item.id === "weapon-iwao") add("armor", 3, "巌: 装備中修正");
  }

  const stats = {
    ap: BASE_STATS.ap + statAdjustments.ap,
    action: BASE_STATS.action + statAdjustments.action,
    hit: BASE_STATS.hit + statAdjustments.hit,
    evade: BASE_STATS.evade + statAdjustments.evade,
    output: BASE_STATS.output + statAdjustments.output,
    armor: statAdjustments.armor,
    load: statAdjustments.load,
  };
  const generatorOutput = resolvedParts.generator?.modifiers?.output ?? 0;
  const outputRecovery = generatorOutput + 2;

  const equippedWeapons = resolvedWeapons.filter(Boolean);
  const categoryCounts = { light: 0, heavy: 0, melee: 0, special: 0 };
  for (const item of equippedWeapons) categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1;
  const lightLike = categoryCounts.light + categoryCounts.melee;
  const heavyLike = categoryCounts.heavy + categoryCounts.special;
  const reducedLight = equippedWeapons.reduce((count, item) => count + (item.flags?.includes("reduces-light") ? 1 : 0), 0);
  const limits = { total: 4, light: 4 - reducedLight, heavy: 2, melee: 1, special: 1 };
  const totalWeight = equippedWeapons.reduce((sum, item) => sum + (item.weight ?? 0), 0);
  const hasUnknownWeight = equippedWeapons.some((item) => item.weight === null);
  const remainingLoad = stats.load - totalWeight;
  const damageBonusFor = (item) => {
    let amount = 0;
    if (mainClass?.id === "assaulter") amount += 2;
    if (resolvedParts.legs?.id === "legs-yamato" && item.category === "melee") amount += 2;
    if (resolvedParts.generator?.id === "generator-eternal" && item.attribute === "ビーム") amount += 3;
    if (equippedWeapons.some((weapon) => weapon.id === "weapon-ammo-box") && item.attribute === "実弾") amount += 1;
    if (hasTechnique(state, "class-assaulter-rapid") && state.techniques.choices["class-assaulter-rapid"] === "short") amount += 2;
    if (hasTechnique(state, "class-assaulter-rapid") && state.techniques.choices["class-assaulter-rapid"] === "long") amount += 1;
    return amount;
  };
  const weaponsWithBonuses = resolvedWeapons.map((item) => item ? { ...item, damageBonus: damageBonusFor(item) } : null);

  if (mainClass && subClass && mainClass.id === subClass.id) addWarning(warnings, "same-class", "メインとサブが同一クラス", "同一クラス選択の可否は製作者未確認です。現状は保存できます。 ");
  for (const slot of PART_SLOTS) if (!resolvedParts[slot]) addWarning(warnings, `missing-${slot}`, "未選択の構成パーツ", `${SLOT_LABELS[slot]}を選択またはカスタム入力してください。`);
  if (equippedWeapons.length > 4) addWarning(warnings, "weapon-total", "武装枠超過", "武装は4枠までです。");
  if (lightLike > limits.light) addWarning(warnings, "weapon-light", "軽量武装枠超過", `軽量武装扱いは${limits.light}枠までです。近接武装も軽量武装として数えます。`);
  if (heavyLike > limits.heavy) addWarning(warnings, "weapon-heavy", "重量武装枠超過", `重量武装扱いは${limits.heavy}枠までです。背部特殊武装も重量武装として数えます。`);
  if (categoryCounts.melee > limits.melee) addWarning(warnings, "weapon-melee", "近接武装枠超過", "近接武装は1つまでです。");
  if (categoryCounts.special > limits.special) addWarning(warnings, "weapon-special", "背部特殊武装枠超過", "背部特殊武装は1つまでです。");
  if (!hasUnknownWeight && remainingLoad < 0) addWarning(warnings, "overload", "積載超過", `武装重量${totalWeight}に対し、積載上限は${stats.load}です。`);
  if (hasUnknownWeight) addWarning(warnings, "unknown-weight", "武装重量が不足", "カスタム武装の重量が未入力のため、積載を確定できません。");

  const special = equippedWeapons.find((item) => item.id === "weapon-barrier");
  if (special && categoryCounts.heavy > 0) addWarning(warnings, "barrier-heavy", "位相偏向器と重量武装", "位相偏向器は重量武装を装備不可としています。保存はできます。 ");
  if (special && equippedWeapons.some((item) => item.attribute === "ビーム")) addWarning(warnings, "barrier-beam", "位相偏向器とビーム武装", "位相偏向器の使用中はビーム属性武装を使用不可です。戦術上の注意として確認してください。 ");
  if (equippedWeapons.some((item) => item.id === "weapon-scope") && !equippedWeapons.some((item) => ["キャノン", "スナイパーライフル"].includes(item.type))) addWarning(warnings, "scope-requirement", "高精度狙撃スコープの対象不足", "同時使用対象のキャノンまたはスナイパーライフルがありません。 ");
  if (equippedWeapons.some((item) => item.id === "weapon-ammo-box")) addWarning(warnings, "ammo-box-choice", "増設弾薬箱の装備不可枠", "軽量または重量武装を1つ装備不可にする選択が必要です。現時点では自動判定していません。 ");
  if (equippedWeapons.some((item) => item.flags?.includes("uncertain-attribute"))) addWarning(warnings, "seisou-attribute", "星霜:ツインブレードの属性未記載", "ルールデータに属性が明記されていないため、属性依存の補正を適用していません。 ");
  for (const item of equippedWeapons.filter((item) => item.isCustom)) {
    for (const key of ["price", "weight", "output"]) {
      if (item[key] === null) addWarning(warnings, `custom-weapon-${item.name}-${key}`, "カスタム武装の数値が不足", `「${item.name}」の${key === "price" ? "価格" : key === "weight" ? "重量" : "消費出力"}が未入力です。`);
    }
  }

  const purchases = [...Object.values(resolvedParts), ...equippedWeapons, ...resolvedConsumables.filter(Boolean)];
  const unknownPrice = purchases.some((item) => item && item.price === null);
  const totalCost = purchases.reduce((sum, item) => sum + (item?.price ?? 0), 0);
  const remainingCredits = STARTING_CREDITS - totalCost;
  if (unknownPrice) addWarning(warnings, "unknown-price", "価格が不足", "カスタム入力の価格が未入力です。残金は確定できません。");
  if (!unknownPrice && remainingCredits < 0) addWarning(warnings, "funds", "残金不足", `合計${totalCost}Cで、初期資金${STARTING_CREDITS}Cを超えています。`);

  const availableTechniqueIds = new Set([...(mainClass?.techniques ?? []), ...(subClass?.techniques ?? [])].map((item) => item.id));
  const passive = findTechnique(state.techniques.passive);
  const active = state.techniques.active.map(findTechnique).filter(Boolean);
  if (mainClass || subClass) {
    if (!passive) addWarning(warnings, "missing-passive", "パッシブ技巧が未選択", "クラス技巧からパッシブを1つ選択します。 ");
    if (active.length < 2) addWarning(warnings, "missing-active", "アクティブ技巧が不足", "クラス技巧からアクティブを2つ選択します。 ");
  }
  for (const item of [passive, ...active].filter(Boolean)) {
    if (!availableTechniqueIds.has(item.id)) addWarning(warnings, `invalid-technique-${item.id}`, "クラス技巧の候補外", `「${item.name}」は現在のメイン/サブクラスの候補にありません。`);
    if (item.options?.length && !state.techniques.choices[item.id]) addWarning(warnings, `missing-technique-choice-${item.id}`, "技巧の効果選択が未入力", `「${item.name}」の効果を選択してください。`);
  }

  const selectedClassTechniques = [passive, ...active].filter(Boolean);
  return {
    origin, mainClass, subClass, parts: resolvedParts, weapons: weaponsWithBonuses, consumables: resolvedConsumables,
    stats, statAdjustments, breakdown, outputRecovery, categoryCounts, limits, totalWeight, remainingLoad,
    totalCost, remainingCredits, warnings, notices, selectedClassTechniques, selectedTechniqueIds: selectedTechniqueIds(state), formatSigned,
  };
}

const itemName = (item) => item ? `『${item.name}』` : "未選択";
const formatCost = (item) => item?.price === null ? "未設定" : `${item?.price ?? 0}C`;
const modifierText = (item) => {
  if (!item) return "";
  const labels = { ap: "AP", action: "行動値", hit: "命中", evade: "回避", output: "出力", load: "積載", armor: "装甲" };
  return Object.entries(item.modifiers ?? {}).filter(([, value]) => value).map(([key, value]) => `${labels[key]}${formatSigned(value)}`).join(" / ") || "修正なし";
};

export function buildSheetText(state, result = calculate(state)) {
  const lines = [];
  lines.push("A･S･Oキャラシテンプレート");
  lines.push(`【 パイロット名: ${state.meta.pilotName || "未入力"} 】`);
  lines.push(`【 機体名: ${state.meta.machineName || "未入力"} 】`);
  lines.push(`【 出自: ${result.origin.name} 】`);
  lines.push(`【 クラス: メイン(${result.mainClass?.name || "未選択"}) / サブ(${result.subClass?.name || "未選択"}) 】`);
  lines.push("");
  lines.push("■ A･Kステータス");
  for (const [key, label] of [["ap", "AP"], ["action", "行動値"], ["hit", "命中"], ["evade", "回避"], ["output", "出力"]]) {
    lines.push(`・${label}: [ ${BASE_STATS[key]} ] + [ ${formatSigned(result.statAdjustments[key])} ] = 【 ${result.stats[key]} 】`);
  }
  lines.push(`・出力回復: 毎ターン ${result.outputRecovery}`);
  lines.push(`・装甲（軽減）: 【 ${result.stats.armor} 】`);
  lines.push("");
  lines.push("■ アセンブル（構成パーツ）");
  for (const slot of PART_SLOTS) {
    const item = result.parts[slot];
    lines.push(`・${SLOT_LABELS[slot]}: ${itemName(item)} [企業名: ${item?.company || "-"}]`);
    lines.push(`  修正: ${modifierText(item)} / 価格: ${formatCost(item)}`);
    if (item?.type) lines.push(`  タイプ: ${item.type}`);
    if (item?.traits) lines.push(`  特性: ${item.traits}`);
  }
  lines.push("");
  lines.push(`■ 武装（積載合計: ${result.totalWeight} / 積載上限: ${result.stats.load} / 残積載: ${result.remainingLoad} ）`);
  result.weapons.forEach((item, index) => {
    if (!item) { lines.push(`${index + 1}. [ 未選択 ]`); return; }
    const power = item.damageBonus ? `${item.power} + ${item.damageBonus}` : item.power;
    lines.push(`${index + 1}. [ ${CATEGORY_LABELS[item.category]} / ${item.type} ]『${item.name}』 射程:${item.range} 属性:${item.attribute}`);
    lines.push(`   威力:${power} / 消費:${item.output ?? "未設定"} / 重量:${item.weight ?? "未設定"} / 価格:${formatCost(item)}`);
    if (item.traits) lines.push(`   特性:${item.traits}`);
  });
  lines.push("");
  lines.push("■ 所持【技巧】");
  for (const item of result.origin.techniques) lines.push(`・【技巧・${item.strength}】『${item.name}』 ${item.description}`);
  for (const item of result.selectedClassTechniques) {
    const choice = item.options?.find((option) => option.id === state.techniques.choices[item.id]);
    lines.push(`・【技巧・${item.strength}】『${item.name}』 タイミング:${item.timing}`);
    lines.push(`  ${item.description}${choice ? ` 選択:${choice.label}` : ""}`);
  }
  lines.push("");
  lines.push("■ 消耗品・所持金");
  lines.push(`・所持アイテム: ${result.consumables.filter(Boolean).map((item) => item.name).join(" / ") || "なし"}`);
  lines.push(`・残金: 【 ${result.remainingCredits}C 】（購入合計 ${result.totalCost}C）`);
  if (result.warnings.length) {
    lines.push("");
    lines.push("■ 確認事項");
    for (const warning of result.warnings) lines.push(`・${warning.title}: ${warning.detail}`);
  }
  if (state.meta.memo.trim()) { lines.push(""); lines.push("■ メモ"); lines.push(state.meta.memo.trim()); }
  return lines.join("\n");
}

export function exportFilename(state, now = new Date()) {
  const rawName = state.meta.pilotName.trim() || state.meta.machineName.trim() || "無名パイロット";
  const safeName = rawName.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80);
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `${safeName}_${date}.json`;
}

export function searchText(entry) {
  return Object.values(entry).filter((value) => typeof value === "string").join(" ").toLocaleLowerCase("ja");
}
