// Formata valor para moeda brasileira
function formatarReais(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Carrega viagens do localStorage
function carregarViagens() {
    return JSON.parse(localStorage.getItem('viagens')) || [];
}

// Salva viagens no localStorage
function salvarViagens(viagens) {
    localStorage.setItem('viagens', JSON.stringify(viagens));
}

// Monta a tabela das viagens
function montarTabela() {
    const viagens = carregarViagens();
    const tbody = document.querySelector('#viagensTable tbody');
    tbody.innerHTML = '';

    viagens.forEach((viagem, index) => {
        // Calcula o valorFrete conforme fórmula e desconta vale se marcado
        let valorFrete = viagem.peso * 120 * 0.00011;
        if (viagem.vale) {
            valorFrete -= 80;
        }
        if (valorFrete < 0) valorFrete = 0;

        const tr = document.createElement('tr');
        tr.dataset.index = index;

        tr.innerHTML = `
            <td data-label="Nº Nota">${viagem.nota}</td>
            <td data-label="Nº CTE">${viagem.cte}</td>
            <td data-label="Peso (Kg)">${viagem.peso.toFixed(2)}</td>
            <td data-label="Status Viagem">${viagem.statusViagem}</td>
            <td data-label="Status Pagamento">${viagem.statusPagamento}</td>
            <td data-label="Vale">${viagem.vale ? 'Sim' : 'Não'}</td>
            <td data-label="Valor Frete">${formatarReais(valorFrete)}</td>
            <td data-label="Data/Hora Cadastro">${viagem.dataHoraCadastro || ''}</td>
        `;

        tbody.appendChild(tr);
    });

    desabilitarBotoes();
}

let viagemSelecionadaIndex = null;

function habilitarBotoes() {
    document.getElementById('btnEditar').disabled = false;
    document.getElementById('btnEditar').setAttribute('aria-disabled', 'false');
    document.getElementById('btnExcluir').disabled = false;
    document.getElementById('btnExcluir').setAttribute('aria-disabled', 'false');
}

function desabilitarBotoes() {
    document.getElementById('btnEditar').disabled = true;
    document.getElementById('btnEditar').setAttribute('aria-disabled', 'true');
    document.getElementById('btnExcluir').disabled = true;
    document.getElementById('btnExcluir').setAttribute('aria-disabled', 'true');
}

function configurarSelecao() {
    const tbody = document.querySelector('#viagensTable tbody');
    tbody.addEventListener('click', (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;

        tbody.querySelectorAll('tr').forEach(row => row.classList.remove('selected'));
        tr.classList.add('selected');
        viagemSelecionadaIndex = Number(tr.dataset.index);

        habilitarBotoes();
    });
}

function mostrarModal() {
    const modal = document.getElementById('modalEdit');
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';
}

function fecharModal() {
    const modal = document.getElementById('modalEdit');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
}

function preencherFormulario() {
    const viagens = carregarViagens();
    if (viagemSelecionadaIndex === null || viagemSelecionadaIndex >= viagens.length) return;

    const viagem = viagens[viagemSelecionadaIndex];

    document.getElementById('editIndex').value = viagemSelecionadaIndex;
    document.getElementById('editNota').value = viagem.nota;
    document.getElementById('editCte').value = viagem.cte;
    document.getElementById('editPeso').value = viagem.peso;
    document.getElementById('editStatusViagem').value = viagem.statusViagem;
    document.getElementById('editStatusPagamento').value = viagem.statusPagamento;
    document.getElementById('editVale').checked = viagem.vale;
}

function salvarEdicao(e) {
    e.preventDefault();

    const index = Number(document.getElementById('editIndex').value);
    const viagens = carregarViagens();

    if (index >= viagens.length) {
        alert('Viagem não encontrada!');
        fecharModal();
        return;
    }

    const nota = document.getElementById('editNota').value.trim();
    const cte = document.getElementById('editCte').value.trim();
    const peso = parseFloat(document.getElementById('editPeso').value);
    const statusViagem = document.getElementById('editStatusViagem').value;
    const statusPagamento = document.getElementById('editStatusPagamento').value;
    const vale = document.getElementById('editVale').checked;

    if (!nota || !cte || isNaN(peso) || !statusViagem || !statusPagamento) {
        alert('Preencha todos os campos corretamente!');
        return;
    }

    viagens[index] = {
        ...viagens[index],
        nota,
        cte,
        peso,
        statusViagem,
        statusPagamento,
        vale,
        // Não armazenamos valorFrete fixo pois será calculado na exibição
        // Mantemos dataHoraCadastro original
    };

    salvarViagens(viagens);
    montarTabela();
    fecharModal();
    viagemSelecionadaIndex = null;
    desabilitarBotoes();
}

function excluirViagem() {
    if (viagemSelecionadaIndex === null) return;

    if (!confirm('Tem certeza que deseja excluir a viagem selecionada?')) return;

    const viagens = carregarViagens();
    viagens.splice(viagemSelecionadaIndex, 1);

    salvarViagens(viagens);
    montarTabela();
    viagemSelecionadaIndex = null;
    desabilitarBotoes();
}

function inicializar() {
    montarTabela();
    configurarSelecao();

    document.getElementById('btnEditar').addEventListener('click', () => {
        if (viagemSelecionadaIndex === null) return;
        preencherFormulario();
        mostrarModal();
    });

    document.getElementById('btnExcluir').addEventListener('click', excluirViagem);

    document.getElementById('editForm').addEventListener('submit', salvarEdicao);

    document.getElementById('cancelEdit').addEventListener('click', () => {
        fecharModal();
    });

    document.getElementById('modalEdit').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharModal();
    });
}

document.addEventListener('DOMContentLoaded', inicializar);
