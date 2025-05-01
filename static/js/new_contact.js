document.addEventListener('DOMContentLoaded', () => {
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');
    const usernameInput = document.getElementById('username-input');
  
    cancelBtn.addEventListener('click', () => {
      window.location.href = '/home/';
    });
  
    saveBtn.addEventListener('click', async () => {
      const username = usernameInput.value.trim();
      if (!username) {
        alert("Name is required");
        return;
      }
  
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
  
      const response = await fetch('/new_contact/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': csrfToken
        },
        body: new URLSearchParams({ username })
      });
  
      const data = await response.json();
      if (data.success) {
        window.location.href = data.redirect_url;
      } else {
        alert(data.errors?.username || "Error occurred");
      }
    });
  });  