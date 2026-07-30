import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const outputName = "A.S.OTRPGキャラクターシート配布版.html";
const pagesDirectory = join(root, "cloudflare-pages");

const read = (name) => readFile(join(root, name), "utf8");
const exportNames = (source) => [...source.matchAll(/\bexport\s+(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)].map((match) => match[1]);
const withoutImports = (source) => source.replace(/import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\r?\n/g, "");
const withoutExports = (source) => source.replace(/\bexport\s+(?=(?:async\s+)?(?:const|let|var|function|class)\b)/g, "");
const safeInlineScript = (source) => source.replace(/<\/script/gi, "<\\/script");

function bundledModule(name, source, dependencies = []) {
  const bindings = dependencies.map((dependency) => `const { ${dependency.exports.join(", ")} } = ${dependency.name};`).join("\n");
  const body = withoutExports(withoutImports(source));
  const exports = exportNames(source);
  return `const ${name} = (() => {\n${bindings}\n${body}\nreturn { ${exports.join(", ")} };\n})();`;
}

const [styles, wireframeStyles, dataSource, logicSource, cocofoliaSource, exporterSource, mediaSource, appSource] = await Promise.all([
  read("styles.css"),
  read("wireframe.css"),
  read("data.js"),
  read("logic.js"),
  read("cocofolia.js"),
  read("exporter.js"),
  read("media.js"),
  read("app.js"),
]);

const modules = [
  bundledModule("dataModule", dataSource),
  bundledModule("logicModule", logicSource, [{ name: "dataModule", exports: exportNames(dataSource) }]),
  bundledModule("cocofoliaModule", cocofoliaSource),
  bundledModule("exporterModule", exporterSource),
  bundledModule("mediaModule", mediaSource),
  bundledModule("appModule", appSource, [
    { name: "dataModule", exports: exportNames(dataSource) },
    { name: "logicModule", exports: exportNames(logicSource) },
    { name: "cocofoliaModule", exports: exportNames(cocofoliaSource) },
    { name: "exporterModule", exports: exportNames(exporterSource) },
    { name: "mediaModule", exports: exportNames(mediaSource) },
  ]),
].join("\n\n");

const output = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="A.S.O.TRPG のローカル利用向けキャラクターシート" />
    <title>A.S.OTRPGキャラクターシート</title>
    <style>
${styles}
${wireframeStyles}
    </style>
  </head>
  <body>
    <div id="app"></div>
    <input id="json-import" type="file" accept="application/json,.json" hidden />
    <script>
${safeInlineScript(modules)}
    </script>
  </body>
</html>
`;

await writeFile(join(root, outputName), output, "utf8");
await mkdir(pagesDirectory, { recursive: true });
await writeFile(join(pagesDirectory, "index.html"), output, "utf8");
console.log(`Generated ${outputName} and cloudflare-pages/index.html`);
