// =================== DATABASE & CONFIGURATION ===================
const positiveQuotes = [
    "💚 Your mental health matters!",
    "✨ You are worthy of care!",
    "🌟 Small steps lead to big changes!",
    "🧸 Self-care is not selfish!",
    "❤️ You've got this!",
    "🌈 Embrace your emotions!",
    "💪 Strength comes from self-love!",
    "🎯 You deserve happiness!",
    "🌸 Growth is a journey!",
    "✨ Be kind to yourself!"
];

const wellbeingWords = [
    { word: 'PEACE', emoji: '🧘', hint: '💚 Find inner calm and tranquility' },
    { word: 'SMILE', emoji: '😊', hint: '😄 Express happiness and positivity' },
    { word: 'LOVE', emoji: '💚', hint: '💕 Practice self-compassion and care' },
    { word: 'HOPE', emoji: '🌟', hint: '✨ Believe in better days ahead' },
    { word: 'BRAVE', emoji: '💪', hint: '🦾 Face challenges with courage' },
    { word: 'TRUST', emoji: '🤝', hint: '🌉 Build meaningful connections' },
    { word: 'HEAL', emoji: '🩹', hint: '💚 Recovery takes time and patience' },
    { word: 'GROW', emoji: '🌱', hint: '🌿 Embrace personal development' },
    { word: 'CARE', emoji: '🏥', hint: '👐 Prioritize your wellbeing' },
    { word: 'JOY', emoji: '🎉', hint: '🎊 Find happiness in small moments' }
];

// =================== GAME STATE ===================
let gameState = {
    isPlaying: false,
    currentWord: null,
    selectedLetters: [],
    score: 0,
    highestScore: localStorage.getItem('highestScore') || 0,
    wordsSolved: 0,
    wordsFailed: 0,
    timeLeft: 10,
    maxTime: 10,
    totalGameTime: 30,
    gameTimeLeft: 30,
    timerInterval: null,
    gameTimerInterval: null,
    canSelect: true
};

// =================== INITIALIZATION ===================
document.addEventListener('DOMContentLoaded', () => {
    showRandomQuote();
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 3200);
});

function showRandomQuote() {
    const randomQuote = positiveQuotes[Math.floor(Math.random() * positiveQuotes.length)];
    document.getElementById('quoteText').textContent = randomQuote;
}

// =================== GAME START & MENU ===================
function startGame() {
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.wordsSolved = 0;
    gameState.wordsFailed = 0;
    gameState.selectedLetters = [];
    gameState.gameTimeLeft = gameState.totalGameTime;

    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameScreen').classList.add('active');

    selectNewWord();
    updateScoreboard();
    generateCards();
    startWordTimer();
    startGameTimer();
}

function backToMenu() {
    gameState.isPlaying = false;
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    if (gameState.gameTimerInterval) clearInterval(gameState.gameTimerInterval);

    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('gameOverScreen').classList.remove('show');
    document.getElementById('menuScreen').style.display = 'flex';
    
    closeSuccessPopup();
    closeFailurePopup();
    
    showRandomQuote();
}

function restartGame() {
    closeSuccessPopup();
    closeFailurePopup();
    startGame();
    document.getElementById('gameOverScreen').classList.remove('show');
}

// =================== WORD MANAGEMENT ===================
function selectNewWord() {
    gameState.currentWord = wellbeingWords[Math.floor(Math.random() * wellbeingWords.length)];
    gameState.selectedLetters = [];
    gameState.timeLeft = gameState.maxTime;

    // Update UI
    document.getElementById('targetWord').textContent = gameState.currentWord.word.split('').join(' ');
    document.getElementById('wordHint').textContent = gameState.currentWord.hint;
    document.getElementById('gameMessage').textContent = `🎯 Click on letters in order to form "${gameState.currentWord.word}"!`;

    // Reset timer visual
    updateTimerDisplay();
}

function generateCards() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';
    gameState.selectedLetters = [];

    const word = gameState.currentWord.word;
    const letters = word.split('');
    const shuffledLetters = letters.sort(() => Math.random() - 0.5);

    shuffledLetters.forEach((letter, index) => {
        const card = document.createElement('div');
        card.className = 'letter-card';
        card.textContent = letter;
        card.dataset.letter = letter;
        card.dataset.index = index;
        card.dataset.cardid = Math.random();
        card.onclick = () => selectLetter(card, letter, index);

        container.appendChild(card);
    });
}

// =================== CARD SELECTION & MATCHING ===================
function selectLetter(cardEl, letter, index) {
    if (!gameState.isPlaying || !gameState.canSelect) return;
    if (cardEl.classList.contains('selected')) return;

    const expectedIndex = gameState.selectedLetters.length;
    const expectedLetter = gameState.currentWord.word[expectedIndex];

    cardEl.classList.add('selected');
    gameState.selectedLetters.push({ letter, cardEl });

    if (letter !== expectedLetter) {
        // Wrong letter
        gameState.canSelect = false;
        document.getElementById('gameMessage').textContent = '❌ Wrong letter! Try again.';

        setTimeout(() => {
            if (cardEl.classList.contains('selected')) {
                cardEl.classList.remove('selected');
            }
            gameState.selectedLetters = [];
            gameState.canSelect = true;
            document.getElementById('gameMessage').textContent = `🎯 Click on letters in order to form "${gameState.currentWord.word}"!`;
        }, 500);

        return;
    }

    // Correct letter
    if (gameState.selectedLetters.length === gameState.currentWord.word.length) {
        // Word completed!
        wordCompleted();
    }
}

function wordCompleted() {
    gameState.canSelect = false;
    gameState.wordsSolved++;

    const points = Math.floor(gameState.timeLeft * 10) + 50;
    gameState.score += points;

    // Update scoreboard
    updateScoreboard();

    // Show success popup
    showSuccessPopup(points);

    // Move to next word after a delay
    setTimeout(() => {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }
        
        gameState.selectedLetters = [];
        gameState.canSelect = true;

        if (gameState.isPlaying && gameState.gameTimeLeft > 0) {
            closeSuccessPopup();
            selectNewWord();
            generateCards();
            startWordTimer();
        }
    }, 1000);
}

// =================== TIMER MANAGEMENT ===================
function startWordTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);

    gameState.timeLeft = gameState.maxTime;
    updateTimerDisplay();

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();

        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            wordFailed();
        }
    }, 1000);
}

function startGameTimer() {
    if (gameState.gameTimerInterval) clearInterval(gameState.gameTimerInterval);

    gameState.gameTimerInterval = setInterval(() => {
        gameState.gameTimeLeft--;

        if (gameState.gameTimeLeft <= 0) {
            clearInterval(gameState.gameTimerInterval);
            clearInterval(gameState.timerInterval);
            gameState.isPlaying = false;
            triggerGameOver();
        }
    }, 1000);
}

function updateTimerDisplay() {
    document.getElementById('wordTimerValue').textContent = gameState.timeLeft;

    // Update SVG circle progress
    const maxDash = 283;
    const progress = (gameState.timeLeft / gameState.maxTime) * maxDash;
    document.getElementById('timerProgress').style.strokeDashoffset = maxDash - progress;

    // Change color based on time
    if (gameState.timeLeft <= 3) {
        document.getElementById('timerProgress').style.stroke = '#ff6b6b';
    } else if (gameState.timeLeft <= 5) {
        document.getElementById('timerProgress').style.stroke = '#ffa500';
    } else {
        document.getElementById('timerProgress').style.stroke = '#ffd700';
    }
}

function wordFailed() {
    if (!gameState.isPlaying) return;
    
    gameState.canSelect = false;
    gameState.wordsFailed++;

    document.getElementById('gameMessage').textContent = '⏱️ Time\'s up!';
    showFailurePopup();

    setTimeout(() => {
        if (gameState.isPlaying && gameState.gameTimeLeft > 0) {
            if (gameState.timerInterval) clearInterval(gameState.timerInterval);
            
            gameState.selectedLetters = [];
            gameState.canSelect = true;
            closeFailurePopup();
            selectNewWord();
            generateCards();
            startWordTimer();
        }
    }, 1000);
}

// =================== POPUPS ===================
function showSuccessPopup(points) {
    const popup = document.getElementById('successPopup');
    const overlay = document.getElementById('popupOverlay');

    document.getElementById('popupEmoji').textContent = gameState.currentWord.emoji;
    document.getElementById('popupTitle').textContent = 'Perfect Match!';
    document.getElementById('popupText').textContent = `You found: ${gameState.currentWord.word}`;
    document.getElementById('popupPoints').textContent = `+${points} Points`;
    document.getElementById('popupWellness').textContent = gameState.currentWord.hint;

    popup.classList.add('show');
    overlay.classList.add('show');
}

function showFailurePopup() {
    const popup = document.getElementById('failurePopup');
    const overlay = document.getElementById('popupOverlay');

    document.getElementById('failureEmoji').textContent = '⏱️';
    document.getElementById('failedWordShow').textContent = gameState.currentWord.word;

    popup.classList.add('show');
    overlay.classList.add('show');
}

function closeSuccessPopup() {
    document.getElementById('successPopup').classList.remove('show');
    document.getElementById('popupOverlay').classList.remove('show');
}

function closeFailurePopup() {
    document.getElementById('failurePopup').classList.remove('show');
    document.getElementById('popupOverlay').classList.remove('show');
}

// =================== SCOREBOARD ===================
function updateScoreboard() {
    document.getElementById('currentScore').textContent = gameState.score;
    document.getElementById('wordsSolved').textContent = gameState.wordsSolved;

    // Update highest score
    if (gameState.score > gameState.highestScore) {
        gameState.highestScore = gameState.score;
        localStorage.setItem('highestScore', gameState.highestScore);
    }
    document.getElementById('highestScore').textContent = gameState.highestScore;
}

// =================== GAME OVER ===================
function triggerGameOver() {
    gameState.isPlaying = false;
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    if (gameState.gameTimerInterval) clearInterval(gameState.gameTimerInterval);

    closeSuccessPopup();
    closeFailurePopup();

    document.getElementById('gameScreen').classList.remove('active');

    // Calculate stats
    const totalAttempts = gameState.wordsSolved + gameState.wordsFailed;
    const accuracy = totalAttempts > 0 ? Math.round((gameState.wordsSolved / totalAttempts) * 100) : 0;

    // Determine emoji based on performance
    let emoji = '🏆';
    if (gameState.wordsSolved < 5) emoji = '💪';
    if (gameState.wordsSolved < 2) emoji = '🌱';

    // Update game over screen
    document.getElementById('gameOverEmoji').textContent = emoji;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalWords').textContent = gameState.wordsSolved;
    document.getElementById('finalAccuracy').textContent = accuracy + '%';

    document.getElementById('gameOverScreen').classList.add('show');
}

// =================== UTILITY FUNCTIONS ===================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameState.isPlaying) {
        triggerGameOver();
    }
});

console.log('✅ Wellbeing Card Connect Game - Loaded Successfully');