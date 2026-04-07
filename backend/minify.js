const fs = require('fs');
const { minify } = require('terser');

(async () => {
  const html = fs.readFileSync('public/index.html', 'utf-8');
  let result = html;
  const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
  let match;
  const replacements = [];

  while ((match = scriptRegex.exec(html)) !== null) {
    const original = match[1];
    if (original.trim().length < 10) continue;
    try {
      const min = await minify(original, {
        compress: { passes: 2, drop_console: false, dead_code: true, unused: true },
        mangle: { toplevel: false }
      });
      if (min.code) {
        replacements.push({ from: match[0], to: '<script>' + min.code + '</script>' });
      }
    } catch (e) { /* skip */ }
  }

  for (const r of replacements) {
    result = result.replace(r.from, r.to);
  }

  // Minify CSS
  result = result.replace(/<style>([\s\S]*?)<\/style>/g, (m, css) => {
    const minCss = css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{};:,>~+])\s*/g, '$1')
      .replace(/;\}/g, '}')
      .trim();
    return '<style>' + minCss + '</style>';
  });

  // Remove HTML comments and collapse whitespace
  result = result.replace(/<!--[\s\S]*?-->/g, '');
  result = result.replace(/>\s+</g, '><');

  fs.writeFileSync('public/index.html', result);
  console.log('Original:', Math.round(html.length / 1024), 'KB');
  console.log('Minified:', Math.round(result.length / 1024), 'KB');
  console.log('Reducao:', Math.round((1 - result.length / html.length) * 100) + '%');
})();
