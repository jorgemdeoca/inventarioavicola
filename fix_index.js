const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

if (!html.includes('id="clearSearch"')) {
  html = html.replace('id="searchInput"', 'id="searchInput" /><button id="clearSearch" style="display:none;" type="button"></button>');
}

if (!html.includes('id="emptyState"')) {
  html = html.replace('</table>', '</table><div id="emptyState" style="display:none;"></div><div id="loader" style="display:none;"></div>');
}

html = html.replace(/filter-chip/g, 'filter-tab');

fs.writeFileSync('public/index.html', html);
console.log('Fixed index.html elements');
