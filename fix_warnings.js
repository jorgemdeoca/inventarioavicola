const fs = require('fs');

const silenceScript = '<script>\n' +
'  const originalWarn = console.warn;\n' +
'  console.warn = (...args) => {\n' +
'    if (args[0] && typeof args[0] === \'string\' && args[0].includes(\'cdn.tailwindcss.com should not be used\')) return;\n' +
'    originalWarn(...args);\n' +
'  };\n' +
'</script>\n' +
'<script src="https://cdn.tailwindcss.com';

for (const file of ['public/index.html', 'public/login.html']) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('<script src="https://cdn.tailwindcss.com', silenceScript);
  fs.writeFileSync(file, html);
}
console.log('Silenced warnings');
