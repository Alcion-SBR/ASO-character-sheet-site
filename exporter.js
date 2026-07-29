function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]);
}

export function buildStandaloneHtml({ title, sheetText, generatedAt = new Date() }) {
  const safeTitle = escapeHtml(title || "A.S.OTRPGキャラクターシート");
  const date = escapeHtml(generatedAt.toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" }));
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
    section { padding: 24px 32px; } h2 { margin: 0; font-size: 17px; letter-spacing: 0; }
    pre { margin: 14px 0 0; padding: 16px; overflow-x: auto; background: #202b35; color: #eef5f8; font: 13px/1.55 ui-monospace, "Cascadia Mono", "Meiryo", monospace; white-space: pre-wrap; }
    footer { padding: 16px 32px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; }
    @media (max-width: 680px) { body { background: #fff; } main { width: 100%; margin: 0; border: 0; box-shadow: none; } header, section, footer { padding-left: 16px; padding-right: 16px; } }
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
    <section><h2>キャラクターシート</h2><pre>${escapeHtml(sheetText)}</pre></section>
    <footer>出力日時: ${date}<br>このHTMLは単体で閲覧できます。再編集にはJSONを使用してください。</footer>
  </main>
</body>
</html>`;
}
