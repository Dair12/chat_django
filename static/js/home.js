const chatList = document.getElementById('chatList');
const filterIcon = document.getElementById('filterIcon');
const searchIcon = document.getElementById('searchIcon');
const filterOptions = document.getElementById('filterOptions');
const searchInput = document.getElementById('searchInput');

const addChatIcon = document.getElementById('add-chat-icon');
addChatIcon.addEventListener('click', () => {
  const addButtonUrl = addChatIcon.getAttribute('data-add-button-url');
  window.location.href = addButtonUrl;
});