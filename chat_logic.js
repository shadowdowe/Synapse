document.addEventListener('DOMContentLoaded', () => {
    // Saare element selectors, bilkul original jaise
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
    const regeneratePopup = document.getElementById('regenerate-popup');
    const regenerateConfirmBtn = document.getElementById('regenerate-confirm-btn');
    const feedbackToast = document.getElementById('feedback-toast');
    const feedbackMessage = document.getElementById('feedback-message');
    const toastCloseBtn = document.getElementById('toast-close-btn');

    let state = { activeChatId: null, chats: {}, isThinkingMode: false, lastUserQuery: null };

    // State management bilkul original jaisa
    const saveState = () => localStorage.setItem('neuronix_chat_state_final_v5', JSON.stringify(state));
    const loadState = () => {
        const saved = localStorage.getItem('neuronix_chat_state_final_v5');
        if (saved) {
            state = JSON.parse(saved);
        }
        if (!state.activeChatId || !state.chats[state.activeChatId]) {
            startNewChat(false);
        }
    };
    
    const renderWelcomeMessage = () => {
        chatLog.innerHTML = `<div class="welcome-message"><h1>Welcome to Synapse</h1><p>Interface with a singular intelligence core. Your session starts now.</p></div>`;
    };
    
    // Chat render logic, 100% original
    const renderChat = () => {
        chatLog.innerHTML = '';
        const activeChat = state.chats[state.activeChatId];
        if (activeChat && activeChat.messages.length > 0) {
            activeChat.messages.forEach(msg => appendMessage(msg.sender, msg.content, false));
            state.lastUserQuery = activeChat.messages.filter(m => m.sender === 'user').pop()?.content || null;
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
            li.innerHTML = `<span>${chat.title}</span><div class="actions"><button class="icon-btn edit-btn" title="Rename"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button><button class="icon-btn delete-btn" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div>`;
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
        switchChat(newId);
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
            else { startNewChat(); }
        }
        saveState(); renderChat(); renderSidebar();
    };

    clearAllBtn.onclick = () => {
        if (!confirm('Are you sure you want to clear ALL chats?')) return;
        state.chats = {}; startNewChat(); saveState();
    };
    
    function appendMessage(sender, message, save = true) {
        if (chatLog.querySelector('.welcome-message')) {
             chatLog.innerHTML = '';
        }
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper sender-${sender.toLowerCase()}`;
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = message;
        wrapper.appendChild(bubble);

        const isLoader = message.includes('loader');
        if (sender === 'ai' && !isLoader) {
            const toolbar = createActionToolbar(message);
            wrapper.appendChild(toolbar);
        }
        
        if(save) {
            addMessageToHistory(sender, message);
        }

        chatLog.appendChild(wrapper);
        chatLog.scrollTop = chatLog.scrollHeight;
        return bubble;
    }

    function createActionToolbar(messageText) {
        const toolbar = document.createElement('div');
        toolbar.className = 'action-toolbar';
        const icons = {
            copy: `<svg height="18" viewBox="0 0 24 24" width="18"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
            like: `<svg height="18" viewBox="0 0 24 24" width="18"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>`,
            like_filled: `<svg height="18" viewBox="0 0 24 24" width="18"><path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.58 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/></svg>`,
            dislike: `<svg height="18" viewBox="0 0 24 24" width="18"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14-.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17-.79-.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>`,
            dislike_filled: `<svg height="18" viewBox="0 0 24 24" width="18"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14-.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17-.79-.44 1.06L9.83 23l6.59-6.59C16.78 16.05 17 15.55 17 15V5c0-1.1-.9-2-2-2zM19 3v12h4V3h-4z"/></svg>`,
            speak: `<svg height="18" viewBox="0 0 24 24" width="18"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
            regenerate: `<svg height="18" viewBox="0 0 24 24" width="18"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`
        };

        const copyBtn = document.createElement('button'); copyBtn.className = 'action-btn'; copyBtn.title = 'Copy'; copyBtn.innerHTML = icons.copy;
        copyBtn.onclick = () => { navigator.clipboard.writeText(messageText); showToast('Text copied to clipboard!'); };
        const likeBtn = document.createElement('button'); likeBtn.className = 'action-btn'; likeBtn.title = 'Like'; likeBtn.innerHTML = icons.like;
        const dislikeBtn = document.createElement('button'); dislikeBtn.className = 'action-btn'; dislikeBtn.title = 'Dislike'; dislikeBtn.innerHTML = icons.dislike;
        likeBtn.onclick = () => { likeBtn.classList.add('active'); likeBtn.innerHTML = icons.like_filled; dislikeBtn.classList.add('hidden'); showToast('Thank you for your feedback!'); };
        dislikeBtn.onclick = () => { dislikeBtn.classList.add('active'); dislikeBtn.innerHTML = icons.dislike_filled; likeBtn.classList.add('hidden'); showToast('Thank you for your feedback!'); };
        const speakBtn = document.createElement('button'); speakBtn.className = 'action-btn'; speakBtn.title = 'Speak'; speakBtn.innerHTML = icons.speak;
        speakBtn.onclick = () => { const utterance = new SpeechSynthesisUtterance(messageText.replace(/<[^>]*>?/gm, '')); window.speechSynthesis.speak(utterance); };
        const regenBtn = document.createElement('button'); regenBtn.className = 'action-btn'; regenBtn.title = 'Regenerate'; regenBtn.innerHTML = icons.regenerate;
        regenBtn.onclick = (e) => {
            e.stopPropagation(); const btn = e.currentTarget; const btnRect = btn.getBoundingClientRect(); const containerRect = document.getElementById('chat-container').getBoundingClientRect();
            regeneratePopup.style.left = `${btnRect.left - containerRect.left + (btnRect.width / 2)}px`;
            regeneratePopup.style.top = `${btnRect.bottom - containerRect.top + 8}px`;
            regeneratePopup.classList.add('show');
            const hideOnClickOutside = (event) => {
                if (!regeneratePopup.contains(event.target) && !btn.contains(event.target)) {
                    regeneratePopup.classList.remove('show'); document.removeEventListener('click', hideOnClickOutside, true);
                }
            }; document.addEventListener('click', hideOnClickOutside, true);
        };
        toolbar.append(copyBtn, likeBtn, dislikeBtn, speakBtn, regenBtn);
        return toolbar;
    }
    
    regenerateConfirmBtn.onclick = () => {
        regeneratePopup.classList.remove('show');
        if(state.lastUserQuery){
            regenerateResponse();
        }
    };
    
    // Regenerate logic, original jaisa
    async function regenerateResponse() {
        const activeChat = state.chats[state.activeChatId];
        if (!activeChat || !state.lastUserQuery) return;
        
        // Purana AI message history se aur screen se hatao
        activeChat.messages.pop();
        const lastMessageBubble = chatLog.querySelector('.message-wrapper:last-child');
        if(lastMessageBubble) lastMessageBubble.remove();
        
        const aiBubble = appendMessage('ai', '<span class="loader"></span>', false);

        try {
            const response = await fetch('/api/proxy', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: state.lastUserQuery })
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.error || `Network error: ${response.status}`);
            }
            const fullText = await response.text();
            aiBubble.parentElement.remove();
            appendMessage('ai', fullText.replace(/\n/g, '<br>'), true);
        } catch (error) {
            const errorMsg = `System Error: ${error.message}`;
            aiBubble.parentElement.remove();
            appendMessage('ai', errorMsg, true);
        }
    }

    // Transmit Query, 100% original flow
    async function transmitQuery() {
        const query = userInput.value.trim();
        if (!query) return;

        state.lastUserQuery = query;
        addMessageToHistory('user', query);
        appendMessage('user', query, false);

        userInput.value = ''; userInput.style.height = 'auto'; sendBtn.disabled = true;
        
        const aiBubble = appendMessage('ai', '<span class="loader"></span>', false);
        
        try {
            const response = await fetch('/api/proxy', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: query })
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.error || `Network error: ${response.status}`);
            }
            const fullText = await response.text();
            aiBubble.parentElement.remove();
            appendMessage('ai', fullText.replace(/\n/g, '<br>'), true);
        } catch (error) {
            const errorMsg = `System Error: ${error.message}`;
            aiBubble.parentElement.remove();
            appendMessage('ai', errorMsg, true);
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
                renderSidebar();
            }
            saveState();
        }
    };

    let toastTimer;
    function showToast(message) {
        clearTimeout(toastTimer);
        feedbackMessage.textContent = message;
        feedbackToast.classList.add('show');
        toastTimer = setTimeout(() => { feedbackToast.classList.remove('show'); }, 3000);
    }
    toastCloseBtn.onclick = () => { clearTimeout(toastTimer); feedbackToast.classList.remove('show'); };

    const openSidebar = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
    const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); regeneratePopup.classList.remove('show'); };
    const applyTheme = (isLight) => {
        document.documentElement.className = isLight ? 'light-theme' : '';
        localStorage.setItem('neuronix_theme_light_final_v5', isLight);
        themeToggle.checked = isLight;
    };

    const toggleThinkingMode = () => {
        state.isThinkingMode = !state.isThinkingMode;
        thinkingModeBtn.classList.toggle('active', state.isThinkingMode);
        saveState();
    };
    
    // Saare event listeners
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = `${userInput.scrollHeight}px`;
        sendBtn.disabled = userInput.value.trim().length === 0;
    });
    openSidebarBtn.onclick = openSidebar;
    closeSidebarBtn.onclick = closeSidebar;
    overlay.onclick = closeSidebar;
    newChatBtn.onclick = () => startNewChat();
    headerNewChatBtn.onclick = () => startNewChat();
    sendBtn.onclick = transmitQuery;
    userInput.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if(!sendBtn.disabled) transmitQuery(); } };
    themeToggle.onchange = () => applyTheme(themeToggle.checked);
    thinkingModeBtn.onclick = toggleThinkingMode;
    
    // App start
    loadState();
    renderChat();
    renderSidebar();
    applyTheme(JSON.parse(localStorage.getItem('neuronix_theme_light_final_v5') || 'false'));
    thinkingModeBtn.classList.toggle('active', state.isThinkingMode);
    sendBtn.disabled = true;
}); 
