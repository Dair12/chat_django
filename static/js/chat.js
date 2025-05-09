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
            messageDiv.classList.add('read');
          }
        }
      });
    }, {
      threshold: 1.0
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

    socket.onmessage = function(e) {
      const data = JSON.parse(e.data);
      const action = data.action;

      if (action === 'send') {
        const message = data.message;
        const isOwn = message.sender === userName;
        const div = document.createElement('div');
        div.className = `message ${isOwn ? 'outgoing' : 'incoming'}`;
        div.dataset.messageId = message.id;

        let contentHtml = '';
        if (message.translated_content && message.translated_content !== message.content) {
          contentHtml = `
            <button class="toggle-original-btn">Translation</button>
            <span class="translated">${message.translated_content}</span>
            <span class="original" style="display: none;">${message.content}</span>
          `;
        } else {
          contentHtml = `<span>${message.content}</span>`;
        }
        div.innerHTML = `<div class="message-content">${contentHtml}</div>`;

        if (isOwn && message.is_read) {
          const checkImg = document.createElement('img');
          checkImg.src = "/static/image/check.png";
          checkImg.className = "read-status";
          checkImg.alt = "✓";
          div.appendChild(checkImg);
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
          const contentDiv = messageDiv.querySelector('.message-content');
          if (contentDiv) {
            let contentHtml = '';
            if (message.translated_content && message.translated_content !== message.content) {
              contentHtml = `
                <button class="toggle-original-btn">Translation</button>
                <span class="translated">${message.translated_content}</span>
                <span class="original" style="display: none;">${message.content}</span>
              `;
            } else {
              contentHtml = `<span>${message.content}</span>`;
            }
            contentDiv.innerHTML = contentHtml;

            // Сохраняем статус прочитано, если он был
            if (messageDiv.classList.contains('outgoing') && !messageDiv.querySelector('.read-status')) {
              const checkImg = document.createElement('img');
              checkImg.src = "/static/image/check.png";
              checkImg.className = "read-status";
              checkImg.alt = "✓";
              messageDiv.appendChild(checkImg);
            }
          }
        }
      } else if (action === 'delete') {
        const messageDiv = document.querySelector(`.message[data-message-id="${data.message_id}"]`);
        if (messageDiv) {
          messageDiv.remove();
        }
      } else if (action === 'read') {
        const messageDiv = document.querySelector(`.message[data-message-id="${data.message_id}"]`);
        if (messageDiv && messageDiv.classList.contains('outgoing') && !messageDiv.querySelector('.read-status')) {
          const checkImg = document.createElement('img');
          checkImg.src = "/static/image/check.png";
          checkImg.className = "read-status";
          checkImg.alt = "✓";
          messageDiv.appendChild(checkImg);
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
      const contentDiv = activeMessage.querySelector('.message-content');
      const originalSpan = contentDiv.querySelector('.original');
      const translatedSpan = contentDiv.querySelector('.translated');
      const oldText = originalSpan ? originalSpan.textContent : contentDiv.textContent.trim();

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

    // document.querySelectorAll('.message.incoming').forEach(messageDiv => {
    //   if (!messageDiv.classList.contains('read')) {
    //     observer.observe(messageDiv);
    //   }
    // });

    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('toggle-original-btn')) {
        const messageDiv = event.target.closest('.message');
        const original = messageDiv.querySelector('.original');
        const translated = messageDiv.querySelector('.translated');

        if (original && translated) {
          const isOriginalVisible = original.style.display === 'block';

          original.style.display = isOriginalVisible ? 'none' : 'block';
          translated.style.display = isOriginalVisible ? 'block' : 'none';
          event.target.textContent = isOriginalVisible ? 'Translation' : 'Original';
        }
      }
    });
});