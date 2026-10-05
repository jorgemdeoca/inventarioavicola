const fs = require('fs');
let html = fs.readFileSync('public/login.html', 'utf8');

html = html.replace(/<form\b[^>]*>/, '<form class="space-y-5" id="loginForm" novalidate>');

fs.writeFileSync('public/login.html', html);
console.log('Fixed login form ID');
