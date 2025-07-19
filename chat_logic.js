document.addEventListener('DOMContentLoaded', () => {
    const chatLog = document.getElementById('chat-log');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const openSidebarBtn = document.getElementById('sidebar-open-btn');
    const closeSidebarBtn = document.getElementById('sidebar-close-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const historyList = document.getElementById('chat-history-list');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const themeBtns = document.querySelectorAll('.theme-btn');

    let state = {
        activeChatId: null,
        chats: {}
    };

    const saveState = () => localStorage.setItem('neuronix_chat_state', JSON.stringify(state));
    const loadState = () => {
        const saved = localStorage.getItem('neuronix_chat_state');
        if (saved) {
            state = JSON.parse(saved);
        } else {
            startNewChat();
        }
    };

    const renderChat = () => {
        chatLog.innerHTML = '';
        const activeChat = state.chats[state.activeChatId];
        if (activeChat) {
            activeChat.messages.forEach(msg => appendMessage(msg.sender, msg.content));
        }
    };

    const renderSidebar = () => {
        historyList.innerHTML = '';
        Object.values(state.chats).forEach(chat => {
            const li = document.createElement('li');
            li.className = `history-item ${chat.id === state.activeChatId ? 'active' : ''}`;
            li.dataset.id = chat.id;
            li.innerHTML = `
                <span>${chat.title}</span>
                <div class="actions">
                    <button class="edit-btn" title="Rename">✏️</button>
                    <button class="delete-btn" title="Delete">🗑️</button>
                </div>`;
            li.onclick = () => switchChat(chat.id);
            li.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); renameChat(chat.id); };
            li.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteChat(chat.id); };
            historyList.appendChild(li);
        });
    };

    const switchChat = (chatId) => {
        state.activeChatId = chatId;
        renderChat();
        renderSidebar();
        closeSidebar();
    };
    
    const startNewChat = () => {
        const newId = Date.now().toString();
        state.chats[newId] = { id: newId, title: 'New Conversation', messages: [] };
        state.activeChatId = newId;
        saveState();
        renderChat();
        renderSidebar();
        closeSidebar();
    };

    const renameChat = (chatId) => {
        const newTitle = prompt('Enter new conversation title:', state.chats[chatId].title);
        if (newTitle && newTitle.trim() !== '') {
            state.chats[chatId].title = newTitle.trim();
            saveState();
            renderSidebar();
        }
    };

    const deleteChat = (chatId) => {
        if (!confirm('Are you sure you want to delete this chat?')) return;
        delete state.chats[chatId];
        if (state.activeChatId === chatId) {
            const remainingIds = Object.keys(state.chats);
            if (remainingIds.length > 0) {
                state.activeChatId = remainingIds[0];
            } else {
                startNewChat();
                return;
            }
        }
        saveState();
        renderChat();
        renderSidebar();
    };

    clearAllBtn.onclick = () => {
        if (!confirm('Are you sure you want to clear ALL chats? This cannot be undone.')) return;
        state = { activeChatId: null, chats: {} };
        startNewChat();
    };
    
    function appendMessage(sender, message) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper sender-${sender.toLowerCase()}`;
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = message;
        wrapper.appendChild(bubble);
        chatLog.appendChild(wrapper);
        chatLog.scrollTop = chatLog.scrollHeight;
        return bubble;
    }

    async function transmitQuery() {
        const query = userInput.value.trim();
        if (!query) return;

        addMessageToHistory('user', query);
        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.disabled = true;

        const aiBubble = appendMessage('ai', '<span class="loader"></span>');

        try {
            const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: query })
            });

            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.error || `Network error: ${response.status}`);
            }

            const fullText = await response.text();
            aiBubble.innerHTML = fullText.replace(/\n/g, '<br>');
            addMessageToHistory('ai', fullText.replace(/\n/g, '<br>'));
        } catch (error) {
            aiBubble.innerHTML = `System Error: ${error.message}`;
            addMessageToHistory('ai', `System Error: ${error.message}`);
        } finally {
            sendBtn.disabled = false;
            userInput.focus();
        }
    }
    
    const addMessageToHistory = (sender, content) => {
        const activeChat = state.chats[state.activeChatId];
        if (activeChat) {
            activeChat.messages.push({ sender, content });
            if (activeChat.title === 'New Conversation' && activeChat.messages.length === 1) {
                activeChat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
            }
            saveState();
            renderSidebar();
        }
    };

    const openSidebar = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
    const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };

    openSidebarBtn.onclick = openSidebar;
    closeSidebarBtn.onclick = closeSidebar;
    overlay.onclick = closeSidebar;
    newChatBtn.onclick = startNewChat;
    sendBtn.onclick = transmitQuery;
    userInput.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); transmitQuery(); } };

    const applyTheme = (theme) => {
        document.documentElement.className = theme === 'light' ? 'light-theme' : '';
        localStorage.setItem('neuronix_theme', theme);
        themeBtns.forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
    };

    themeBtns.forEach(btn => btn.onclick = () => applyTheme(btn.dataset.theme));
    
    loadState();
    renderChat();
    renderSidebar();
    applyTheme(localStorage.getItem('neuronix_theme') || 'dark');
});