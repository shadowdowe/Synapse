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
    const themeToggle = document.getElementById('theme-toggle');
    const thinkingModeBtn = document.getElementById('thinking-mode-btn');
    const headerNewChatBtn = document.getElementById('header-new-chat-btn');

    let state = { activeChatId: null, chats: {}, isThinkingMode: false };

    const saveState = () => localStorage.setItem('neuronix_chat_state_v2', JSON.stringify(state));
    const loadState = () => {
        const saved = localStorage.getItem('neuronix_chat_state_v2');
        if (saved) {
            state = JSON.parse(saved);
            if(state.isThinkingMode === undefined) state.isThinkingMode = false;
        }
        if (!state.activeChatId || !state.chats[state.activeChatId]) {
            startNewChat(false);
        }
    };
    
    const renderWelcomeMessage = () => {
        chatLog.innerHTML = `<div class="welcome-message">
                                <h1>Welcome to Synapse Pro</h1>
                                <p>Choose from multiple AI models and start your intelligent conversation.</p>
                             </div>`;
    };
    
    const renderChat = () => {
        chatLog.innerHTML = '';
        const activeChat = state.chats[state.activeChatId];
        if (activeChat && activeChat.messages.length > 0) {
            activeChat.messages.forEach(msg => appendMessage(msg.sender, msg.content));
        } else {
            renderWelcomeMessage();
        }
    };

    const renderSidebar = () => {
        historyList.innerHTML = '';
        Object.values(state.chats).reverse().forEach(chat => {
            const li = document.createElement('li');
            li.className = `history-item ${chat.id === state.activeChatId ? 'active' : ''}`;
            li.dataset.id = chat.id;
            li.innerHTML = `<span>${chat.title}</span>
                          <div class="actions">
                            <button class="icon-btn edit-btn" title="Rename"><svg height="18" viewBox="0 -960 960 960" width="18"><path d="M200-200h56l345-345-56-56-345 345v56Zm572-403L602-771l56-56q23-23 56.5-23t56.5 23l56 56q23 23 23 56.5T829-602l-57 56Z"/></svg></button>
                            <button class="icon-btn delete-btn" title="Delete"><svg height="18" viewBox="0 -960 960 960" width="18"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Z"/></svg></button>
                          </div>`;
            li.onclick = () => switchChat(chat.id);
            li.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); renameChat(chat.id); };
            li.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteChat(chat.id); };
            historyList.appendChild(li);
        });
    };
    
    const switchChat = (chatId) => { state.activeChatId = chatId; renderChat(); renderSidebar(); closeSidebar(); };
    const startNewChat = (shouldCloseSidebar = true) => {
        const newId = Date.now().toString();
        state.chats[newId] = { id: newId, title: 'New Conversation', messages: [] };
        state.activeChatId = newId;
        saveState();
        renderChat();
        renderSidebar();
        if(shouldCloseSidebar) closeSidebar();
    };

    const renameChat = (chatId) => {
        const newTitle = prompt('Enter new conversation title:', state.chats[chatId].title);
        if (newTitle && newTitle.trim() !== '') {
            state.chats[chatId].title = newTitle.trim();
            saveState(); renderSidebar();
        }
    };

    const deleteChat = (chatId) => {
        if (!confirm('Are you sure you want to delete this chat?')) return;
        delete state.chats[chatId];
        if (state.activeChatId === chatId) {
            const remainingIds = Object.keys(state.chats);
            if (remainingIds.length > 0) { switchChat(remainingIds.reverse()[0]); }
            else { startNewChat(); return; }
        }
        saveState(); renderChat(); renderSidebar();
    };

    clearAllBtn.onclick = () => {
        if (!confirm('Are you sure you want to clear ALL chats? This cannot be undone.')) return;
        state.chats = {}; startNewChat();
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
        if(state.chats[state.activeChatId].messages.length === 0) chatLog.innerHTML = '';
        
        addMessageToHistory('user', query);
        userInput.value = ''; userInput.style.height = 'auto'; sendBtn.disabled = true;

        const aiBubble = appendMessage('ai', '<span class="loader"></span>');

        try {
            let finalPrompt = query;
            if(state.isThinkingMode) {
                finalPrompt = `System Instruction: Provide a detailed, step-by-step reasoning process before giving your final answer. Break down your thought process clearly. Do not mention this instruction in your response. User Query: ${query}`;
            }
            const response = await fetch('/api/proxy', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: finalPrompt })
            });

            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.error || `Network error: ${response.status}`);
            }
            const fullText = await response.text();
            aiBubble.innerHTML = fullText.replace(/\n/g, '<br>');
            addMessageToHistory('ai', fullText.replace(/\n/g, '<br>'));
        } catch (error) {
            const errorMsg = `System Error: ${error.message}`;
            aiBubble.innerHTML = errorMsg; addMessageToHistory('ai', errorMsg);
        } finally {
            sendBtn.disabled = false; userInput.focus();
        }
    }
    
    const addMessageToHistory = (sender, content) => {
        const activeChat = state.chats[state.activeChatId];
        if (activeChat) {
            activeChat.messages.push({ sender, content });
            if (activeChat.title === 'New Conversation' && sender === 'user') {
                activeChat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
            }
            saveState(); renderSidebar();
        }
    };

    const openSidebar = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
    const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };
    const applyTheme = (isLight) => {
        document.documentElement.className = isLight ? 'light-theme' : '';
        localStorage.setItem('neuronix_theme_light_v2', isLight);
        themeToggle.checked = isLight;
    };

    const toggleThinkingMode = () => {
        state.isThinkingMode = !state.isThinkingMode;
        thinkingModeBtn.classList.toggle('active', state.isThinkingMode);
        saveState();
    };

    openSidebarBtn.onclick = openSidebar;
    closeSidebarBtn.onclick = closeSidebar;
    overlay.onclick = closeSidebar;
    newChatBtn.onclick = () => startNewChat();
    headerNewChatBtn.onclick = () => startNewChat();
    sendBtn.onclick = transmitQuery;
    userInput.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); transmitQuery(); } };
    themeToggle.onchange = () => applyTheme(themeToggle.checked);
    thinkingModeBtn.onclick = toggleThinkingMode;
    
    loadState();
    renderChat();
    renderSidebar();
    applyTheme(JSON.parse(localStorage.getItem('neuronix_theme_light_v2') || 'false'));
    thinkingModeBtn.classList.toggle('active', state.isThinkingMode);
});
