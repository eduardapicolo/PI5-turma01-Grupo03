const dogs = [
    {
        id: 1,
        name: 'Rex, 3 anos',
        desc: 'Brincalhão e cheio de energia',
        img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1',
        ong: 'ONG Cão Feliz',
        telefone: '(19) 99999-9999'
    },
    {
        id: 2,
        name: 'Luna, 2 anos',
        desc: 'Carinhosa e ama crianças',
        img: 'https://images.unsplash.com/photo-1517849845537-4d257902454a',
        ong: 'Abrigo Amigo Fiel',
        telefone: '(11) 98888-8888'
    },
    {
        id: 3,
        name: 'Thor, 4 anos',
        desc: 'Leal e protetor',
        img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e',
        ong: 'Patinhas Carentes',
        telefone: '(19) 97777-7777'
    }
];


const container = document.getElementById('cards-container');
const matchScreen = document.getElementById('match-screen');
const ongNome = document.getElementById('ong-nome');
const ongTelefone = document.getElementById('ong-telefone');

let index = 0;
let activeCard = null;

function renderCard() {
    container.innerHTML = '';

    if (index >= dogs.length) {
        container.innerHTML = '<p style="color:white;text-align:center;margin-top:50%; font-size: 20px;">Acabaram os doguinhos 🐶<br>Volte mais tarde!</p>';
        return;
    }

    const dog = dogs[index];

    const card = document.createElement('div');
    card.classList.add('card');

    card.dataset.ong = dog.ong;
    card.dataset.telefone = dog.telefone;

    card.innerHTML = `
        <div class="label like-label">LIKE</div>
        <div class="label nope-label">NOPE</div>
        <img src="${dog.img}" draggable="false" />
        <div class="card-info">
            <h2>${dog.name}</h2>
            <p>${dog.desc}</p>
        </div>
    `;

    container.appendChild(card);
    activeCard = card;
    enableSwipe(card);
}


let startX = 0;
let currentX = 0;
let dragging = false;

function enableSwipe(card) {
    card.addEventListener('pointerdown', (e) => {
        dragging = true;
        startX = e.clientX;
        card.style.transition = 'none';
    });
}

document.addEventListener('pointermove', (e) => {
    if (!dragging || !activeCard) return;

    currentX = e.clientX - startX;
    const rotate = currentX * 0.05;

    activeCard.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;

    const likeLabel = activeCard.querySelector('.like-label');
    const nopeLabel = activeCard.querySelector('.nope-label');

    if (currentX > 0) {
        likeLabel.style.opacity = Math.min(currentX / 100, 1);
        nopeLabel.style.opacity = 0;
    } else {
        nopeLabel.style.opacity = Math.min(-currentX / 100, 1);
        likeLabel.style.opacity = 0;
    }
});

document.addEventListener('pointerup', () => {
    if (!dragging || !activeCard) return;

    dragging = false;
    activeCard.style.transition = 'transform 0.4s ease-out';

    const limit = 80;
    const likeLabel = activeCard.querySelector('.like-label');
    const nopeLabel = activeCard.querySelector('.nope-label');

    if (currentX > limit) {
        swipe('right');
    } else if (currentX < -limit) {
        swipe('left');
    } else {
        activeCard.style.transform = 'translateX(0) rotate(0deg)';
        likeLabel.style.opacity = 0;
        nopeLabel.style.opacity = 0;
    }

    currentX = 0;
});

function swipe(direction) {
    if (!activeCard) return;

    const card = activeCard;
    activeCard = null;

    if (direction === 'right') {
        card.style.transform = `translateX(${window.innerWidth}px) rotate(30deg)`;

        const nomeDaOng = card.dataset.ong;
        const telefoneDaOng = card.dataset.telefone;

        setTimeout(() => {
            openMatch(nomeDaOng, telefoneDaOng);
            nextCard();
        }, 300);

    } else {
        card.style.transform = `translateX(-${window.innerWidth}px) rotate(-30deg)`;

        setTimeout(() => {
            nextCard();
        }, 300);
    }
}

function nextCard() {
    index++;
    renderCard();
}

function openMatch(nome, telefone) {
    ongNome.innerText = nome;
    ongTelefone.innerText = "📞 " + telefone;
    matchScreen.classList.add('active');
}

function fecharMatch() {
    matchScreen.classList.remove('active');
}

document.getElementById('btn-nope').addEventListener('click', () => {
    swipe('left');
});

document.getElementById('btn-like').addEventListener('click', () => {
    swipe('right');
});

let curtidos = [];

function swipe(direction) {
    if (!activeCard) return;
    const card = activeCard;
    activeCard = null;

    if (direction === 'right') {
        card.style.transform = `translateX(${window.innerWidth}px) rotate(30deg)`;
        
        const dogAtual = dogs[index];
        curtidos.push(dogAtual); 

        setTimeout(() => {
            openMatch(dogAtual.ong, dogAtual.telefone);
            nextCard();
        }, 300);
    } else {
        card.style.transform = `translateX(-${window.innerWidth}px) rotate(-30deg)`;
        setTimeout(() => { nextCard(); }, 300);
    }
}

// ANIMAIS CURTIDOS
function abrirFavoritos() {
    const listContainer = document.getElementById('fav-list');
    listContainer.innerHTML = '';

    if (curtidos.length === 0) {
        listContainer.innerHTML = '<p style="grid-column: span 2; text-align: center; color: #888;">Nenhum aumigo ainda. 💔</p>';
    } else {
        curtidos.forEach(dog => {
            listContainer.innerHTML += `
                <div class="fav-item">
                    <img src="${dog.img}">
                    <p>${dog.name.split(',')[0]}</p>
                </div>
            `;
        });
    }
    document.getElementById('favorites-screen').classList.add('active');
}

function fecharFavoritos() {
    document.getElementById('favorites-screen').classList.remove('active');
}

//CHAT DAS ONGS
function abrirChat() {
    const chatListContainer = document.getElementById('chat-list');
    chatListContainer.innerHTML = '';

    if (curtidos.length === 0) {
        chatListContainer.innerHTML = `
            <div style="text-align: center; margin-top: 50px;">
                <p style="color: #666;">Dê um Match primeiro para<br>começar a conversar!</p>
            </div>`;
    } else {
        curtidos.forEach(animal => {
            chatListContainer.innerHTML += `
                <div class="chat-item" onclick="alert('Conectando ao WhatsApp da ${animal.ong}...')">
                    <img src="${animal.img}">
                    <div class="chat-info">
                        <h4>${animal.name.split(',')[0]} (${animal.ong})</h4>
                        <p>Olá! Tenho interesse em adotar...</p>
                    </div>
                </div>
            `;
        });
    }
    document.getElementById('chat-screen').classList.add('active');
}

function fecharChat() {
    document.getElementById('chat-screen').classList.remove('active');
}

// TELA USUARIO
function abrirPerfil() {
    document.getElementById('match-count').innerText = curtidos.length;
    
    document.getElementById('profile-screen').classList.add('active');
}

function fecharPerfil() {
    document.getElementById('profile-screen').classList.remove('active');
}

renderCard();