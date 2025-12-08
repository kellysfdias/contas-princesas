// --- BLOCO 1: SELEÇÃO DOS ELEMENTOS PRINCIPAIS ---
// Guardamos em constantes os elementos do HTML que vamos usar várias vezes.
const addExpenseButton = document.getElementById('add-expense-btn');
const expenseModalElement = document.getElementById('expenseModal');
const saveExpenseButton = document.getElementById('save-expense-btn');
const expenseForm = document.getElementById('expense-form');
const expenseTableBody = document.querySelector('#expense-table tbody');
let editingExpenseId = null;

const monthFilter = document.getElementById('expense-month-select');
const yearFilter = document.getElementById('expense-year-select');


// --- BLOCO 2: INICIALIZAÇÃO DO MODAL ---
// Dizemos ao Bootstrap para transformar nosso elemento HTML em um Modal interativo.
const expenseModal = new bootstrap.Modal(expenseModalElement);

// --- BLOCO 3: AÇÕES (EVENT LISTENERS) ---

// AÇÃO 1: Abrir o modal ao clicar em "Adicionar Nova Despesa"
addExpenseButton.addEventListener('click', function() {
    editingExpenseId = null; // Limpa a memória de edição
    expenseForm.reset();     // Limpa visualmente o formulário
    expenseModal.show();
});

// AÇÃO 2: Salvar a despesa (CRIAR ou EDITAR)
saveExpenseButton.addEventListener('click', function(event) {
    event.preventDefault();

    const descriptionInput = document.getElementById('expense-description');
    const valueInput = document.getElementById('expense-value');
    const dateInput = document.getElementById('expense-date');
    const installmentsInput = document.getElementById('expense-installments');
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
        paidBy: paidBySelected.value
    };

    let allExpenses = JSON.parse(localStorage.getItem('expenses')) || [];

    if (editingExpenseId !== null) {
        // MODO DE EDIÇÃO
        const indexToEdit = allExpenses.findIndex(expense => expense.id === editingExpenseId);
        if (indexToEdit !== -1) {
            allExpenses[indexToEdit] = { id: editingExpenseId, ...expenseData };
        }
    } else {
        // MODO DE CRIAÇÃO
        allExpenses.push({ id: new Date().getTime(), ...expenseData });
    }

    localStorage.setItem('expenses', JSON.stringify(allExpenses));
    renderExpenses();
    expenseForm.reset();
    expenseModal.hide();
});

// AÇÃO 3: Gerenciar o foco por acessibilidade quando o modal fecha.
expenseModalElement.addEventListener('hidden.bs.modal', function () {
  addExpenseButton.focus();
});

// --- BLOCO 4: FUNÇÃO PARA RENDERIZAR (DESENHAR) AS DESPESAS NA TELA ---
// --- BLOCO 4: FUNÇÃO PARA RENDERIZAR (DESENHAR) AS DESPESAS NA TELA ---
function renderExpenses() {
    // 1. Pega a lista completa de despesas
    const expensesFromStorage = localStorage.getItem('expenses');
    const allExpenses = expensesFromStorage ? JSON.parse(expensesFromStorage) : [];

    // 2. LÊ OS VALORES DOS FILTROS
    const selectedMonth = parseInt(monthFilter.value);
    const selectedYear = parseInt(yearFilter.value);

    // 3. FILTRA A LISTA (COM A CORREÇÃO DO BUG)
    const filteredExpenses = allExpenses.filter(function(expense) {
        
        // --- INÍCIO DA CORREÇÃO ---
        // A data está salva como "YYYY-MM-DD" (ex: "2025-11-01")
        // Vamos quebrar o texto no hífen '-'
        const dateParts = expense.date.split('-'); // "2025-11-01" -> ["2025", "11", "01"]

        // Pegamos as partes e as convertemos em números
        const expenseYear = parseInt(dateParts[0]);  // 2025
        const expenseMonth = parseInt(dateParts[1]); // 11
        // Não precisamos do dia (dateParts[2]) para o filtro
        // --- FIM DA CORREÇÃO ---

        // A despesa só passa no filtro se o mês E o ano baterem.
        // Agora, 11 (Novembro) será comparado com 11 (Novembro) e 10 com 10.
        return expenseMonth === selectedMonth && expenseYear === selectedYear;
    });

    // 4. Limpa a tabela
    expenseTableBody.innerHTML = '';

    // 5. Desenha as linhas da tabela (agora usando a LISTA FILTRADA)
    filteredExpenses.forEach(function(expense) {
        
        // --- FORMATAÇÃO DA DATA (NOVO!) ---
        // Pega "2025-10-30", quebra em pedaços, inverte e junta com barras.
        // Resultado: "30/10/2025"
        const dateFormatted = expense.date.split('-').reverse().join('/');

        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="text-center">${dateFormatted}</td> <td>${expense.description}</td>
          <td class="text-nowrap text-end">R$ ${expense.value.toFixed(2).replace('.', ',')}</td> <td class="text-center">${expense.paidBy}</td>
          <td class="text-center">${expense.installments}x</td>
          <td>
            <div class="d-flex gap-2 justify-content-center"> <button class="btn btn-sm btn-warning edit-btn" data-id="${expense.id}">
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
// CHAMA A FUNÇÃO PELA PRIMEIRA VEZ PARA CARREGAR OS DADOS INICIAIS
populateFilters();
renderExpenses();

// --- BLOCO 5: AÇÃO DE EXCLUIR DESPESA E EDITAR ---

expenseTableBody.addEventListener('click', function(event) {
    // 1. Verificamos se o local exato do clique (event.target) tem a classe 'delete-btn'
    if (event.target.classList.contains('delete-btn')) {
        // Se tiver, executamos este código
       // 2. Se foi, pegamos o ID que "carimbamos" no botão.
        const expenseId = parseInt(event.target.dataset.id);
        console.log("ID da despesa a ser excluída:", expenseId);

        // 3. Pedimos uma confirmação ao usuário.
        const wantsToDelete = confirm('Tem certeza que deseja excluir esta despesa?');

        // 4. Verificamos se o usuário clicou em "OK".
        if (wantsToDelete) {
    // 1. Pega a lista completa de despesas do localStorage.
    let allExpenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // 2. Cria uma NOVA lista, mantendo apenas as despesas com ID DIFERENTE do que foi clicado.
    const updatedExpenses = allExpenses.filter(function(expense) {
        return expense.id !== expenseId;
    });

    // 3. Salva a nova lista (sem o item excluído) de volta no localStorage.
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));

    // 4. Re-desenha a tabela para mostrar o resultado na tela.
    renderExpenses();
    //
        }
    
    }

    // LÓGICA DE EDITAR (ADICIONE ESTE BLOCO)
    if (event.target.classList.contains('edit-btn')) {
    const expenseId = parseInt(event.target.dataset.id);
    const allExpenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const expenseToEdit = allExpenses.find(function(expense) {
        return expense.id === expenseId;
    });

    // Se a despesa foi encontrada...
        if (expenseToEdit) {
            editingExpenseId = expenseToEdit.id;
            // 1. Preenchemos os campos do formulário com os dados da despesa
            document.getElementById('expense-description').value = expenseToEdit.description;
            document.getElementById('expense-value').value = expenseToEdit.value;
            document.getElementById('expense-date').value = expenseToEdit.date;
            document.getElementById('expense-installments').value = expenseToEdit.installments;

            // 2. Marcamos o radio button correto (Kelly ou Mary)
            document.querySelector(`input[name="paid-by"][value="${expenseToEdit.paidBy}"]`).checked = true;

            // 3. Abrimos o modal
            expenseModal.show();
        }
    }
    
});

// --- BLOCO 7: FUNÇÃO PARA POPULAR OS FILTROS DE MÊS/ANO ---

function populateFilters() {
    // 1. Pega a data de HOJE
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // +1 porque os meses vão de 0 a 11
    const currentYear = today.getFullYear();

    // 2. Popula os MESES
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // Loop de 1 a 12
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = monthNames[i - 1]; // Pega o nome do mês no array
        
        // Se este for o mês atual, já o deixa selecionado
        if (i === currentMonth) {
            option.selected = true;
        }
        
        monthFilter.appendChild(option);
    }

    // 3. Popula os ANOS
    // Vamos mostrar 5 anos (ex: de 2023 até 2027)
    const startYear = currentYear - 2; // Começa 2 anos atrás
    for (let i = 0; i < 5; i++) {
        const year = startYear + i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;

        // Se este for o ano atual, já o deixa selecionado
        if (year === currentYear) {
            option.selected = true;
        }

        yearFilter.appendChild(option);
    }
}   
// --- BLOCO 6: "OUVINTES" DOS FILTROS ---

// Adiciona um "ouvinte" ao dropdown de MÊS
monthFilter.addEventListener('change', renderExpenses);

// Adiciona um "ouvinte" ao dropdown de ANO
yearFilter.addEventListener('change', renderExpenses);

 