export const BASE_STATS = Object.freeze({ ap: 30, action: 5, hit: 6, evade: 7, output: 4 });
export const STARTING_CREDITS = 100;

const technique = (id, source, name, timing, description, options = []) => ({
  id,
  source,
  name,
  timing,
  description,
  options,
  strength: "S",
});

export const origins = [
  {
    id: "human",
    name: "人間",
    description: "機体負荷を抑え、安定的な機体の使用が可能。",
    modifiers: { ap: 10 },
    choice: { id: "humanBonus", label: "人間の補正", options: ["命中+1", "回避+1"] },
    techniques: [
      { ...technique("origin-human-tune", "出自", "パーツチューン", "開始前", "ミッション開始前に、武装1つの攻撃力+2または消費出力-1（0にはできない）を選ぶ。"), strength: "S" },
      { ...technique("origin-human-cooldown", "出自", "アドバンス・クールダウン", "パッシブ", "APが0になった際、1度だけAP1で耐えられる。"), strength: "S" },
      { ...technique("origin-human-special", "出自", "これがとっておきだ！", "アクティブ", "シナリオ1回。判定後に出たダイス目を反転できる。"), strength: "S" },
      { id: "origin-human-limit", source: "出自", name: "物理的制約", timing: "パッシブ", description: "重量武装を使う際、移動後は使用できなくなる。", strength: "W" },
    ],
  },
  {
    id: "enhanced",
    name: "強化人間",
    description: "機体性能を限界まで引き出せるが、不安定かつコストがかかる。",
    modifiers: { action: 1, output: 2 },
    techniques: [
      { ...technique("origin-enhanced-air", "出自", "空中挙動", "パッシブ", "本来移動後に使用不可能な武装を移動後または空中で使用可能。該当時の命中と空中回避に+1。"), strength: "S" },
      { ...technique("origin-enhanced-photon", "出自", "フォトン・トレイル", "パッシブ", "ビーム属性の近接武装使用時、追加で出力1を消費して射程+1。攻撃ごとに宣言する。"), strength: "S" },
      { ...technique("origin-enhanced-limit", "出自", "リミッター解除…起動！！", "アクティブ", "シナリオ1回。ターン中の出力消費を0、命中と回避+2。ただしターン終了時AP-10、次ターン出力半減。"), strength: "S" },
      { id: "origin-enhanced-unstable", source: "出自", name: "精神的不安定", timing: "パッシブ", description: "1ゾロ時にオーバーヒートし、次ターンのジェネレーター出力が半分になる。", strength: "W" },
      { id: "origin-enhanced-cost", source: "出自", name: "維持コスト", timing: "パッシブ", description: "報酬の資金から薬代・調整代として1割が引かれる。", strength: "W" },
    ],
  },
];

export const classes = [
  {
    id: "assaulter",
    name: "アサルター",
    modifierLabel: "全武装の威力+2",
    techniques: [
      technique("class-assaulter-rapid", "アサルター", "ラピッド・ファイア", "パッシブ", "以下の効果から1つを選択する。選択後は変更不可扱い。", [
        { id: "short", label: "近距離特化", description: "射程1〜3で攻撃時、ダメージ+2。常に回避-2。" },
        { id: "long", label: "遠距離特化", description: "射程4以上で攻撃時、命中+2、ダメージ+1。常に行動値-1。" },
      ]),
      technique("class-assaulter-full", "アサルター", "フルスロットル", "アクティブ", "消費出力2。そのターンの命中判定+1、回避判定-2。"),
      technique("class-assaulter-piercing", "アサルター", "ピアシング・アサルト", "アクティブ", "消費出力3。次に行う攻撃1回は装甲値を無視する。"),
    ],
  },
  {
    id: "operator",
    name: "オペレーター",
    modifierLabel: "命中+2",
    modifiers: { hit: 2 },
    techniques: [
      technique("class-operator-link", "オペレーター", "高精度リンク結合", "パッシブ", "自分から3マス以内の自分以外の味方全員の命中判定+1。"),
      technique("class-operator-scan", "オペレーター", "スキャン・アナライズ", "アクティブ", "消費出力1。敵1体を指定し、その敵への味方全員のダメージ+2。次ラウンド終了時まで。重複不可。"),
      technique("class-operator-jamming", "オペレーター", "ジャミング・ウェーブ", "アクティブ", "消費出力2。敵1体の次の手番の命中判定-3。ラウンド1回。"),
    ],
  },
  {
    id: "medic",
    name: "メディック",
    modifierLabel: "AP回復効果+2",
    techniques: [
      technique("class-medic-doctor", "メディック", "フィールド・ドクター", "パッシブ", "緊急修理キットなどの消耗品効果を常に+3する。"),
      technique("class-medic-repair", "メディック", "リペア・スプレー", "アクティブ", "消費出力2。自分または射程1〜3の相手のAPを2d6回復。ラウンド1回。"),
      technique("class-medic-purge", "メディック", "緊急冷却パージ", "アクティブ", "消費出力1。視界内の味方1機のデバフまたはオーバーヒート1つを解除し、そのターンの回避+1。ラウンド1回。"),
    ],
  },
  {
    id: "vanguard",
    name: "ヴァンガード",
    modifierLabel: "回避または装甲+1（選択）",
    techniques: [
      technique("class-vanguard-defense", "ヴァンガード", "ディフェンス・セッティング", "パッシブ", "以下の効果から1つを選択する。", [
        { id: "ap", label: "胴体AP+10", description: "装備している胴体パーツのAPに+10。" },
        { id: "evade", label: "胴体回避+1", description: "装備している胴体パーツの回避に+1。" },
      ]),
      technique("class-vanguard-protect", "ヴァンガード", "プロテクト・アセット", "ダメージロール直後", "消費出力1。1〜2マス以内の味方が受けるダメージを自らに移す。ラウンド1回。"),
      technique("class-vanguard-provoke", "ヴァンガード", "プロヴォック・サイン", "アクティブ", "消費出力2。敵1体が自分以外を攻撃する場合、その命中判定-4。次ターン終了時まで。"),
    ],
  },
];

const part = (id, slot, company, name, price, modifiers = {}, traits = "", type = "") => ({ id, slot, company, name, price, modifiers, traits, type });
const weapon = (id, company, category, type, name, price, power, weight, output, range, attribute, traits = "", flags = []) => ({ id, company, category, type, name, price, power, weight, output, range, attribute, traits, flags });

export const parts = [
  part("head-yatagarasu", "head", "稜威重工", "八咫烏", 8, { hit: 0, action: -1, ap: 10 }),
  part("torso-fudo", "torso", "稜威重工", "不動", 18, { ap: 20, load: 10, output: -1, armor: 7 }),
  part("legs-kongo", "legs", "稜威重工", "金剛", 20, { evade: -2, action: -2, ap: 15, load: 30 }, "", "タンク"),
  part("legs-gozen", "legs", "稜威重工", "御前", 22, { evade: -2, action: -3, load: 25, armor: 1 }, "移動後使用不可能な武装も使用可能。", "タンク"),
  part("legs-yamato", "legs", "稜威重工", "大和", 16, { evade: -1, action: -1, ap: 10, load: 22 }, "近接武装の攻撃力+2。", "重二脚"),
  part("generator-kurogane", "generator", "稜威重工", "黒鉄", 14, { output: 4 }, "胴体パーツの出力修正を0に変更。"),
  part("head-shingan", "head", "シキシマニューロニクス", "心眼-No.003", 12, { hit: 1, action: 1, ap: 0 }),
  part("torso-nichirin", "torso", "シキシマニューロニクス", "日輪", 10, { ap: 5, load: 5, output: -1, armor: 3 }),
  part("legs-murakumo", "legs", "シキシマニューロニクス", "叢雲", 14, { evade: 1, action: 1, load: 15 }, "回避失敗時、出力1を消費してダメージ半減。ラウンド1回。", "中二脚"),
  part("legs-karasutengu", "legs", "シキシマニューロニクス", "烏天狗", 16, { evade: 0, action: 2, load: 18 }, "ホバリング時、命中+2。", "多脚"),
  part("generator-tsukuyomi", "generator", "シキシマニューロニクス", "月読", 20, { output: 1 }, "技巧1つを選び、その消費出力-1（0にはならない）。"),
  part("head-epiphany", "head", "ヴェリタス・ダイナミクス", "エピファニー", 14, { hit: 1, action: 2, ap: -5 }),
  part("torso-thesaurus", "torso", "ヴェリタス・ダイナミクス", "シソーラス", 16, { ap: -5, load: 3, output: 3, armor: 3 }, "武装の消費出力-1。"),
  part("legs-wisp", "legs", "ヴェリタス・ダイナミクス", "ウィスプ", 12, { evade: 3, action: 2, load: 8 }, "", "軽二脚"),
  part("legs-feather", "legs", "ヴェリタス・ダイナミクス", "フェザー", 18, { evade: 2, action: 3, ap: -10, load: 7 }, "出力2を消費して障害物を無視。", "逆関節"),
  part("generator-eternal", "generator", "ヴェリタス・ダイナミクス", "エターナル", 20, { output: 3, armor: -2 }, "ビーム属性の武装ダメージ+3。"),
  part("head-antler", "head", "アルビオン・ジェネティクス", "アントラー", 10, { hit: 1, action: 0, ap: 5 }),
  part("torso-slug", "torso", "アルビオン・ジェネティクス", "スラッグ", 14, { ap: 10, load: 8, output: 0, armor: 5 }),
  part("legs-scarab", "legs", "アルビオン・ジェネティクス", "スカラベ", 13, { evade: 2, action: 1, load: 12 }, "", "逆関節"),
  part("legs-arachne", "legs", "アルビオン・ジェネティクス", "アーラクネ", 15, { evade: 1, action: 1, load: 16 }, "", "多脚"),
  part("generator-cell-core", "generator", "アルビオン・ジェネティクス", "セル・コア", 16, { output: 2 }, "ターン終了時、余った出力1につきAPを2回復。"),
  part("head-brutus", "head", "ノクティス・アイアンワークス", "ブルータス", 9, { hit: 1, action: -1, ap: 5 }),
  part("torso-obelisk", "torso", "ノクティス・アイアンワークス", "オベリスク", 15, { ap: 15, output: 1, armor: 6, load: 10 }),
  part("legs-iron-soul", "legs", "ノクティス・アイアンワークス", "アイアンソウル", 14, { evade: 0, action: 0, load: 20 }, "", "中二脚"),
  part("legs-hulk", "legs", "ノクティス・アイアンワークス", "ハルク", 17, { evade: -1, action: -1, load: 25 }, "", "重二脚"),
  part("generator-iron-heart", "generator", "ノクティス・アイアンワークス", "アイアンハート", 10, { output: 1 }, "実弾属性の武装使用時、命中判定+1。"),
  part("head-stratos", "head", "イーサ・エアロスペース", "ストラトス", 13, { hit: 0, action: 2, ap: 0 }),
  part("torso-uriel", "torso", "イーサ・エアロスペース", "ウリエル", 15, { ap: 0, output: 2, armor: 2, load: 5 }, "ホバリング移動時、回避判定+1。"),
  part("legs-sky-eye", "legs", "イーサ・エアロスペース", "スカイアイ", 17, { evade: 1, action: 3, load: 14 }, "ホバリング時、クイックブーストを出力1で1ターン2回まで使用可能。", "多脚"),
  part("legs-comet", "legs", "イーサ・エアロスペース", "コメット", 20, { evade: 2, action: 4, load: 10 }, "回避判定に行動値の4分の1（切り上げ）を追加可能。1ターン2回。", "軽二脚"),
  part("generator-solar-sail", "generator", "イーサ・エアロスペース", "ソーラーセイル", 17, { output: 3 }, "ホバリング移動でターンを終えた場合、次ターンの出力+1。"),
  part("head-hephaestus", "head", "プロメテウス・インダストリーズ", "ヘパイストス", 10, { hit: 0, action: 0, ap: 5 }),
  part("torso-hestia", "torso", "プロメテウス・インダストリーズ", "ヘステイア", 17, { ap: 10, output: 2, armor: 3, load: 12 }),
  part("legs-bulldozer", "legs", "プロメテウス・インダストリーズ", "ブルドーザー", 20, { evade: -3, action: -2, ap: 20, load: 35 }, "", "タンク"),
  part("legs-workman", "legs", "プロメテウス・インダストリーズ", "ワークマン", 13, { evade: -1, action: -1, load: 18 }, "この機体に対する回復量+2。", "中二脚"),
  part("generator-bigbang", "generator", "プロメテウス・インダストリーズ", "ビックバング", 15, { output: 5 }, "戦闘開始時に1d6。2以下ならそのターンの出力-3。"),
];

export const weapons = [
  weapon("weapon-samidare", "稜威重工", "light", "ハンドガン", "五月雨", 3, "4", 5, 1, "1〜3", "実弾", "命中時に2回分のダメージを与える。"),
  weapon("weapon-sekiranun", "稜威重工", "light", "ショットガン", "積乱雲", 5, "9", 9, 1, "1〜2", "実弾", "射程1で命中した場合、ダメージ+3。"),
  weapon("weapon-type3", "稜威重工", "light", "アサルトライフル", "三式・突撃銃", 5, "7", 8, 1, "2〜4", "実弾"),
  weapon("weapon-nubeki", "稜威重工", "light", "アサルトライフル", "不抜", 8, "6", 6, 1, "2〜4", "実弾", "使用後、そのターンの回避-1。"),
  weapon("weapon-goriki", "稜威重工", "heavy", "キャノン", "剛力・改二", 10, "2d6+10", 15, 2, "4〜6", "実弾", "攻撃後、タンク脚以外は回避不可。"),
  weapon("weapon-amakudari", "稜威重工", "heavy", "キャノン", "天降", 18, "20", 18, 6, "5〜10", "実弾", "移動後使用不可。この制限は技巧などでも無視できない。"),
  weapon("weapon-kantetsu", "稜威重工", "heavy", "スナイパーライフル", "貫徹", 12, "10", 10, 2, "4〜8", "実弾", "命中時、対象を直線2マス移動。"),
  weapon("weapon-bakuretsu", "稜威重工", "heavy", "ミサイル", "爆裂", 10, "7", 8, 2, "3〜5", "実弾", "命中時、隣接マスにも1d6ダメージ。"),
  weapon("weapon-tessaku", "稜威重工", "heavy", "オートタレット", "鉄柵", 13, "5", 6, 2, "1〜4", "実弾", "設置武装。隣または同マスで攻撃されると5ダメージまで軽減し、1点でも発動すると破壊。"),
  weapon("weapon-muramasa", "稜威重工", "melee", "ブレード", "村正", 15, "2d6+12", 8, 2, "1", "実弾", "命中-2。"),
  weapon("weapon-hagan", "稜威重工", "melee", "大槌", "破岩", 10, "14", 15, 2, "1", "実弾", "命中時、対象の装甲値-5。重複不可。"),
  weapon("weapon-iwao", "稜威重工", "special", "大盾", "巌", 18, "0", 12, 0, "-", "-", "装備中、装甲値+3。軽量武装1つを装備できなくなる。", ["reduces-light"]),
  weapon("weapon-kokuin", "シキシマニューロニクス", "light", "ハンドガン", "刻印", 5, "2", 2, 1, "1〜3", "実弾", "この武装での命中判定+2。"),
  weapon("weapon-shikou", "シキシマニューロニクス", "light", "アサルトライフル", "思考", 10, "3", 4, 2, "2〜4", "実弾", "命中判定+1。クリティカル時、ダメージ+2d6。"),
  weapon("weapon-kyokkou", "シキシマニューロニクス", "heavy", "スナイパーライフル", "極光", 12, "6", 5, 5, "5〜10", "ビーム", "命中判定時、常にダイス+1。"),
  weapon("weapon-kokuu", "シキシマニューロニクス", "heavy", "キャノン", "虚空:指向性弾", 15, "0", 6, 4, "2〜5", "ビーム", "ダメージの代わりに対象の出力を1d6消費。2回目以降は命中修正-4。"),
  weapon("weapon-chidori", "シキシマニューロニクス", "heavy", "ミサイル", "千鳥", 13, "8", 7, 3, "3〜6", "実弾", "遮蔽物無視。この武装への回避判定-1。"),
  weapon("weapon-kanshi", "シキシマニューロニクス", "heavy", "オートタレット", "監視", 14, "2", 2, 3, "1〜4", "ビーム", "使用時、次ターン終了まで自身の回避+1。"),
  weapon("weapon-dengen", "シキシマニューロニクス", "melee", "ワイヤー", "電幻", 12, "4", 3, 2, "1〜3", "ビーム", "命中時、対象を1マス自分へ引き寄せる。"),
  weapon("weapon-scope", "シキシマニューロニクス", "special", "スコープ", "高精度狙撃スコープ", 16, "-", 6, 3, "-", "-", "キャノンまたはスナイパーライフルと同時使用。判定をクリティカルにしダメージ+5。戦闘1回。装備中は行動値-2、軽量武装1つを装備不可。", ["requires-sniper-or-cannon", "reduces-light", "action-minus-2"]),
  weapon("weapon-tenka", "ヴェリタス・ダイナミクス", "light", "ハンドガン", "点火", 8, "3", 2, 2, "1〜2", "ビーム", "命中後、対象の出力を1d3消費させる。"),
  weapon("weapon-kakusan", "ヴェリタス・ダイナミクス", "light", "ショットガン", "拡散", 12, "6", 5, 4, "1〜2", "ビーム", "射程内の対象全てに攻撃可能。"),
  weapon("weapon-ruten", "ヴェリタス・ダイナミクス", "light", "アサルトライフル", "流転", 13, "5", 4, 3, "2〜4", "ビーム", "追加で出力2を消費してダメージ+3。"),
  weapon("weapon-tokuiten", "ヴェリタス・ダイナミクス", "heavy", "スナイパーライフル", "特異点", 14, "7", 8, 6, "5〜8", "ビーム", "命中時、対象を自身へ2マス引き寄せる。"),
  weapon("weapon-kourin", "ヴェリタス・ダイナミクス", "heavy", "ミサイル", "光輪", 20, "8", 6, 4, "3〜6", "ビーム", "この武装に対する回避判定-3。"),
  weapon("weapon-danzai", "ヴェリタス・ダイナミクス", "heavy", "キャノン", "断罪", 25, "25", 15, 12, "4〜15", "ビーム", "射程上全ての敵を攻撃可能。次ターン出力0。"),
  weapon("weapon-kouheki", "ヴェリタス・ダイナミクス", "heavy", "オートタレット", "光壁", 15, "1", 3, 5, "1〜2", "ビーム", "使用後、次ターン終了まで装甲値+5。"),
  weapon("weapon-shinri", "ヴェリタス・ダイナミクス", "melee", "ブレード", "真理", 10, "10", 3, 3, "1", "ビーム"),
  weapon("weapon-seisou", "ヴェリタス・ダイナミクス", "melee", "ブレード", "星霜:ツインブレード", 15, "12", 4, 5, "1", "未記載", "命中判定を2回行い、両方命中した場合ダメージ+5。", ["uncertain-attribute"]),
  weapon("weapon-koujou", "ヴェリタス・ダイナミクス", "melee", "ランス", "光条･牙突", 15, "6", 6, 3, "1", "ビーム", "アサルトブースト後ならダメージ+3、回避-2。"),
  weapon("weapon-barrier", "ヴェリタス・ダイナミクス", "special", "バリア", "位相偏向器", 18, "-", 5, 4, "-", "-", "使用後3ターン持続。使用中はビーム属性武装を使用不可、重量武装を装備不可。", ["forbids-heavy", "forbids-beam"]),
  weapon("weapon-shinkei", "アルビオン・ジェネティクス", "light", "ハンドガン", "神経", 8, "1", 2, 1, "1〜2", "実弾", "命中時、対象の命中判定-2。重複不可。"),
  weapon("weapon-youkai", "アルビオン・ジェネティクス", "light", "ショットガン", "溶解", 10, "4", 5, 2, "1〜2", "実弾", "命中後3ターン、対象のターン開始時に1d6装甲貫通ダメージ。"),
  weapon("weapon-zoushoku", "アルビオン・ジェネティクス", "light", "アサルトライフル", "増殖", 12, "3", 4, 1, "2〜4", "実弾", "クリティカル時、次ターン対象は行動不可。"),
  weapon("weapon-kisei", "アルビオン・ジェネティクス", "heavy", "スナイパーライフル", "寄生", 15, "5", 6, 3, "4〜8", "実弾", "ダメージが入ると対象の出力最大値-1。戦闘終了まで。最大-3。"),
  weapon("weapon-kyouran", "アルビオン・ジェネティクス", "heavy", "ミサイル", "狂乱", 13, "6", 5, 3, "3〜5", "実弾", "回避失敗時、先に4ダメージ。装甲適用可。"),
  weapon("weapon-houkou", "アルビオン・ジェネティクス", "heavy", "キャノン", "咆哮", 15, "10", 12, 4, "3〜6", "実弾", "着弾地点周囲1マスに酸の雲を1d6ターン形成。"),
  weapon("weapon-gankyuu", "アルビオン・ジェネティクス", "heavy", "オートタレット", "眼球", 12, "2", 2, 2, "1〜4", "実弾", "着弾地点周囲1マスの敵に次の回避-2。"),
  weapon("weapon-spore", "アルビオン・ジェネティクス", "special", "スモーク", "スポア・スモッグ", 14, "-", 4, 3, "0〜3", "-", "装備中は行動値-1、軽量武装1つを装備不可。", ["reduces-light", "action-minus-1"]),
  weapon("weapon-rouhei", "ノクティス・アイアンワークス", "light", "ハンドガン", "老兵", 7, "3", 3, 0, "1〜2", "実弾", "命中判定+2、命中後に対象の行動値-2。重複不可。"),
  weapon("weapon-dansou", "ノクティス・アイアンワークス", "light", "ショットガン", "断層", 10, "8", 7, 1, "1〜2", "実弾", "射程1で攻撃時、命中判定+2。"),
  weapon("weapon-gekitetu", "ノクティス・アイアンワークス", "light", "アサルトライフル", "撃鉄", 9, "5", 5, 1, "2〜4", "実弾", "命中判定+1。"),
  weapon("weapon-jihibiki", "ノクティス・アイアンワークス", "heavy", "スナイパーライフル", "地響", 10, "8", 10, 1, "4〜7", "実弾", "命中時、対象を使用者と反対方向へ1マス移動。"),
  weapon("weapon-ren-gan", "ノクティス・アイアンワークス", "heavy", "ミサイル", "連岩", 11, "6", 6, 2, "3〜5", "実弾", "対象の回避判定-1。"),
  weapon("weapon-tekka", "ノクティス・アイアンワークス", "heavy", "キャノン", "鉄塊", 16, "12", 10, 2, "2〜5", "実弾", "例外的に移動後も使用可能。"),
  weapon("weapon-kouban", "ノクティス・アイアンワークス", "heavy", "オートタレット", "鋼板", 13, "4", 6, 2, "1〜4", "実弾", "使用後、自身へのダメージを3点軽減。1ラウンド3回。"),
  weapon("weapon-zekkou", "ノクティス・アイアンワークス", "melee", "パイルバンカー", "絶口", 13, "18", 12, 0, "1", "実弾", "命中-2。"),
  weapon("weapon-sensaku", "ノクティス・アイアンワークス", "melee", "チェンソー", "旋削", 12, "12", 9, 0, "1", "実弾", "命中-2。命中時、相手の装甲を-2してダメージ算出。"),
  weapon("weapon-ammo-box", "ノクティス・アイアンワークス", "special", "増加弾倉", "増設弾薬箱", 12, "-", 5, 0, "-", "-", "装備中は行動値-2。実弾の命中とダメージ+1。軽量または重量武装1つを装備不可。", ["action-minus-2", "needs-slot-choice"]),
  weapon("weapon-mabataki", "イーサ・エアロスペース", "light", "ハンドガン", "瞬き", 8, "2", 1, 1, "1〜2", "実弾", "1ターンに命中低下なしで3回まで射撃可能。"),
  weapon("weapon-toppuu", "イーサ・エアロスペース", "light", "ショットガン", "突風", 12, "3", 3, 1, "1〜2", "実弾", "ダメージロール後、自身を1マス移動。"),
  weapon("weapon-yokka", "イーサ・エアロスペース", "light", "アサルトライフル", "翼下", 14, "4", 2, 1, "2〜4", "実弾", "ホバリング移動時、命中+1、ダメージ+2。"),
  weapon("weapon-tengan", "イーサ・エアロスペース", "heavy", "スナイパーライフル", "天眼", 14, "5", 4, 3, "5〜10", "実弾", "使用後、射程内の敵に対する味方3人までの命中判定+1。次ターン終了まで。"),
  weapon("weapon-uteki", "イーサ・エアロスペース", "heavy", "ミサイル", "雨滴", 13, "3", 2, 2, "2〜5", "実弾", "着弾地点範囲1マスをまとめて対象にできる。"),
  weapon("weapon-rakurai", "イーサ・エアロスペース", "heavy", "キャノン", "落雷", 14, "12", 6, 4, "3〜6", "ビーム", "ホバリング移動時のみ使用可能。範囲2マスに1d3装甲貫通ダメージ。"),
  weapon("weapon-ukigumo", "イーサ・エアロスペース", "heavy", "オートタレット", "浮雲", 12, "1", 3, 2, "1〜3", "ビーム", "使用後3ターン、手番開始時に射程内の敵1名へ出力消費なしで攻撃可能。"),
  weapon("weapon-senpu", "イーサ・エアロスペース", "melee", "ワイヤー", "旋風", 10, "4", 2, 2, "1〜3", "実弾", "命中+1。対象の行動値が低ければダメージ+5。"),
  weapon("weapon-booster", "イーサ・エアロスペース", "special", "ブースター", "超高機動用ブースター", 17, "-", 5, 2, "-", "-", "戦闘中3回。アサルトブーストの移動+5、移動後ダメージ+5、使用後回避-5。装備中は行動値-2。", ["action-minus-2"]),
  weapon("weapon-funsai", "プロメテウス・インダストリーズ", "light", "ショットガン", "粉砕", 10, "11", 9, 2, "1", "実弾", "攻撃後2d6で3以下なら次ターン終了まで使用不可。"),
  weapon("weapon-sosei", "プロメテウス・インダストリーズ", "light", "アサルトライフル", "粗製", 8, "8", 6, 2, "2〜4", "実弾", "攻撃時、APを1消費。"),
  weapon("weapon-roshin", "プロメテウス・インダストリーズ", "heavy", "キャノン", "炉心", 18, "22", 18, 7, "3〜6", "実弾", "使用後、ターン終了まで回避と行動値-4。"),
  weapon("weapon-hinotori", "プロメテウス・インダストリーズ", "heavy", "ミサイル", "火の鳥", 13, "9", 7, 3, "3〜6", "実弾", "判定後1d6で1なら自分に着弾。"),
  weapon("weapon-shinkan", "プロメテウス・インダストリーズ", "heavy", "オートタレット", "信管", 7, "10", 4, 1, "1〜2", "実弾", "設置後、敵が範囲1マスに侵入すると爆発。設置時に2が出た場合その場で爆発。"),
  weapon("weapon-moonblade", "プロメテウス・インダストリーズ", "melee", "ブレード", "月光刃:試作", 10, "7", 5, 3, "1〜2", "ビーム", "近接武装として分類される。"),
  weapon("weapon-nessou", "プロメテウス・インダストリーズ", "melee", "バーナー", "熱葬", 12, "15", 8, 3, "1", "実弾", "命中時、敵の装甲を半分としてダメージ算出。1d6で2以下なら自分に5ダメージ。"),
  weapon("weapon-cooling-tank", "プロメテウス・インダストリーズ", "special", "冷却材", "緊急冷却タンク", 15, "-", 6, 2, "-", "-", "プロメテウスのパーツ使用時のダイスを、出力2で戦闘3回まで振り直し可能。"),
];

export const consumables = [
  { id: "item-repair", name: "緊急修理キット", price: 5, timing: "アクティブ", effect: "APを10点回復。1ターン使用。使い捨て。" },
  { id: "item-battery", name: "予備バッテリー", price: 3, timing: "アクティブ", effect: "使用したターンの出力+3。使い捨て。" },
  { id: "item-booster", name: "追加ブースター", price: 4, timing: "アクティブ", effect: "使用したターンの回避+2。使い捨て。" },
  { id: "item-fcs", name: "高精度FCSプラグ", price: 4, timing: "アクティブ", effect: "使用したターンの命中+2。使い捨て。" },
  { id: "item-coolant", name: "耐熱冷却材", price: 2, timing: "アクティブ", effect: "炎上、オーバーヒートを即座に解除。" },
];

export const SLOT_LABELS = { head: "頭部", torso: "胴体", legs: "脚部", generator: "ジェネレーター" };
export const CATEGORY_LABELS = { light: "軽量武装", heavy: "重量武装", melee: "近接武装", special: "背部特殊武装" };

export const findById = (list, id) => list.find((entry) => entry.id === id) ?? null;
export const findPart = (id) => findById(parts, id);
export const findWeapon = (id) => findById(weapons, id);
export const findConsumable = (id) => findById(consumables, id);
export const findClass = (id) => findById(classes, id);
export const findOrigin = (id) => findById(origins, id);
export const allClassTechniques = () => classes.flatMap((entry) => entry.techniques);
