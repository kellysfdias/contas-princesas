// ======================================================
// 1. CONFIGURAÇÃO DO SUPABASE (Usando supabaseClient)
// ======================================================
const supabaseUrl = 'https://mzfpluvysmhsfqaipoea.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16ZnBsdXZ5c21oc2ZxYWlwb2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTkyNjYsImV4cCI6MjA4MDk3NTI2Nn0.-YUWuIiPFzvBOzsdSLbU8c3WETBMXrKfWICqBqZ8tp4'; 

// Correção: Usando 'supabaseClient' para evitar conflito com a biblioteca
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ======================================================
// 2. SELEÇÃO DE ELEMENTOS
// ======================================================
const generalTotalElement = document.getElementById('general-total-value');
const myTotalElement = document.getElementById('my-total-value');
const balanceStatusElement = document.getElementById('balance-status-text');

const viewAsSelectElement = document.getElementById('view-as-select');
const myTotalTitleTextElement = document.getElementById('my-total-title-text');
const monthFilter = document.getElementById('month-select');
const yearFilter = document.getElementById('year-select');

let globalExpensesList = []; 

// ======================================================
// 3. BUSCAR DADOS (Usando supabaseClient)
// ======================================================
async function loadExpensesForDashboard() {
    console.log("Dashboard: Buscando dados...");

    // Usa 'supabaseClient' aqui
    const { data, error } = await supabaseClient
        .from('expenses')
        .select('*');

    if (error) {
        console.error("Erro Dashboard:", error);
        balanceStatusElement.textContent = "Erro de conexão";
        return;
    }

    // Mapeia snake_case -> camelCase
    globalExpensesList = data.map(item => ({
        id: item.id,
        description: item.description,
        value: item.value,
        date: item.date,
        paidBy: item.paid_by, 
        installments: item.installments
    }));

    updateDashboard();
}

// ======================================================
// 4. POPULAR FILTROS
// ======================================================
function populateFilters() {
    if (!monthFilter || !yearFilter) return;

    const today = new Date();
    const currentMonth = today.getMonth() + 1; 
    const currentYear = today.getFullYear(); 

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    // Meses
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = monthNames[i - 1];
        if (i === currentMonth) option.selected = true;
        monthFilter.appendChild(option); 
    }

    // Anos
    const startYear = currentYear - 2; 
    for (let i = 0; i < 5; i++) {
        const year = startYear + i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) option.selected = true;
        yearFilter.appendChild(option); 
    }
}

// ======================================================
// 5. CÁLCULOS E ATUALIZAÇÃO
// ======================================================
function updateDashboard() {
    const selectedMonth = parseInt(monthFilter.value);
    const selectedYear = parseInt(yearFilter.value);

    // Filtra
    const filteredExpenses = globalExpensesList.filter(function(expense) {
        const dateParts = expense.date.split('-'); 
        const expenseYear = parseInt(dateParts[0]);
        const expenseMonth = parseInt(dateParts[1]);
        return expenseMonth === selectedMonth && expenseYear === selectedYear;
    });

    // Totais
    const generalTotal = filteredExpenses.reduce((acc, expense) => acc + expense.value, 0);

    const kellyTotal = filteredExpenses
        .filter(expense => expense.paidBy === 'Kelly')
        .reduce((acc, expense) => acc + expense.value, 0);

    const maryTotal = filteredExpenses
        .filter(expense => expense.paidBy === 'Mary')
        .reduce((acc, expense) => acc + expense.value, 0);

    // Visualizar como...
    const selectedView = viewAsSelectElement.value;
    let viewTotal = 0;
    let viewTitle = '';

    if (selectedView === 'Kelly') {
        viewTotal = kellyTotal;
        viewTitle = 'Kelly Pagou';
    } else if (selectedView === 'Mary') {
        viewTotal = maryTotal;
        viewTitle = 'Mary Pagou';
    } else {
        viewTotal = generalTotal;
        viewTitle = 'Total (Mês)';
    }

    // Balanço
    const fairShare = generalTotal / 2;
    const balance = kellyTotal - fairShare; 

    let balanceText = '';
    
    if (generalTotal === 0) {
        balanceText = "Sem gastos no mês";
    } else if (balance > 0.01) { 
        balanceText = `Mary deve R$ ${balance.toFixed(2).replace('.', ',')} para Kelly`;
    } else if (balance < -0.01) {
        balanceText = `Kelly deve R$ ${Math.abs(balance).toFixed(2).replace('.', ',')} para Mary`;
    } else {
        balanceText = 'Tudo Quites!';
    }

    // Desenha
    generalTotalElement.textContent = `R$ ${generalTotal.toFixed(2).replace('.', ',')}`;
    myTotalTitleTextElement.textContent = viewTitle;
    myTotalElement.textContent = `R$ ${viewTotal.toFixed(2).replace('.', ',')}`;
    balanceStatusElement.textContent = balanceText;
}

// ======================================================
// 6. INICIALIZAÇÃO
// ======================================================
populateFilters();
loadExpensesForDashboard();

viewAsSelectElement.addEventListener('change', updateDashboard);
if(monthFilter) monthFilter.addEventListener('change', updateDashboard);
if(yearFilter) yearFilter.addEventListener('change', updateDashboard);