const fs = require('fs');
const path = require('path');
const lucide = require('lucide');

const rootDir = path.join(__dirname, '..');
const indexHtmlPath = path.join(rootDir, 'index.html');
const appJsPath = path.join(rootDir, 'app.js');

let indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
let appJs = fs.readFileSync(appJsPath, 'utf-8');

const iconsSet = new Set();

const dynamicIcons = [
  'party-popper', 'play',
  'sun', 'cloud-sun', 'cloud', 'cloud-fog', 'cloud-drizzle',
  'cloud-rain', 'snowflake', 'cloud-rain-wind', 'cloud-lightning'
];
dynamicIcons.forEach(i => iconsSet.add(i));

const iTagRegex = /<i\s+([^>]*?)data-lucide="([^"]+)"([^>]*?)>.*?<\/i>/g;

let match;
while ((match = iTagRegex.exec(indexHtml)) !== null) {
  iconsSet.add(match[2]);
}

// Scan <use href="#lucide-..."> dalam index.html dan app.js
const useHrefRegex = /href="#lucide-([a-z0-9-]+)"/g;
for (const src of [indexHtml, appJs]) {
  while ((match = useHrefRegex.exec(src)) !== null) {
    iconsSet.add(match[1]);
  }
}

const icons = Array.from(iconsSet).sort();

console.log(`Found ${icons.length} unique icons.`);

let spriteSvg = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">\n  <defs>\n`;

icons.forEach(iconName => {
  const toPascalCase = str => str.replace(/(^\w|-\w)/g, g => g.replace('-', '').toUpperCase());
  const pascalName = toPascalCase(iconName);
  const iconAst = lucide.icons[pascalName];
  
  if (!iconAst) {
    console.warn(`Warning: Icon ${iconName} (Pascal: ${pascalName}) not found in lucide!`);
    return;
  }
  
  const children = iconAst;
  
  let innerElements = children.map(child => {
    let tag = child[0];
    let cattrs = child[1] || {};
    let attrsStr = Object.entries(cattrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `      <${tag} ${attrsStr}></${tag}>`;
  }).join('\n');
  
  spriteSvg += `    <symbol id="lucide-${iconName}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n`;
  spriteSvg += innerElements + '\n';
  spriteSvg += `    </symbol>\n`;
});

spriteSvg += `  </defs>\n</svg>`;

indexHtml = indexHtml.replace(iTagRegex, (fullMatch, before, iconName, after) => {
  const attrRegex = /([a-zA-Z0-9-]+)="([^"]*)"/g;
  let allAttrs = (before + ' ' + after).trim();
  let attrsMap = {};
  
  let attrMatch;
  while ((attrMatch = attrRegex.exec(allAttrs)) !== null) {
    attrsMap[attrMatch[1]] = attrMatch[2];
  }
  
  const size = attrsMap['size'] || '24';
  const cls = attrsMap['class'] ? `lucide-icon ${attrsMap['class']}` : 'lucide-icon';
  const style = attrsMap['style'] ? ` style="${attrsMap['style']}"` : '';
  const id = attrsMap['id'] ? ` id="${attrsMap['id']}"` : '';
  const title = attrsMap['title'] ? ` title="${attrsMap['title']}"` : '';
  
  return `<svg class="${cls}" width="${size}" height="${size}"${style}${id}${title}><use href="#lucide-${iconName}"></use></svg>`;
});

indexHtml = indexHtml.replace(/<script[^>]*src="[^"]*lucide\.min\.js"[^>]*><\/script>\s*/g, '');
indexHtml = indexHtml.replace(/<script>\s*\/\/\s*Initialize Lucide Icons\s*document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*{\s*lucide\.createIcons\(\);\s*}\);\s*<\/script>\s*/g, '');

const existingSpriteRegex = /<!-- SVG Sprite for Lucide Icons -->\n<svg[\s\S]*?<\/svg>/g;
if (existingSpriteRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(existingSpriteRegex, `<!-- SVG Sprite for Lucide Icons -->\n${spriteSvg}`);
} else {
  indexHtml = indexHtml.replace(/<body[^>]*>/i, (match) => {
    return `${match}\n\n<!-- SVG Sprite for Lucide Icons -->\n${spriteSvg}\n`;
  });
}

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf-8');
console.log('Updated index.html');

appJs = appJs.replace(/<i data-lucide="\s*'\s*\+\s*iconName\s*\+\s*'" size="44"><\/i>/g, '<svg class="lucide-icon" width="44" height="44"><use href="#lucide-\' + iconName + \'"></use></svg>');

appJs = appJs.replace(/<i data-lucide="play" size="12" style="([^"]+)"><\/i>/g, '<svg class="lucide-icon" width="12" height="12" style="$1"><use href="#lucide-play"></use></svg>');

appJs = appJs.replace(/<i data-lucide="party-popper" size="16"><\/i>/g, '<svg class="lucide-icon" width="16" height="16"><use href="#lucide-party-popper"></use></svg>');

appJs = appJs.replace(/if\(window\.lucide\)\s*lucide\.createIcons\(\{attrs:\{'stroke-width':\s*2\}\}\);/g, '');

fs.writeFileSync(appJsPath, appJs, 'utf-8');
console.log('Updated app.js');
