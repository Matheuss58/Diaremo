// Dados da aplicação
let diaryData = {
    entries: {},
    events: {},
    settings: {
        autoSave: 30000,
        theme: 'gothic'
    },
    currentDate: new Date(),
    currentPage: 0
};

// Elementos DOM
const coverScreen = document.getElementById('cover-screen');
const bookCover = document.getElementById('book-cover');
const diaryInterface = document.getElementById('diary-interface');
const diaryTextarea = document.getElementById('diary-entry');
const saveStatus = document.getElementById('save-status');
const currentDateEl = document.getElementById('current-date');
const pageTitleInput = document.getElementById('page-title');
const leftDateEl = document.getElementById('left-date');
const leftTitleEl = document.getElementById('left-title');
const leftTextEl = document.getElementById('left-text');
const agendaModal = document.getElementById('agenda-modal');
const calendarGrid = document.getElementById('calendar-grid');
const agendaMonthEl = document.getElementById('agenda-month');
const settingsModal = document.getElementById('settings-modal');
const autoSaveSelect = document.getElementById('auto-save');
const themeSelect = document.getElementById('theme');

// Variáveis de controle
let autoSaveInterval;
let currentView = 'today';
let agendaCurrentDate = new Date();

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
    document.getElementById('btn-backup').addEventListener('click', backupData);
    document.getElementById('btn-restore').addEventListener('click', restoreData);
    document.getElementById('btn-settings').addEventListener('click', openSettings);
    
    // Controles do livro
    document.getElementById('btn-prev').addEventListener('click', showPreviousPage);
    document.getElementById('btn-next').addEventListener('click', showNextPage);
    document.getElementById('btn-lock').addEventListener('click', toggleLockPage);
    document.getElementById('btn-save').addEventListener('click', saveEntry);
    
    // Agenda
    document.getElementById('btn-prev-month').addEventListener('click', () => changeAgendaMonth(-1));
    document.getElementById('btn-next-month').addEventListener('click', () => changeAgendaMonth(1));
    document.getElementById('btn-close-agenda').addEventListener('click', closeAgenda);
    
    // Configurações
    document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
    document.getElementById('btn-close-settings').addEventListener('click', closeSettings);
    
    // Salvamento ao digitar
    diaryTextarea.addEventListener('input', debounce(saveEntry, 2000));
    pageTitleInput.addEventListener('input', debounce(saveEntry, 2000));
}

function openDiary() {
    coverScreen.classList.add('hidden');
    diaryInterface.classList.remove('hidden');
    loadTodayEntry();
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('pt-BR', options);
    
    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    leftDateEl.textContent = now.toLocaleDateString('pt-BR', dateOptions);
}

function getDateKey(date = new Date()) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function loadData() {
    const savedData = localStorage.getItem('diaryData');
    if (savedData) {
        diaryData = JSON.parse(savedData);
        
        // Carregar configurações
        if (diaryData.settings) {
            autoSaveSelect.value = diaryData.settings.autoSave;
            themeSelect.value = diaryData.settings.theme;
        }
    }
}

function saveData() {
    localStorage.setItem('diaryData', JSON.stringify(diaryData));
    return true;
}

function loadTodayEntry() {
    const todayKey = getDateKey();
    
    if (diaryData.entries[todayKey]) {
        pageTitleInput.value = diaryData.entries[todayKey].title || '';
        diaryTextarea.value = diaryData.entries[todayKey].content || '';
        
        // Verificar se a página está travada
        if (diaryData.entries[todayKey].locked) {
            lockPage();
        } else {
            unlockPage();
        }
    } else {
        pageTitleInput.value = '';
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
    
    diaryData.entries[todayKey].title = pageTitleInput.value;
    diaryData.entries[todayKey].content = diaryTextarea.value;
    diaryData.entries[todayKey].updatedAt = new Date().toISOString();
    
    if (saveData()) {
        updateSaveStatus('Salvo automaticamente ' + new Date().toLocaleTimeString());
        return true;
    }
    
    return false;
}

function toggleLockPage() {
    const todayKey = getDateKey();
    
    if (!diaryData.entries[todayKey]) {
        if (!saveEntry()) return;
    }
    
    diaryData.entries[todayKey].locked = !diaryData.entries[todayKey].locked;
    
    if (diaryData.entries[todayKey].locked) {
        lockPage();
        updateSaveStatus('Página travada');
    } else {
        unlockPage();
        updateSaveStatus('Página destravada');
    }
    
    saveData();
}

function lockPage() {
    diaryTextarea.setAttribute('readonly', true);
    pageTitleInput.setAttribute('readonly', true);
    document.getElementById('btn-lock').innerHTML = '<i class="fas fa-unlock"></i> Destravar Página';
}

function unlockPage() {
    diaryTextarea.removeAttribute('readonly');
    pageTitleInput.removeAttribute('readonly');
    document.getElementById('btn-lock').innerHTML = '<i class="fas fa-lock"></i> Travar Página';
}

function showPreviousPage() {
    // Implementar navegação para página anterior
    updateSaveStatus('Funcionalidade de navegação em desenvolvimento');
}

function showNextPage() {
    // Implementar navegação para próxima página
    updateSaveStatus('Funcionalidade de navegação em desenvolvimento');
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
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junio',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    agendaMonthEl.textContent = `${monthNames[month]} ${year}`;
    
    // Limpar grade do calendário
    calendarGrid.innerHTML = '';
    
    // Adicionar cabeçalhos dos dias da semana
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    weekdays.forEach(day => {
        const cell = document.createElement('div');
        cell.textContent = day;
        cell.style.fontWeight = 'bold';
        calendarGrid.appendChild(cell);
    });
    
    // Obter primeiro dia do mês e último dia do mês
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Preencher dias vazios no início
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendarGrid.appendChild(document.createElement('div'));
    }
    
    // Preencher os dias do mês
    const today = new Date();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        cell.textContent = day;
        
        const dateKey = `${year}-${month + 1}-${day}`;
        
        // Verificar se é o dia atual
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            cell.classList.add('current-day');
        }
        
        // Verificar se há entrada neste dia
        if (diaryData.entries[dateKey]) {
            cell.classList.add('has-entry');
        }
        
        cell.addEventListener('click', () => showDayDetails(dateKey));
        calendarGrid.appendChild(cell);
    }
}

function showDayDetails(dateKey) {
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
        eventsTitle.textContent = 'Eventos:';
        eventsTitle.style.marginTop = '1rem';
        dayEvents.appendChild(eventsTitle);
        
        diaryData.events[dateKey].forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.innerHTML = `
                <p><strong>${event.time}</strong> - ${event.title}</p>
            `;
            eventDiv.style.marginBottom = '0.5rem';
            dayEvents.appendChild(eventDiv);
        });
    }
}

function openSettings() {
    // Carregar configurações atuais
    autoSaveSelect.value = diaryData.settings.autoSave;
    themeSelect.value = diaryData.settings.theme;
    
    settingsModal.style.display = 'flex';
}

function closeSettings() {
    settingsModal.style.display = 'none';
}

function saveSettings() {
    diaryData.settings.autoSave = parseInt(autoSaveSelect.value);
    diaryData.settings.theme = themeSelect.value;
    
    saveData();
    setupAutoSave();
    applyTheme();
    
    settingsModal.style.display = 'none';
    updateSaveStatus('Configurações salvas');
}

function applyTheme() {
    // Implementar mudança de tema
    document.body.setAttribute('data-theme', diaryData.settings.theme);
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
                applyTheme();
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