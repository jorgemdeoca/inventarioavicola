const fs = require('fs');
let html = fs.readFileSync('public/dashboard_preview.html', 'utf8');
const oldHtml = fs.readFileSync('public/index.html', 'utf8');

const modalsMatch = oldHtml.match(/(<!-- MODALS -->[\s\S]*?)<\/body>/);
const modalsHtml = modalsMatch ? modalsMatch[1] : '';

html = html.replace('<!-- Tailwind CSS -->', '<link rel="stylesheet" href="css/styles.css">\n<!-- Tailwind CSS -->');

html = html.replace('title="Ajustes de Sistema"', 'title="Ajustes de Sistema" id="themeToggle"');
html = html.replace('<div class="flex items-center gap-2 pl-2 border-l border-outline-variant/30">', '<div class="flex items-center gap-2 pl-2 border-l border-outline-variant/30" id="btnLogout" style="cursor:pointer" title="Cerrar Sesión">');

html = html.replace('<button class="bg-primary-container hover:bg-surface-tint text-on-primary-container', '<button id="btnNuevaVenta" class="bg-primary-container hover:bg-surface-tint text-on-primary-container');
html = html.replace('placeholder="Buscar cliente o remisión..." type="text"', 'placeholder="Buscar cliente o remisión..." type="text" id="searchInput"');

html = html.replace('Todos (28)', 'Todos');
html = html.replace('Pagados (22)', 'Pagado');
html = html.replace('Pendientes (4)', 'Pendiente');
html = html.replace('Parciales (2)', 'Parcial');

html = html.replace('<button class="px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-semibold">Todos</button>', '<button id="filterTodos" class="px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-semibold filter-chip active" data-filter="Todos">Todos</button>');
html = html.replace('<button class="px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface transition-colors">Pagado</button>', '<button id="filterPagado" class="px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface transition-colors filter-chip" data-filter="Pagado">Pagado</button>');
html = html.replace('<button class="px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface transition-colors">Pendiente</button>', '<button id="filterPendiente" class="px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface transition-colors filter-chip" data-filter="Pendiente">Pendiente</button>');
html = html.replace('<button class="px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface transition-colors">Parcial</button>', '<button id="filterParcial" class="px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface transition-colors filter-chip" data-filter="Parcial">Parcial</button>');

html = html.replace('<tbody class="divide-y divide-outline-variant/15 text-body-sm font-body-sm">', '<tbody id="ventasBody" class="divide-y divide-outline-variant/15 text-body-sm font-body-sm">');
html = html.replace(/<tbody id="ventasBody"[\s\S]*?<\/tbody>/, '<tbody id="ventasBody" class="divide-y divide-outline-variant/15 text-body-sm font-body-sm"></tbody>');

html = html.replace('<span class="text-metric-display font-metric-display text-on-surface tracking-tight">,250.00 <span class="text-label-md font-label-md font-normal text-outline">USD</span></span>', '<span id="statTotalGanancias" class="text-metric-display font-metric-display text-on-surface tracking-tight">.00 <span class="text-label-md font-label-md font-normal text-outline">USD</span></span>');
html = html.replace('<div class="text-metric-display font-metric-display text-on-surface">18,420 <span class="text-headline-sm font-headline-sm font-normal text-outline">kg</span></div>', '<div id="statTotalPeso" class="text-metric-display font-metric-display text-on-surface">0 <span class="text-headline-sm font-headline-sm font-normal text-outline">kg</span></div>');
html = html.replace('<div class="text-metric-display font-metric-display text-primary-container">,120.00 <span class="text-headline-sm font-headline-sm font-normal text-outline">USD</span></div>', '<div id="statTotalGastos" class="text-metric-display font-metric-display text-primary-container">.00 <span class="text-headline-sm font-headline-sm font-normal text-outline">USD</span></div>');
html = html.replace('<div class="text-metric-display font-metric-display text-on-surface">12,450 <span class="text-headline-sm font-headline-sm font-normal text-outline">aves en pie</span></div>', '<div id="statTotalPollos" class="text-metric-display font-metric-display text-on-surface">0 <span class="text-headline-sm font-headline-sm font-normal text-outline">aves vendidas</span></div>');

html = html.replace('</body>', modalsHtml + '\n</body>');

fs.writeFileSync('public/index.html', html);
console.log('index.html migrated successfully.');
