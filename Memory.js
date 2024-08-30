const gridContainer = document.querySelector(".grid-container");
const backgroundMusic = document.getElementById("background-music");
const flipSound = document.getElementById("flip-sound");
const winSound = document.getElementById("win-sound");
const loseSound = document.getElementById("lose-sound");
const matchSound = document.getElementById("match-sound");
const muteButton = document.querySelector(".mute-button");
const volumeSlider = document.querySelector(".volume-slider");

let cards = [];
let lockBoard = false;
let score = 0;
let firstCard, secondCard;
let moves = 0;
const targetMoves = 25;
let timeLeft = 45;
let timer;
let gameStarted = false; // Add this variable
let isMuted = false;

document.querySelector(".score").textContent = score;
document.querySelector(".target-moves").textContent = targetMoves;
document.querySelector(".time-left").textContent = timeLeft;

fetch("./data/cards.json")
    .then((res) => res.json())
    .then((data) => {
        cards = [...data, ...data];
        shuffleCards();
        generateCards();
    });

function shuffleCards() {
    let currentIndex = cards.length,
        randomIndex,
        temporaryValue;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = cards[currentIndex];
        cards[currentIndex] = cards[randomIndex];
        cards[randomIndex] = temporaryValue;
    }
}

function generateCards() {
    for (let card of cards) {
        const cardElement = document.createElement("div");
        cardElement.classList.add("card");
        cardElement.setAttribute("data-name", card.name);
        cardElement.innerHTML = `
            <div class="front">
                <img class="front-image" src=${card.image} />
            </div>
            <div class="back"></div>
        `;
        gridContainer.appendChild(cardElement);
        cardElement.addEventListener("click", flipCard);
    }
}

function flipCard() {
    if (lockBoard || !gameStarted) return; // Check if the game has started
    if (this === firstCard) return;
    this.classList.add("flipped");
    playFlipSound();

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    score++;
    moves++;
    document.querySelector(".score").textContent = score;
    document.querySelector(".target-moves").textContent = targetMoves - moves;
    lockBoard = true;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.name === secondCard.dataset.name;
    if (isMatch) {
        disableCards();
        playMatchSound(); // Play match sound
    } else {
        unflipCards();
    }
    checkWinCondition();
}

function disableCards() {
    firstCard.removeEventListener("click", flipCard);
    secondCard.removeEventListener("click", flipCard);
    resetBoard();
}

function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        resetBoard();
    }, 1000);
}

function resetBoard() {
    [firstCard, secondCard, lockBoard] = [null, null, false];
}

function restart() {
    clearInterval(timer);
    resetBoard();
    shuffleCards();
    score = 0;
    moves = 0;
    timeLeft = 45;
    gameStarted = false; // Reset the game state
    document.querySelector(".score").textContent = score;
    document.querySelector(".target-moves").textContent = targetMoves;
    document.querySelector(".time-left").textContent = timeLeft;
    document.querySelector(".message").style.display = "none";
    gridContainer.innerHTML = "";
    generateCards();
}

function startGame() {
    clearInterval(timer);
    resetBoard();
    shuffleCards();
    score = 0;
    moves = 0;
    timeLeft = 45;
    gameStarted = true; // Set the game state to started
    document.querySelector(".score").textContent = score;
    document.querySelector(".target-moves").textContent = targetMoves;
    document.querySelector(".time-left").textContent = timeLeft;
    document.querySelector(".message").style.display = "none";
    gridContainer.innerHTML = "";
    generateCards();
    startTimer();

    document.querySelector(".start-button").textContent = "Started";
    playBackgroundMusic();
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.querySelector(".time-left").textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            lockBoard = true;
            document.querySelector(".message").textContent = "You Lose!";
            document.querySelector(".message").style.display = "block";
            playLoseSound(); // Play lose sound
        }
    }, 1000);
}

function checkWinCondition() {
    if (document.querySelectorAll('.card:not(.flipped)').length === 0) {
        clearInterval(timer);
        document.querySelector(".message").textContent = "You Won!";
        document.querySelector(".message").style.color = "#4CAF50";
        document.querySelector(".message").style.display = "flex";
        playWinSound(); // Play win sound
       
        pauseBackgroundMusic(); // Pause background music
    } else if (moves > targetMoves || timeLeft <= 0) {
        clearInterval(timer);
        lockBoard = true;
        document.querySelector(".message").textContent = "You Lose!";
        document.querySelector(".message").style.color = "#f15b5b"; // Red color for lose
        document.querySelector(".message").style.display = "flex"; 
        playLoseSound(); // Play lose sound
       
        pauseBackgroundMusic(); // Pause background music
    }
}

function playBackgroundMusic() {
    backgroundMusic.play().catch(error => {
        console.error("Failed to play background music:", error);
    });
}

function pauseBackgroundMusic() {
    backgroundMusic.pause();
}

function playFlipSound() {
    flipSound.play().catch(error => {
        console.error("Failed to play flip sound:", error);
    });
    adjustVolume();
}

function playWinSound() {
    winSound.play().catch(error => {
        console.error("Failed to play win sound:", error);
    });
    adjustVolume();
}

function playLoseSound() {
    loseSound.play().catch(error => {
        console.error("Failed to play lose sound:", error);
    });
    adjustVolume();
}
function playMatchSound() { // Add this function
    matchSound.play().catch(error => {
        console.error("Failed to play match sound:", error);
    });
    adjustVolume();
}

muteButton.addEventListener("click", toggleMute);
volumeSlider.addEventListener("input", adjustVolume);

function toggleMute() {
    isMuted = !isMuted;
    backgroundMusic.muted = isMuted;
    flipSound.muted = isMuted;
    winSound.muted = isMuted;
    loseSound.muted = isMuted;
    matchSound.muted = isMuted;

    if (isMuted) {
        muteButton.textContent = "🔇";
    } else {
        muteButton.textContent = "🔊";
    }
}

function adjustVolume() {
    const volume = volumeSlider.value;
    backgroundMusic.volume = volume;
    flipSound.volume = volume;
    winSound.volume = volume;
    loseSound.volume = volume;
    matchSound.volume = volume;
}



document.querySelector(".start-button").addEventListener("click", startGame);
