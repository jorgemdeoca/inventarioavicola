const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Match any placeholder starting with 'Buscar'
html = html.replace(/<input class="bg-surface-container-lowest[^>]+placeholder="Buscar[^>]+type="text"\/>/, '<input class="bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg pl-9 pr-3 py-1.5 text-body-sm font-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container w-64 transition-all" placeholder="Buscar cliente o remision..." type="text" id="searchInput" /><button id="clearSearch" class="hidden absolute right-3 top-2.5 text-outline material-symbols-outlined text-[18px]">close</button>');

// Remove duplicate tags
html = html.replace(/<\/body>\n<\/html>\n<\/body>\n<\/html>/g, '</body>\n</html>');

fs.writeFileSync('public/index.html', html);
console.log('Fixed search 3');
