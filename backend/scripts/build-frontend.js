const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let terserMinify;
try {
  terserMinify = require('terser').minify;
} catch {
  console.log('terser não disponível — JS não será minificado');
}

const repoRoot = path.resolve(__dirname, '..', '..');
const sourceHtmlPath = path.join(repoRoot, 'nutri_saas_mockup_v2.html');
const publicDir = path.join(repoRoot, 'backend', 'public');
const assetsDir = path.join(publicDir, 'assets');
const generatedAssetPattern = /^app(?:\.[0-9a-f]{8})?\.(css|js)$/i;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
}

function cleanupGeneratedAssets(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  for (const entry of fs.readdirSync(dirPath)) {
    if (generatedAssetPattern.test(entry)) {
      fs.unlinkSync(path.join(dirPath, entry));
    }
  }
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

async function buildFrontend() {
  const html = fs.readFileSync(sourceHtmlPath, 'utf8');

  const styleStart = html.indexOf('<style>');
  const styleEnd = html.indexOf('</style>', styleStart);
  const scriptStart = html.lastIndexOf('<script>');
  const scriptEnd = html.lastIndexOf('</script>');

  if (styleStart === -1 || styleEnd === -1 || scriptStart === -1 || scriptEnd === -1) {
    throw new Error('Nao foi possivel localizar os blocos principais de CSS/JS no HTML fonte.');
  }

  const rawCss = html.slice(styleStart + '<style>'.length, styleEnd).trim();
  const rawJs = html.slice(scriptStart + '<script>'.length, scriptEnd).trim();

  const finalCss = minifyCss(rawCss);

  // Minificar JS com terser (se disponível)
  let finalJs = rawJs;
  if (terserMinify) {
    const minifiedJs = await terserMinify(rawJs, {
      compress: { drop_console: false, passes: 2, toplevel: false, unused: false },
      mangle: false
    });
    finalJs = minifiedJs.code;
  }

  const cssFileName = `app.${hashContent(finalCss)}.css`;
  const jsFileName = `app.${hashContent(finalJs)}.js`;

  const builtHtml = [
    html.slice(0, styleStart),
    `  <link rel="preload" href="assets/${cssFileName}" as="style">\n`,
    `  <link rel="stylesheet" href="assets/${cssFileName}">\n`,
    html.slice(styleEnd + '</style>'.length, scriptStart),
    `  <script src="assets/${jsFileName}"></script>\n`,
    html.slice(scriptEnd + '</script>'.length)
  ].join('');

  ensureDir(assetsDir);
  cleanupGeneratedAssets(assetsDir);
  fs.writeFileSync(path.join(assetsDir, cssFileName), finalCss);
  fs.writeFileSync(path.join(assetsDir, jsFileName), finalJs);
  fs.writeFileSync(path.join(publicDir, 'index.html'), builtHtml);

  const jsSaved = Math.round((1 - Buffer.byteLength(finalJs) / Buffer.byteLength(rawJs)) * 100);
  console.log('Frontend buildado com sucesso.');
  console.log(`Assets gerados: ${cssFileName}, ${jsFileName}`);
  console.log(`HTML fonte: ${Math.round(Buffer.byteLength(html) / 1024)} KB`);
  console.log(`HTML gerado: ${Math.round(Buffer.byteLength(builtHtml) / 1024)} KB`);
  console.log(`CSS gerado: ${Math.round(Buffer.byteLength(rawCss) / 1024)} KB`);
  console.log(`JS gerado: ${Math.round(Buffer.byteLength(finalJs) / 1024)} KB (${jsSaved}% menor)`);
}

buildFrontend().catch(err => {
  console.error('Build falhou:', err.message);
  process.exit(1);
});