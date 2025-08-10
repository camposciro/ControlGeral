document.getElementById("viagemForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const nota = document.getElementById("nota").value.trim();
    const cte = document.getElementById("cte").value.trim();
    const peso = parseFloat(document.getElementById("peso").value);
    const statusViagem = document.getElementById("statusViagem").value;
    const statusPagamento = document.getElementById("statusPagamento").value;
    const vale = document.getElementById("vale").checked;

    if (!nota || !cte || isNaN(peso) || !statusViagem || !statusPagamento) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }

    let valorFrete = 1000;
    if (vale) {
        valorFrete -= 80;
    }

    // Data/hora atual formatada para pt-BR
    const agora = new Date();
    const dataHoraCadastro = agora.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const viagem = {
        id: Date.now(),
        nota,
        cte,
        peso,
        statusViagem,
        statusPagamento,
        vale,
        valorFrete,
        dataHoraCadastro
    };

    let viagens = JSON.parse(localStorage.getItem("viagens")) || [];
    viagens.push(viagem);
    localStorage.setItem("viagens", JSON.stringify(viagens));

    alert("Viagem cadastrada com sucesso!");

    // Redirecionar para página de listagem
    window.location.href = "listar_viagens.html";
});
