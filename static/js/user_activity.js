document.addEventListener('DOMContentLoaded', () => {
  
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  localStorage.setItem('user_timezone', userTimezone);

  const ctx = document.getElementById('activityChart').getContext('2d');
  let chart;

  function showMetrics(type) {
    const messagesMetrics = document.querySelector('.messages-metrics');
    const timeMetrics = document.querySelector('.time-metrics');
    const attendanceMetrics = document.querySelector('.attendance-metrics');

    messagesMetrics.style.display = type === 'messages' ? 'block' : 'none';
    timeMetrics.style.display = type === 'time' ? 'block' : 'none';
    attendanceMetrics.style.display = type === 'attendance' ? 'block' : 'none';
  }

  // Функция для инициализации/обновления графика
  function updateChart(dataType) {
    let datasetLabel, yAxisLabel, data;

    if (dataType === 'messages') {
      datasetLabel = 'Messages per Day';
      yAxisLabel = 'Messages';
      data = graphData.messages;
      showMetrics('messages'); // Добавлено
    } else if (dataType === 'minutes') {
      datasetLabel = 'Minutes per Day';
      yAxisLabel = 'Minutes';
      data = graphData.minutes;
      showMetrics('time'); // Добавлено
    } else if (dataType === 'attendance') {
      datasetLabel = 'Sessions per Day';
      yAxisLabel = 'Sessions';
      data = graphData.attendance;
      showMetrics('attendance'); // Добавлено
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