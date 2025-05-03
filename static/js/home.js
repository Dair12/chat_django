const chatList = document.getElementById('chatList');
const filterIcon = document.getElementById('filterIcon');
const searchIcon = document.getElementById('searchIcon');
const filterOptions = document.getElementById('filterOptions');
const searchInput = document.getElementById('searchInput');
const sortAZButton = document.getElementById('sortAZ');
const sortTimeButton = document.getElementById('sortTime');

// Показать/скрыть опции фильтра
filterIcon.addEventListener('click', (e) => {
  e.stopPropagation();
  filterOptions.style.display = filterOptions.style.display === 'block' ? 'none' : 'block';
  searchInput.style.display = 'none';
});

// Показать/скрыть поле поиска
searchIcon.addEventListener('click', (e) => {
  e.stopPropagation();
  searchInput.style.display = searchInput.style.display === 'block' ? 'none' : 'block';
  filterOptions.style.display = 'none';
});

// Скрыть фильтры и поиск при клике вне области
document.addEventListener('click', (e) => {
  if (!e.target.closest('.header-right')) {
    filterOptions.style.display = 'none';
    searchInput.style.display = 'none';
  }
});

// Поиск по имени
searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value.toLowerCase();
  const chatItems = chatList.querySelectorAll('.chat-item');
  chatItems.forEach(item => {
    const name = item.getAttribute('data-name');
    item.style.display = name.includes(searchTerm) ? '' : 'none';
  });
});

// Сортировка по A-Z
sortAZButton.addEventListener('click', () => {
  const chatItems = Array.from(chatList.querySelectorAll('.chat-item'));
  chatItems.sort((a, b) => a.getAttribute('data-name').localeCompare(b.getAttribute('data-name')));
  chatItems.forEach(item => chatList.appendChild(item));
  filterOptions.style.display = 'none';
});

// Сортировка по времени
sortTimeButton.addEventListener('click', () => {
  const chatItems = Array.from(chatList.querySelectorAll('.chat-item'));
  chatItems.sort((a, b) => {
    const timeA = new Date(a.getAttribute('data-created-at'));
    const timeB = new Date(b.getAttribute('data-created-at'));
    return timeB - timeA; // От новых к старым
  });
  chatItems.forEach(item => chatList.appendChild(item));
  filterOptions.style.display = 'none';
});

// Обработчик кликов по чатам

chatList.addEventListener('click', (e) => {
  const chatItem = e.target.closest('.chat-item');
  if (!chatItem) return;

  const chatType = chatItem.getAttribute('data-type');
  const span = chatItem.querySelector('.chat-box span');
  const chatId = span ? span.getAttribute('data-id') : null;

  console.log('Chat Item Clicked:', { chatType, chatId, span: span ? span.outerHTML : 'No span' });

  if (!chatId || chatId === 'null' || chatId === '' || isNaN(parseInt(chatId))) {
    console.error('Invalid chat ID:', chatId);
    alert('Error: Invalid chat ID. Please check the contact or group data.');
    return;
  }

  const id = parseInt(chatId);
  if (chatType === 'friend') {
    window.location.href = `/chat/user/${id}/`;
  } else if (chatType === 'group') {
    window.location.href = `/chat/group/${id}/`;
  }
});

// Обработчик для кнопки добавления контакта
const addChatIcon = document.getElementById('add-chat-icon');
addChatIcon.addEventListener('click', () => {
  const addButtonUrl = addChatIcon.getAttribute('data-add-button-url');
  window.location.href = addButtonUrl;
});