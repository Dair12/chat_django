document.addEventListener('DOMContentLoaded', () => {
  
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  localStorage.setItem('user_timezone', userTimezone);

  const ctx = document.getElementById('activityChart').getContext('2d');
  let chart;

  // Функция для инициализации/обновления графика
  function updateChart(dataType) {
    const isMessages = dataType === 'messages';
    const datasetLabel = isMessages ? 'Messages per Day' : 'Minutes per Day';
    const yAxisLabel = isMessages ? 'Messages' : 'Minutes';
    const data = isMessages ? graphData.messages : graphData.minutes;

    if (chart) {
      chart.destroy(); // Уничтожаем предыдущий график
    }

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: graphData.labels,
        datasets: [{
          label: datasetLabel,
          data: data,
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
              text: yAxisLabel
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
  }

  // Инициализация графика с сообщениями по умолчанию
  updateChart('messages');

  // Обработчики кнопок
  const messagesButton = document.getElementById('showMessages');
  const minutesButton = document.getElementById('showMinutes');

  messagesButton.addEventListener('click', () => {
    updateChart('messages');
    messagesButton.classList.add('active');
    minutesButton.classList.remove('active');
  });

  minutesButton.addEventListener('click', () => {
    updateChart('minutes');
    minutesButton.classList.add('active');
    messagesButton.classList.remove('active');
  });
});