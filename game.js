class SpaceInvaders {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.score = 0;
        this.lives = 3;
        this.gameRunning = false;
        this.gameStarted = false;
        
        this.keys = {};
        this.lastTime = 0;
        
        this.player = {
            x: this.width / 2 - 20,
            y: this.height - 60,
            width: 40,
            height: 30,
            speed: 300
        };
        
        this.bullets = [];
        this.invaders = [];
        this.invaderBullets = [];
        
        this.invaderDirection = 1;
        this.invaderSpeed = 50;
        this.invaderDropDistance = 30;
        
        this.setupEventListeners();
        this.createInvaders();
        this.startGame();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.shoot();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    createInvaders() {
        this.invaders = [];
        const rows = 5;
        const cols = 10;
        const invaderWidth = 30;
        const invaderHeight = 20;
        const spacing = 10;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.invaders.push({
                    x: col * (invaderWidth + spacing) + 100,
                    y: row * (invaderHeight + spacing) + 50,
                    width: invaderWidth,
                    height: invaderHeight,
                    alive: true,
                    type: row < 2 ? 'fast' : 'normal'
                });
            }
        }
    }
    
    shoot() {
        if (this.gameRunning) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                width: 4,
                height: 10,
                speed: 400
            });
        }
    }
    
    invaderShoot() {
        const aliveInvaders = this.invaders.filter(inv => inv.alive);
        if (aliveInvaders.length > 0 && Math.random() < 0.001) {
            const randomInvader = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
            this.invaderBullets.push({
                x: randomInvader.x + randomInvader.width / 2 - 2,
                y: randomInvader.y + randomInvader.height,
                width: 4,
                height: 10,
                speed: 200
            });
        }
    }
    
    update(deltaTime) {
        if (!this.gameRunning) return;
        
        this.updatePlayer(deltaTime);
        this.updateBullets(deltaTime);
        this.updateInvaders(deltaTime);
        this.updateInvaderBullets(deltaTime);
        this.checkCollisions();
        this.invaderShoot();
        
        if (this.invaders.every(inv => !inv.alive)) {
            this.nextWave();
        }
        
        if (this.invaders.some(inv => inv.alive && inv.y + inv.height >= this.player.y)) {
            this.gameOver();
        }
    }
    
    updatePlayer(deltaTime) {
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x -= this.player.speed * deltaTime / 1000;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x += this.player.speed * deltaTime / 1000;
        }
        
        this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= bullet.speed * deltaTime / 1000;
            
            if (bullet.y + bullet.height < 0) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateInvaderBullets(deltaTime) {
        for (let i = this.invaderBullets.length - 1; i >= 0; i--) {
            const bullet = this.invaderBullets[i];
            bullet.y += bullet.speed * deltaTime / 1000;
            
            if (bullet.y > this.height) {
                this.invaderBullets.splice(i, 1);
            }
        }
    }
    
    updateInvaders(deltaTime) {
        const aliveInvaders = this.invaders.filter(inv => inv.alive);
        if (aliveInvaders.length === 0) return;
        
        let shouldDrop = false;
        const leftmost = Math.min(...aliveInvaders.map(inv => inv.x));
        const rightmost = Math.max(...aliveInvaders.map(inv => inv.x + inv.width));
        
        if (this.invaderDirection === 1 && rightmost >= this.width - 10) {
            shouldDrop = true;
            this.invaderDirection = -1;
        } else if (this.invaderDirection === -1 && leftmost <= 10) {
            shouldDrop = true;
            this.invaderDirection = 1;
        }
        
        for (const invader of this.invaders) {
            if (!invader.alive) continue;
            
            if (shouldDrop) {
                invader.y += this.invaderDropDistance;
            } else {
                invader.x += this.invaderDirection * this.invaderSpeed * deltaTime / 1000;
            }
        }
    }
    
    checkCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (const invader of this.invaders) {
                if (!invader.alive) continue;
                
                if (this.isColliding(bullet, invader)) {
                    invader.alive = false;
                    this.bullets.splice(i, 1);
                    this.score += invader.type === 'fast' ? 20 : 10;
                    this.updateScore();
                    break;
                }
            }
        }
        
        for (let i = this.invaderBullets.length - 1; i >= 0; i--) {
            const bullet = this.invaderBullets[i];
            
            if (this.isColliding(bullet, this.player)) {
                this.invaderBullets.splice(i, 1);
                this.lives--;
                this.updateLives();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
                break;
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    nextWave() {
        this.createInvaders();
        this.invaderSpeed += 20;
        this.bullets = [];
        this.invaderBullets = [];
    }
    
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawPlayer();
        this.drawBullets();
        this.drawInvaders();
        this.drawInvaderBullets();
        
        if (!this.gameRunning && !this.gameStarted) {
            this.drawStartScreen();
        }
    }
    
    drawPlayer() {
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        this.ctx.fillStyle = '#0a0';
        this.ctx.fillRect(this.player.x + 5, this.player.y - 10, 5, 10);
        this.ctx.fillRect(this.player.x + 15, this.player.y - 15, 10, 15);
        this.ctx.fillRect(this.player.x + 30, this.player.y - 10, 5, 10);
    }
    
    drawBullets() {
        this.ctx.fillStyle = '#ff0';
        for (const bullet of this.bullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }
    
    drawInvaderBullets() {
        this.ctx.fillStyle = '#f00';
        for (const bullet of this.invaderBullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }
    
    drawInvaders() {
        for (const invader of this.invaders) {
            if (!invader.alive) continue;
            
            this.ctx.fillStyle = invader.type === 'fast' ? '#f0f' : '#fff';
            this.ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
            
            this.ctx.fillStyle = invader.type === 'fast' ? '#a0a' : '#ccc';
            this.ctx.fillRect(invader.x + 5, invader.y + 5, invader.width - 10, invader.height - 10);
        }
    }
    
    drawStartScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#0f0';
        this.ctx.font = '48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SPACE INVADERS', this.width / 2, this.height / 2 - 50);
        
        this.ctx.font = '24px Courier New';
        this.ctx.fillText('Press SPACE to start', this.width / 2, this.height / 2 + 20);
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLives() {
        document.getElementById('lives').textContent = this.lives;
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    startGame() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.gameRunning = true;
        }
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    new SpaceInvaders();
}

window.addEventListener('load', () => {
    new SpaceInvaders();
});