document.addEventListener('DOMContentLoaded', () => {
  const backIcon = document.getElementById('backIcon');
  const exitBtn = document.getElementById('exitBtn');
  const renameInput = document.getElementById('renameInput');

  // Back button
  backIcon.addEventListener('click', () => {
    window.location.href = '/home';
  });

  // Exit group
  exitBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to exit the group?')) {
      fetch(`/group_info/${groupId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ action: 'exit' })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          window.location.href = data.redirect_url;
        } else {
          alert('Error: ' + data.error);
        }
      })
      .catch(error => {
        alert('Error: ' + error);
      });
    }
  });

  // Rename group (if user is owner)
  if (renameInput) {
    renameInput.addEventListener('change', () => {
      const newName = renameInput.value.trim();
      if (newName) {
        fetch(`/group_info/${groupId}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          body: JSON.stringify({ action: 'rename', name: newName })
        })
        .then(response => response.json())
        .then(data => {
          if (!data.success) {
            alert('Error: ' + data.error);
            renameInput.value = renameInput.defaultValue;
          }
        });
      }
    });
  }
});