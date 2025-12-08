// --- BLOCO 1: SELEÇÃO DOS ELEMENTOS DO DASHBOARD ---
const generalTotalElement = document.getElementById('general-total-value');
const myTotalElement = document.getElementById('my-total-value');
const balanceStatusElement = document.getElementById('balance-status-text');

// Novos elementos que estamos selecionando
const viewAsSelectElement = document.getElementById('view-as-select');
const myTotalTitleTextElement = document.getElementById('my-total-title-text');

const monthFilter = document.getElementById('month-select');
const yearFilter = document.getElementById('year-select');

// --- BLOCO 1.5: FUNÇÃO PARA POPULAR OS FILTROS DE MÊS/ANO ---

function populateFilters() {
    // 1. Pega a data de HOJE
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 10 (Outubro)
    const currentYear = today.getFullYear(); // 2025

    // 2. Popula os MESES
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = monthNames[i - 1];
        
        if (i === currentMonth) {
            option.selected = true;
        }
        
        // USA A VARIÁVEL 'monthFilter' DO DASHBOARD
        monthFilter.appendChild(option); 
    }

    // 3. Popula os ANOS
    const startYear = currentYear - 2; // Começa 2 anos atrás (2023)
    for (let i = 0; i < 5; i++) {
        const year = startYear + i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;

        if (year === currentYear) {
            option.selected = true;
        }

        // USA A VARIÁVEL 'yearFilter' DO DASHBOARD
        yearFilter.appendChild(option); 
    }
}


// --- BLOCO 2: FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO ---
// --- BLOCO 2: FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO ---
function updateDashboard() {
    
    // --- Parte A: Ler os Dados (igual) ---
    const expensesFromStorage = localStorage.getItem('expenses');
    const allExpenses = expensesFromStorage ? JSON.parse(expensesFromStorage) : [];

    // --- Parte B: LER OS FILTROS E FILTRAR A LISTA (NOVO!) ---
    // 1. Lemos os valores dos filtros de Mês e Ano
    const selectedMonth = parseInt(monthFilter.value);
    const selectedYear = parseInt(yearFilter.value);

    // 2. Filtramos a lista de "todas as despesas" para ter apenas as do Mês/Ano selecionados
    const filteredExpenses = allExpenses.filter(function(expense) {
        // Usamos a mesma lógica à prova de fuso horário da outra página
        const dateParts = expense.date.split('-'); // ex: "2025-10-20" -> ["2025", "10", "20"]
        const expenseYear = parseInt(dateParts[0]);
        const expenseMonth = parseInt(dateParts[1]);
        
        return expenseMonth === selectedMonth && expenseYear === selectedYear;
    });

    // --- Parte C: Cálculos (AGORA USANDO A LISTA FILTRADA) ---
    // Todos os cálculos agora são feitos em 'filteredExpenses', não em 'allExpenses'

    // 1. Total Geral (do mês filtrado)
    const generalTotal = filteredExpenses.reduce((acc, expense) => acc + expense.value, 0);

    // 2. Lógica do dropdown "Visualizar como"
    const selectedView = viewAsSelectElement.value;
    let selectedTotal = 0;
    let selectedTitle = '';

    if (selectedView === 'Kelly') {
        selectedTotal = filteredExpenses // Usa a lista filtrada
            .filter(expense => expense.paidBy === 'Kelly')
            .reduce((acc, expense) => acc + expense.value, 0);
        selectedTitle = 'Kelly Pagou';
    } else if (selectedView === 'Mary') {
        selectedTotal = filteredExpenses // Usa a lista filtrada
            .filter(expense => expense.paidBy === 'Mary')
            .reduce((acc, expense) => acc + expense.value, 0);
        selectedTitle = 'Mary Pagou';
    } else {
        selectedTotal = generalTotal;
        selectedTitle = 'Total (Mês Selecionado)';
    }

    // 3. Lógica do Balanço Final (do mês filtrado)
    const kellyTotal = filteredExpenses // Usa a lista filtrada
        .filter(expense => expense.paidBy === 'Kelly')
        .reduce((acc, expense) => acc + expense.value, 0);

    const maryTotal = filteredExpenses // Usa a lista filtrada
        .filter(expense => expense.paidBy === 'Mary')
        .reduce((acc, expense) => acc + expense.value, 0);
    
    const fairShare = generalTotal / 2;
    const balance = kellyTotal - fairShare;

    let balanceText = '';
    if (balance > 0) {
        balanceText = `Mary deve R$ ${balance.toFixed(2).replace('.', ',')} para Kelly`;
    } else if (balance < 0) {
        balanceText = `Kelly deve R$ ${Math.abs(balance).toFixed(2).replace('.', ',')} para Mary`;
    } else {
        balanceText = 'Quites!';
    }

    // --- Parte D: Atualizar a Tela (igual) ---
    generalTotalElement.textContent = `R$ ${generalTotal.toFixed(2).replace('.', ',')}`;
    myTotalTitleTextElement.textContent = selectedTitle; // << MUDE AQUI para usar a nova variável
    myTotalElement.textContent = `R$ ${selectedTotal.toFixed(2).replace('.', ',')}`;
    balanceStatusElement.textContent = balanceText;
}

// --- BLOCO 3: "OUVINTES" ---

// 1. Chama as funções na ordem correta quando a página carrega
populateFilters(); // 1º - Popula os filtros (e seleciona o mês/ano atual)
updateDashboard(); // 2º - Atualiza os cards (já usando os filtros corretos)

// 2. Chama a 'updateDashboard' TODA VEZ que o usuário mudar qualquer filtro
viewAsSelectElement.addEventListener('change', updateDashboard);
monthFilter.addEventListener('change', updateDashboard);
yearFilter.addEventListener('change', updateDashboard);