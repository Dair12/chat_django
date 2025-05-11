document.addEventListener('DOMContentLoaded', () => {
  
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  localStorage.setItem('user_timezone', userTimezone);

  const ctx = document.getElementById('activityChart').getContext('2d');
  let chart;

  // Функция для инициализации/обновления графика
  function updateChart(dataType) {
    let datasetLabel, yAxisLabel, data;

    if (dataType === 'messages') {
      datasetLabel = 'Messages per Day';
      yAxisLabel = 'Messages';
      data = graphData.messages;
    } else if (dataType === 'minutes') {
      datasetLabel = 'Minutes per Day';
      yAxisLabel = 'Minutes';
      data = graphData.minutes;
    } else if (dataType === 'attendance') {
      datasetLabel = 'Sessions per Day';
      yAxisLabel = 'Sessions';
      data = graphData.attendance;
    } else {
      return;
    }

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
  const chartButtons = document.querySelectorAll('.chart-btn');

  chartButtons.forEach(button => {
    button.addEventListener('click', () => {
      const dataType = button.id.replace('show', '').toLowerCase(); // showMessages -> messages
      updateChart(dataType);
      chartButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });
});