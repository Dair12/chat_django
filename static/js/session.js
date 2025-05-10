document.addEventListener('DOMContentLoaded', () => {
    const chatId = document.body.dataset.chatId;
    const isGroup = document.body.dataset.isGroup === '1';

    // Отправка heartbeat или завершения сессии
    async function sendSessionUpdate(action = 'heartbeat') {
        if (!isGroup) return; // Heartbeat только для групповых чатов

        try {
            const response = await fetch(`/chat/group/${chatId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify({ action })
            });
            const data = await response.json();
            console.log(`${action} response:`, data);
        } catch (error) {
            console.error(`Error in ${action}:`, error);
        }
    }

    // Запускаем heartbeat каждые 30 секунд
    if (isGroup) {
        const heartbeatInterval = setInterval(() => sendSessionUpdate('heartbeat'), 30000);

        // Завершаем сессию при закрытии страницы
        window.addEventListener('beforeunload', () => {
            clearInterval(heartbeatInterval);
            sendSessionUpdate('end_session');
        });
    }
});