
import './style.css'
import { AuthKitProvider, SignInButton, useProfile } from '@farcaster/auth-kit'

class FarcasterBirdGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.gameRunning = false;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('birdJumpHighScore') || '0');
    this.user = null;
    this.isLoading = false;
    
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
    this.checkWalletConnection();
    this.updateUI();
    this.gameLoop();
    this.initializeHaptics();
  }

  initializeHaptics() {
    // Initialize haptic feedback for mobile devices
    this.hapticSupported = 'vibrate' in navigator;
  }

  triggerHaptic(pattern = [100]) {
    if (this.hapticSupported) {
      navigator.vibrate(pattern);
    }
  }
  
  setupFarcaster() {
    const connectBtn = document.getElementById('connectBtn');
    const userInfo = document.getElementById('userInfo');
    const loadingDiv = document.getElementById('loading');
    
    // Check if running in Farcaster context
    this.inFarcasterContext = this.detectFarcasterContext();
    
    connectBtn.addEventListener('click', async () => {
      this.showLoading(true);
      
      try {
        // Simulate Farcaster Auth Kit integration
        await this.authenticateWithFarcaster();
        
        connectBtn.style.display = 'none';
        userInfo.style.display = 'block';
        userInfo.innerHTML = `
          <div class="user-profile">
            <img src="${this.user.pfp}" alt="Profile" class="profile-pic" />
            <div class="user-details">
              <p><strong>${this.user.displayName}</strong></p>
              <p>@${this.user.username}</p>
              <p>FID: ${this.user.fid}</p>
            </div>
          </div>
          <button id="disconnectBtn">Disconnect</button>
        `;
        
        document.getElementById('disconnectBtn').addEventListener('click', () => {
          this.disconnect();
        });
        
      } catch (error) {
        console.error('Authentication failed:', error);
        alert('Failed to connect with Farcaster. Please try again.');
      } finally {
        this.showLoading(false);
      }
    });
  }

  detectFarcasterContext() {
    // Check if app is running in Farcaster client
    return window.location.hostname.includes('farcaster') || 
           window.navigator.userAgent.includes('Farcaster') ||
           window.parent !== window;
  }

  async authenticateWithFarcaster() {
    // Simulate API call with loading state
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.user = {
      fid: Math.floor(Math.random() * 100000),
      username: 'user' + Math.floor(Math.random() * 1000),
      displayName: 'Farcaster User',
      pfp: `https://api.dicebear.com/6.x/avataaars/svg?seed=${Math.random()}`,
      wallet: null
    };
    
    // Auto-connect wallet if in Farcaster context
    if (this.inFarcasterContext) {
      await this.connectWallet();
    }
  }

  disconnect() {
    this.user = null;
    document.getElementById('connectBtn').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('walletInfo').style.display = 'none';
    this.updateUI();
  }

  async checkWalletConnection() {
    // Check if wallet is already connected
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0 && this.user) {
          this.user.wallet = accounts[0];
          this.updateWalletUI();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  }

  async connectWallet() {
    if (!window.ethereum) {
      alert('Please install MetaMask or use a web3 wallet');
      return;
    }

    try {
      this.showLoading(true);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        this.user.wallet = accounts[0];
        this.updateWalletUI();
        this.triggerHaptic([50]);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet');
    } finally {
      this.showLoading(false);
    }
  }

  updateWalletUI() {
    const walletInfo = document.getElementById('walletInfo');
    if (this.user && this.user.wallet) {
      walletInfo.style.display = 'block';
      walletInfo.innerHTML = `
        <div class="wallet-connected">
          <p>💳 Wallet Connected</p>
          <p>${this.user.wallet.substring(0, 6)}...${this.user.wallet.substring(38)}</p>
        </div>
      `;
    }
  }

  showLoading(show) {
    const loadingDiv = document.getElementById('loading');
    this.isLoading = show;
    loadingDiv.style.display = show ? 'block' : 'none';
  }

  updateUI() {
    document.getElementById('highScore').textContent = `High Score: ${this.highScore}`;
  }
  
  setupEventListeners() {
    const startBtn = document.getElementById('startBtn');
    const shareBtn = document.getElementById('shareBtn');
    
    startBtn.addEventListener('click', () => this.startGame());
    shareBtn.addEventListener('click', () => this.shareToFarcaster());
    
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

    // Handle page visibility for performance
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.gameRunning = false;
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
    this.triggerHaptic([100]);
  }
  
  jump() {
    this.bird.velocity = this.bird.jumpPower;
    this.triggerHaptic([50]);
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
        this.triggerHaptic([25]);
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
    this.triggerHaptic([200, 100, 200]);
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('birdJumpHighScore', this.highScore.toString());
      this.updateUI();
    }
    
    // Show game over message
    const message = this.user 
      ? `Game Over! Score: ${this.score}\nHigh Score: ${this.highScore}\nPlayed by ${this.user.displayName}\n\nShare your score on Farcaster!`
      : `Game Over! Score: ${this.score}\nHigh Score: ${this.highScore}\n\nConnect with Farcaster to share your score!`;
    
    alert(message);
    
    // Auto-share if connected
    if (this.user && this.score > 0) {
      setTimeout(() => this.shareToFarcaster(), 1000);
    }
  }
  
  async shareToFarcaster() {
    if (!this.user) {
      alert('Please connect with Farcaster first!');
      return;
    }

    const shareText = this.generateShareText();
    const shareUrl = this.generateShareUrl();
    
    try {
      this.showLoading(true);
      
      // If in Farcaster context, use native sharing
      if (this.inFarcasterContext) {
        await this.nativeShare(shareText, shareUrl);
      } else {
        // Fallback to web sharing or copy to clipboard
        await this.webShare(shareText, shareUrl);
      }
      
      console.log('Shared to Farcaster:', shareText);
      this.triggerHaptic([100, 50, 100]);
      
    } catch (error) {
      console.error('Sharing failed:', error);
      // Fallback: copy to clipboard
      this.copyToClipboard(shareText);
      alert('Share text copied to clipboard!');
    } finally {
      this.showLoading(false);
    }
  }

  generateShareText() {
    const scoreEmoji = this.score >= 10 ? '🔥' : this.score >= 5 ? '⭐' : '🐣';
    return `Just scored ${this.score} points in Bird Jump! ${scoreEmoji}\n\nCan you beat my score? 🐦\n\nPlay now: ${window.location.origin}`;
  }

  generateShareUrl() {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      score: this.score,
      player: this.user.username,
      challenge: 'true'
    });
    return `${baseUrl}?${params.toString()}`;
  }

  async nativeShare(text, url) {
    // Simulate Farcaster native sharing API
    const shareData = {
      text: text,
      url: url,
      embeds: [{
        url: url
      }]
    };
    
    // In a real implementation, this would use the Farcaster API
    await new Promise(resolve => setTimeout(resolve, 1000));
    return shareData;
  }

  async webShare(text, url) {
    if (navigator.share) {
      await navigator.share({
        title: 'Bird Jump Game',
        text: text,
        url: url
      });
    } else {
      throw new Error('Web Share API not supported');
    }
  }

  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
  
  updateScore() {
    document.getElementById('score').textContent = `Score: ${this.score}`;
  }
  
  draw() {
    // Clear canvas with gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw clouds
    this.drawClouds();
    
    // Draw bird with better graphics
    this.drawBird();
    
    // Draw obstacles with better styling
    this.drawObstacles();
    
    // Draw ground
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);
    
    // Draw score on canvas
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    
    if (this.highScore > 0) {
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(`Best: ${this.highScore}`, 10, 55);
    }
  }

  drawClouds() {
    // Simple cloud animation
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.beginPath();
    this.ctx.arc(100 + (Date.now() * 0.01) % 500, 80, 20, 0, Math.PI * 2);
    this.ctx.arc(300 + (Date.now() * 0.008) % 500, 120, 15, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawBird() {
    // Bird body
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);
    
    // Bird emoji
    this.ctx.font = '24px Arial';
    this.ctx.fillText('🐦', this.bird.x - 2, this.bird.y + 24);
  }

  drawObstacles() {
    this.obstacles.forEach(obstacle => {
      // Top obstacle
      this.ctx.fillStyle = '#32CD32';
      this.ctx.fillRect(obstacle.x, 0, this.obstacleWidth, obstacle.topHeight);
      
      // Bottom obstacle
      this.ctx.fillRect(obstacle.x, obstacle.bottomY, this.obstacleWidth, obstacle.bottomHeight);
      
      // Add caps
      this.ctx.fillStyle = '#228B22';
      this.ctx.fillRect(obstacle.x - 5, obstacle.topHeight - 20, this.obstacleWidth + 10, 20);
      this.ctx.fillRect(obstacle.x - 5, obstacle.bottomY, this.obstacleWidth + 10, 20);
    });
  }
  
  gameLoop() {
    if (this.gameRunning && !this.isLoading) {
      this.updateBird();
      this.updateObstacles();
      this.checkCollisions();
    }
    
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  // Handle URL parameters for challenges
  handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const challengeScore = params.get('score');
    const challenger = params.get('player');
    
    if (challengeScore && challenger) {
      document.getElementById('challenge').style.display = 'block';
      document.getElementById('challenge').innerHTML = `
        <div class="challenge-banner">
          <p>🏆 Challenge from @${challenger}</p>
          <p>Beat their score of ${challengeScore}!</p>
        </div>
      `;
    }
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new FarcasterBirdGame();
  game.handleUrlParams();
});
