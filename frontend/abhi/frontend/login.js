document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const email = document.getElementById('email');
  const password = document.getElementById('password');

  const loginBtn = document.getElementById('loginBtn');
  const btnText = document.getElementById('btnText');
  const spinner = document.getElementById('spinner');
  const mainError = document.getElementById('mainError');

  const togglePassword = document.getElementById('togglePassword');
  const TOKEN_KEY = 'axo_auth_token';

  /* ================= PASSWORD TOGGLE ================= */
  togglePassword?.addEventListener('click', () => {
    password.type =
      password.type === 'password' ? 'text' : 'password';

    togglePassword.innerHTML =
      password.type === 'text'
        ? '<i class="fa-regular fa-eye-slash"></i>'
        : '<i class="fa-regular fa-eye"></i>';
  });

  /* ================= FORM SUBMIT ================= */
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // 🔥 MUST

    console.log('🔥 LOGIN CLICKED'); // <-- YOU WILL SEE THIS

    mainError.textContent = '';
    spinner.style.display = 'inline-block';
    btnText.textContent = 'Logging in…';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.value.trim().toLowerCase(),
          password: password.value
        })
      });

      console.log('🔥 API CALLED', res.status);

      const data = await res.json();

      if (!res.ok) {
        mainError.textContent = data.error || 'Login failed';
        return;
      }

      localStorage.setItem('axo_auth_token', data.token);
localStorage.setItem('axo_user', JSON.stringify(data.user));

// 🔥 force storage flush before redirect
setTimeout(() => {
  window.location.replace('/dashboard');
}, 50);

      window.location.replace('/dashboard');

    } catch (err) {
      console.error(err);
      mainError.textContent = 'Server error';
    } finally {
      spinner.style.display = 'none';
      btnText.textContent = 'Login';
    }
  });

  /* ================= NETWORK BACKGROUND ANIMATION ================= */
/* ================= NETWORK BACKGROUND ANIMATION ================= */
(() => {
  const canvas = document.getElementById('networkCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let points = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  const POINT_COUNT = Math.min(80, Math.floor(width / 15));

  for (let i = 0; i < POINT_COUNT; i++) {
    points.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // draw dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(30, 58, 138, 0.35)';
      ctx.fill();

      // draw connections
      for (let j = i + 1; j < points.length; j++) {
        const q = points[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(30, 58, 138, ${0.12 - dist / 1200})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
/* ===== NETWORK VISIBILITY BOOST (SAFE OVERRIDE) ===== */
(() => {
  const originalDraw = window.requestAnimationFrame;

  const canvas = document.getElementById('networkCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // override global alpha slightly darker
  ctx.globalAlpha = 1;
})();


});
