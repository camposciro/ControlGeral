// auth.js

// Configuração do Firebase com seus dados reais (copie do Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyAJBfbhadCB6sN_5FEuwpDqHnrwEVX0uL0",
    authDomain: "controlegeral-bc2f9.firebaseapp.com",
    projectId: "controlegeral-bc2f9",
    storageBucket: "controlegeral-bc2f9.appspot.com",
    messagingSenderId: "538209456858",
    appId: "SEU_APP_ID_AQUI"  // ATENÇÃO: substitua pelo seu appId do Firebase Console!
};

// Inicializa Firebase (se ainda não inicializou)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

async function login(email, senha) {
    try {
        await auth.signInWithEmailAndPassword(email, senha);
        alert('Login realizado com sucesso!');
        window.location.href = 'home.html'; // ou sua página principal
    } catch (error) {
        document.getElementById('error-msg').textContent = 'Erro no login: ' + error.message;
    }
}

function logout() {
    auth.signOut().then(() => {
        alert('Você saiu da conta.');
        window.location.href = 'index.html';
    });
}

auth.onAuthStateChanged(user => {
    if (user) {
        console.log('Usuário logado:', user.email);
    } else {
        console.log('Nenhum usuário logado.');
    }
});

// Event listener do form para chamar login
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('emailLogin').value;
            const senha = document.getElementById('senhaLogin').value;
            login(email, senha);
        });
    }
});
