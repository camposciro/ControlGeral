// Formata valor para moeda brasileira
function formatarReais(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Carrega viagens do localStorage
function carregarViagens() {
    const viagensJSON = localStorage.getItem('viagens');
    if (!viagensJSON) return [];
    try {
        return JSON.parse(viagensJSON);
    } catch {
        console.error('Erro ao interpretar dados de viagens no localStorage.');
        return [];
    }
}

// Aplica os filtros e retorna lista filtrada
function filtrarViagens(viagens, filtro) {
    return viagens.filter(v => {
        // Valida e compara datas (dataHoraCadastro deve estar em ISO string)
        if (filtro.dataInicio) {
            const dataInicioFiltro = new Date(filtro.dataInicio + "T00:00:00");
            if (!v.dataHoraCadastro || new Date(v.dataHoraCadastro) < dataInicioFiltro) return false;
        }
        if (filtro.dataFim) {
            const dataFimFiltro = new Date(filtro.dataFim + "T23:59:59");
            if (!v.dataHoraCadastro || new Date(v.dataHoraCadastro) > dataFimFiltro) return false;
        }

        // Filtra por status da viagem, se informado
        if (filtro.statusViagem && filtro.statusViagem !== "") {
            if (v.statusViagem !== filtro.statusViagem) return false;
        }

        return true;
    });
}

// Calcula o ganho líquido de uma viagem (PESO * 120 * 0.00011) - 80 se pegou vale
function calcularGanho(viagem) {
    let ganhoBruto = (viagem.peso || 0) * 120 * 0.00011;
    if (viagem.vale === true) {
        ganhoBruto -= 80;
    }
    return ganhoBruto > 0 ? ganhoBruto : 0;
}

// Monta a tabela de relatório com as viagens filtradas e calcula total
function montarTabelaRelatorio(viagens) {
    const tbody = document.querySelector('#relatorioTable tbody');
    tbody.innerHTML = '';

    let totalGanho = 0;

    viagens.forEach(v => {
        const ganho = calcularGanho(v);
        totalGanho += ganho;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Nº Nota">${v.nota || ''}</td>
            <td data-label="Nº CTE">${v.cte || ''}</td>
            <td data-label="Data / Hora">${v.dataHoraCadastro || ''}</td>
            <td data-label="Peso (Kg)">${(v.peso || 0).toFixed(2)}</td>
            <td data-label="Status Viagem">${v.statusViagem || ''}</td>
            <td data-label="Vale">${v.vale ? 'Sim' : 'Não'}</td>
            <td data-label="Ganho (R$)">${formatarReais(ganho)}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('totalGanhos').textContent = formatarReais(totalGanho);
}

function aplicarFiltro(event) {
    event.preventDefault();

    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const statusViagem = document.getElementById('statusViagemFiltro').value;

    const viagens = carregarViagens();

    const viagensFiltradas = filtrarViagens(viagens, {
        dataInicio,
        dataFim,
        statusViagem
    });

    montarTabelaRelatorio(viagensFiltradas);
}

function inicializar() {
    montarTabelaRelatorio(carregarViagens());

    document.getElementById('filtroForm').addEventListener('submit', aplicarFiltro);

    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });
    }
}

document.addEventListener('DOMContentLoaded', inicializar);
