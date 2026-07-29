function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]);
}

function sharedImageMarkup(images) {
  const machineImage = images.machine || "";
  const pilotImage = images.pilot || "";
  const frontImage = machineImage || pilotImage;
  if (!frontImage) return "";
  const hasPair = Boolean(machineImage && pilotImage);
  const frontLabel = machineImage ? "機体" : "パイロット";
  const frontFace = '<div class="image-face image-front"><img src="' + escapeHtml(frontImage) + '" alt="' + frontLabel + '画像"><span>' + frontLabel + '</span></div>';
  const backFace = hasPair ? '<div class="image-face image-back"><img src="' + escapeHtml(pilotImage) + '" alt="パイロット画像"><span>パイロット</span></div>' : "";
  const toggle = hasPair ? '<button type="button" class="image-toggle" id="image-toggle" aria-pressed="false">切り替え</button>' : "";
  return '<section class="image-section"><div class="image-card" id="image-card"><div class="image-inner">' + frontFace + backFace + '</div></div>' + toggle + '</section>';
}

export function buildStandaloneHtml({ title, sheetText, images = {}, generatedAt = new Date() }) {
  const safeTitle = escapeHtml(title || "A.S.OTRPGキャラクターシート");
  const date = escapeHtml(generatedAt.toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" }));
  const imageMarkup = sharedImageMarkup(images);
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>A.S.OTRPGキャラクターシート | ${safeTitle}</title>
  <style>
    :root { --ink: #19212a; --muted: #5f6874; --line: #cbd3db; --accent: #0c66b4; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #edf1f4; color: var(--ink); font: 15px/1.6 system-ui, -apple-system, "Yu Gothic UI", "Meiryo", sans-serif; }
    main { width: min(980px, calc(100% - 32px)); margin: 32px auto; background: #fff; border: 1px solid var(--line); box-shadow: 0 8px 24px rgb(25 33 42 / 10%); }
    header { padding: 28px 32px 20px; border-bottom: 4px solid var(--accent); }
    h1 { margin: 0; font-size: 24px; line-height: 1.3; letter-spacing: 0; }
    p { margin: 8px 0 0; color: var(--muted); } .character { color: var(--accent); font-size: 18px; font-weight: 700; }
    .image-section { display: flex; align-items: center; gap: 14px; padding: 24px 32px; border-bottom: 1px solid var(--line); }
    .image-card { width: min(480px, 100%); perspective: 1200px; }
    .image-inner { position: relative; width: 100%; aspect-ratio: 4 / 3; transform-style: preserve-3d; transition: transform 460ms ease; }
    .image-card.is-flipped .image-inner { transform: rotateY(180deg); }
    .image-face { position: absolute; inset: 0; display: grid; overflow: hidden; place-items: center; border: 1px solid var(--line); border-radius: 4px; background: #f5f7f8; backface-visibility: hidden; }
    .image-face img { width: 100%; height: 100%; object-fit: contain; }
    .image-face span { position: absolute; right: 8px; bottom: 8px; padding: 2px 6px; background: rgb(255 255 255 / 86%); font-size: 11px; }
    .image-back { transform: rotateY(180deg); }
    .image-toggle { min-height: 36px; padding: 7px 12px; border: 1px solid var(--line); border-radius: 4px; background: #fff; color: var(--ink); cursor: pointer; }
    .image-toggle:hover { border-color: var(--accent); background: #f3f8fd; }
    section { padding: 24px 32px; } h2 { margin: 0; font-size: 17px; letter-spacing: 0; }
    pre { margin: 14px 0 0; padding: 16px; overflow-x: auto; background: #202b35; color: #eef5f8; font: 13px/1.55 ui-monospace, "Cascadia Mono", "Meiryo", monospace; white-space: pre-wrap; }
    footer { padding: 16px 32px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; }
    @media (max-width: 680px) { body { background: #fff; } main { width: 100%; margin: 0; border: 0; box-shadow: none; } header, section, footer { padding-left: 16px; padding-right: 16px; } }
    @media (max-width: 680px) { .image-section { align-items: flex-start; flex-direction: column; padding-right: 16px; padding-left: 16px; } }
    @media (prefers-reduced-motion: reduce) { .image-inner { transition: none; } }
    @media print { body { background: #fff; } main { width: 100%; margin: 0; border: 0; box-shadow: none; } }
  </style>
</head>
<body>
  <main>
    <header>
      <p>A.S.OTRPGキャラクターシート / 非公式 / 閲覧専用</p>
      <h1>アサルト・スティール・オンライン</h1>
      <p class="character">${safeTitle}</p>
    </header>
    ${imageMarkup}
    <section><h2>キャラクターシート</h2><pre>${escapeHtml(sheetText)}</pre></section>
    <footer>出力日時: ${date}<br>このHTMLは単体で閲覧できます。再編集にはJSONを使用してください。</footer>
  </main>
  <script>
    const imageCard = document.querySelector("#image-card");
    const imageToggle = document.querySelector("#image-toggle");
    if (imageCard && imageToggle) imageToggle.addEventListener("click", () => {
      const flipped = imageCard.classList.toggle("is-flipped");
      imageToggle.setAttribute("aria-pressed", String(flipped));
    });
  </script>
</body>
</html>`;
}
