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
        this.maxScrollSpeed = 6;
        
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
        this.obstacleInterval = 0;
        this.minObstacleInterval = 600;
        this.maxObstacleInterval = 2500;
        
        // Input handling
        this.pressStartTime = 0;
        this.isPressing = false;
        
        // Event listeners
        this.setupEventListeners();
        
        // Start game loop
        this.lastTime = 0;
        this.allowRestart = true;
        this.gameOverTime = 0;
        this.strongGravity = 0.35; // Even stronger gravity for quick descent
        this.weakGravity = 0.08;   // Weaker gravity for hang time
        this.obstaclesPassed = 0; // Track how many obstacles have been passed
        this.spectators = [];
        this.spectatorTimer = 0;
        this.spectatorInterval = 2000 + Math.random() * 2000; // 2-4 seconds between groups
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
        
        // Touch support on the whole document
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.isPressing) {
                this.isPressing = true;
                this.pressStartTime = Date.now();
                this.jump();
            }
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isPressing = false;
        }, { passive: false });
    }
    
    jump() {
        if (!this.horse.jumping) {
            this.horse.jumping = true;
            this.horse.velocity = this.horse.jumpForce;
            this.horse.gravity = this.strongGravity; // Start with strong gravity
        }
    }
    
    createObstacle() {
        // 20% chance to create a ditch instead of a fence
        if (Math.random() < 0.2) {
            // Ditch: wide, short, and marked as type 'ditch'
            const width = 50 + Math.random() * 40; // 50-90px wide
            this.obstacles.push({
                x: this.canvas.width,
                y: this.ground,
                width: width,
                height: 20,
                type: 'ditch'
            });
        } else {
            // Fence: as before, marked as type 'fence'
            const height = Math.random() < 0.7 ? 40 : 60;
            this.obstacles.push({
                x: this.canvas.width,
                y: this.ground - height,
                width: 20,
                height: height,
                type: 'fence'
            });
        }
        // Randomize interval between 600ms and maxObstacleInterval
        this.obstacleInterval = Math.random() * (this.maxObstacleInterval - this.minObstacleInterval) + this.minObstacleInterval;
        // Increase speed rapidly: after 3 obstacles, reach maxScrollSpeed
        if (this.scrollSpeed < this.maxScrollSpeed) {
            this.scrollSpeed += (this.maxScrollSpeed - 2) / 3;
            if (this.scrollSpeed > this.maxScrollSpeed) this.scrollSpeed = this.maxScrollSpeed;
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
                this.obstaclesPassed++;
                this.obstacles.splice(i, 1);
                this.score++;
                document.getElementById('score-value').textContent = this.score;
                continue;
            }
            // Check collision
            if (this.checkCollision(this.horse, this.obstacles[i])) {
                this.gameOver = true;
            }
            // Ditch fail: if horse is on ground and over a ditch
            if (this.obstacles[i].type === 'ditch') {
                const overDitch = this.horse.x + this.horse.width > this.obstacles[i].x && this.horse.x < this.obstacles[i].x + this.obstacles[i].width;
                const onGround = !this.horse.jumping && this.horse.y >= this.ground - 30;
                if (overDitch && onGround) {
                    this.gameOver = true;
                }
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
        // Update manor house
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
        // Update spectators
        this.spectatorTimer += this.scrollSpeed;
        if (this.spectatorTimer > this.spectatorInterval) {
            this.createSpectatorGroup();
            this.spectatorTimer = 0;
            this.spectatorInterval = 2000 + Math.random() * 2000; // 2-4 seconds between groups
        }
        for (let i = this.spectators.length - 1; i >= 0; i--) {
            this.spectators[i].x -= this.scrollSpeed;
            if (this.spectators[i].x + this.spectators[i].groupWidth < 0) {
                this.spectators.splice(i, 1);
            }
        }
    }
    
    updateHorse(deltaTime) {
        if (this.horse.jumping) {
            // Adjust gravity based on press
            if (this.isPressing) {
                this.horse.gravity = this.weakGravity; // Weaker gravity for hang time
            } else {
                this.horse.gravity = this.strongGravity; // Stronger gravity for quick descent
            }
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
        
        // Draw main roof (darker brown)
        this.ctx.fillStyle = '#5C3310';
        this.ctx.beginPath();
        this.ctx.moveTo(m.x - 10, m.y);
        this.ctx.lineTo(m.x + m.width/2, m.y - 40);
        this.ctx.lineTo(m.x + m.width + 10, m.y);
        this.ctx.fill();
        
        // Draw wing roofs (darker brown)
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
        
        // Draw door (darker brown)
        this.ctx.fillStyle = '#4B2E05';
        this.ctx.fillRect(m.x + 80, m.y + 100, 40, 50);
    }
    
    drawHorseAndRider() {
        // Draw horse body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.horse.x, this.horse.y, this.horse.width, this.horse.height);
        
        // Draw horse tail
        this.ctx.save();
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        let tailBaseX = this.horse.x - 5;
        let tailBaseY = this.horse.y + this.horse.height - 5;
        if (this.horse.jumping) {
            // Tail up when jumping
            this.ctx.moveTo(tailBaseX, tailBaseY);
            this.ctx.lineTo(tailBaseX - 15, tailBaseY - 20);
        } else {
            // Tail down when running/standing
            this.ctx.moveTo(tailBaseX, tailBaseY);
            this.ctx.lineTo(tailBaseX - 10, tailBaseY + 20);
        }
        this.ctx.stroke();
        this.ctx.restore();
        
        // Animate legs
        const now = Date.now();
        let runAnim = Math.sin(now / 120) * 0.5; // Oscillate between -0.5 and 0.5 radians
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
            // Animated running legs
            // Front left leg
            this.ctx.save();
            this.ctx.translate(this.horse.x + 10, this.horse.y + this.horse.height);
            this.ctx.rotate(0.2 + runAnim);
            this.ctx.fillRect(0, 0, 6, 20);
            this.ctx.restore();
            // Front right leg
            this.ctx.save();
            this.ctx.translate(this.horse.x + 25, this.horse.y + this.horse.height);
            this.ctx.rotate(-0.2 - runAnim);
            this.ctx.fillRect(0, 0, 6, 20);
            this.ctx.restore();
            // Back left leg
            this.ctx.save();
            this.ctx.translate(this.horse.x + 35, this.horse.y + this.horse.height);
            this.ctx.rotate(-0.2 + runAnim);
            this.ctx.fillRect(0, 0, 6, 20);
            this.ctx.restore();
            // Back right leg
            this.ctx.save();
            this.ctx.translate(this.horse.x + 50, this.horse.y + this.horse.height);
            this.ctx.rotate(0.2 - runAnim);
            this.ctx.fillRect(0, 0, 6, 20);
            this.ctx.restore();
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
        // Draw rider's head (yellow)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.horse.x + 25, this.horse.y - 35, 6, 0, Math.PI * 2);
        this.ctx.fill();
        // Draw black helmet as a rectangle covering the top half of the head
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(this.horse.x + 19, this.horse.y - 41, 12, 6);
    }
    
    drawSpectators() {
        this.spectators.forEach(group => {
            group.people.forEach((person, idx) => {
                // Draw body
                this.ctx.fillStyle = '#444';
                this.ctx.fillRect(person.x, person.y, 8, 18);
                // Draw head
                this.ctx.fillStyle = person.color;
                this.ctx.beginPath();
                this.ctx.arc(person.x + 4, person.y - 4, 6, 0, Math.PI * 2);
                this.ctx.fill();
                // Draw dog if this person has one
                if (person.hasDog) {
                    // Draw lead
                    this.ctx.strokeStyle = '#222';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(person.x + 8, person.y + 10);
                    this.ctx.lineTo(person.x + 20, person.y + 18);
                    this.ctx.stroke();
                    // Draw dog (simple brown oval body, small head, tail)
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.beginPath();
                    this.ctx.ellipse(person.x + 20, person.y + 18, 8, 5, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(person.x + 27, person.y + 18, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    // Tail
                    this.ctx.strokeStyle = '#8B4513';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(person.x + 28, person.y + 18);
                    this.ctx.lineTo(person.x + 32, person.y + 15);
                    this.ctx.stroke();
                }
            });
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            this.ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
        });
        this.drawManor();
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.ground, this.canvas.width, 50);
        this.drawSpectators(); // Draw spectators on top of grass, in front of manor
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'fence') {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(obstacle.x, obstacle.y, 5, obstacle.height);
                this.ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y, 5, obstacle.height);
                this.ctx.fillRect(obstacle.x, obstacle.y + obstacle.height/3, obstacle.width, 5);
                this.ctx.fillRect(obstacle.x, obstacle.y + obstacle.height*2/3, obstacle.width, 5);
            } else if (obstacle.type === 'ditch') {
                this.ctx.fillStyle = '#1a237e';
                this.ctx.fillRect(obstacle.x, this.ground, obstacle.width, 20);
            }
        });
        this.drawHorseAndRider();
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press Space or Tap to Restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
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
        } else {
            // Start timer for allowing restart
            if (!this.gameOverTime) {
                this.gameOverTime = Date.now();
                this.allowRestart = false;
            } else if (Date.now() - this.gameOverTime > 1000) { // 1 second delay
                this.allowRestart = true;
            }
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
        this.gameOverTime = 0;
        this.allowRestart = true;
        this.obstaclesPassed = 0;
        this.spectators = [];
        this.spectatorTimer = 0;
        this.spectatorInterval = 2000 + Math.random() * 2000;
        document.getElementById('score-value').textContent = '0';
    }
    
    createSpectatorGroup() {
        // 2-5 spectators per group
        const num = 2 + Math.floor(Math.random() * 4);
        const group = [];
        let groupWidth = 0;
        let baseX = this.canvas.width + Math.random() * 100;
        let y = this.ground + 10;
        let dogIndex = Math.floor(Math.random() * num); // One spectator will have a dog
        for (let i = 0; i < num; i++) {
            let color = ['#f5c16c', '#e0ac69', '#c68642', '#8d5524', '#fff', '#222'][Math.floor(Math.random()*6)];
            group.push({
                x: baseX + i * 18,
                y: y,
                color: color,
                hasDog: i === dogIndex
            });
            groupWidth = (i+1) * 18;
        }
        this.spectators.push({
            x: baseX,
            y: y,
            people: group,
            groupWidth: groupWidth
        });
    }
}

// Start the game
const game = new Game();

// Add restart functionality
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && game.gameOver && game.allowRestart) {
        game.reset();
    }
});

document.getElementById('gameCanvas').addEventListener('touchend', (e) => {
    if (game.gameOver && game.allowRestart) {
        game.reset();
    }
}); 