const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

if (!html.includes('id="searchInput"')) {
    html = html.replace('placeholder="Buscar cliente o remisión..." type="text"', 'placeholder="Buscar cliente o remisión..." type="text" id="searchInput"');
}
if (!html.includes('id="clearSearch"')) {
    html = html.replace('id="searchInput"/>', 'id="searchInput"/><button id="clearSearch" class="hidden absolute right-3 top-2.5 text-outline material-symbols-outlined text-[18px]">close</button>');
}
if (!html.includes('id="emptyState"')) {
    html = html.replace('</table>', '</table><div id="emptyState" class="hidden text-center py-8 text-outline">No hay ventas para mostrar</div>');
}
if (!html.includes('id="loader"')) {
    html = html.replace('</table>', '</table><div id="loader" class="hidden text-center py-8 text-primary">Cargando...</div>');
}

fs.writeFileSync('public/index.html', html);
console.log('Fixed IDs');
