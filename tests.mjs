import { calculate, createDefaultState, exportFilename, hydrateState } from "./logic.js";
import { buildEditableHtml } from "./exporter.js";
import { buildCocofoliaCharacter } from "./cocofolia.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exampleState() {
  const state = createDefaultState();
  state.meta.pilotName = "ジョン・ドゥ";
  state.origin = "human";
  state.humanBonus = "evade";
  state.classes.main = "operator";
  state.classes.sub = "vanguard";
  state.parts.head.id = "head-shingan";
  state.parts.torso.id = "torso-thesaurus";
  state.parts.legs.id = "legs-comet";
  state.parts.generator.id = "generator-eternal";
  state.weapons[0].id = "weapon-muramasa";
  state.weapons[1].id = "weapon-shinkei";
  state.weapons[2].id = "weapon-rouhei";
  state.consumables[0].id = "item-repair";
  state.techniques.passive = "class-vanguard-defense";
  state.techniques.choices["class-vanguard-defense"] = "evade";
  state.techniques.active = ["class-operator-scan", "class-operator-jamming"];
  return state;
}

{
  const result = calculate(exampleState());
  assert(result.stats.ap === 35, "例キャラ: AP");
  assert(result.stats.action === 10, "例キャラ: 行動値");
  assert(result.stats.hit === 9, "例キャラ: 命中");
  assert(result.stats.evade === 11, "例キャラ: 回避");
  assert(result.stats.output === 10, "例キャラ: 出力");
  assert(result.stats.armor === 1, "例キャラ: 装甲");
  assert(result.stats.load === 13 && result.totalWeight === 13, "例キャラ: 積載");
  assert(result.remainingCredits === -3, "老兵を7Cで計算");
}

{
  const state = createDefaultState();
  state.parts.torso.id = "torso-nichirin";
  state.parts.legs.id = "legs-wisp";
  state.weapons[0].id = "weapon-danzai";
  const result = calculate(state);
  assert(result.warnings.some((warning) => warning.code === "overload"), "積載超過を警告");
}

{
  const state = createDefaultState();
  assert(state.consumables.length === 1, "新規シートは消耗品の入力行を1つ用意する");
  state.consumables = Array.from({ length: 6 }, () => ({ id: "item-repair", custom: {} }));
  const result = calculate(state);
  assert(result.consumables.filter(Boolean).length === 6, "消耗品は4個を超えて保持できる");
  assert(result.totalCost === 30 && result.remainingCredits === 70, "可変数の消耗品価格を残金へ反映する");
  const hydrated = hydrateState({ ...state, consumables: [...state.consumables, { id: "", custom: {} }] });
  assert(hydrated.consumables.length === 6, "旧JSONの末尾にある空の消耗品枠を読み込み時に除く");
}

{
  const state = createDefaultState();
  state.weapons[0].id = "weapon-barrier";
  state.weapons[1].id = "weapon-kourin";
  const result = calculate(state);
  assert(result.warnings.some((warning) => warning.code === "barrier-heavy"), "位相偏向器と重量武装を警告");
  assert(result.warnings.some((warning) => warning.code === "barrier-beam"), "位相偏向器とビーム武装を警告");
}

{
  const state = createDefaultState();
  state.weapons[0].id = "weapon-spore";
  state.weapons[1].id = "weapon-danzai";
  state.weapons[2].id = "weapon-shinkei";
  const validResult = calculate(state);
  assert(validResult.limits.total === 3, "スポア・スモッグは全武装枠を1つ追加で消費");
  assert(validResult.limits.light === 4, "軽量武装のカテゴリ上限は下げない");
  assert(!validResult.warnings.some((warning) => warning.code === "weapon-total"), "スポア・スモッグと重量・軽量各1つは装備可能");
  state.weapons[3].id = "weapon-rouhei";
  const overResult = calculate(state);
  assert(overResult.warnings.some((warning) => warning.code === "weapon-total"), "追加枠消費後の武装枠超過を警告");
}

{
  const filename = exportFilename(exampleState(), new Date("2026-07-29T00:00:00+09:00"));
  assert(filename === "ジョン・ドゥ_20260729.json", "内部の基本ファイル名");
}

{
  const state = exampleState();
  state.meta.memo = "</script><b>safe</b>";
  const template = '<!doctype html><html><body><script id="aso-editable-payload" type="application/json"></script><script>window.app = true;</script></body></html>';
  const editableHtml = buildEditableHtml({
    documentHtml: template,
    state,
    images: { machine: "data:image/png;base64,bWFjaGluZQ==", pilot: "" },
    sheetId: "sheet-test",
    generatedAt: new Date("2026-07-30T00:00:00+09:00"),
  });
  const payloadMatch = editableHtml.match(/id="aso-editable-payload" type="application\/json">([\s\S]*?)<\/script>/);
  assert(payloadMatch, "editable HTML payload exists");
  const payload = JSON.parse(payloadMatch[1]);
  assert(payload.sheetId === "sheet-test", "editable HTML keeps its sheet id");
  assert(payload.state.meta.memo === "</script><b>safe</b>", "editable HTML safely stores character data");
  assert(payload.images.machine === "data:image/png;base64,bWFjaGluZQ==", "editable HTML embeds images");
}

{
  const state = exampleState();
  state.meta.machineName = "UNKNOWN:LUCK";
  state.meta.playerName = "テストPL";
  state.meta.memo = "確認用メモ";
  const character = buildCocofoliaCharacter({ state, result: calculate(state) });
  assert(character.kind === "character", "ココフォリア用の種別");
  assert(character.data.name === "UNKNOWN:LUCK", "ココフォリアのコマ名は機体名を優先");
  assert(character.data.initiative === 10, "ココフォリアの行動値");
  assert(character.data.status.find((item) => item.label === "AP")?.max === "35", "ココフォリアのAP");
  assert(character.data.status.find((item) => item.label === "出力")?.value === "10", "ココフォリアの出力");
  assert(character.data.status.find((item) => item.label === "装甲")?.value === "1", "ココフォリアの装甲");
  assert(character.data.params.some((item) => item.label === "命中修正" && item.value === "0"), "ココフォリアの命中修正");
  assert(character.data.commands.includes("2d6+{命中}+{命中修正}"), "ココフォリアの命中パレット");
  assert(character.data.commands.includes("3回目の使用後"), "ココフォリアの武装使用制限");
  assert(character.data.commands.includes("ビーム軽減"), "ココフォリアの移動・軽減参照");
  assert(character.data.faces.length === 0, "ココフォリア出力は立ち絵なし");
  assert(JSON.parse(JSON.stringify(character)).data.memo.includes("確認用メモ"), "ココフォリアJSONをシリアライズできる");
}

console.log("All character-sheet logic tests passed.");
