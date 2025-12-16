// Dados da aplicação
let diaryData = {
    entries: {},
    events: {},
    settings: {
        autoSave: 30000
    }
};

// Elementos DOM
const coverScreen = document.getElementById('cover-screen');
const bookCover = document.getElementById('book-cover');
const diaryInterface = document.getElementById('diary-interface');
const diaryTextarea = document.getElementById('diary-entry');
const diaryTitle = document.getElementById('diary-title');
const saveStatus = document.getElementById('save-status');
const currentDateEl = document.getElementById('current-date');
const agendaModal = document.getElementById('agenda-modal');
const calendarGrid = document.getElementById('calendar-grid');
const agendaMonthEl = document.getElementById('agenda-month');
const eventModal = document.getElementById('event-modal');
const eventForm = document.getElementById('event-form');
const btnLock = document.getElementById('btn-lock');
const btnUnlock = document.getElementById('btn-unlock');

// Variáveis de controle
let autoSaveInterval;
let agendaCurrentDate = new Date();
let selectedDate = null;

// Inicialização
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    loadData();
    setupEventListeners();
    updateDate();
    setupAutoSave();
    
    // Mostrar a capa do livro inicialmente
    coverScreen.classList.remove('hidden');
    diaryInterface.classList.add('hidden');
}

function setupEventListeners() {
    // Interação com a capa do livro
    bookCover.addEventListener('click', openDiary);
    
    // Botões de navegação
    document.getElementById('btn-agenda').addEventListener('click', openAgenda);
    document.getElementById('btn-stats').addEventListener('click', showStats);
    document.getElementById('btn-backup').addEventListener('click', backupData);
    document.getElementById('btn-restore').addEventListener('click', restoreData);
    
    // Controles do diário
    btnLock.addEventListener('click', lockPage);
    btnUnlock.addEventListener('click', unlockPage);
    
    // Agenda
    document.getElementById('btn-prev-month').addEventListener('click', () => changeAgendaMonth(-1));
    document.getElementById('btn-next-month').addEventListener('click', () => changeAgendaMonth(1));
    document.getElementById('btn-add-event').addEventListener('click', addNewEvent);
    document.getElementById('btn-close-agenda').addEventListener('click', closeAgenda);
    
    // Eventos
    document.getElementById('btn-cancel-event').addEventListener('click', closeEventModal);
    eventForm.addEventListener('submit', saveEvent);
    
    // Salvamento ao digitar
    diaryTextarea.addEventListener('input', handleInput);
    diaryTitle.addEventListener('input', handleInput);
}

function handleInput() {
    updateSaveStatus('Editando...');
    debouncedSave();
}

const debouncedSave = debounce(saveEntry, 2000);

function openDiary() {
    coverScreen.classList.add('hidden');
    diaryInterface.classList.remove('hidden');
    loadTodayEntry();
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('pt-BR', options);
}

function getDateKey(date = new Date()) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function loadData() {
    const savedData = localStorage.getItem('diaryData');
    if (savedData) {
        diaryData = JSON.parse(savedData);
    }
}

function saveData() {
    localStorage.setItem('diaryData', JSON.stringify(diaryData));
    return true;
}

function loadTodayEntry() {
    const todayKey = getDateKey();
    
    if (diaryData.entries[todayKey]) {
        diaryTitle.value = diaryData.entries[todayKey].title || '';
        diaryTextarea.value = diaryData.entries[todayKey].content || '';
        
        // Verificar se a página está travada
        if (diaryData.entries[todayKey].locked) {
            lockPage();
        } else {
            unlockPage();
        }
    } else {
        diaryTitle.value = '';
        diaryTextarea.value = '';
        unlockPage();
    }
    
    updateSaveStatus('Entrada carregada');
}

function saveEntry() {
    const todayKey = getDateKey();
    
    if (!diaryData.entries[todayKey]) {
        diaryData.entries[todayKey] = {
            title: '',
            content: '',
            locked: false,
            createdAt: new Date().toISOString()
        };
    }
    
    // Não salvar se a página estiver travada
    if (diaryData.entries[todayKey].locked) {
        updateSaveStatus('Página travada - não é possível editar');
        return false;
    }
    
    diaryData.entries[todayKey].title = diaryTitle.value;
    diaryData.entries[todayKey].content = diaryTextarea.value;
    diaryData.entries[todayKey].updatedAt = new Date().toISOString();
    
    if (saveData()) {
        updateSaveStatus('Salvo automaticamente ' + new Date().toLocaleTimeString());
        return true;
    }
    
    return false;
}

function lockPage() {
    const todayKey = getDateKey();
    
    if (!diaryData.entries[todayKey]) {
        if (!saveEntry()) return;
    }
    
    diaryData.entries[todayKey].locked = true;
    saveData();
    
    diaryTitle.setAttribute('readonly', true);
    diaryTextarea.setAttribute('readonly', true);
    btnLock.style.display = 'none';
    btnUnlock.style.display = 'block';
    diaryInterface.classList.add('locked');
    
    updateSaveStatus('Página travada');
}

function unlockPage() {
    const todayKey = getDateKey();
    
    if (diaryData.entries[todayKey]) {
        diaryData.entries[todayKey].locked = false;
        saveData();
    }
    
    diaryTitle.removeAttribute('readonly');
    diaryTextarea.removeAttribute('readonly');
    btnLock.style.display = 'block';
    btnUnlock.style.display = 'none';
    diaryInterface.classList.remove('locked');
    
    updateSaveStatus('Página destravada');
}

function setupAutoSave() {
    clearInterval(autoSaveInterval);
    
    if (diaryData.settings.autoSave > 0) {
        autoSaveInterval = setInterval(saveEntry, diaryData.settings.autoSave);
    }
}

function updateSaveStatus(message) {
    saveStatus.textContent = message;
    
    // Limpar a mensagem após 3 segundos
    if (message !== 'Editando...') {
        setTimeout(() => {
            if (saveStatus.textContent === message) {
                saveStatus.textContent = '';
            }
        }, 3000);
    }
}

function openAgenda() {
    agendaModal.style.display = 'flex';
    renderAgenda();
}

function closeAgenda() {
    agendaModal.style.display = 'none';
}

function changeAgendaMonth(direction) {
    agendaCurrentDate.setMonth(agendaCurrentDate.getMonth() + direction);
    renderAgenda();
}

function renderAgenda() {
    const year = agendaCurrentDate.getFullYear();
    const month = agendaCurrentDate.getMonth();
    
    // Atualizar título da agenda
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    agendaMonthEl.textContent = `${monthNames[month]} ${year}`;
    
    // Limpar grade do calendário
    calendarGrid.innerHTML = '';
    
    // Obter primeiro dia do mês e último dia do mês
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Preencher dias vazios no início (do mês anterior)
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Preencher os dias do mês
    const today = new Date();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const dateKey = `${year}-${month + 1}-${day}`;
        
        // Verificar se é o dia atual
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayElement.classList.add('current-day');
        }
        
        // Verificar se há entrada neste dia
        if (diaryData.entries[dateKey]) {
            dayElement.classList.add('has-entry');
        }
        
        dayElement.addEventListener('click', () => showDayDetails(dateKey));
        calendarGrid.appendChild(dayElement);
    }
}

function showDayDetails(dateKey) {
    selectedDate = dateKey;
    const dayEvents = document.getElementById('day-events');
    dayEvents.innerHTML = '';
    
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const title = document.createElement('h4');
    title.textContent = dateStr;
    dayEvents.appendChild(title);
    
    if (diaryData.entries[dateKey]) {
        const entryDiv = document.createElement('div');
        entryDiv.innerHTML = `
            <p><strong>Diário:</strong> ${diaryData.entries[dateKey].title || 'Sem título'}</p>
            <p>${diaryData.entries[dateKey].content.substring(0, 100)}${diaryData.entries[dateKey].content.length > 100 ? '...' : ''}</p>
        `;
        dayEvents.appendChild(entryDiv);
    } else {
        const noEntry = document.createElement('p');
        noEntry.textContent = 'Nenhuma entrada neste dia.';
        noEntry.style.fontStyle = 'italic';
        dayEvents.appendChild(noEntry);
    }
    
    // Adicionar eventos da agenda (se houver)
    if (diaryData.events[dateKey] && diaryData.events[dateKey].length > 0) {
        const eventsTitle = document.createElement('h5');
        eventsTitle.textContent = 'Compromissos:';
        eventsTitle.style.marginTop = '1rem';
        dayEvents.appendChild(eventsTitle);
        
        diaryData.events[dateKey].forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.innerHTML = `
                <p><strong>${event.time}</strong> - ${event.title}</p>
                ${event.description ? `<p>${event.description}</p>` : ''}
            `;
            eventDiv.style.marginBottom = '0.5rem';
            eventDiv.style.padding = '0.5rem';
            eventDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            eventDiv.style.borderRadius = '4px';
            dayEvents.appendChild(eventDiv);
        });
    }
    
    // Botão para adicionar evento neste dia
    const addEventBtn = document.createElement('button');
    addEventBtn.textContent = 'Adicionar Evento';
    addEventBtn.className = 'btn';
    addEventBtn.style.marginTop = '1rem';
    addEventBtn.addEventListener('click', () => {
        document.getElementById('event-date').value = dateKey.split('-').join('-');
        openEventModal();
    });
    dayEvents.appendChild(addEventBtn);
}

function addNewEvent() {
    document.getElementById('event-date').value = '';
    document.getElementById('event-time').value = '';
    document.getElementById('event-title').value = '';
    document.getElementById('event-description').value = '';
    openEventModal();
}

function openEventModal() {
    eventModal.style.display = 'flex';
}

function closeEventModal() {
    eventModal.style.display = 'none';
}

function saveEvent(e) {
    e.preventDefault();
    
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-description').value;
    
    if (!date || !title) {
        alert('Data e título são obrigatórios!');
        return;
    }
    
    const dateKey = date.replace(/-/g, '-');
    
    if (!diaryData.events[dateKey]) {
        diaryData.events[dateKey] = [];
    }
    
    diaryData.events[dateKey].push({
        time,
        title,
        description,
        createdAt: new Date().toISOString()
    });
    
    saveData();
    closeEventModal();
    
    if (agendaModal.style.display === 'flex') {
        renderAgenda();
        if (selectedDate === dateKey) {
            showDayDetails(dateKey);
        }
    }
    
    updateSaveStatus('Evento salvo com sucesso');
}

function showStats() {
    // Implementar estatísticas
    updateSaveStatus('Estatísticas em desenvolvimento');
}

function backupData() {
    const dataStr = JSON.stringify(diaryData);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `diario-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const restoredData = JSON.parse(e.target.result);
                diaryData = restoredData;
                localStorage.setItem('diaryData', JSON.stringify(diaryData));
                loadTodayEntry();
                setupAutoSave();
                updateSaveStatus('Dados restaurados com sucesso!');
            } catch (err) {
                updateSaveStatus('Erro ao restaurar dados: arquivo inválido');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Utilitários
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}