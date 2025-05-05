document.addEventListener('DOMContentLoaded', () => {
    const chatId = document.body.dataset.chatId;
    const isGroup = document.body.dataset.isGroup === '1';
    const chatName = document.getElementById('chatName');
    const messagesContainer = document.querySelector('.messages');
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendButton');
    const emojiToggle = document.getElementById('emojiToggle');
    const emojiPicker = document.getElementById('emojiPicker');
    const contextMenu = document.getElementById('contextMenu');
    const backIcon = document.getElementById('backIcon');
  
    let activeMessage = null;
  
    // WebSocket connection
    const socket = new WebSocket(
      'ws://' + window.location.host + '/ws/chat/' + (isGroup ? 'group' : 'user') + '/' + chatId + '/'
    );
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageDiv = entry.target;
          const messageId = messageDiv.dataset.messageId;
    
          if (messageDiv.classList.contains('incoming') && !messageDiv.classList.contains('read')) {
            socket.send(JSON.stringify({
              action: 'read',
              message_id: messageId
            }));
            messageDiv.classList.add('read'); // помечаем, что уже отправили
          }
        }
      });
    }, {
      threshold: 1.0  // 100% должно быть видно
    });    

    // Group name click handler
    chatName.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isGroup) {
        window.location.href = `group_info?group_id=${chatId}`;
      } else {
        alert('Это не групповой чат.');
      }
    });
  
    chatName.addEventListener('touchstart', (e) => {
      e.preventDefault();
      chatName.click();
    });
  
    // Back button
    backIcon.addEventListener('click', () => {
      window.location.href = '/home';
    });
  
    // WebSocket message handler
    socket.onmessage = function(e) {
      const data = JSON.parse(e.data);
      const action = data.action;
  
      if (action === 'send') {
        const message = data.message;
        const isOwn = message.sender === userName;
        const div = document.createElement('div');
        div.className = `message ${isOwn ? 'outgoing' : 'incoming'}`;
        div.dataset.messageId = message.id;
        div.textContent = message.content;
        if (isOwn && message.is_read) {
          div.innerHTML += `<img src="/static/image/check.png" class="read-status" alt="✓">`;
        }
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (!isOwn) {
          observer.observe(div);
        }
      } else if (action === 'edit') {
        const message = data.message;
        const messageDiv = document.querySelector(`.message[data-message-id="${message.id}"]`);
        if (messageDiv) {
          messageDiv.textContent = message.content;
          if (messageDiv.classList.contains('outgoing') && message.is_read) {
            messageDiv.innerHTML += `<img src="/static/image/check.png" class="read-status" alt="✓">`;
          }
        }
      } else if (action === 'delete') {
        const messageDiv = document.querySelector(`.message[data-message-id="${data.message_id}"]`);
        if (messageDiv) {
          messageDiv.remove();
        }
      } else if (action === 'read') {
        const messageDiv = document.querySelector(`.message[data-message-id="${data.message_id}"]`);
        if (messageDiv && messageDiv.classList.contains('outgoing')) {
          messageDiv.innerHTML = messageDiv.textContent + `<img src="/static/image/check.png" class="read-status" alt="✓">`;
        }
      }
    };
  
    socket.onclose = function(e) {
      console.error('Chat socket closed unexpectedly');
    };
  
    // Send message
    sendBtn.addEventListener('click', () => {
      const content = input.value.trim();
      if (content) {
        socket.send(JSON.stringify({
          'action': 'send',
          'content': content
        }));
        input.value = '';
      }
    });
  
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });
  
    // Emoji picker
    emojiToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      emojiPicker.style.display = emojiPicker.style.display === 'flex' ? 'none' : 'flex';
    });
  
    emojiPicker.addEventListener('click', (e) => {
      if (e.target.tagName === 'SPAN') {
        input.value += e.target.textContent;
        input.focus();
      }
    });
  
    // Context menu
    function hideContextMenu() {
      if (activeMessage) {
        activeMessage.style.marginBottom = '';
        activeMessage.classList.remove('active');
        activeMessage = null;
      }
      contextMenu.style.opacity = '0';
      contextMenu.style.transform = 'translateY(-5px)';
      contextMenu.style.visibility = 'hidden';
      setTimeout(() => {
        contextMenu.style.display = 'none';
      }, 200);
    }
  
    messagesContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const messageEl = e.target.closest('.message');
      if (messageEl && messageEl.classList.contains('outgoing')) {
        if (activeMessage) {
          activeMessage.style.marginBottom = '';
          activeMessage.classList.remove('active');
        }
        activeMessage = messageEl;
        messageEl.classList.add('active');
  
        contextMenu.style.display = 'flex';
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = '-9999px';
        const menuHeight = contextMenu.offsetHeight;
  
        messageEl.style.marginBottom = `${menuHeight}px`;
  
        const rect = messageEl.getBoundingClientRect();
        contextMenu.style.position = 'fixed';
        contextMenu.style.left = `${rect.right - 80}px`;
        contextMenu.style.top = `${rect.bottom + 5}px`;
  
        contextMenu.style.opacity = '1';
        contextMenu.style.transform = 'translateY(0)';
        contextMenu.style.visibility = 'visible';
      }
    });
  
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu') && !e.target.closest('.message.active')) {
        hideContextMenu();
      }
    });
  
    contextMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  
    // Edit message
    document.getElementById('editMessage').addEventListener('click', () => {
      if (!activeMessage) return;
      const messageId = activeMessage.dataset.messageId;
      const oldText = activeMessage.textContent.trim();
      const newText = prompt('Изменить сообщение:', oldText);
  
      if (newText !== null && newText !== oldText) {
        socket.send(JSON.stringify({
          'action': 'edit',
          'message_id': messageId,
          'content': newText.trim()
        }));
        hideContextMenu();
      }
    });
  
    // Delete message
    document.getElementById('deleteMessage').addEventListener('click', () => {
      if (!activeMessage) return;
      const messageId = activeMessage.dataset.messageId;
      if (confirm('Delete this message?')) {
        socket.send(JSON.stringify({
          'action': 'delete',
          'message_id': messageId
        }));
        hideContextMenu();
      }
    });
  
    // Mark messages as read
    socket.onopen = function(e) {
    
      // Отправка "прочитано" только после установления соединения
      document.querySelectorAll('.message.incoming').forEach(messageDiv => {
        const messageId = messageDiv.dataset.messageId;
        socket.send(JSON.stringify({
          'action': 'read',
          'message_id': messageId
        }));
      });
    };    
  
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    document.querySelectorAll('.message.incoming').forEach(messageDiv => {
      if (!messageDiv.classList.contains('read')) {
        observer.observe(messageDiv);
      }
    });    

    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('toggle-original-btn')) {
        const messageDiv = event.target.closest('.message');
        const original = messageDiv.querySelector('.original');
        const translated = messageDiv.querySelector('.translated');
    
        if (original && translated) {
          const isOriginalVisible = original.style.display === 'block';
    
          original.style.display = isOriginalVisible ? 'none' : 'block';
          translated.style.display = isOriginalVisible ? 'block' : 'none';
          event.target.textContent = isOriginalVisible ? 'Показать оригинал' : 'Скрыть оригинал';
        }
      }
    });      
  });