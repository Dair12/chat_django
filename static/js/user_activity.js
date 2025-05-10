document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('messageChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: graphData.labels,
      datasets: [{
        label: 'Messages per Day',
        data: graphData.data,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
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
            text: 'Messages'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      }
    }
  });
});
