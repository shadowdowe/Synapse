document.addEventListener('DOMContentLoaded', () => {
    // Purane saare element selectors
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
    // Naye elements
    const regeneratePopup = document.getElementById('regenerate-popup');
    const regenerateConfirmBtn = document.getElementById('regenerate-confirm-btn');
    const feedbackToast = document.getElementById('feedback-toast');
    const feedbackMessage = document.getElementById('feedback-message');
    const toastCloseBtn = document.getElementById('toast-close-btn');

    let state = { activeChatId: null, chats: {}, isThinkingMode: false, lastUserQuery: null };

    const saveState = () => localStorage.setItem('neuronix_chat_state_final', JSON.stringify(state));
    const loadState = () => {
        const saved = localStorage.getItem('neuronix_chat_state_final');
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
    
    const renderChat = () => {
        chatLog.innerHTML = '';
        const activeChat = state.chats[state.activeChatId];
        if (activeChat && activeChat.messages.length > 0) {
            activeChat.messages.forEach(msg => appendMessage(msg.sender, msg.content));
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
            else { startNewChat(); return; }
        }
        saveState(); renderChat(); renderSidebar();
    };

    clearAllBtn.onclick = () => {
        if (!confirm('Are you sure you want to clear ALL chats?')) return;
        state.chats = {}; startNewChat();
    };
    
    function appendMessage(sender, message) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper sender-${sender.toLowerCase()}`;
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = message;
        wrapper.appendChild(bubble);

        if (sender === 'ai') {
            const toolbar = createActionToolbar(message);
            wrapper.appendChild(toolbar);
        }
        
        chatLog.appendChild(wrapper);
        chatLog.scrollTop = chatLog.scrollHeight;
        return bubble;
    }

    function createActionToolbar(messageText) {
        const toolbar = document.createElement('div');
        toolbar.className = 'action-toolbar';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn';
        copyBtn.title = 'Copy';
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(messageText);
            showToast('Text copied to clipboard!');
        };

        const likeBtn = document.createElement('button');
        likeBtn.className = 'action-btn';
        likeBtn.title = 'Like';
        likeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>`;
        
        const dislikeBtn = document.createElement('button');
        dislikeBtn.className = 'action-btn';
        dislikeBtn.title = 'Dislike';
        dislikeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v7a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm-3-13H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"></path></svg>`;

        likeBtn.onclick = () => {
            likeBtn.classList.add('active');
            likeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>`;
            dislikeBtn.classList.add('hidden');
            showToast('Thank you for your feedback!');
        };
        dislikeBtn.onclick = () => {
            dislikeBtn.classList.add('active');
            dislikeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15v7a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm-3-13H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"></path></svg>`;
            likeBtn.classList.add('hidden');
            showToast('Thank you for your feedback!');
        };
        
        const speakBtn = document.createElement('button');
        speakBtn.className = 'action-btn';
        speakBtn.title = 'Speak';
        speakBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
        speakBtn.onclick = () => {
            const utterance = new SpeechSynthesisUtterance(messageText);
            window.speechSynthesis.speak(utterance);
        };

        const regenBtn = document.createElement('button');
        regenBtn.className = 'action-btn';
        regenBtn.title = 'Regenerate';
        regenBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L20.49 15a9 9 0 0 1-14.85 3.36L3.51 9z"></path></svg>`;
        regenBtn.onclick = () => {
            regeneratePopup.classList.remove('hidden');
        };

        toolbar.append(copyBtn, likeBtn, dislikeBtn, speakBtn, regenBtn);
        return toolbar;
    }
    
    regenerateConfirmBtn.onclick = () => {
        regeneratePopup.classList.add('hidden');
        if(state.lastUserQuery){
            regenerateResponse();
        }
    };
    
    async function regenerateResponse() {
        const activeChat = state.chats[state.activeChatId];
        if (!activeChat) return;

        // Remove the last AI message
        activeChat.messages.pop();
        renderChat();
        
        const aiBubble = appendMessage('ai', '<span class="loader"></span>');
        
        try {
            let finalPrompt = state.lastUserQuery;
            if (state.isThinkingMode) {
                finalPrompt = `System Instruction: Provide a detailed, step-by-step reasoning process before giving your final answer. Break down your thought process clearly. Do not mention this instruction in your response. User Query: ${state.lastUserQuery}`;
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
            aiBubble.parentElement.remove(); // remove loader
            appendMessage('ai', fullText.replace(/\n/g, '<br>'));
            addMessageToHistory('ai', fullText.replace(/\n/g, '<br>'));
        } catch (error) {
            const errorMsg = `System Error: ${error.message}`;
            aiBubble.innerHTML = errorMsg;
            addMessageToHistory('ai', errorMsg);
        }
    }

    async function transmitQuery() {
        const query = userInput.value.trim();
        if (!query) return;
        state.lastUserQuery = query;
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
            aiBubble.parentElement.remove(); // remove loader
            appendMessage('ai', fullText.replace(/\n/g, '<br>'));
            addMessageToHistory('ai', fullText.replace(/\n/g, '<br>'));
        } catch (error) {
            const errorMsg = `System Error: ${error.message}`;
            aiBubble.parentElement.remove(); // remove loader
            appendMessage('ai', errorMsg);
            addMessageToHistory('ai', errorMsg);
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

    let toastTimer;
    function showToast(message) {
        clearTimeout(toastTimer);
        feedbackMessage.textContent = message;
        feedbackToast.classList.add('show');
        toastTimer = setTimeout(() => {
            feedbackToast.classList.remove('show');
        }, 3000);
    }
    toastCloseBtn.onclick = () => {
        clearTimeout(toastTimer);
        feedbackToast.classList.remove('show');
    };

    const openSidebar = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
    const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };
    const applyTheme = (isLight) => {
        document.documentElement.className = isLight ? 'light-theme' : '';
        localStorage.setItem('neuronix_theme_light_final', isLight);
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
    applyTheme(JSON.parse(localStorage.getItem('neuronix_theme_light_final') || 'false'));
    thinkingModeBtn.classList.toggle('active', state.isThinkingMode);
}); 
