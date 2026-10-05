const fs = require('fs');
let html = fs.readFileSync('public/login.html', 'utf8');

const regex = /try\s*\{\s*const res = await API\.login[^]*?\} catch/;
const replacement = "try {\n" +
"          const res = await fetch('/api/auth/login', {\n" +
"            method: 'POST',\n" +
"            headers: { 'Content-Type': 'application/json' },\n" +
"            body: JSON.stringify({ username, password })\n" +
"          });\n" +
"          const data = await res.json();\n" +
"          if (res.ok && data.success) {\n" +
"            localStorage.setItem('pollos-token', data.token);\n" +
"            localStorage.setItem('pollos-user', JSON.stringify(data.user));\n" +
"            window.location.href = '/index.html';\n" +
"          } else {\n" +
"            authError.textContent = data.message || data.error || 'Credenciales invalidas';\n" +
"            authError.classList.remove('hidden');\n" +
"          }\n" +
"        } catch";

if (regex.test(html)) {
  html = html.replace(regex, replacement);
  fs.writeFileSync('public/login.html', html);
  console.log('Fixed API.login call regex');
} else {
  console.log('Regex did not match');
}
