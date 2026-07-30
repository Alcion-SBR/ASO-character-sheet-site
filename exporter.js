function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function editablePayloadMarkup(payload) {
  return `<script id="aso-editable-payload" type="application/json">${safeJson(payload)}</script>`;
}

export function buildEditableHtml({ documentHtml, state, images = {}, sheetId, generatedAt = new Date() }) {
  if (!documentHtml.includes("aso-editable-payload")) throw new Error("Editable HTML template is missing.");
  const payload = {
    schemaVersion: 1,
    sheetId,
    state: { ...state, exportedAt: generatedAt.toISOString() },
    images,
  };
  const marker = /<script\b(?=[^>]*\bid=["']aso-editable-payload["'])[^>]*>[\s\S]*?<\/script>/i;
  return documentHtml.replace(marker, editablePayloadMarkup(payload));
}
