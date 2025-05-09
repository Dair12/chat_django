const groupNameInput = document.getElementById('groupName');
const memberInput = document.getElementById('memberInput');
const memberList = document.getElementById('memberList');
const createGroupBtn = document.getElementById('createGroupBtn');

let members = [];

// Filter friends based on search input
memberInput.addEventListener('input', () => {
    const searchTerm = memberInput.value.toLowerCase();
    const friendItems = memberList.getElementsByClassName('member-item');

    Array.from(friendItems).forEach(item => {
        const username = item.dataset.username.toLowerCase();
        item.style.display = username.includes(searchTerm) ? '' : 'none';
    });
});

// Handle checkbox selection
memberList.addEventListener('change', (e) => {
    if (e.target.classList.contains('friend-checkbox')) {
        const username = e.target.value;
        if (e.target.checked) {
            if (!members.includes(username)) {
                members.push(username);
            }
        } else {
            members = members.filter(member => member !== username);
        }
    }
});

// Handle group creation
createGroupBtn.addEventListener('click', async () => {
    const groupName = groupNameInput.value.trim();

    if (!groupName) {
        alert('Please enter a group name.');
        return;
    }

    if (members.length === 0) {
        alert('Please select at least one member.');
        return;
    }

    try {
        const response = await fetch('/add_group/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                group_name: groupName,
                members: members,
            }),
        });

        const data = await response.json();
        if (data.success) {
            window.location.href = data.redirect_url || '/home/';
        } else {
            alert('Error creating group: ' + (data.errors || 'Unknown error'));
        }
    } catch (error) {
        alert('Error creating group: ' + error.message);
    }
});

// Function to get CSRF token from cookies
function getCSRFToken() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) {
            return value;
        }
    }
    return '';
}