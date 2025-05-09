const form = document.getElementById('register-form');
form.addEventListener('submit', async function(e) {
  e.preventDefault();

  ['username', 'email', 'password1', 'password2'].forEach(field => {
    document.getElementById(`${field}-error`).innerText = '';
  });

  const formData = new FormData(form);
  const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

  const response = await fetch(form.action, {
    method: "POST",
    headers: {
      'X-CSRFToken': csrfToken
    },
    body: formData
  });

  const data = await response.json();

  if (data.success) {
    window.location.href = data.redirect_url;
  } else {
    data.errors.forEach(error => {
      const [field, message] = error.split(': ');
      const errorElement = document.getElementById(`${field}-error`);
      if (errorElement) {
        errorElement.innerText = message;
      }
    });
  }
});
