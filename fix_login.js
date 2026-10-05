const fs = require('fs');

let html = fs.readFileSync('public/login_preview.html', 'utf8');

// Add loginForm ID
html = html.replace('<form class="flex flex-col gap-5">', '<form class="flex flex-col gap-5" id="loginForm" novalidate>');

// Username error span
html = html.replace(/(<input[^>]+id="username"[^>]*>)/, '$1\n<span class="text-red-400 text-xs mt-1 block" id="errorUsername"></span>');

// Password error span
html = html.replace(/(<input[^>]+id="password"[^>]*>)/, '$1\n<span class="text-red-400 text-xs mt-1 block" id="errorPassword"></span>');

// Global auth error span (right above the submit button)
html = html.replace('<button class="w-full bg-primary', '<div id="authError" class="hidden bg-error/20 text-error p-3 rounded-lg text-body-sm mb-2 text-center"></div>\n<button type="submit" class="w-full bg-primary');

// Append scripts at the end of the body
const scripts = `
  <script src="js/api.js"></script>
  <script src="js/validation.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('loginForm');
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const authError = document.getElementById('authError');
        
        document.getElementById('username').classList.remove('error');
        document.getElementById('password').classList.remove('error');
        document.getElementById('errorUsername').textContent = '';
        document.getElementById('errorPassword').textContent = '';
        authError.classList.add('hidden');
        
        let hasErr = false;
        if (!username) {
          document.getElementById('username').classList.add('error');
          document.getElementById('errorUsername').textContent = 'El usuario es obligatorio';
          hasErr = true;
        }
        if (!password) {
          document.getElementById('password').classList.add('error');
          document.getElementById('errorPassword').textContent = 'La contraseña es obligatoria';
          hasErr = true;
        }
        
        if (hasErr) return;
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Ingresando...';
        btn.disabled = true;
        
        try {
          const res = await API.login(username, password);
          if (res.success) {
            window.location.href = '/index.html';
          } else {
            authError.textContent = res.message || 'Credenciales inválidas';
            authError.classList.remove('hidden');
          }
        } catch (err) {
          authError.textContent = 'Error de conexión con el servidor.';
          authError.classList.remove('hidden');
        } finally {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      });
    });
  </script>
`;
html = html.replace('</body>', scripts + '\n</body>');

fs.writeFileSync('public/login.html', html);
console.log('Fixed login.html properly');
