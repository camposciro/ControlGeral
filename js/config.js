/* config.js - funções de exportar/importar/enviar/backup/exportarPDF
   Compatível com o HTML que você forneceu.
*/

/* ---------- helpers ---------- */

// formata data p/ nome de arquivo
function nowStamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// baixa um Blob com nome
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// calcula ganho pela fórmula (peso * 120 * 0.00011) - 80 quando vale = true
function calcularGanho(viagem) {
    const peso = Number(viagem.peso) || 0;
    let ganho = peso * 120 * 0.00011;
    if (viagem.vale === true || viagem.vale === 'true' || viagem.vale === 1 || viagem.vale === '1') {
        ganho -= 80;
    }
    return ganho > 0 ? ganho : 0;
}

// tenta converter texto booleano em booleano
function parseBoolean(val) {
    if (typeof val === 'boolean') return val;
    if (!val && val !== 0) return false;
    const s = String(val).toLowerCase().trim();
    return (s === 'true' || s === '1' || s === 'sim' || s === 's' || s === 'yes');
}

/* ---------- leitura/escrita localStorage ---------- */

function carregarViagens() {
    const raw = localStorage.getItem('viagens');
    if (!raw) return [];
    try { return JSON.parse(raw); }
    catch (err) { console.error('Erro parse viagens', err); return []; }
}

function salvarViagens(viagens) {
    localStorage.setItem('viagens', JSON.stringify(viagens));
}

/* ---------- EXPORTAR CSV / JSON ---------- */

function exportarDados() {
    const viagens = carregarViagens();
    if (!viagens || viagens.length === 0) {
        alert('Não há viagens salvas para exportar.');
        return;
    }

    // montar CSV: cabeçalho
    const headers = ['id', 'nota', 'cte', 'peso', 'statusViagem', 'statusPagamento', 'vale', 'valorFrete', 'dataHoraCadastro', 'ganho'];
    const rows = [headers.join(',')];

    viagens.forEach(v => {
        const valorFrete = (v.valorFrete !== undefined && v.valorFrete !== null) ? Number(v.valorFrete) : '';
        const ganho = calcularGanho(v);

        const esc = val => {
            if (val === null || val === undefined) return '';
            const s = String(val);
            if (s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
            if (s.includes(',') || s.includes('\n') || s.includes('\r')) return `"${s}"`;
            return s;
        };

        const line = [
            esc(v.id || ''),
            esc(v.nota || ''),
            esc(v.cte || ''),
            esc(Number(v.peso || 0).toFixed(2)),
            esc(v.statusViagem || ''),
            esc(v.statusPagamento || ''),
            esc(v.vale ? 'Sim' : 'Não'),
            esc(valorFrete),
            esc(v.dataHoraCadastro || ''),
            esc(ganho.toFixed(2))
        ].join(',');

        rows.push(line);
    });

    const csv = rows.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const filename = `viagens-${nowStamp()}.csv`;
    downloadBlob(blob, filename);
    alert(`Exportado ${viagens.length} registros em ${filename}`);
}

/* ---------- PARSER CSV SIMPLES (suporta aspas e vírgulas dentro de campos) ---------- */

function parseCSV(text) {
    const lines = text.split(/\r\n|\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];
    const data = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fields = [];
        let cur = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (ch === '"') {
                if (inQuotes && line[j + 1] === '"') {
                    cur += '"';
                    j++; // pula a segunda aspa
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                fields.push(cur);
                cur = '';
            } else {
                cur += ch;
            }
        }
        fields.push(cur);
        data.push(fields);
    }

    return data;
}

/* ---------- IMPORTAR (CSV ou JSON) ---------- */

async function importarDados() {
    const input = document.getElementById('importFile');
    if (!input || !input.files || input.files.length === 0) {
        alert('Nenhum arquivo selecionado.');
        return;
    }

    const file = input.files[0];
    const text = await file.text();

    const filename = file.name || 'import';

    // Se JSON
    if (filename.toLowerCase().endsWith('.json')) {
        try {
            const parsed = JSON.parse(text);
            let incoming = [];
            if (Array.isArray(parsed)) incoming = parsed;
            else if (parsed && Array.isArray(parsed.viagens)) incoming = parsed.viagens;
            else {
                alert('Formato JSON inválido. Deve ser um array de viagens ou objeto com propriedade "viagens".');
                return;
            }

            if (incoming.length === 0) { alert('Arquivo JSON não contém registros.'); return; }

            const action = confirm('Deseja SUBSTITUIR todas as viagens existentes? (OK = Substituir, Cancel = Mesclar)');
            if (action) {
                salvarViagens(incoming);
                alert(`Importação concluída: substituídos ${incoming.length} registros.`);
            } else {
                const existentes = carregarViagens();
                const unidos = existentes.concat(incoming);
                salvarViagens(unidos);
                alert(`Importação concluída: mesclados ${incoming.length} registros.`);
            }

            input.value = '';
            return;
        } catch (err) {
            console.error(err);
            alert('Erro ao ler JSON: ' + err.message);
            return;
        }
    }

    // Se CSV
    try {
        const table = parseCSV(text);
        if (!table || table.length < 1) { alert('CSV vazio'); return; }

        const header = table[0].map(h => String(h || '').trim().toLowerCase());
        const rows = table.slice(1);

        const mapIndex = name => {
            const keys = ['id', 'nota', 'cte', 'peso', 'statusviagem', 'statuspagamento', 'vale', 'valorfrete', 'datahoracadastro', 'dataHoraCadastro', 'data_hora'];
            let idx = header.indexOf(name.toLowerCase());
            if (idx !== -1) return idx;
            for (let i = 0; i < header.length; i++) {
                const h = header[i];
                if (h.includes(name.toLowerCase())) return i;
            }
            for (let k of keys) {
                const pos = header.indexOf(k);
                if (pos !== -1) return pos;
            }
            return -1;
        };

        const idxNota = mapIndex('nota');
        const idxCte = mapIndex('cte');
        const idxPeso = mapIndex('peso');
        const idxStatusViagem = mapIndex('statusviagem');
        const idxStatusPagamento = mapIndex('statuspagamento');
        const idxVale = mapIndex('vale');
        const idxValorFrete = mapIndex('valorfrete');
        const idxDataHora = mapIndex('datahoracadastro') !== -1 ? mapIndex('datahoracadastro') : mapIndex('dataHoraCadastro');

        if (idxPeso === -1) {
            console.warn('CSV não contém coluna "peso" detectada. Verifique o cabeçalho.');
        }

        const incoming = rows.map(r => {
            const obj = {};
            obj.id = (idxNota === -1 ? Date.now() + Math.floor(Math.random() * 1000) : (r[idxNota] || '').trim()) || (Date.now() + Math.floor(Math.random() * 1000));
            if (idxNota !== -1) obj.nota = (r[idxNota] || '').trim();
            if (idxCte !== -1) obj.cte = (r[idxCte] || '').trim();
            if (idxPeso !== -1) obj.peso = parseFloat((r[idxPeso] || '0').replace(',', '.')) || 0;
            if (idxStatusViagem !== -1) obj.statusViagem = (r[idxStatusViagem] || '').trim();
            if (idxStatusPagamento !== -1) obj.statusPagamento = (r[idxStatusPagamento] || '').trim();
            if (idxVale !== -1) obj.vale = parseBoolean((r[idxVale] || '').trim());
            if (idxValorFrete !== -1) obj.valorFrete = parseFloat((r[idxValorFrete] || '').replace(',', '.')) || 0;
            if (idxDataHora !== -1) obj.dataHoraCadastro = (r[idxDataHora] || '').trim();
            return obj;
        });

        if (incoming.length === 0) { alert('CSV não possui registros válidos.'); input.value = ''; return; }

        const action = confirm('Deseja SUBSTITUIR todas as viagens existentes? (OK = Substituir, Cancel = Mesclar)');
        if (action) {
            salvarViagens(incoming);
            alert(`Importação CSV concluída: ${incoming.length} registros importados (substituídos).`);
        } else {
            const existentes = carregarViagens();
            const unidos = existentes.concat(incoming);
            salvarViagens(unidos);
            alert(`Importação CSV concluída: ${incoming.length} registros mesclados.`);
        }

        input.value = '';
    } catch (err) {
        console.error(err);
        alert('Erro ao importar CSV: ' + err.message);
    }
}

/* ---------- BACKUP (JSON com todo o localStorage) ---------- */

function fazerBackup() {
    const obj = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        obj[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const filename = `backup-localstorage-${nowStamp()}.json`;
    downloadBlob(blob, filename);
    alert('Backup gerado e baixado: ' + filename);
}

/* ---------- ENVIAR RELATÓRIO (tenta navigator.share, senão faz download e instruções) ---------- */

async function enviarRelatorio() {
    const viagens = carregarViagens();
    if (!viagens || viagens.length === 0) { alert('Não há dados para enviar.'); return; }

    const headers = ['id', 'nota', 'cte', 'peso', 'statusViagem', 'statusPagamento', 'vale', 'valorFrete', 'dataHoraCadastro', 'ganho'];
    const rows = [headers.join(',')];

    viagens.forEach(v => {
        const valorFrete = (v.valorFrete !== undefined && v.valorFrete !== null) ? Number(v.valorFrete) : '';
        const ganho = calcularGanho(v);
        const esc = val => {
            if (val === null || val === undefined) return '';
            const s = String(val);
            if (s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
            if (s.includes(',') || s.includes('\n') || s.includes('\r')) return `"${s}"`;
            return s;
        };
        const line = [
            esc(v.id || ''), esc(v.nota || ''), esc(v.cte || ''), esc(Number(v.peso || 0).toFixed(2)),
            esc(v.statusViagem || ''), esc(v.statusPagamento || ''), esc(v.vale ? 'Sim' : 'Não'),
            esc(valorFrete), esc(v.dataHoraCadastro || ''), esc(ganho.toFixed(2))
        ].join(',');
        rows.push(line);
    });

    const csv = rows.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const filename = `relatorio-viagens-${nowStamp()}.csv`;

    if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: blob.type })] })) {
        try {
            await navigator.share({
                title: 'Relatório de Viagens',
                text: 'Segue relatório de viagens (CSV).',
                files: [new File([blob], filename, { type: blob.type })]
            });
            alert('Compartilhamento concluído.');
            return;
        } catch (err) {
            console.warn('share() falhou:', err);
        }
    }

    downloadBlob(blob, filename);
    alert('Arquivo baixado. Para enviar por e-mail, anexe o arquivo ' + filename + ' manualmente.');
}

/* ---------- EXPORTAR PDF usando jsPDF e autotable ---------- */

function exportarPDF() {
    const viagens = carregarViagens();
    if (!viagens || viagens.length === 0) {
        alert('Não há viagens salvas para exportar.');
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Biblioteca jsPDF não carregada.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const title = "Relatório de Viagens";
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    const headers = [['ID', 'Nota', 'CTE', 'Peso', 'Status Viagem', 'Status Pagamento', 'Vale', 'Valor Frete', 'Data Cadastro', 'Ganho']];
    const data = viagens.map(v => [
        v.id || '',
        v.nota || '',
        v.cte || '',
        v.peso != null ? v.peso.toFixed(2) : '',
        v.statusViagem || '',
        v.statusPagamento || '',
        v.vale ? 'Sim' : 'Não',
        v.valorFrete != null ? v.valorFrete.toFixed(2) : '',
        v.dataHoraCadastro || '',
        calcularGanho(v).toFixed(2)
    ]);

    if (doc.autoTable) {
        doc.autoTable({
            head: headers,
            body: data,
            startY: 30,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [30, 60, 114] }
        });
        doc.save(`viagens-${nowStamp()}.pdf`);
    } else {
        alert('O plugin autoTable do jsPDF não está disponível.');
    }
}

/* ---------- inicialização e bind de eventos ---------- */

document.addEventListener('DOMContentLoaded', () => {
    window.exportarDados = exportarDados;
    window.importarDados = importarDados;
    window.enviarRelatorio = enviarRelatorio;
    window.fazerBackup = fazerBackup;
    window.exportarPDF = exportarPDF;

    const input = document.getElementById('importFile');
    if (input) {
        input.addEventListener('change', () => {
            const label = input.nextElementSibling;
            if (input.files.length > 0) {
                const nome = input.files[0].name;
                let el = input.parentElement.querySelector('.import-filename');
                if (!el) {
                    el = document.createElement('div');
                    el.className = 'import-filename';
                    input.parentElement.appendChild(el);
                }
                el.textContent = 'Arquivo: ' + nome;
            }
            importarDados();
        });
    }
});
