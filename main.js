/**
 * FusionBots - Reinventing Competition
 * A 2D competitive local game with hybrid sports modes
 * Built with Phaser 3
 */

// ========== GAME CONFIGURATION ==========
const CONFIG = {
    width: 1024,
    height: 768,
    playerSpeed: 220,
    ballBounce: 0.85,
    pushForce: 600,
    knockbackForce: 500,
    maxBallVelocity: 800,
    pushCooldown: 800,
    pushRadius: 120,
    modeDuration: 60,
    explanationDuration: 7,
    colors: {
        background: 0x0a0a0f,
        player1: 0x00f5ff,
        player2: 0xff2d78,
        ball: 0xffffff,
        lava: 0xff4500,
        safeZone: 0x00ff88,
        goal: 0xffff00
    }
};

// ========== PLAYER CLASS ==========
class Player {
    constructor(scene, x, y, color, controls, id) {
        this.scene = scene;
        this.id = id;
        this.color = color;
        this.controls = controls;
        this.speed = CONFIG.playerSpeed;
        this.canPush = true;
        this.pushCooldownTimer = 0;
        this.hasBall = false;
        this.score = 0;
        this.modeScore = 0;
        
        // Create player sprite
        this.sprite = scene.add.circle(x, y, 25, color);
        this.sprite.setStrokeStyle(3, 0xffffff);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCircle(25);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0.3);
        this.sprite.body.setDrag(100);
        
        // Create glow effect
        this.glow = scene.add.circle(x, y, 35, color, 0.2);
        
        // Cooldown bar background
        this.cooldownBarBg = scene.add.rectangle(x, y - 40, 40, 6, 0x333333);
        this.cooldownBar = scene.add.rectangle(x, y - 40, 40, 6, color);
        
        // Flash overlay for push feedback
        this.flashOverlay = scene.add.circle(x, y, 30, 0xffffff, 0);
        
        this.sprite.player = this;
    }
    
    update() {
        const body = this.sprite.body;
        let velocityX = 0;
        let velocityY = 0;
        
        // Handle movement based on controls
        if (this.controls.up.isDown) velocityY = -this.speed;
        if (this.controls.down.isDown) velocityY = this.speed;
        if (this.controls.left.isDown) velocityX = -this.speed;
        if (this.controls.right.isDown) velocityX = this.speed;
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        body.setVelocity(velocityX, velocityY);
        
        // Update visual elements position
        this.glow.setPosition(this.sprite.x, this.sprite.y);
        this.cooldownBarBg.setPosition(this.sprite.x, this.sprite.y - 40);
        this.cooldownBar.setPosition(this.sprite.x - 20 + (this.cooldownBar.width / 2), this.sprite.y - 40);
        this.flashOverlay.setPosition(this.sprite.x, this.sprite.y);
        
        // Update cooldown bar
        if (!this.canPush) {
            const elapsed = this.scene.time.now - this.pushCooldownTimer;
            const progress = Math.min(elapsed / CONFIG.pushCooldown, 1);
            this.cooldownBar.setScale(progress, 1);
            
            if (progress >= 1) {
                this.canPush = true;
            }
        } else {
            this.cooldownBar.setScale(1, 1);
        }
    }
    
    push(ball, otherPlayer) {
        if (!this.canPush) return false;
        
        this.canPush = false;
        this.pushCooldownTimer = this.scene.time.now;
        
        // Flash effect on pusher
        this.flashOverlay.setAlpha(0.8);
        this.scene.tweens.add({
            targets: this.flashOverlay,
            alpha: 0,
            duration: 200,
            ease: 'Power2'
        });
        
        // Create expansion wave
        const wave = this.scene.add.circle(this.sprite.x, this.sprite.y, 30, this.color, 0.5);
        this.scene.tweens.add({
            targets: wave,
            radius: 80,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onUpdate: () => {
                wave.setRadius(wave.radius);
            },
            onComplete: () => wave.destroy()
        });
        
        // Push ball if in range
        if (ball && ball.sprite) {
            const distToBall = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                ball.sprite.x, ball.sprite.y
            );
            
            if (distToBall < CONFIG.pushRadius) {
                const angle = Phaser.Math.Angle.Between(
                    this.sprite.x, this.sprite.y,
                    ball.sprite.x, ball.sprite.y
                );
                ball.sprite.body.setVelocity(
                    Math.cos(angle) * CONFIG.pushForce,
                    Math.sin(angle) * CONFIG.pushForce
                );
            }
        }
        
        // Push rival if in range
        if (otherPlayer && otherPlayer.sprite) {
            const distToRival = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                otherPlayer.sprite.x, otherPlayer.sprite.y
            );
            
            if (distToRival < CONFIG.pushRadius) {
                const angle = Phaser.Math.Angle.Between(
                    this.sprite.x, this.sprite.y,
                    otherPlayer.sprite.x, otherPlayer.sprite.y
                );
                otherPlayer.sprite.body.setVelocity(
                    Math.cos(angle) * CONFIG.knockbackForce,
                    Math.sin(angle) * CONFIG.knockbackForce
                );
                
                // Flash effect on hit rival
                otherPlayer.flashOverlay.setFillStyle(this.color, 0.6);
                otherPlayer.flashOverlay.setAlpha(0.6);
                this.scene.tweens.add({
                    targets: otherPlayer.flashOverlay,
                    alpha: 0,
                    duration: 200,
                    ease: 'Power2'
                });
                
                return true; // Hit rival
            }
        }
        
        return false;
    }
    
    setPosition(x, y) {
        this.sprite.setPosition(x, y);
        this.glow.setPosition(x, y);
        this.cooldownBarBg.setPosition(x, y - 40);
        this.cooldownBar.setPosition(x, y - 40);
        this.flashOverlay.setPosition(x, y);
    }
    
    setSpeedModifier(modifier) {
        this.speed = CONFIG.playerSpeed * modifier;
    }
    
    resetSpeed() {
        this.speed = CONFIG.playerSpeed;
    }
    
    addScore(points) {
        this.score += points;
        this.modeScore += points;
    }
    
    resetModeScore() {
        this.modeScore = 0;
    }
    
    destroy() {
        this.sprite.destroy();
        this.glow.destroy();
        this.cooldownBarBg.destroy();
        this.cooldownBar.destroy();
        this.flashOverlay.destroy();
    }
}

// ========== BALL CLASS ==========
class Ball {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Create ball with glow
        this.glow = scene.add.circle(x, y, 20, 0xffffff, 0.2);
        this.sprite = scene.add.circle(x, y, 12, CONFIG.colors.ball);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCircle(12);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(CONFIG.ballBounce);
        this.sprite.body.setDrag(50);
        this.sprite.body.setMaxVelocity(CONFIG.maxBallVelocity);
        
        // Timer for explosive mode
        this.timer = 0;
        this.timerText = null;
        this.isExplosive = false;
        
        this.sprite.ball = this;
    }
    
    update() {
        this.glow.setPosition(this.sprite.x, this.sprite.y);
        
        if (this.timerText) {
            this.timerText.setPosition(this.sprite.x, this.sprite.y - 25);
        }
        
        // Limit velocity
        const velocity = this.sprite.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > CONFIG.maxBallVelocity) {
            const ratio = CONFIG.maxBallVelocity / speed;
            this.sprite.body.setVelocity(velocity.x * ratio, velocity.y * ratio);
        }
    }
    
    setPosition(x, y) {
        this.sprite.setPosition(x, y);
        this.glow.setPosition(x, y);
        this.sprite.body.setVelocity(0, 0);
    }
    
    enableExplosiveMode(duration) {
        this.isExplosive = true;
        this.timer = duration;
        this.timerText = this.scene.add.text(this.sprite.x, this.sprite.y - 25, duration.toFixed(1), {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#ffffff'
        }).setOrigin(0.5);
    }
    
    updateTimer(delta) {
        if (!this.isExplosive) return false;
        
        this.timer -= delta / 1000;
        
        if (this.timerText) {
            this.timerText.setText(Math.max(0, this.timer).toFixed(1));
            
            // Change color when time is low
            if (this.timer <= 2) {
                this.timerText.setColor('#ff0000');
                // Pulse effect
                const pulse = 0.5 + Math.sin(this.scene.time.now / 100) * 0.3;
                this.glow.setAlpha(pulse);
                this.glow.setFillStyle(0xff4500, pulse);
            }
        }
        
        return this.timer <= 0;
    }
    
    resetTimer(duration) {
        this.timer = duration;
        if (this.timerText) {
            this.timerText.setColor('#ffffff');
        }
        this.glow.setFillStyle(0xffffff, 0.2);
    }
    
    disableExplosiveMode() {
        this.isExplosive = false;
        if (this.timerText) {
            this.timerText.destroy();
            this.timerText = null;
        }
        this.glow.setFillStyle(0xffffff, 0.2);
    }
    
    destroy() {
        this.sprite.destroy();
        this.glow.destroy();
        if (this.timerText) {
            this.timerText.destroy();
        }
    }
}

// ========== ARENA CLASS ==========
class Arena {
    constructor(scene) {
        this.scene = scene;
        this.zones = [];
        this.goals = [];
        this.boundaries = [];
        this.lavaZones = [];
        this.safeZone = null;
        this.centerZone = null;
    }
    
    createBoundaries(config = {}) {
        this.clearAll();
        
        const width = CONFIG.width;
        const height = CONFIG.height;
        const wallThickness = 15;
        
        // Default full boundaries
        if (!config.noSides) {
            // Left wall
            this.createWall(wallThickness / 2, height / 2, wallThickness, height);
            // Right wall
            this.createWall(width - wallThickness / 2, height / 2, wallThickness, height);
        }
        
        // Top wall
        this.createWall(width / 2, wallThickness / 2, width, wallThickness);
        // Bottom wall
        this.createWall(width / 2, height - wallThickness / 2, width, wallThickness);
    }
    
    createWall(x, y, width, height) {
        const wall = this.scene.add.rectangle(x, y, width, height, 0x333333);
        this.scene.physics.add.existing(wall, true);
        this.boundaries.push(wall);
        return wall;
    }
    
    createGoals(config = {}) {
        const width = CONFIG.width;
        const height = CONFIG.height;
        const goalWidth = 20;
        const goalHeight = 120;
        
        // Left goal (Player 2 scores here)
        const leftGoal = this.scene.add.rectangle(goalWidth / 2, height / 2, goalWidth, goalHeight, CONFIG.colors.player2, 0.5);
        leftGoal.setStrokeStyle(2, CONFIG.colors.player2);
        this.scene.physics.add.existing(leftGoal, !config.moving);
        leftGoal.body.setImmovable(true);
        leftGoal.isGoal = true;
        leftGoal.forPlayer = 2;
        this.goals.push(leftGoal);
        
        // Right goal (Player 1 scores here)
        const rightGoal = this.scene.add.rectangle(width - goalWidth / 2, height / 2, goalWidth, goalHeight, CONFIG.colors.player1, 0.5);
        rightGoal.setStrokeStyle(2, CONFIG.colors.player1);
        this.scene.physics.add.existing(rightGoal, !config.moving);
        rightGoal.body.setImmovable(true);
        rightGoal.isGoal = true;
        rightGoal.forPlayer = 1;
        this.goals.push(rightGoal);
        
        if (config.moving) {
            leftGoal.baseY = height / 2;
            rightGoal.baseY = height / 2;
            leftGoal.moveOffset = 0;
            rightGoal.moveOffset = Math.PI; // Out of phase
        }
        
        return this.goals;
    }
    
    createBaskets() {
        const width = CONFIG.width;
        const height = CONFIG.height;
        const basketRadius = 40;
        
        // Left basket
        const leftBasket = this.scene.add.circle(100, height / 2, basketRadius, CONFIG.colors.player2, 0.3);
        leftBasket.setStrokeStyle(3, CONFIG.colors.player2);
        this.scene.physics.add.existing(leftBasket, true);
        leftBasket.body.setCircle(basketRadius);
        leftBasket.isBasket = true;
        leftBasket.forPlayer = 2;
        this.goals.push(leftBasket);
        
        // Right basket
        const rightBasket = this.scene.add.circle(width - 100, height / 2, basketRadius, CONFIG.colors.player1, 0.3);
        rightBasket.setStrokeStyle(3, CONFIG.colors.player1);
        this.scene.physics.add.existing(rightBasket, true);
        rightBasket.body.setCircle(basketRadius);
        rightBasket.isBasket = true;
        rightBasket.forPlayer = 1;
        this.goals.push(rightBasket);
        
        return this.goals;
    }
    
    createLavaZone(shrinkable = false) {
        const width = CONFIG.width;
        const height = CONFIG.height;
        const margin = 100;
        
        // Create safe zone in center
        const safeWidth = width - margin * 2;
        const safeHeight = height - margin * 2;
        
        this.safeZone = this.scene.add.rectangle(width / 2, height / 2, safeWidth, safeHeight, CONFIG.colors.safeZone, 0.2);
        this.safeZone.setStrokeStyle(2, CONFIG.colors.safeZone);
        this.safeZone.originalWidth = safeWidth;
        this.safeZone.originalHeight = safeHeight;
        
        // Create lava zones around edges
        this.createLavaRect(margin / 2, height / 2, margin, height); // Left
        this.createLavaRect(width - margin / 2, height / 2, margin, height); // Right
        this.createLavaRect(width / 2, margin / 2, width - margin * 2, margin); // Top
        this.createLavaRect(width / 2, height - margin / 2, width - margin * 2, margin); // Bottom
        
        return this.safeZone;
    }
    
    createLavaRect(x, y, width, height) {
        const lava = this.scene.add.rectangle(x, y, width, height, CONFIG.colors.lava, 0.6);
        lava.isLava = true;
        this.lavaZones.push(lava);
        
        // Pulse animation
        this.scene.tweens.add({
            targets: lava,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        return lava;
    }
    
    shrinkSafeZone(factor) {
        if (!this.safeZone) return;
        
        const newWidth = this.safeZone.width * factor;
        const newHeight = this.safeZone.height * factor;
        
        this.scene.tweens.add({
            targets: this.safeZone,
            displayWidth: newWidth,
            displayHeight: newHeight,
            duration: 1000,
            ease: 'Power2'
        });
    }
    
    createCenterZone() {
        const width = CONFIG.width;
        const height = CONFIG.height;
        const zoneWidth = 200;
        const zoneHeight = 200;
        
        this.centerZone = this.scene.add.rectangle(width / 2, height / 2, zoneWidth, zoneHeight, 0x444444, 0.3);
        this.centerZone.setStrokeStyle(2, 0x888888);
        this.centerZone.controlledBy = null;
        
        return this.centerZone;
    }
    
    createEndZones() {
        const width = CONFIG.width;
        const height = CONFIG.height;
        const zoneWidth = 80;
        
        // Left end zone (Player 1 scores here)
        const leftZone = this.scene.add.rectangle(zoneWidth / 2, height / 2, zoneWidth, height - 30, CONFIG.colors.player1, 0.2);
        leftZone.setStrokeStyle(2, CONFIG.colors.player1);
        leftZone.isEndZone = true;
        leftZone.forPlayer = 1;
        this.zones.push(leftZone);
        
        // Right end zone (Player 2 scores here)
        const rightZone = this.scene.add.rectangle(width - zoneWidth / 2, height / 2, zoneWidth, height - 30, CONFIG.colors.player2, 0.2);
        rightZone.setStrokeStyle(2, CONFIG.colors.player2);
        rightZone.isEndZone = true;
        rightZone.forPlayer = 2;
        this.zones.push(rightZone);
        
        return this.zones;
    }
    
    updateMovingGoals(time) {
        this.goals.forEach(goal => {
            if (goal.baseY !== undefined) {
                const amplitude = 150;
                const speed = 0.001;
                goal.y = goal.baseY + Math.sin(time * speed + goal.moveOffset) * amplitude;
                goal.body.updateFromGameObject();
            }
        });
    }
    
    isInSafeZone(x, y) {
        if (!this.safeZone) return true;
        
        const bounds = this.safeZone.getBounds();
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    }
    
    isInCenterZone(x, y) {
        if (!this.centerZone) return false;
        
        const bounds = this.centerZone.getBounds();
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    }
    
    clearAll() {
        this.zones.forEach(z => z.destroy());
        this.goals.forEach(g => g.destroy());
        this.boundaries.forEach(b => b.destroy());
        this.lavaZones.forEach(l => l.destroy());
        if (this.safeZone) this.safeZone.destroy();
        if (this.centerZone) this.centerZone.destroy();
        
        this.zones = [];
        this.goals = [];
        this.boundaries = [];
        this.lavaZones = [];
        this.safeZone = null;
        this.centerZone = null;
    }
}

// ========== BASE GAME MODE CLASS ==========
class GameMode {
    constructor(scene, arena, players, ball) {
        this.scene = scene;
        this.arena = arena;
        this.players = players;
        this.ball = ball;
        this.timeRemaining = CONFIG.modeDuration;
        this.isActive = false;
        this.name = "Base Mode";
        this.rules = ["Rule 1", "Rule 2"];
    }
    
    setupArena() {
        this.arena.createBoundaries();
    }
    
    setupPlayers() {
        this.players[0].setPosition(200, CONFIG.height / 2);
        this.players[1].setPosition(CONFIG.width - 200, CONFIG.height / 2);
        this.players[0].resetSpeed();
        this.players[1].resetSpeed();
        this.players[0].resetModeScore();
        this.players[1].resetModeScore();
    }
    
    setupBall() {
        this.ball.setPosition(CONFIG.width / 2, CONFIG.height / 2);
    }
    
    setupCollisions() {
        // Ball collides with boundaries
        this.arena.boundaries.forEach(wall => {
            this.scene.physics.add.collider(this.ball.sprite, wall);
            this.players.forEach(player => {
                this.scene.physics.add.collider(player.sprite, wall);
            });
        });
        
        // Players collide with each other
        this.scene.physics.add.collider(this.players[0].sprite, this.players[1].sprite);
        
        // Players collide with ball
        this.players.forEach(player => {
            this.scene.physics.add.collider(player.sprite, this.ball.sprite);
        });
    }
    
    updateModeLogic(delta) {
        // Override in subclasses
    }
    
    checkWinCondition() {
        // Returns winner or null if time not up
        if (this.timeRemaining <= 0) {
            if (this.players[0].modeScore > this.players[1].modeScore) return 1;
            if (this.players[1].modeScore > this.players[0].modeScore) return 2;
            return 0; // Tie
        }
        return null;
    }
    
    cleanup() {
        this.arena.clearAll();
        this.ball.disableExplosiveMode();
    }
    
    start() {
        this.isActive = true;
        this.setupArena();
        this.setupPlayers();
        this.setupBall();
        this.setupCollisions();
    }
    
    update(delta) {
        if (!this.isActive) return;
        
        this.timeRemaining -= delta / 1000;
        this.updateModeLogic(delta);
    }
}

// ========== MODE 1: SURVIVAL GOAL ==========
class SurvivalGoalMode extends GameMode {
    constructor(scene, arena, players, ball) {
        super(scene, arena, players, ball);
        this.name = "GOL DE SUPERVIVENCIA";
        this.rules = [
            "Marca goles o empuja al rival fuera.",
            "Pero si caes tras anotar, pierdes el punto."
        ];
        this.pendingGoal = null;
        this.pendingGoalTimer = 0;
        this.goalConfirmTime = 3;
    }
    
    setupArena() {
        this.arena.createBoundaries({ noSides: true });
        this.arena.createGoals();
        
        // Create danger zone indicators on sides
        this.dangerLeft = this.scene.add.rectangle(0, CONFIG.height / 2, 20, CONFIG.height, 0xff0000, 0.3);
        this.dangerRight = this.scene.add.rectangle(CONFIG.width, CONFIG.height / 2, 20, CONFIG.height, 0xff0000, 0.3);
        
        // Pulse animation
        this.scene.tweens.add({
            targets: [this.dangerLeft, this.dangerRight],
            alpha: 0.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    setupCollisions() {
        super.setupCollisions();
        
        // Goal detection
        this.arena.goals.forEach(goal => {
            this.scene.physics.add.overlap(this.ball.sprite, goal, (ball, goalObj) => {
                this.onGoalScored(goalObj.forPlayer);
            });
        });
    }
    
    onGoalScored(forPlayer) {
        if (this.pendingGoal) return;
        
        const scoringPlayer = forPlayer === 1 ? 0 : 1;
        this.pendingGoal = scoringPlayer;
        this.pendingGoalTimer = this.goalConfirmTime;
        
        // Visual feedback
        this.scene.uiManager.showAnnouncement(`¡GOL PENDIENTE P${scoringPlayer + 1}!`, CONFIG.colors[`player${scoringPlayer + 1}`]);
        
        // Reset ball
        this.ball.setPosition(CONFIG.width / 2, CONFIG.height / 2);
    }
    
    checkPlayerOutOfBounds(player) {
        const x = player.sprite.x;
        return x < 0 || x > CONFIG.width;
    }
    
    updateModeLogic(delta) {
        // Check pending goal confirmation
        if (this.pendingGoal !== null) {
            this.pendingGoalTimer -= delta / 1000;
            
            const scoringPlayer = this.players[this.pendingGoal];
            
            if (this.checkPlayerOutOfBounds(scoringPlayer)) {
                // Goal cancelled!
                this.scene.uiManager.showAnnouncement("¡GOL ANULADO!", 0xff0000);
                this.pendingGoal = null;
            } else if (this.pendingGoalTimer <= 0) {
                // Goal confirmed!
                scoringPlayer.addScore(1);
                this.scene.uiManager.showAnnouncement(`¡GOL P${this.pendingGoal + 1}!`, scoringPlayer.color);
                this.pendingGoal = null;
            }
        }
        
        // Check if players fall out
        this.players.forEach((player, index) => {
            if (this.checkPlayerOutOfBounds(player)) {
                const otherPlayer = this.players[1 - index];
                otherPlayer.addScore(1);
                this.scene.uiManager.showAnnouncement(`¡P${index + 1} CAYÓ!`, otherPlayer.color);
                
                // Reset positions
                this.setupPlayers();
                this.ball.setPosition(CONFIG.width / 2, CONFIG.height / 2);
            }
        });
    }
    
    cleanup() {
        super.cleanup();
        if (this.dangerLeft) this.dangerLeft.destroy();
        if (this.dangerRight) this.dangerRight.destroy();
    }
}

// ========== MODE 2: CARRY DOMINANCE ==========
class CarryDominanceMode extends GameMode {
    constructor(scene, arena, players, ball) {
        super(scene, arena, players, ball);
        this.name = "DOMINACIÓN DE CARGA";
        this.rules = [
            "Lleva el balón a la línea rival.",
            "Controla el centro para sumar puntos extra."
        ];
        this.centerControlTimer = 0;
        this.ballCarrier = null;
    }
    
    setupArena() {
        this.arena.createBoundaries();
        this.arena.createEndZones();
        this.arena.createCenterZone();
    }
    
    setupCollisions() {
        super.setupCollisions();
        
        // End zone scoring
        this.arena.zones.forEach(zone => {
            this.players.forEach(player => {
                this.scene.physics.add.overlap(player.sprite, zone, () => {
                    if (zone.isEndZone && this.ballCarrier === player && zone.forPlayer === (this.players.indexOf(player) + 1)) {
                        this.onEndZoneScored(player, zone);
                    }
                });
            });
        });
    }
    
    onEndZoneScored(player, zone) {
        player.addScore(2);
        this.scene.uiManager.showAnnouncement(`¡TOUCHDOWN P${this.players.indexOf(player) + 1}!`, player.color);
        
        // Reset
        this.ballCarrier = null;
        player.resetSpeed();
        this.setupPlayers();
        this.ball.setPosition(CONFIG.width / 2, CONFIG.height / 2);
    }
    
    updateModeLogic(delta) {
        // Check ball carrier
        let newCarrier = null;
        let minDist = 50;
        
        this.players.forEach(player => {
            const dist = Phaser.Math.Distance.Between(
                player.sprite.x, player.sprite.y,
                this.ball.sprite.x, this.ball.sprite.y
            );
            if (dist < minDist) {
                minDist = dist;
                newCarrier = player;
            }
        });
        
        if (newCarrier !== this.ballCarrier) {
            if (this.ballCarrier) {
                this.ballCarrier.resetSpeed();
            }
            this.ballCarrier = newCarrier;
            if (this.ballCarrier) {
                this.ballCarrier.setSpeedModifier(0.6);
            }
        }
        
        // Center zone control
        let playerInCenter = null;
        this.players.forEach(player => {
            if (this.arena.isInCenterZone(player.sprite.x, player.sprite.y)) {
                if (player !== this.ballCarrier) {
                    playerInCenter = player;
                }
            }
        });
        
        if (playerInCenter) {
            this.centerControlTimer += delta / 1000;
            this.arena.centerZone.setFillStyle(playerInCenter.color, 0.4);
            
            if (this.centerControlTimer >= 3) {
                playerInCenter.addScore(1);
                this.scene.uiManager.showAnnouncement(`¡CONTROL P${this.players.indexOf(playerInCenter) + 1}!`, playerInCenter.color);
                this.centerControlTimer = 0;
            }
        } else {
            this.centerControlTimer = 0;
            if (this.arena.centerZone) {
                this.arena.centerZone.setFillStyle(0x444444, 0.3);
            }
        }
    }
}

// ========== MODE 3: TRIPLE RISK ==========
class TripleRiskMode extends GameMode {
    constructor(scene, arena, players, ball) {
        super(scene, arena, players, ball);
        this.name = "TRIPLE RIESGO";
        this.rules = [
            "Encesta para ganar puntos.",
            "Arriesga en la lava para ganar más."
        ];
        this.lavaDamageTimer = [0, 0];
        this.shrinkTimer = 0;
        this.shrinkCount = 0;
    }
    
    setupArena() {
        this.arena.createBoundaries();
        this.arena.createBaskets();
        this.arena.createLavaZone(true);
    }
    
    setupCollisions() {
        super.setupCollisions();
        
        // Basket scoring
        this.arena.goals.forEach(basket => {
            this.scene.physics.add.overlap(this.ball.sprite, basket, () => {
                if (basket.isBasket) {
                    this.onBasketScored(basket);
                }
            });
        });
    }
    
    onBasketScored(basket) {
        const scoringPlayerIndex = basket.forPlayer - 1;
        const scoringPlayer = this.players[scoringPlayerIndex];
        
        // Check if scoring player is in lava
        const inLava = !this.arena.isInSafeZone(scoringPlayer.sprite.x, scoringPlayer.sprite.y);
        const points = inLava ? 3 : 1;
        
        scoringPlayer.addScore(points);
        this.scene.uiManager.showAnnouncement(
            `¡CANASTA P${scoringPlayerIndex + 1}! +${points}`,
            scoringPlayer.color
        );
        
        // Reset ball
        this.ball.setPosition(CONFIG.width / 2, CONFIG.height / 2);
    }
    
    updateModeLogic(delta) {
        // Lava damage
        this.players.forEach((player, index) => {
            if (!this.arena.isInSafeZone(player.sprite.x, player.sprite.y)) {
                this.lavaDamageTimer[index] += delta / 1000;
                
                // Visual feedback - player flashes red
                player.sprite.setFillStyle(0xff4500);
                
                if (this.lavaDamageTimer[index] >= 2) {
                    player.addScore(-1);
                    this.scene.uiManager.showAnnouncement(`¡P${index + 1} QUEMADO! -1`, 0xff4500);
                    this.lavaDamageTimer[index] = 0;
                }
            } else {
                this.lavaDamageTimer[index] = 0;
                player.sprite.setFillStyle(player.color);
            }
        });
        
        // Shrink safe zone every 15 seconds
        this.shrinkTimer += delta / 1000;
        if (this.shrinkTimer >= 15 && this.shrinkCount < 3) {
            this.arena.shrinkSafeZone(0.8);
            this.shrinkCount++;
            this.shrinkTimer = 0;
            this.scene.uiManager.showAnnouncement("¡ZONA SEGURA REDUCIDA!", CONFIG.colors.lava);
        }
    }
}

// ========== MODE 4: DYNAMIC OBJECTIVE ==========
class DynamicObjectiveMode extends GameMode {
    constructor(scene, arena, players, ball) {
        super(scene, arena, players, ball);
        this.name = "OBJETIVO DINÁMICO";
        this.rules = [
            "Las porterías no se quedan quietas.",
            "Adáptate y aprovecha el caos."
        ];
        this.lastPusherHit = null;
    }
    
    setupArena() {
        this.arena.createBoundaries();
        this.arena.createGoals({ moving: true });
    }
    
    setupCollisions() {
        super.setupCollisions();
        
        // Goal detection
        this.arena.goals.forEach(goal => {
            this.scene.physics.add.overlap(this.ball.sprite, goal, () => {
                this.onGoalScored(goal.forPlayer);
            });
        });
    }
    
    onGoalScored(forPlayer) {
        const scoringPlayerIndex = forPlayer - 1;
        const scoringPlayer = this.players[scoringPlayerIndex];
        
        let points = 1;
        
        // Bonus point if pusher hit rival during goal attempt
        if (this.lastPusherHit === scoringPlayerIndex) {
            points = 2;
            this.lastPusherHit = null;
        }
        
        scoringPlayer.addScore(points);
        this.scene.uiManager.showAnnouncement(
            `¡GOL P${scoringPlayerIndex + 1}! +${points}`,
            scoringPlayer.color
        );
        
        // Reset ball
        this.ball.setPosition(CONFIG.width / 2, CONFIG.height / 2);
    }
    
    updateModeLogic(delta) {
        // Update moving goals
        this.arena.updateMovingGoals(this.scene.time.now);
    }
    
    onPushHitRival(pusherIndex) {
        this.lastPusherHit = pusherIndex;
    }
}

// ========== MODE 5: CONTROLLED IMPACT ==========
class ControlledImpactMode extends GameMode {
    constructor(scene, arena, players, ball) {
        super(scene, arena, players, ball);
        this.name = "IMPACTO CONTROLADO";
        this.rules = [
            "El balón explotará.",
            "No seas el más cercano cuando ocurra."
        ];
        this.explosionTime = 6;
    }
    
    setupArena() {
        this.arena.createBoundaries();
    }
    
    setupBall() {
        super.setupBall();
        this.ball.enableExplosiveMode(this.explosionTime);
    }
    
    updateModeLogic(delta) {
        // Update ball timer
        const exploded = this.ball.updateTimer(delta);
        
        if (exploded) {
            this.triggerExplosion();
        }
    }
    
    triggerExplosion() {
        // Find closest player
        let closestPlayer = null;
        let closestDist = Infinity;
        
        this.players.forEach((player, index) => {
            const dist = Phaser.Math.Distance.Between(
                player.sprite.x, player.sprite.y,
                this.ball.sprite.x, this.ball.sprite.y
            );
            if (dist < closestDist) {
                closestDist = dist;
                closestPlayer = player;
            }
        });
        
        // Visual explosion effect
        const explosion = this.scene.add.circle(this.ball.sprite.x, this.ball.sprite.y, 20, 0xff4500, 0.8);
        this.scene.tweens.add({
            targets: explosion,
            radius: 150,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onUpdate: () => {
                explosion.setRadius(explosion.radius);
            },
            onComplete: () => explosion.destroy()
        });
        
        // Penalize closest player
        if (closestPlayer) {
            closestPlayer.addScore(-2);
            const playerIndex = this.players.indexOf(closestPlayer);
            this.scene.uiManager.showAnnouncement(`¡EXPLOSIÓN! P${playerIndex + 1} -2`, 0xff4500);
        }
        
        // Reset timer and ball position
        this.ball.resetTimer(this.explosionTime);
        this.ball.setPosition(CONFIG.width / 2, CONFIG.height / 2);
    }
}

// ========== UI MANAGER ==========
class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.scoreTexts = [];
        this.modeTitle = null;
        this.timerText = null;
        this.announcement = null;
        this.overlay = null;
        this.countdownText = null;
        this.explanationTexts = [];
    }
    
    createScoreDisplay() {
        // Player 1 score (top left)
        const p1Score = this.scene.add.text(20, 20, 'P1: 0', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00f5ff'
        });
        this.scoreTexts.push(p1Score);
        
        // Player 2 score (top right)
        const p2Score = this.scene.add.text(CONFIG.width - 120, 20, 'P2: 0', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#ff2d78'
        });
        this.scoreTexts.push(p2Score);
        
        // Mode timer
        this.timerText = this.scene.add.text(CONFIG.width / 2, 20, '60', {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#ffffff'
        }).setOrigin(0.5, 0);
        
        // Mode title
        this.modeTitle = this.scene.add.text(CONFIG.width / 2, 60, '', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#888888'
        }).setOrigin(0.5, 0);
    }
    
    updateScores(player1Score, player2Score) {
        this.scoreTexts[0].setText(`P1: ${player1Score}`);
        this.scoreTexts[1].setText(`P2: ${player2Score}`);
    }
    
    updateTimer(seconds) {
        this.timerText.setText(Math.ceil(seconds).toString());
        if (seconds <= 10) {
            this.timerText.setColor('#ff4500');
        } else {
            this.timerText.setColor('#ffffff');
        }
    }
    
    setModeTitle(title) {
        this.modeTitle.setText(title);
    }
    
    showAnnouncement(text, color = 0xffffff) {
        if (this.announcement) {
            this.announcement.destroy();
        }
        
        const colorHex = '#' + color.toString(16).padStart(6, '0');
        
        this.announcement = this.scene.add.text(CONFIG.width / 2, CONFIG.height / 2, text, {
            fontSize: '36px',
            fontFamily: 'Courier New',
            color: colorHex,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: this.announcement,
            alpha: 0,
            y: CONFIG.height / 2 - 50,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                if (this.announcement) {
                    this.announcement.destroy();
                    this.announcement = null;
                }
            }
        });
    }
    
    showExplanationOverlay(modeName, rules, onComplete) {
        // Dark overlay
        this.overlay = this.scene.add.rectangle(
            CONFIG.width / 2, CONFIG.height / 2,
            CONFIG.width, CONFIG.height,
            0x000000, 0.85
        );
        
        // Mode name
        const titleText = this.scene.add.text(CONFIG.width / 2, CONFIG.height / 2 - 100, modeName, {
            fontSize: '48px',
            fontFamily: 'Courier New',
            color: '#ffffff',
            stroke: '#00f5ff',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.explanationTexts.push(titleText);
        
        // Rules
        rules.forEach((rule, index) => {
            const ruleText = this.scene.add.text(CONFIG.width / 2, CONFIG.height / 2 - 20 + index * 40, rule, {
                fontSize: '24px',
                fontFamily: 'Courier New',
                color: '#cccccc'
            }).setOrigin(0.5);
            this.explanationTexts.push(ruleText);
        });
        
        // Countdown
        let countdown = CONFIG.explanationDuration;
        this.countdownText = this.scene.add.text(CONFIG.width / 2, CONFIG.height / 2 + 120, `Comenzando en: ${countdown}`, {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#00ff88'
        }).setOrigin(0.5);
        
        const countdownTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                countdown--;
                if (this.countdownText) {
                    this.countdownText.setText(`Comenzando en: ${countdown}`);
                }
                if (countdown <= 0) {
                    this.hideExplanationOverlay();
                    onComplete();
                }
            },
            repeat: CONFIG.explanationDuration - 1
        });
    }
    
    hideExplanationOverlay() {
        if (this.overlay) {
            this.scene.tweens.add({
                targets: this.overlay,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    this.overlay.destroy();
                    this.overlay = null;
                }
            });
        }
        
        this.explanationTexts.forEach(text => {
            this.scene.tweens.add({
                targets: text,
                alpha: 0,
                duration: 300,
                onComplete: () => text.destroy()
            });
        });
        this.explanationTexts = [];
        
        if (this.countdownText) {
            this.scene.tweens.add({
                targets: this.countdownText,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    this.countdownText.destroy();
                    this.countdownText = null;
                }
            });
        }
    }
    
    showFinalResults(player1Total, player2Total, modeScores) {
        // Dark overlay
        this.overlay = this.scene.add.rectangle(
            CONFIG.width / 2, CONFIG.height / 2,
            CONFIG.width, CONFIG.height,
            0x000000, 0.9
        );
        
        // Winner announcement
        let winnerText = "¡EMPATE!";
        let winnerColor = '#ffffff';
        if (player1Total > player2Total) {
            winnerText = "¡JUGADOR 1 GANA!";
            winnerColor = '#00f5ff';
        } else if (player2Total > player1Total) {
            winnerText = "¡JUGADOR 2 GANA!";
            winnerColor = '#ff2d78';
        }
        
        const title = this.scene.add.text(CONFIG.width / 2, 100, winnerText, {
            fontSize: '48px',
            fontFamily: 'Courier New',
            color: winnerColor,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Final scores
        this.scene.add.text(CONFIG.width / 2, 180, `P1: ${player1Total} - P2: ${player2Total}`, {
            fontSize: '36px',
            fontFamily: 'Courier New',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Mode breakdown
        const modeNames = [
            "Gol de Supervivencia",
            "Dominación de Carga",
            "Triple Riesgo",
            "Objetivo Dinámico",
            "Impacto Controlado"
        ];
        
        modeScores.forEach((scores, index) => {
            this.scene.add.text(CONFIG.width / 2, 250 + index * 35, 
                `${modeNames[index]}: P1 ${scores[0]} - P2 ${scores[1]}`, {
                fontSize: '20px',
                fontFamily: 'Courier New',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        });
        
        // Restart instruction
        this.scene.add.text(CONFIG.width / 2, CONFIG.height - 80, "Presiona ESPACIO para reiniciar", {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00ff88'
        }).setOrigin(0.5);
    }
}

// ========== GAME MODE MANAGER ==========
class GameModeManager {
    constructor(scene) {
        this.scene = scene;
        this.modeClasses = [
            SurvivalGoalMode,
            CarryDominanceMode,
            TripleRiskMode,
            DynamicObjectiveMode,
            ControlledImpactMode
        ];
        this.currentModeIndex = -1;
        this.currentMode = null;
        this.modeScores = [];
        this.isTransitioning = false;
    }
    
    startNextMode(arena, players, ball) {
        // Sequential mode progression through all 5 modes
        this.currentModeIndex++;
        
        if (this.currentModeIndex >= this.modeClasses.length) {
            // All modes complete
            return null;
        }
        
        const ModeClass = this.modeClasses[this.currentModeIndex];
        this.currentMode = new ModeClass(this.scene, arena, players, ball);
        
        return this.currentMode;
    }
    
    recordModeScore(player1Score, player2Score) {
        this.modeScores.push([player1Score, player2Score]);
    }
    
    isGameComplete() {
        return this.currentModeIndex >= this.modeClasses.length - 1;
    }
    
    reset() {
        this.currentModeIndex = -1;
        this.currentMode = null;
        this.modeScores = [];
    }
}

// ========== MAIN GAME SCENE ==========
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }
    
    create() {
        // Set background
        this.cameras.main.setBackgroundColor(CONFIG.colors.background);
        
        // Initialize managers
        this.uiManager = new UIManager(this);
        this.modeManager = new GameModeManager(this);
        this.arena = new Arena(this);
        
        // Create controls (as specified in requirements: P1=WASD+F, P2=Arrows+Shift)
        this.controls = {
            player1: {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
                push: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F)
            },
            player2: {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
                push: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
            }
        };
        
        // Create players
        this.players = [
            new Player(this, 200, CONFIG.height / 2, CONFIG.colors.player1, this.controls.player1, 1),
            new Player(this, CONFIG.width - 200, CONFIG.height / 2, CONFIG.colors.player2, this.controls.player2, 2)
        ];
        
        // Create ball
        this.ball = new Ball(this, CONFIG.width / 2, CONFIG.height / 2);
        
        // Create UI
        this.uiManager.createScoreDisplay();
        
        // Game state
        this.gameState = 'menu';
        this.currentMode = null;
        
        // Show menu
        this.showMainMenu();
    }
    
    showMainMenu() {
        this.gameState = 'menu';
        
        // Hide players and ball
        this.players.forEach(p => {
            p.sprite.setVisible(false);
            p.glow.setVisible(false);
            p.cooldownBarBg.setVisible(false);
            p.cooldownBar.setVisible(false);
        });
        this.ball.sprite.setVisible(false);
        this.ball.glow.setVisible(false);
        
        // Menu overlay
        this.menuOverlay = this.add.rectangle(
            CONFIG.width / 2, CONFIG.height / 2,
            CONFIG.width, CONFIG.height,
            0x000000, 0.9
        );
        
        // Title
        this.menuTitle = this.add.text(CONFIG.width / 2, 150, 'FUSIONBOTS', {
            fontSize: '72px',
            fontFamily: 'Courier New',
            color: '#00f5ff',
            stroke: '#ff2d78',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Subtitle
        this.menuSubtitle = this.add.text(CONFIG.width / 2, 220, 'Reinventing Competition', {
            fontSize: '28px',
            fontFamily: 'Courier New',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Controls info
        this.controlsText = this.add.text(CONFIG.width / 2, 350, 
            'CONTROLES\n\n' +
            'Jugador 1: WASD + F (empujar)\n' +
            'Jugador 2: Flechas + Shift (empujar)', {
            fontSize: '20px',
            fontFamily: 'Courier New',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5);
        
        // Start instruction
        this.startText = this.add.text(CONFIG.width / 2, CONFIG.height - 100, 'Presiona ESPACIO para comenzar', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00ff88'
        }).setOrigin(0.5);
        
        // Pulse animation
        this.tweens.add({
            targets: this.startText,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Space key to start
        this.input.keyboard.once('keydown-SPACE', () => {
            this.hideMainMenu();
            this.startGame();
        });
    }
    
    hideMainMenu() {
        if (this.menuOverlay) this.menuOverlay.destroy();
        if (this.menuTitle) this.menuTitle.destroy();
        if (this.menuSubtitle) this.menuSubtitle.destroy();
        if (this.controlsText) this.controlsText.destroy();
        if (this.startText) this.startText.destroy();
        
        // Show players and ball
        this.players.forEach(p => {
            p.sprite.setVisible(true);
            p.glow.setVisible(true);
            p.cooldownBarBg.setVisible(true);
            p.cooldownBar.setVisible(true);
        });
        this.ball.sprite.setVisible(true);
        this.ball.glow.setVisible(true);
    }
    
    startGame() {
        // Reset everything
        this.players[0].score = 0;
        this.players[1].score = 0;
        this.modeManager.reset();
        
        // Start first mode
        this.startNextMode();
    }
    
    startNextMode() {
        this.gameState = 'transition';
        
        // Clean up previous mode
        if (this.currentMode) {
            this.modeManager.recordModeScore(
                this.players[0].modeScore,
                this.players[1].modeScore
            );
            this.currentMode.cleanup();
        }
        
        // Get next mode
        this.currentMode = this.modeManager.startNextMode(this.arena, this.players, this.ball);
        
        if (!this.currentMode) {
            // Game complete
            this.showFinalResults();
            return;
        }
        
        // Show explanation overlay
        this.uiManager.showExplanationOverlay(
            this.currentMode.name,
            this.currentMode.rules,
            () => {
                this.gameState = 'playing';
                this.currentMode.start();
                this.uiManager.setModeTitle(this.currentMode.name);
            }
        );
    }
    
    showFinalResults() {
        this.gameState = 'results';
        
        // Record final mode score
        this.modeManager.recordModeScore(
            this.players[0].modeScore,
            this.players[1].modeScore
        );
        
        this.uiManager.showFinalResults(
            this.players[0].score,
            this.players[1].score,
            this.modeManager.modeScores
        );
        
        // Space to restart
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }
    
    update(time, delta) {
        if (this.gameState !== 'playing') return;
        
        // Update players
        this.players.forEach(player => player.update());
        
        // Update ball
        this.ball.update();
        
        // Handle push input
        if (Phaser.Input.Keyboard.JustDown(this.controls.player1.push)) {
            const hitRival = this.players[0].push(this.ball, this.players[1]);
            if (hitRival && this.currentMode instanceof DynamicObjectiveMode) {
                this.currentMode.onPushHitRival(0);
            }
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.controls.player2.push)) {
            const hitRival = this.players[1].push(this.ball, this.players[0]);
            if (hitRival && this.currentMode instanceof DynamicObjectiveMode) {
                this.currentMode.onPushHitRival(1);
            }
        }
        
        // Update current mode
        if (this.currentMode) {
            this.currentMode.update(delta);
            
            // Update UI
            this.uiManager.updateScores(this.players[0].score, this.players[1].score);
            this.uiManager.updateTimer(this.currentMode.timeRemaining);
            
            // Check win condition
            const winner = this.currentMode.checkWinCondition();
            if (winner !== null) {
                // Mode ended
                if (this.modeManager.isGameComplete()) {
                    this.showFinalResults();
                } else {
                    this.startNextMode();
                }
            }
        }
    }
}

// ========== GAME INITIALIZATION ==========
const gameConfig = {
    type: Phaser.AUTO,
    width: CONFIG.width,
    height: CONFIG.height,
    parent: 'game-container',
    backgroundColor: CONFIG.colors.background,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: MainScene
};

// Start the game
const game = new Phaser.Game(gameConfig);
