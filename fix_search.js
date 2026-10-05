const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

html = html.replace(/<input([^>]*?)placeholder="Buscar cliente[^>]*?type="text"\s*\/>/, '<input\="Buscar cliente" type="text" id="searchInput" /><button id="clearSearch" class="hidden absolute right-3 top-2.5 text-outline material-symbols-outlined text-[18px]">close</button>');

fs.writeFileSync('public/index.html', html);
console.log('Fixed search IDs');
