const { execSync } = require('child_process');
const fs = require('fs');
const oldHtml = execSync('git show 9636703:public/index.html').toString('utf8');
const lines = oldHtml.split('\n');
const modalsAndScripts = lines.slice(90, 201).join('\n');

let html = fs.readFileSync('public/index.html', 'utf8');

const inputOld = '<input class="bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg pl-9 pr-3 py-1.5 text-body-sm font-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container w-64 transition-all" placeholder="Buscar cliente o remisión..." type="text"/>';
const inputNew = '<input class="bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg pl-9 pr-3 py-1.5 text-body-sm font-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container w-64 transition-all" placeholder="Buscar cliente o remisión..." type="text" id="searchInput" /><button id="clearSearch" class="hidden absolute right-3 top-2.5 text-outline material-symbols-outlined text-[18px]">close</button>';
html = html.replace(inputOld, inputNew);

html = html.replace('</table>', '</table><div id="emptyState" class="hidden text-center py-8 text-outline">No hay ventas para mostrar</div><div id="loader" class="hidden text-center py-8 text-primary">Cargando...</div>');

html = html.replace('</body></html>', modalsAndScripts + '\n</body></html>');
fs.writeFileSync('public/index.html', html);
console.log('Fixed everything');
