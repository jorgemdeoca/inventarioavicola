const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

html = html.replace('<input="Buscar cliente" type="text" id="searchInput" />', '<input class="bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg pl-9 pr-3 py-1.5 text-body-sm font-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container w-64 transition-all" placeholder="Buscar cliente o remisión..." type="text" id="searchInput" />');

fs.writeFileSync('public/index.html', html);
console.log('Fixed search IDs properly');
