const fs = require('fs');
let html = fs.readFileSync('public/login.html', 'utf8');

const oldScript = "const res = await API.login(username, password);\n          if (res.success) {\n            window.location.href = '/index.html';\n          } else {\n            authError.textContent = res.message || 'Credenciales inválidas';\n            authError.classList.remove('hidden');\n          }";

const newScript = "const res = await fetch('/api/auth/login', {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify({ username, password })\n          });\n          const data = await res.json();\n          if (res.ok && data.success) {\n            localStorage.setItem('pollos-token', data.token);\n            localStorage.setItem('pollos-user', JSON.stringify(data.user));\n            window.location.href = '/index.html';\n          } else {\n            authError.textContent = data.message || data.error || 'Credenciales inválidas';\n            authError.classList.remove('hidden');\n          }";

html = html.replace(oldScript, newScript);
fs.writeFileSync('public/login.html', html);
console.log('Fixed API.login call');
