document.addEventListener('DOMContentLoaded', () => {
  const backIcon = document.getElementById('backIcon');
  const exitBtn = document.getElementById('exitBtn');
  const memberList = document.getElementById('memberList');
  const activityPanel = document.getElementById('activityPanel');
  const closeActivityBtn = document.getElementById('closeActivityBtn');
  const totalMessages = document.getElementById('totalMessages');
  const activityUsername = document.getElementById('activityUsername');
  let messageChart = null;

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

  // Rename group (for owner)
  const renameInput = document.getElementById('renameInput');
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

  // Member click to show activity (for owner only)
  if (isOwner) {
    memberList.addEventListener('click', (e) => {
      const memberItem = e.target.closest('.member-item');
      if (memberItem) {
        const userId = memberItem.dataset.userId;
        const username = memberItem.querySelector('span').textContent;

        // Fetch user activity
        fetch(`/group_info/${groupId}/user_activity/${userId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Update activity panel
            activityUsername.textContent = `${username}'s Activity`;
            totalMessages.textContent = `Total Messages: ${data.total_messages}`;

            // Destroy existing chart if it exists
            if (messageChart) {
              messageChart.destroy();
            }

            // Create new chart
            const ctx = document.getElementById('messageChart').getContext('2d');
            messageChart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: data.graph_data.labels,
                datasets: [{
                  label: 'Messages per Day',
                  data: data.graph_data.data,
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
                }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Number of Messages'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Date'
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: true
                  }
                }
              }
            });

            // Show activity panel
            activityPanel.classList.add('active');
          } else {
            alert('Error: ' + data.error);
          }
        })
        .catch(error => {
          alert('Error: ' + error);
        });
      }
    });

    // Close activity panel
    closeActivityBtn.addEventListener('click', () => {
      activityPanel.classList.remove('active');
      if (messageChart) {
        messageChart.destroy();
        messageChart = null;
      }
    });
  }
});