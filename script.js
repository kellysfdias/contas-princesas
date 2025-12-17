// ======================================================
// 1. CONFIGURAÇÃO DO SUPABASE (Com nome diferente para evitar erro)
// ======================================================
const supabaseUrl = 'https://mzfpluvysmhsfqaipoea.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16ZnBsdXZ5c21oc2ZxYWlwb2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTkyNjYsImV4cCI6MjA4MDk3NTI2Nn0.-YUWuIiPFzvBOzsdSLbU8c3WETBMXrKfWICqBqZ8tp4'; 

// MUDANÇA CRUCIAL: Chamamos de 'supabaseClient' em vez de apenas 'supabase'
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ======================================================
// 2. SELEÇÃO DE ELEMENTOS (HTML)
// ======================================================
const addExpenseButton = document.getElementById('add-expense-btn');
const saveExpenseButton = document.getElementById('save-expense-btn');
const expenseModalElement = document.getElementById('expenseModal');
const expenseForm = document.getElementById('expense-form');
const expenseTableBody = document.querySelector('#expense-table tbody');

// Campos do Formulário
const descriptionInput = document.getElementById('expense-description');
const valueInput = document.getElementById('expense-value');
const dateInput = document.getElementById('expense-date');
const installmentsInput = document.getElementById('expense-installments');

// Filtros
const monthFilter = document.getElementById('expense-month-select');
const yearFilter = document.getElementById('expense-year-select');

// Variáveis de Controle
let expenseModal;
// Verifica se o Bootstrap carregou antes de tentar usar
if (window.bootstrap) {
    expenseModal = new bootstrap.Modal(expenseModalElement);
} else {
    console.error("Bootstrap não foi carregado corretamente.");
}

let editingExpenseId = null; 
let allExpenses = []; 

// ======================================================
// 3. FUNÇÕES DE SUPORTE (FILTROS)
// ======================================================

function populateFilters() {
    // Se não achou os elementos no HTML, para aqui
    if (!monthFilter || !yearFilter) {
        console.error("Erro: Selects de filtro não encontrados no HTML");
        return;
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    // Limpa antes de preencher
    monthFilter.innerHTML = '';
    yearFilter.innerHTML = '';

    // Cria os Meses
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = monthNames[i - 1];
        if (i === currentMonth) option.selected = true;
        monthFilter.appendChild(option);
    }

    // Cria os Anos
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
// 4. FUNÇÕES DE BANCO DE DADOS (USANDO supabaseClient)
// ======================================================

async function loadExpenses() {
    console.log("Carregando despesas...");

    // Usa 'supabaseClient' aqui
    const { data, error } = await supabaseClient
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error("Erro ao carregar:", error);
        alert("Erro ao conectar com o banco de dados.");
        return;
    }

    // Mapeia os dados
    allExpenses = data.map(item => ({
        id: item.id,
        description: item.description,
        value: item.value,
        date: item.date,
        paidBy: item.paid_by, // snake_case do banco -> camelCase do JS
        installments: item.installments
    }));

    renderExpenses();
}

async function deleteExpense(id) {
    if(confirm('Tem certeza que deseja excluir esta despesa?')) {
        // Usa 'supabaseClient' aqui
        const { error } = await supabaseClient
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Erro ao excluir: ' + error.message);
        } else {
            loadExpenses();
        }
    }
}

// ======================================================
// 5. INTERFACE E EVENTOS
// ======================================================

function renderExpenses() {
    if (!monthFilter || !yearFilter) return;

    const selectedMonth = parseInt(monthFilter.value);
    const selectedYear = parseInt(yearFilter.value);

    // Filtra
    const filteredExpenses = allExpenses.filter(function(expense) {
        const dateParts = expense.date.split('-'); 
        const expenseYear = parseInt(dateParts[0]);
        const expenseMonth = parseInt(dateParts[1]);
        return expenseMonth === selectedMonth && expenseYear === selectedYear;
    });

    expenseTableBody.innerHTML = '';

    // Desenha
    filteredExpenses.forEach(function(expense) {
        const dateFormatted = expense.date.split('-').reverse().join('/');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-center">${dateFormatted}</td> 
            <td>${expense.description}</td>
            <td class="text-nowrap text-end">R$ ${expense.value.toFixed(2).replace('.', ',')}</td> 
            <td class="text-center">${expense.paidBy}</td>
            <td class="text-center">${expense.installments}x</td>
            <td>
                <div class="d-flex gap-2 justify-content-center"> 
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${expense.id}">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${expense.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        expenseTableBody.appendChild(row);
    });
}

// Evento: Botão Adicionar
addExpenseButton.addEventListener('click', function() {
    editingExpenseId = null;
    expenseForm.reset();
    if (expenseModal) expenseModal.show();
});

// Evento: Botão Salvar
saveExpenseButton.addEventListener('click', async function(event) {
    event.preventDefault();

    const paidBySelected = document.querySelector('input[name="paid-by"]:checked');
    
    if (!descriptionInput.value || !valueInput.value || !dateInput.value || !paidBySelected) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }

    const expenseData = {
        description: descriptionInput.value,
        value: parseFloat(valueInput.value),
        date: dateInput.value,
        installments: parseInt(installmentsInput.value) || 1,
        paid_by: paidBySelected.value
    };

    let error = null;

    if (editingExpenseId !== null) {
        // EDIÇÃO (Usa supabaseClient)
        const response = await supabaseClient
            .from('expenses')
            .update(expenseData)
            .eq('id', editingExpenseId);
        error = response.error;
    } else {
        // CRIAÇÃO (Usa supabaseClient)
        const response = await supabaseClient
            .from('expenses')
            .insert([expenseData]);
        error = response.error;
    }

    if (error) {
        alert('Erro ao salvar: ' + error.message);
    } else {
        if (expenseModal) expenseModal.hide();
        expenseForm.reset();
        loadExpenses();
    }
});

// Evento: Cliques na tabela (Editar/Excluir)
expenseTableBody.addEventListener('click', (e) => {
    const targetBtn = e.target.closest('button');
    if (!targetBtn) return;

    const id = targetBtn.dataset.id;

    if (targetBtn.classList.contains('delete-btn')) {
        deleteExpense(id);
    }

    if (targetBtn.classList.contains('edit-btn')) {
        const expense = allExpenses.find(item => item.id == id);
        if (expense) {
            editingExpenseId = id; 
            
            descriptionInput.value = expense.description;
            valueInput.value = expense.value;
            dateInput.value = expense.date;
            installmentsInput.value = expense.installments;
            
            const radio = document.querySelector(`input[name="paid-by"][value="${expense.paidBy}"]`);
            if(radio) radio.checked = true;

            if (expenseModal) expenseModal.show();
        }
    }
});

// Evento: Mudança de filtro
if (monthFilter && yearFilter) {
    monthFilter.addEventListener('change', renderExpenses);
    yearFilter.addEventListener('change', renderExpenses);
}

// INICIALIZAÇÃO
populateFilters();
loadExpenses();