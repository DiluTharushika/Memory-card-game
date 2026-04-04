/**
 * Memory Master - Professional Edition
 * Handle game logic, UI updates, and audio management.
 */

// --- Constants & State ---
const CONFIG = {
    '4x3': { rows: 3, cols: 4, targetMoves: 15, time: 40 },
    '4x4': { rows: 4, cols: 4, targetMoves: 25, time: 60 },
    '5x4': { rows: 4, cols: 5, targetMoves: 35, time: 90 }
};

let currentState = {
    gridType: '4x3',
    cards: [],
    lockBoard: false,
    firstCard: null,
    secondCard: null,
    moves: 0,
    matches: 0,
    score: 0,
    timeLeft: 0,
    timer: null,
    gameStarted: false,
    bgmVolume: 0.3,
    sfxVolume: 0.7,
    isMuted: false
};

// --- DOM Elements ---
const gridContainer = document.querySelector(".grid-container");
const scoreEl = document.querySelector(".score");
const movesEl = document.querySelector(".moves");
const targetEl = document.querySelector(".target-moves");
const timeEl = document.querySelector(".time-left");
const startBtn = document.querySelector(".start-button");
const restartBtns = document.querySelectorAll(".restart-button");
const diffBtns = document.querySelectorAll(".diff-btn");
const messageOverlay = document.getElementById("message-overlay");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");

// Audio Elements
const audio = {
    bgm: document.getElementById("bg-music"),
    flip: document.getElementById("flip-sound"),
    win: document.getElementById("win-sound"),
    lose: document.getElementById("lose-sound"),
    match: document.getElementById("match-sound")
};

const bgmSlider = document.querySelector(".bgm-slider");
const sfxSlider = document.querySelector(".sfx-slider");
const muteBtn = document.querySelector(".mute-btn");

// --- Initialization ---
function init() {
    setupEventListeners();
    loadCards();
    renderCards();
    updateUI();
    applyAudioSettings();
}

function setupEventListeners() {
    startBtn.addEventListener("click", startGame);
    restartBtns.forEach(btn => btn.addEventListener("click", resetGame));
    
    diffBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (currentState.gameStarted) return;
            diffBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentState.gridType = btn.dataset.grid;
            resetGame();
        });
    });

    bgmSlider.addEventListener("input", (e) => {
        currentState.bgmVolume = e.target.value;
        applyAudioSettings();
    });

    sfxSlider.addEventListener("input", (e) => {
        currentState.sfxVolume = e.target.value;
        applyAudioSettings();
    });

    muteBtn.addEventListener("click", toggleMute);
}

// --- Audio Logic ---
function applyAudioSettings() {
    audio.bgm.volume = currentState.isMuted ? 0 : currentState.bgmVolume;
    audio.flip.volume = currentState.isMuted ? 0 : currentState.sfxVolume;
    audio.win.volume = currentState.isMuted ? 0 : currentState.sfxVolume;
    audio.lose.volume = currentState.isMuted ? 0 : currentState.sfxVolume;
    audio.match.volume = currentState.isMuted ? 0 : currentState.sfxVolume;
}

function toggleMute() {
    currentState.isMuted = !currentState.isMuted;
    muteBtn.textContent = currentState.isMuted ? "🔇" : "🔊";
    applyAudioSettings();
}

function playSFX(key) {
    if (audio[key]) {
        audio[key].currentTime = 0;
        audio[key].play().catch(() => {});
    }
}

// --- Game Logic ---
function loadCards() {
    const data = [
        { "image": "Assestes/cat.jpeg", "name": "cat" },
        { "image": "Assestes/coak.jpeg", "name": "coak" },
        { "image": "Assestes/dog.jpeg", "name": "dog" },
        { "image": "Assestes/gorilla.jpeg", "name": "gorilla" },
        { "image": "Assestes/lion.jpeg", "name": "lion" },
        { "image": "Assestes/monkey.jpeg", "name": "monkey" },
        { "image": "Assestes/pig.jpeg", "name": "pig" },
        { "image": "Assestes/rabbit.jpeg", "name": "rabbit" },
        { "image": "Assestes/squeril.jpeg", "name": "squeril" },
        { "image": "Assestes/tiger.jpeg", "name": "tiger" },
        { "image": "Assestes/chick with mom.jpeg", "name": "chick" }
    ];

    const config = CONFIG[currentState.gridType];
    const numPairs = (config.rows * config.cols) / 2;
    
    // Take subset of cards based on difficulty
    const subset = data.slice(0, numPairs);
    currentState.cards = [...subset, ...subset];
    shuffle(currentState.cards);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderCards() {
    gridContainer.innerHTML = "";
    const config = CONFIG[currentState.gridType];
    
    // Set grid columns and rows dynamically for flexible sizing
    gridContainer.style.gridTemplateColumns = `repeat(${config.cols}, auto)`;
    gridContainer.style.gridTemplateRows = `repeat(${config.rows}, auto)`;
    
    currentState.cards.forEach((card, index) => {
        const cardEl = document.createElement("div");
        cardEl.classList.add("card");
        cardEl.dataset.name = card.name;
        cardEl.dataset.index = index;
        
        cardEl.innerHTML = `
            <div class="card-inner">
                <div class="front">
                    <img src="${card.image}" alt="${card.name}">
                </div>
                <div class="back"></div>
            </div>
        `;
        
        cardEl.addEventListener("click", handleCardClick);
        gridContainer.appendChild(cardEl);
    });
    console.log(`Rendered ${currentState.cards.length} cards into grid.`);
}

function handleCardClick() {
    if (!currentState.gameStarted || currentState.lockBoard) return;
    if (this === currentState.firstCard) return;
    if (this.classList.contains("flipped")) return;

    this.classList.add("flipped");
    playSFX("flip");

    if (!currentState.firstCard) {
        currentState.firstCard = this;
        return;
    }

    currentState.secondCard = this;
    currentState.moves++;
    movesEl.textContent = currentState.moves;
    
    checkMatch();
}

function checkMatch() {
    const isMatch = currentState.firstCard.dataset.name === currentState.secondCard.dataset.name;
    currentState.lockBoard = true;

    if (isMatch) {
        currentState.matches++;
        currentState.score += 10;
        scoreEl.textContent = currentState.score;
        currentState.firstCard.classList.add("matched");
        currentState.secondCard.classList.add("matched");
        playSFX("match");
        resetBoard();
        checkWin();
    } else {
        setTimeout(() => {
            currentState.firstCard.classList.remove("flipped");
            currentState.secondCard.classList.remove("flipped");
            resetBoard();
        }, 1000);
    }
}

function resetBoard() {
    currentState.firstCard = null;
    currentState.secondCard = null;
    currentState.lockBoard = false;
}

function startGame() {
    if (currentState.gameStarted) return;
    
    resetStats();
    currentState.gameStarted = true;
    startBtn.style.display = "none";
    
    loadCards();
    renderCards();
    startTimer();
    audio.bgm.play().catch(() => {});
}

function resetGame() {
    clearInterval(currentState.timer);
    messageOverlay.style.display = "none";
    currentState.gameStarted = false;
    startBtn.style.display = "block";
    resetStats();
    loadCards();
    renderCards();
    audio.bgm.pause();
    audio.bgm.currentTime = 0;
}

function resetStats() {
    const config = CONFIG[currentState.gridType];
    currentState.moves = 0;
    currentState.matches = 0;
    currentState.score = 0;
    currentState.timeLeft = config.time;
    currentState.lockBoard = false;
    
    updateUI();
}

function updateUI() {
    const config = CONFIG[currentState.gridType];
    scoreEl.textContent = currentState.score;
    movesEl.textContent = currentState.moves;
    targetEl.textContent = config.targetMoves;
    timeEl.textContent = currentState.timeLeft;
}

function startTimer() {
    currentState.timer = setInterval(() => {
        currentState.timeLeft--;
        timeEl.textContent = currentState.timeLeft;

        if (currentState.timeLeft <= 0) {
            endGame(false);
        }
    }, 1000);
}

function checkWin() {
    const config = CONFIG[currentState.gridType];
    const totalPairs = (config.rows * config.cols) / 2;
    
    if (currentState.matches === totalPairs) {
        endGame(true);
    }
}

function endGame(isWin) {
    clearInterval(currentState.timer);
    currentState.gameStarted = false;
    currentState.lockBoard = true;
    
    audio.bgm.pause();
    
    if (isWin) {
        modalTitle.textContent = "You Won!";
        modalTitle.style.color = "var(--accent-color)";
        modalMessage.textContent = `Excellent! Score: ${currentState.score} in ${currentState.moves} moves.`;
        playSFX("win");
    } else {
        modalTitle.textContent = "Time's Up!";
        modalTitle.style.color = "#ef4444";
        modalMessage.textContent = "Better luck next time! Want to try again?";
        playSFX("lose");
    }
    
    messageOverlay.style.display = "flex";
}

// Start the app
init();
