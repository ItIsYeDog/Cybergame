const canvas = document.getElementById('gameCanvas');
canvas.style.cursor = 'none';
const ctx = canvas.getContext('2d');

const playerImage = new Image();
playerImage.src = 'assets/images/player.png';

const threatImage = new Image();
threatImage.src = 'assets/images/threat.png';

const threatimage2 = new Image();
threatimage2.src = 'assets/images/threat2.png';

const backgroundImage = new Image();
backgroundImage.src = 'assets/images/background.png';

const powerupImage = new Image();
powerupImage.src = 'assets/images/powerup.png';

const heartImage = new Image();
heartImage.src = 'assets/images/hearth.png';

const shootSound = new Audio('assets/sounds/shoot.wav');
const explosionSound = new Audio('assets/sounds/explosion.mp3');
const powerupSound = new Audio('assets/sounds/powerup.wav');
const backgroundMusic = new Audio('assets/sounds/background-music.mp3');

backgroundMusic.loop = true;

let gameStarted = false;
let threatInterval;
let powerUpInterval;

let score = 0;
document.getElementById('score').innerText = score;

const musicToggleBtn = document.getElementById('musicToggle');
let isMusicPlaying = false;

musicToggleBtn.addEventListener('click', () => {
    if (isMusicPlaying) {
        backgroundMusic.pause();
        musicToggleBtn.classList.remove('active');
    } else {
        backgroundMusic.play().catch(error => {
            console.error('Music play failed', error);
        });
        musicToggleBtn.classList.add('active');
    }
    isMusicPlaying = !isMusicPlaying;
});

const startMenu = document.getElementById('startMenu');
const gameContainer = document.getElementById('gameContainer');
const playButton = document.getElementById('playButton');

playButton.addEventListener('click', () => {
    startMenu.style.display = 'none';
    gameContainer.style.display = 'block';
    if (isMusicPlaying) {
        backgroundMusic.play().catch(error => {
            console.error('Music play failed', error);
        });
    }
    gameLoop();
});

class Player {
    constructor() {
        this.width = 80;
        this.height = 100;
        this.x = (canvas.width - this.width) / 2;
        this.y = canvas.height - this.height - 10;
        this.speed = 8;
        this.missiles = [];
        this.movingLeft = false;
        this.movingRight = false;
        this.lives = 5;
    }

    draw() {
        ctx.drawImage(playerImage, this.x, this.y, this.width, this.height);
    }

    drawLives() {
        for (let i = 0; i < this.lives; i++) {
            ctx.drawImage(heartImage, 10 + i * 30, 10, 20, 20);
        }
    }

    moveLeft() {
        if (this.x > 0) {
            this.x -= this.speed;
        }
    }

    moveRight() {
        if (this.x + this.width < canvas.width) {
            this.x += this.speed;
        }
    }

    shoot() {
        const missile = new Missile(this.x + this.width / 2 - 2.5, this.y - 10);
        this.missiles.push(missile);
        shootSound.play();
    }

    update() {
        if (this.movingLeft) {
            this.moveLeft();
        }
        if (this.movingRight) {
            this.moveRight();
        }

        this.missiles.forEach((missile, index) => {
            missile.update();
            if (missile.y + missile.height < 0) {
                this.missiles.splice(index, 1);
            }
        });
    }

    drawMissiles() {
        this.missiles.forEach(missile => missile.draw());
    }
}

class Missile {
    constructor(x, y) {
        this.width = 5;
        this.height = 10;
        this.x = x;
        this.y = y;
        this.speed = 7;
    }

    update() {
        this.y -= this.speed;
    }

    draw() {
        ctx.fillStyle = '#AF9B60';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Threat {
    constructor(y) {
        this.width = 60;
        this.height = 60;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = 0;
        this.speed = 2;
        this.image = Math.random() < 0.5 ? threatImage : threatimage2;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class PowerUp {
    constructor(x, y) {
        this.width = 20;
        this.height = 60;
        this.x = x;
        this.y = y;
        this.speed = 3;
        this.duration = 5;
        this.timer = this.duration;
    }

    update() {
        this.y += this.speed;
        this.timer -= 1 / 60;
    }

    draw() {
        ctx.drawImage(powerupImage, this.x, this.y, this.width, this.height);
    }
}

const player = new Player();
const threats = [];
const powerUps = [];

function spawnThreat() {
    const x = Math.random() * (canvas.width - 30);
    const threat = new Threat(x, 0);
    threats.push(threat);
}

function spawnPowerUp() {
    const x = Math.random() * (canvas.width - 20);
    const powerUp = new PowerUp(x, 0);
    powerUps.push(powerUp);
}

function updateGame() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    player.draw();
    player.update();
    player.drawMissiles();
    player.drawLives();

    threats.forEach((threat, index) => {
        threat.update();
        threat.draw();

        player.missiles.forEach((missile, missileIndex) => {
            if (
                missile.x < threat.x + threat.width &&
                missile.x + missile.width > threat.x &&
                missile.y < threat.y + threat.height &&
                missile.y + missile.height > threat.y
            ) {
                threats.splice(index, 1);
                player.missiles.splice(missileIndex, 1);
                explosionSound.play();
                score += 10;
                document.getElementById('score').innerText = score;
            }
        });

        if (threat.y + threat.height > canvas.height) {
            threats.splice(index, 1);
            player.lives -= 1;
            if (player.lives === 0) {
                document.location.reload();
            }
        }
    });

const powerupTimerElement = document.getElementById('powerupTimer');
let powerupTimerInterval;

powerUps.forEach((powerUp, index) => {
    powerUp.update();
    powerUp.draw();

    if (
        powerUp.x < player.x + player.width &&
        powerUp.x + powerUp.width > player.x &&
        powerUp.y < player.y + player.height &&
        powerUp.y + powerUp.height > player.y
    ) {
        powerupSound.play();
        player.speed += 2;

        powerUp.timer = powerUp.duration;

        if (powerupTimerInterval) {
            clearInterval(powerupTimerInterval);
        }

        powerupTimerInterval = setInterval(() => {
            if (powerUp) {
                if (powerUp.timer <= 0) {
                    clearInterval(powerupTimerInterval);
                    powerupTimerElement.textContent = '';
                } else {
                    powerUp.timer -= 1;
                    powerupTimerElement.textContent = `${Math.ceil(powerUp.timer)}s`;
                }
            }
        }, 1000);

        setTimeout(() => {
            player.speed -= 2;
            clearInterval(powerupTimerInterval);
            powerupTimerElement.textContent = '';
        }, powerUp.duration * 1000);

        powerUps.splice(index, 1);
    }
});
}

function startGame() {
    gameStarted = true;
    threatInterval = setInterval(spawnThreat, 1500);
    powerUpInterval = setInterval(spawnPowerUp, 10000);
    gameLoop();
}

function gameLoop() {
    if (!gameStarted) {
        return;
    }

    updateGame();
    requestAnimationFrame(gameLoop);
}

function stopGame() {
    gameStarted = false;
    clearInterval(threatInterval);
    clearInterval(powerUpInterval);
}

document.getElementById('playButton').addEventListener('click', startGame);


window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        player.movingLeft = true;
    } else if (e.key === 'ArrowRight') {
        player.movingRight = true;
    } else if (e.key === ' ') {
        player.shoot();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') {
        player.movingLeft = false;
    } else if (e.key === 'ArrowRight') {
        player.movingRight = false;
    }
});