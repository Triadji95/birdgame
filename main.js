
import './style.css'

class FarcasterBirdGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.gameRunning = false;
    this.score = 0;
    this.user = null;
    
    // Bird properties
    this.bird = {
      x: 50,
      y: 300,
      width: 30,
      height: 30,
      velocity: 0,
      gravity: 0.5,
      jumpPower: -10
    };
    
    // Obstacles
    this.obstacles = [];
    this.obstacleWidth = 60;
    this.obstacleGap = 150;
    this.obstacleSpeed = 2;
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.setupFarcaster();
    this.gameLoop();
  }
  
  setupFarcaster() {
    const connectBtn = document.getElementById('connectBtn');
    const userInfo = document.getElementById('userInfo');
    
    // Simulate Farcaster connection (in real app, use actual SDK)
    connectBtn.addEventListener('click', () => {
      // Mock Farcaster user data
      this.user = {
        fid: Math.floor(Math.random() * 10000),
        username: 'user' + Math.floor(Math.random() * 1000),
        displayName: 'Farcaster User',
        pfp: '🐦'
      };
      
      connectBtn.style.display = 'none';
      userInfo.style.display = 'block';
      userInfo.innerHTML = `
        <p>Connected as: ${this.user.pfp} ${this.user.displayName}</p>
        <p>FID: ${this.user.fid}</p>
      `;
    });
  }
  
  setupEventListeners() {
    const startBtn = document.getElementById('startBtn');
    
    startBtn.addEventListener('click', () => this.startGame());
    
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.gameRunning) {
        e.preventDefault();
        this.jump();
      }
    });
    
    this.canvas.addEventListener('click', () => {
      if (this.gameRunning) {
        this.jump();
      }
    });
  }
  
  startGame() {
    this.gameRunning = true;
    this.score = 0;
    this.bird.y = 300;
    this.bird.velocity = 0;
    this.obstacles = [];
    
    document.getElementById('startBtn').textContent = 'Restart Game';
    this.updateScore();
  }
  
  jump() {
    this.bird.velocity = this.bird.jumpPower;
  }
  
  updateBird() {
    this.bird.velocity += this.bird.gravity;
    this.bird.y += this.bird.velocity;
    
    // Keep bird in bounds
    if (this.bird.y < 0) {
      this.bird.y = 0;
      this.bird.velocity = 0;
    }
    
    if (this.bird.y + this.bird.height > this.canvas.height) {
      this.gameOver();
    }
  }
  
  updateObstacles() {
    // Add new obstacles
    if (this.obstacles.length === 0 || this.obstacles[this.obstacles.length - 1].x < this.canvas.width - 200) {
      const gapY = Math.random() * (this.canvas.height - this.obstacleGap - 100) + 50;
      this.obstacles.push({
        x: this.canvas.width,
        topHeight: gapY,
        bottomY: gapY + this.obstacleGap,
        bottomHeight: this.canvas.height - (gapY + this.obstacleGap),
        passed: false
      });
    }
    
    // Move obstacles
    this.obstacles.forEach((obstacle, index) => {
      obstacle.x -= this.obstacleSpeed;
      
      // Check if bird passed obstacle
      if (!obstacle.passed && obstacle.x + this.obstacleWidth < this.bird.x) {
        obstacle.passed = true;
        this.score++;
        this.updateScore();
      }
      
      // Remove off-screen obstacles
      if (obstacle.x + this.obstacleWidth < 0) {
        this.obstacles.splice(index, 1);
      }
    });
  }
  
  checkCollisions() {
    this.obstacles.forEach(obstacle => {
      // Check collision with top obstacle
      if (this.bird.x < obstacle.x + this.obstacleWidth &&
          this.bird.x + this.bird.width > obstacle.x &&
          this.bird.y < obstacle.topHeight) {
        this.gameOver();
      }
      
      // Check collision with bottom obstacle
      if (this.bird.x < obstacle.x + this.obstacleWidth &&
          this.bird.x + this.bird.width > obstacle.x &&
          this.bird.y + this.bird.height > obstacle.bottomY) {
        this.gameOver();
      }
    });
  }
  
  gameOver() {
    this.gameRunning = false;
    this.shareScore();
    alert(`Game Over! Score: ${this.score}\n${this.user ? `Played by ${this.user.displayName}` : 'Connect with Farcaster to share your score!'}`);
  }
  
  shareScore() {
    if (this.user) {
      // In a real app, this would cast to Farcaster
      console.log(`Sharing to Farcaster: ${this.user.displayName} scored ${this.score} points in Bird Jump! 🐦`);
    }
  }
  
  updateScore() {
    document.getElementById('score').textContent = `Score: ${this.score}`;
  }
  
  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw bird
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);
    
    // Draw bird emoji
    this.ctx.font = '24px Arial';
    this.ctx.fillText('🐦', this.bird.x, this.bird.y + 24);
    
    // Draw obstacles
    this.ctx.fillStyle = '#32CD32';
    this.obstacles.forEach(obstacle => {
      // Top obstacle
      this.ctx.fillRect(obstacle.x, 0, this.obstacleWidth, obstacle.topHeight);
      
      // Bottom obstacle
      this.ctx.fillRect(obstacle.x, obstacle.bottomY, this.obstacleWidth, obstacle.bottomHeight);
    });
    
    // Draw ground
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);
  }
  
  gameLoop() {
    if (this.gameRunning) {
      this.updateBird();
      this.updateObstacles();
      this.checkCollisions();
    }
    
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FarcasterBirdGame();
});
