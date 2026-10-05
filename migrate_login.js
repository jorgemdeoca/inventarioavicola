const fs = require('fs');
let html = fs.readFileSync('public/login_preview.html', 'utf8');
const oldHtml = fs.readFileSync('public/login.html', 'utf8');

const scriptMatch = oldHtml.match(/<script>([\s\S]*?)<\/script>/);
const oldScript = scriptMatch ? scriptMatch[0] : '';

html = html.replace('<form class="space-y-5" onsubmit="event.preventDefault();">', '<form class="space-y-5" id="loginForm" novalidate>');
html = html.replace('type="submit"', 'type="submit" id="btnLogin"');

html = html.replace(/(<input[^>]+id="username"[^>]*>[\s\S]*?<\/div>)/, '\\n<span class="text-red-400 text-xs mt-1 block" id="errorUsername"></span>');
html = html.replace(/(<input[^>]+id="password"[^>]*>[\s\S]*?<\/div>)/, '\\n<span class="text-red-400 text-xs mt-1 block" id="errorPassword"></span>');

const alertHtml = '<div class="hidden bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2 mb-4" id="alertError" role="alert"><span class="material-symbols-outlined text-[18px]">error</span><span id="alertMsg">Error al iniciar sesión</span></div>';
html = html.replace('<!-- Form Fields Stack -->', alertHtml + '\n<!-- Form Fields Stack -->');

html = html.replace(/<script>[\s\S]*?<\/script>/, oldScript);

fs.writeFileSync('public/login.html', html);
console.log('login.html migrated successfully.');
