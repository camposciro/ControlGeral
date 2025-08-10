document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); // evita recarregar a página

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('error-msg');

    // Limpa mensagem de erro
    errorMsg.textContent = "";

    // Simples validação de exemplo
    if (username === "admin" && password === "1234") {
        window.location.href = "home.html"; // redireciona para a página principal
    } else {
        errorMsg.textContent = "Usuário ou senha inválidos!";
    }
});
