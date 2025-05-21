class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 500;
        this.canvas.height = 300;
        
        // Game state
        this.score = 0;
        this.gameOver = false;
        this.gravity = 0.6;
        this.ground = this.canvas.height - 50;
        this.scrollSpeed = 2;
        this.maxScrollSpeed = 5;
        
        // Background elements
        this.clouds = [
            { x: 0, y: 50, width: 100, height: 30 },
            { x: 200, y: 80, width: 80, height: 25 },
            { x: 400, y: 40, width: 120, height: 35 }
        ];
        
        this.backgroundElements = {
            manor: {
                x: this.canvas.width,
                y: this.ground - 150,
                width: 200,
                height: 150,
                active: false,
                speed: 0.5
            }
        };
        
        // Horse properties
        this.horse = {
            x: 50,
            y: this.ground - 30,
            width: 40,
            height: 30,
            jumping: false,
            velocity: 0,
            jumpForce: -8,
            maxJumpHeight: 150,
            legAngle: 0,
            gravity: 0.08
        };
        
        // Obstacles array
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 2000;
        this.minObstacleInterval = 500;
        this.maxObstacleInterval = 4000;
        
        // Input handling
        this.pressStartTime = 0;
        this.isPressing = false;
        
        // Event listeners
        this.setupEventListeners();
        
        // Start game loop
        this.lastTime = 0;
        this.animate(0);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isPressing) {
                this.isPressing = true;
                this.pressStartTime = Date.now();
                this.jump();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.isPressing = false;
            }
        });
        
        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.isPressing) {
                this.isPressing = true;
                this.pressStartTime = Date.now();
                this.jump();
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isPressing = false;
        });
    }
    
    jump() {
        if (!this.horse.jumping) {
            this.horse.jumping = true;
            this.horse.velocity = this.horse.jumpForce;
            this.horse.gravity = 0.08;
        }
    }
    
    createObstacle() {
        const height = Math.random() < 0.7 ? 40 : 60;
        this.obstacles.push({
            x: this.canvas.width,
            y: this.ground - height,
            width: 20,
            height: height
        });
        
        // Set random interval for next obstacle with occasional very close fences
        if (Math.random() < 0.3) { // 30% chance of very close fence
            this.obstacleInterval = Math.random() * 500 + 500; // Between 0.5 and 1 second
        } else {
            this.obstacleInterval = Math.random() * (this.maxObstacleInterval - this.minObstacleInterval) + this.minObstacleInterval;
        }
    }
    
    updateObstacles(deltaTime) {
        this.obstacleTimer += deltaTime;
        if (this.obstacleTimer > this.obstacleInterval) {
            this.createObstacle();
            this.obstacleTimer = 0;
        }
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            if (!this.obstacles[i]) continue;
            
            this.obstacles[i].x -= this.scrollSpeed;
            
            if (this.obstacles[i].x + this.obstacles[i].width < 0) {
                this.obstacles.splice(i, 1);
                this.score++;
                document.getElementById('score').textContent = `Score: ${this.score}`;
                continue;
            }
            
            if (this.checkCollision(this.horse, this.obstacles[i])) {
                this.gameOver = true;
            }
        }
    }
    
    updateClouds() {
        this.clouds.forEach(cloud => {
            cloud.x -= this.scrollSpeed * 0.5;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width;
                cloud.y = Math.random() * 100;
            }
        });
    }
    
    updateBackground() {
        if (this.backgroundElements.manor.active) {
            this.backgroundElements.manor.x -= this.backgroundElements.manor.speed;
            if (this.backgroundElements.manor.x + this.backgroundElements.manor.width < 0) {
                this.backgroundElements.manor.active = false;
            }
        } else {
            if (Math.random() < 0.001) {
                this.backgroundElements.manor.active = true;
                this.backgroundElements.manor.x = this.canvas.width;
            }
        }
    }
    
    updateHorse(deltaTime) {
        if (this.horse.jumping) {
            this.horse.velocity += this.horse.gravity;
            this.horse.y += this.horse.velocity;
            
            if (this.horse.y < this.ground - this.horse.maxJumpHeight) {
                this.horse.y = this.ground - this.horse.maxJumpHeight;
                this.horse.velocity = 0;
            }
            
            if (this.horse.y >= this.ground - 30) {
                this.horse.y = this.ground - 30;
                this.horse.jumping = false;
                this.horse.velocity = 0;
            }
        }
        
        if (this.isPressing && this.horse.jumping) {
            const pressDuration = Date.now() - this.pressStartTime;
            if (pressDuration > 200) {
                this.horse.gravity = 0.04;
            }
        } else {
            this.horse.gravity = 0.08;
        }
    }
    
    checkCollision(horse, obstacle) {
        if (!obstacle) return false;
        
        const collisionHeight = horse.jumping ? 20 : 30;
        const collisionY = horse.jumping ? horse.y + 5 : horse.y;
        
        return horse.x < obstacle.x + obstacle.width &&
               horse.x + horse.width > obstacle.x &&
               collisionY < obstacle.y + obstacle.height &&
               collisionY + collisionHeight > obstacle.y;
    }
    
    drawManor() {
        if (!this.backgroundElements.manor.active) return;
        
        const m = this.backgroundElements.manor;
        
        // Draw left wing
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.fillRect(m.x - 60, m.y + 50, 60, 100);
        
        // Draw right wing
        this.ctx.fillRect(m.x + m.width, m.y + 50, 60, 100);
        
        // Draw main building
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.fillRect(m.x, m.y, m.width, m.height);
        
        // Draw main roof
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.moveTo(m.x - 10, m.y);
        this.ctx.lineTo(m.x + m.width/2, m.y - 40);
        this.ctx.lineTo(m.x + m.width + 10, m.y);
        this.ctx.fill();
        
        // Draw wing roofs
        this.ctx.beginPath();
        this.ctx.moveTo(m.x - 70, m.y + 50);
        this.ctx.lineTo(m.x - 30, m.y + 20);
        this.ctx.lineTo(m.x + 10, m.y + 50);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(m.x + m.width - 10, m.y + 50);
        this.ctx.lineTo(m.x + m.width + 30, m.y + 20);
        this.ctx.lineTo(m.x + m.width + 70, m.y + 50);
        this.ctx.fill();
        
        // Draw windows
        this.ctx.fillStyle = '#87CEEB';
        // Main building windows
        this.ctx.fillRect(m.x + 30, m.y + 40, 20, 30);
        this.ctx.fillRect(m.x + 80, m.y + 40, 20, 30);
        this.ctx.fillRect(m.x + 130, m.y + 40, 20, 30);
        this.ctx.fillRect(m.x + 30, m.y + 90, 20, 30);
        this.ctx.fillRect(m.x + 80, m.y + 90, 20, 30);
        this.ctx.fillRect(m.x + 130, m.y + 90, 20, 30);
        
        // Left wing windows
        this.ctx.fillRect(m.x - 40, m.y + 70, 20, 30);
        this.ctx.fillRect(m.x - 40, m.y + 110, 20, 30);
        
        // Right wing windows
        this.ctx.fillRect(m.x + m.width + 20, m.y + 70, 20, 30);
        this.ctx.fillRect(m.x + m.width + 20, m.y + 110, 20, 30);
        
        // Draw door
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(m.x + 80, m.y + 100, 40, 50);
    }
    
    drawHorseAndRider() {
        // Draw horse body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.horse.x, this.horse.y, this.horse.width, this.horse.height);
        
        // Draw horse legs
        this.ctx.fillStyle = '#8B4513';
        if (this.horse.jumping) {
            // Folded legs during jump
            // Front legs
            this.ctx.save();
            this.ctx.translate(this.horse.x + 10, this.horse.y + this.horse.height);
            this.ctx.rotate(Math.PI / 4);
            this.ctx.fillRect(0, 0, 6, 15);
            this.ctx.restore();
            
            this.ctx.save();
            this.ctx.translate(this.horse.x + 25, this.horse.y + this.horse.height);
            this.ctx.rotate(Math.PI / 4);
            this.ctx.fillRect(0, 0, 6, 15);
            this.ctx.restore();
            
            // Back legs
            this.ctx.save();
            this.ctx.translate(this.horse.x + 35, this.horse.y + this.horse.height);
            this.ctx.rotate(-Math.PI / 4);
            this.ctx.fillRect(0, 0, 6, 15);
            this.ctx.restore();
            
            this.ctx.save();
            this.ctx.translate(this.horse.x + 50, this.horse.y + this.horse.height);
            this.ctx.rotate(-Math.PI / 4);
            this.ctx.fillRect(0, 0, 6, 15);
            this.ctx.restore();
        } else {
            // Normal standing legs
            // Front legs
            this.ctx.fillRect(this.horse.x + 10, this.horse.y + this.horse.height, 6, 20);
            this.ctx.fillRect(this.horse.x + 25, this.horse.y + this.horse.height, 6, 20);
            // Back legs
            this.ctx.fillRect(this.horse.x + 35, this.horse.y + this.horse.height, 6, 20);
            this.ctx.fillRect(this.horse.x + 50, this.horse.y + this.horse.height, 6, 20);
        }
        
        // Draw horse head
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.horse.x + this.horse.width - 8, this.horse.y - 10, 20, 10);
        
        // Draw horse neck
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.moveTo(this.horse.x + this.horse.width - 8, this.horse.y);
        this.ctx.lineTo(this.horse.x + this.horse.width - 8, this.horse.y - 10);
        this.ctx.lineTo(this.horse.x + this.horse.width - 20, this.horse.y - 10);
        this.ctx.fill();
        
        // Draw rider in more purple color
        this.ctx.fillStyle = '#9370DB';
        this.ctx.fillRect(this.horse.x + 15, this.horse.y - 25, 20, 25);
        
        // Draw rider's head
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.horse.x + 25, this.horse.y - 35, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sky
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            this.ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
        });
        
        // Draw manor house
        this.drawManor();
        
        // Draw ground
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.ground, this.canvas.width, 50);
        
        // Draw obstacles
        this.ctx.fillStyle = '#8B4513';
        this.obstacles.forEach(obstacle => {
            this.ctx.fillRect(obstacle.x, obstacle.y, 5, obstacle.height);
            this.ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y, 5, obstacle.height);
            this.ctx.fillRect(obstacle.x, obstacle.y + obstacle.height/3, obstacle.width, 5);
            this.ctx.fillRect(obstacle.x, obstacle.y + obstacle.height*2/3, obstacle.width, 5);
        });
        
        // Draw horse and rider
        this.drawHorseAndRider();
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press Space to Restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }
    
    animate(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.gameOver) {
            this.updateHorse(deltaTime);
            this.updateObstacles(deltaTime);
            this.updateClouds();
            this.updateBackground();
        }
        
        this.draw();
        requestAnimationFrame((time) => this.animate(time));
    }
    
    reset() {
        this.score = 0;
        this.gameOver = false;
        this.obstacles = [];
        this.scrollSpeed = 2;
        this.horse.y = this.ground - 30;
        this.horse.jumping = false;
        this.horse.velocity = 0;
        document.getElementById('score').textContent = 'Score: 0';
    }
}

// Start the game
const game = new Game();

// Add restart functionality
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && game.gameOver) {
        game.reset();
    }
}); 