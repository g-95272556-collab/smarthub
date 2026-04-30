const fs = require('fs');
const path = require('path');
const lucide = require('lucide'); // Import to get SVG strings

const rootDir = path.join(__dirname, '..');
const indexHtmlPath = path.join(rootDir, 'index.html');
const appJsPath = path.join(rootDir, 'app.js');

let indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
let appJs = fs.readFileSync(appJsPath, 'utf-8');

const iconsSet = new Set();

// Fixed icons used dynamically in app.js
const dynamicIcons = [
  'party-popper', 'play',
  'sun', 'cloud-sun', 'cloud', 'cloud-fog', 'cloud-drizzle', 
  'cloud-rain', 'snowflake', 'cloud-rain-wind', 'cloud-lightning'
];
dynamicIcons.forEach(i => iconsSet.add(i));

// Extract from index.html
const iTagRegex = /<i\s+([^>]*?)data-lucide="([^"]+)"([^>]*?)>.*?<\/i>/g;

let match;
while ((match = iTagRegex.exec(indexHtml)) !== null) {
  iconsSet.add(match[2]);
}

// Convert iconsSet to array
const icons = Array.from(iconsSet).sort();

console.log(`Found ${icons.length} unique icons.`);

// Build SVG Sprite
let spriteSvg = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">\n  <defs>\n`;

icons.forEach(iconName => {
  // Get icon data from lucide
  // lucide.icons[camelCase(iconName)] is the SVG AST array
  const toCamelCase = str => str.replace(/-([a-z0-9])/g, g => g[1].toUpperCase());
  const iconAst = lucide.icons[toCamelCase(iconName)];
  
  if (!iconAst) {
    console.warn(`Warning: Icon ${iconName} not found in lucide!`);
    return;
  }
  
  // Build paths from AST
  const attrs = iconAst[1] || {};
  const children = iconAst[2] || [];
  
  let innerElements = children.map(child => {
    let tag = child[0];
    let cattrs = child[1];
    let attrsStr = Object.entries(cattrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `      <${tag} ${attrsStr}></${tag}>`;
  }).join('\n');
  
  spriteSvg += `    <symbol id="lucide-${iconName}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n`;
  spriteSvg += innerElements + '\n';
  spriteSvg += `    </symbol>\n`;
});

spriteSvg += `  </defs>\n</svg>`;

// Replace <i data-lucide="..."> in index.html with <svg>...</svg>
indexHtml = indexHtml.replace(iTagRegex, (fullMatch, before, iconName, after) => {
  // Extract attributes from before and after
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
  
  return `<svg class="${cls}" width="${size}" height="${size}"${style}${id}><use href="#lucide-${iconName}"></use></svg>`;
});

// Remove lucide script from index.html
indexHtml = indexHtml.replace(/<script[^>]*src="[^"]*lucide\.min\.js"[^>]*><\/script>\s*/g, '');
indexHtml = indexHtml.replace(/<script>\s*\/\/\s*Initialize Lucide Icons\s*document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*{\s*lucide\.createIcons\(\);\s*}\);\s*<\/script>\s*/g, '');

// Prepend spriteSvg to body
indexHtml = indexHtml.replace(/<body[^>]*>/i, (match) => {
  return `${match}\n\n<!-- SVG Sprite for Lucide Icons -->\n${spriteSvg}\n`;
});

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf-8');
console.log('Updated index.html');

// Now update app.js
// In app.js we have: ic.innerHTML = '<i data-lucide="' + iconName + '" size="44"></i>';
// and: var marker = isNext ? '<i data-lucide="play" size="12" style="fill:currentColor;display:inline-block;margin-right:4px"></i> ' : '';

appJs = appJs.replace(/<i data-lucide="\s*'\s*\+\s*iconName\s*\+\s*'" size="44"><\/i>/g, '<svg class="lucide-icon" width="44" height="44"><use href="#lucide-\' + iconName + \'"></use></svg>');

appJs = appJs.replace(/<i data-lucide="play" size="12" style="([^"]+)"><\/i>/g, '<svg class="lucide-icon" width="12" height="12" style="$1"><use href="#lucide-play"></use></svg>');

appJs = appJs.replace(/<i data-lucide="party-popper" size="16"><\/i>/g, '<svg class="lucide-icon" width="16" height="16"><use href="#lucide-party-popper"></use></svg>');

// Remove dynamic lucide.createIcons calls in app.js
appJs = appJs.replace(/if\(window\.lucide\)\s*lucide\.createIcons\(\{attrs:\{'stroke-width':\s*2\}\}\);/g, '');

fs.writeFileSync(appJsPath, appJs, 'utf-8');
console.log('Updated app.js');

