const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData(loginForm);
  const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

  const response = await fetch(loginForm.action, {
    method: "POST",
    headers: {
      'X-CSRFToken': csrfToken
    },
    body: formData
  });

  const data = await response.json();
  const errorBox = document.getElementById('login-error-box');
  errorBox.innerHTML = '';

  if (data.success) {
    window.location.href = data.redirect_url;
  } else {
    data.errors.forEach(err => {
      const p = document.createElement('p');
      p.textContent = err;
      errorBox.appendChild(p);
    });
  }
});