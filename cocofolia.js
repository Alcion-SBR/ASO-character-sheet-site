function valueText(value) {
  return String(value ?? "");
}

function weaponPowerText(item) {
  if (item.power === null || item.power === undefined || item.power === "") return "未設定";
  return item.damageBonus ? String(item.power) + " + " + item.damageBonus : valueText(item.power);
}

function weaponCommands(result) {
  const lines = [];
  result.weapons.filter(Boolean).forEach((item) => {
    const name = "〈" + item.name + "〉";
    const hit = "2d6+{命中}+{命中修正}";
    lines.push("### ■" + name);
    lines.push(hit + " 命中判定／" + name + " 1回目");
    lines.push(hit + "-2 命中判定／" + name + " 2回目");
    lines.push(hit + "-2 命中判定／" + name + " 3回目");
    lines.push("威力: " + weaponPowerText(item) + " / 出力-" + (item.output ?? "未設定") + " / 射程: " + (item.range || "未設定") + " / 属性: " + (item.attribute || "未記載"));
    lines.push("3回目の使用後: 次ターン終了までこの武装は使用不可");
    if (item.traits) lines.push("特性: " + item.traits);
    lines.push("");
  });
  return lines;
}

function techniqueCommands(state, result) {
  const techniques = [...result.origin.techniques, ...result.selectedClassTechniques];
  if (!techniques.length) return [];
  const lines = ["### ■技巧"];
  for (const item of techniques) {
    const choice = item.options?.find((option) => option.id === state.techniques.choices[item.id]);
    lines.push("【" + item.timing + "】『" + item.name + "』");
    lines.push(item.description + (choice ? " 選択: " + choice.label : ""));
    if (item.id === "origin-human-tune" && result.partTune.applied) {
      lines.push("選択: 『" + result.partTune.target.name + "』 / " + (result.partTune.effect === "power" ? "威力+2" : "消費出力-1"));
    }
  }
  return lines;
}

export function buildCocofoliaCharacter({ state, result }) {
  const pilotName = state.meta.pilotName.trim() || "未入力";
  const machineName = state.meta.machineName.trim() || pilotName || "未命名A･K";
  const playerName = state.meta.playerName.trim();
  const commands = [
    "### ■基本判定",
    "2d6+{命中}+{命中修正} 命中判定",
    "2d6+{回避}+{回避修正} 回避判定（出力-1）",
    "",
    ...weaponCommands(result),
    ...techniqueCommands(state, result),
    "",
    "### ■ターン・移動",
    "出力+{出力回復} ターン開始時の出力回復",
    "クイックブースト: 出力-2 / 回避+1 / ターン1回",
    "アサルトブースト: 出力-2 / 回避-2",
    "ホバリング: 出力-1 / 回避+1",
    "オーバーブースト: 出力-4 / 次ターンの出力回復-2 / ターン1回",
    "ビーム軽減: 出力-2 / 最大出力の半分を軽減 / ターン1回",
  ].join("\n").trim();

  const memo = [
    "パイロット: " + pilotName,
    playerName ? "PL: " + playerName : "",
    "出自: " + result.origin.name,
    "クラス: メイン(" + (result.mainClass?.name ?? "未選択") + ") / サブ(" + (result.subClass?.name ?? "未選択") + ")",
    "出力回復: 毎ターン " + result.outputRecovery,
    state.meta.memo.trim(),
  ].filter(Boolean).join("\n");

  return {
    kind: "character",
    data: {
      playerName,
      externalUrl: "",
      status: [
        { label: "AP", value: valueText(result.stats.ap), max: valueText(result.stats.ap) },
        { label: "出力", value: valueText(result.stats.output), max: valueText(result.stats.output) },
        { label: "装甲", value: valueText(result.stats.armor) },
      ],
      initiative: result.stats.action,
      params: [
        { label: "行動値", value: valueText(result.stats.action) },
        { label: "命中", value: valueText(result.stats.hit) },
        { label: "命中修正", value: "0" },
        { label: "回避", value: valueText(result.stats.evade) },
        { label: "回避修正", value: "0" },
        { label: "出力回復", value: valueText(result.outputRecovery) },
      ],
      faces: [],
      x: 0,
      y: 0,
      z: 0,
      angle: 0,
      width: 4,
      height: 4,
      active: true,
      secret: false,
      invisible: false,
      hideStatus: false,
      color: "",
      roomId: null,
      commands,
      speaking: true,
      name: machineName,
      memo,
    },
  };
}
