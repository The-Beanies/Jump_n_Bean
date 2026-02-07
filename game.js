const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const GAME_VERSION = "v1.9";
const FIXED_DT = 1 / 60;
const MAX_SPEED = 150;
const PLATFORM_HEIGHT = 8;
const BIOME_STEP = 500;
const MUSIC_SRC = "Icy Tower v131 - Opening Theme Song High Quality.mp3";
const LEADERBOARD_LIMIT = 20;
const SCORE_STORAGE_KEY = "jumpnbean_highscores";
const LAST_NAME_KEY = "jumpnbean_lastname";
const TOKEN_POINTS = 150;
const ENEMY_POINTS = 220;
const STOMP_BONUS = 140;
const POWERUP_DURATION = 10;
const POWER_BONUS_RATE = 120;
const SLIDE_WINDOW = 0.28;
const COMBO_HOP_POINTS = 90;
const BLOOD_STAIN_LIMIT = 28;
const DEATH_SLOW_DURATION = 2;
const DEATH_SLOW_FACTOR = 0.4;
const YOU_DIED_DURATION = 1.4;
const DEATH_SPLASH_DURATION = 1.1;
const DEATH_SPLASH_COUNT = 28;
const SUPER_JUMP_THRESHOLD = 0.85;
const SUPER_JUMP_MULT = 1.25;
const STYLE_WALL_JUMP = 70;
const STYLE_LONG_JUMP = 120;
const STYLE_SPEED = 60;
const STYLE_SUPER_JUMP = 90;
const STREAK_BASE_POINTS = 30;
const LONG_JUMP_DISTANCE = 120;
const SPEED_STYLE_THRESHOLD = 120;
const TIPS = [
  "Walljump to climb faster.",
  "Chain walljumps for combo points.",
  "Stomp enemies for bonus points.",
  "Ride combo hops to build streaks.",
  "Grab tokens to boost score.",
  "Use double-jump after a stomp.",
  "Safe bars protect you after biome shifts.",
  "Walljump, land, hop fast to extend combos.",
  "Higher speed = higher jumps.",
  "Stay near the center to avoid edge traps.",
  "Combos boost coin value too.",
  "Use short taps for precise landings.",
  "Build streaks for big score jumps.",
];

const keys = { left: false, right: false };
let jumpQueued = false;
let jumpHeld = false;

const BIOMES = [
  {
    name: "Paper Plains",
    bgTop: "#e7e1d1",
    bgBottom: "#b7b0a1",
    haze: "#f7f1e2",
    platformTop: "#8b5a3c",
    platformFace: "#6f3d29",
    platformSide: "#4b2a1f",
    trim: "#caa778",
    coinLight: "#fff1a3",
    coinMid: "#e7c552",
    coinDark: "#b88a2c",
    decor: "#d6c9ae",
  },
  {
    name: "Ink Archives",
    bgTop: "#5d6a78",
    bgBottom: "#2d3945",
    haze: "#7f8a97",
    platformTop: "#4a5a69",
    platformFace: "#2f3944",
    platformSide: "#1f252d",
    trim: "#8aa0b6",
    coinLight: "#ffe9a7",
    coinMid: "#f2cf62",
    coinDark: "#b08a2c",
    decor: "#3b4652",
  },
  {
    name: "Stamp City",
    bgTop: "#c96f55",
    bgBottom: "#8a3f2e",
    haze: "#e0987b",
    platformTop: "#7b3f2f",
    platformFace: "#54261c",
    platformSide: "#3b1a14",
    trim: "#c8835f",
    coinLight: "#ffe3a1",
    coinMid: "#ffd36c",
    coinDark: "#c98d2f",
    decor: "#9b4b38",
  },
  {
    name: "Red Tape Ridge",
    bgTop: "#d3b35c",
    bgBottom: "#92763a",
    haze: "#f0d086",
    platformTop: "#8a5f34",
    platformFace: "#6a4a2a",
    platformSide: "#4a331d",
    trim: "#d2a157",
    coinLight: "#fff0b5",
    coinMid: "#ffe285",
    coinDark: "#cfa34b",
    decor: "#a47a3f",
  },
];

let player = null;
let platforms = [];
let coins = [];
let enemies = [];
let powerups = [];
let state = "play";
let cameraY = 0;
let maxHeight = 0;
let score = 0;
let coinsCollected = 0;
let coinScore = 0;
let enemyScore = 0;
let powerScore = 0;
let styleScore = 0;
let streakScore = 0;
let startY = 0;
let nextPlatformY = 0;
let highScores = loadHighScores();
let highScore = highScores[0]?.score || 0;
let elapsedTime = 0;
let scrollSpeed = 0;
let animTime = 0;
let landSquash = 0;
let wallCombo = 0;
let lastWallJumpTime = -999;
let comboTimer = 0;
let comboScore = 0;
let slideWindow = 0;
let sparkles = [];
let bloodParticles = [];
let bloodStains = [];
let comboPopups = [];
let paceLevel = 0;
let lastPlateauHeight = 0;
let spinTime = 0;
let spinDir = 1;
let wallJumpLockSide = 0;
let invincibleTimer = 0;
let bannerTimer = 0;
let bannerBiomeIndex = 0;
let doubleJumpAvailable = false;
let safeBarTimer = 0;
let levelsEarned = 1;
let deathSlowTimer = 0;
let youDiedTimer = 0;
let deathFocus = { x: 0, y: 0 };
let tipIndex = 0;
let currentTip = TIPS[0];
let lastTipIndex = -1;
let deathSplashTimer = 0;
let deathSplashDrops = [];
let floorStreak = 0;
let lastLandingPlatformId = null;
let platformIdCounter = 1;
let airStartX = 0;
let airMaxDistance = 0;
let airTime = 0;

let audioCtx = null;
let musicOn = false;

const musicButton = document.getElementById("music-toggle");
const musicAudio = document.getElementById("music-audio");
const scoreEntry = document.getElementById("score-entry");
const scoreValue = document.getElementById("score-value");
const levelValue = document.getElementById("level-value");
const scoreName = document.getElementById("score-name");
const scoreSave = document.getElementById("score-save");
const scoreList = document.getElementById("score-list");
const scoreStatus = document.getElementById("score-status");
const scorePrev = document.getElementById("score-prev");
const scoreNext = document.getElementById("score-next");
const scorePage = document.getElementById("score-page");
const scoreRestart = document.getElementById("score-restart");
const gameVersion = document.getElementById("game-version");
const touchLeft = document.getElementById("touch-left");
const touchRight = document.getElementById("touch-right");
const touchJump = document.getElementById("touch-jump");
let scoreSaved = false;
let lastName = localStorage.getItem(LAST_NAME_KEY) || "";
let leaderboardOffset = 0;
let leaderboardTotal = highScores.length;
let leaderboardLoading = false;
let leaderboardError = "";

if (gameVersion) {
  gameVersion.textContent = GAME_VERSION;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mod(value, size) {
  return ((value % size) + size) % size;
}

function normalizeName(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}

function sanitizeName(value) {
  const cleaned = normalizeName(value);
  if (cleaned.length === 3) return cleaned;
  return cleaned.padEnd(3, "A").slice(0, 3);
}

function loadHighScores() {
  let list = [];
  try {
    const raw = localStorage.getItem(SCORE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
  } catch {
    list = [];
  }
  const legacy = Number(localStorage.getItem("jumpnbean_highscore") || 0);
  if (legacy && !list.some((entry) => entry.score === legacy)) {
    list.push({ name: "BEA", score: legacy, levels: 1 });
  }
  return list
    .filter((entry) => entry && typeof entry.score === "number")
    .map((entry) => ({
      name: sanitizeName(entry.name),
      score: entry.score,
      levels: Number.isFinite(entry.levels) ? Math.max(1, Math.floor(entry.levels)) : 1,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, LEADERBOARD_LIMIT);
}

function saveHighScores() {
  highScores = highScores.slice(0, LEADERBOARD_LIMIT);
  leaderboardTotal = Math.max(leaderboardTotal, highScores.length);
  localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(highScores));
  highScore = highScores[0]?.score || 0;
  localStorage.setItem("jumpnbean_highscore", String(highScore));
  renderScoreList();
}

function updateLeaderboardControls() {
  if (!scorePrev || !scoreNext || !scorePage) return;
  const total = Math.max(leaderboardTotal, highScores.length);
  const totalPages = Math.max(1, Math.ceil(total / LEADERBOARD_LIMIT));
  const currentPage = Math.min(totalPages - 1, Math.floor(leaderboardOffset / LEADERBOARD_LIMIT));
  scorePrev.disabled = leaderboardLoading || currentPage <= 0;
  scoreNext.disabled = leaderboardLoading || currentPage >= totalPages - 1;
  scorePage.textContent = `${currentPage + 1}/${totalPages}`;
}

function renderScoreList() {
  if (!scoreList) return;
  scoreList.innerHTML = "";
  scoreList.classList.remove("empty");
  const list = highScores.length ? highScores : [];
  if (!list.length) {
    const li = document.createElement("li");
    li.textContent = leaderboardLoading ? "Loading..." : "No scores yet";
    scoreList.classList.add("empty");
    scoreList.removeAttribute("start");
    scoreList.appendChild(li);
  } else {
    scoreList.start = leaderboardOffset + 1;
    list.forEach((entry, index) => {
      const li = document.createElement("li");
      const entryLevels = Number.isFinite(entry.levels) ? entry.levels : 1;
      li.textContent = `${entry.name} — ${entry.score} · Lv ${entryLevels}`;
      if (entry.is_latest) li.classList.add("latest");
      scoreList.appendChild(li);
    });
  }
  if (scoreStatus) {
    if (leaderboardLoading) {
      scoreStatus.textContent = "Loading leaderboard...";
    } else if (leaderboardError) {
      scoreStatus.textContent = leaderboardError;
    } else {
      scoreStatus.textContent = "";
    }
  }
  updateLeaderboardControls();
}

async function fetchLeaderboard(offset = leaderboardOffset) {
  const previousOffset = leaderboardOffset;
  try {
    leaderboardLoading = true;
    leaderboardError = "";
    leaderboardOffset = Math.max(0, offset);
    renderScoreList();
    const res = await fetch(
      `/api/scores?limit=${LEADERBOARD_LIMIT}&offset=${leaderboardOffset}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("leaderboard_fetch_failed");
    const data = await res.json();
    if (!Array.isArray(data.scores)) throw new Error("leaderboard_invalid");
    highScores = data.scores
      .filter((entry) => entry && typeof entry.score === "number")
      .map((entry) => ({
        name: sanitizeName(entry.name),
        score: entry.score,
        levels: Number.isFinite(entry.levels) ? Math.max(1, Math.floor(entry.levels)) : 1,
        is_latest: Boolean(entry.is_latest),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, LEADERBOARD_LIMIT);
    if (Number.isFinite(data.total)) {
      leaderboardTotal = Math.max(0, Number(data.total));
    } else {
      leaderboardTotal = Math.max(leaderboardTotal, highScores.length);
    }
    saveHighScores();
  } catch {
    leaderboardOffset = previousOffset;
    leaderboardError = "Leaderboard offline — local scores shown";
  } finally {
    leaderboardLoading = false;
    renderScoreList();
  }
}

async function submitScore(name, scoreValue) {
  try {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score: Math.floor(scoreValue), levels: levelsEarned }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function openScoreEntry() {
  if (!scoreEntry) return;
  if (scoreValue) scoreValue.textContent = String(score);
  if (levelValue) levelValue.textContent = String(levelsEarned);
  renderScoreList();
  leaderboardOffset = 0;
  fetchLeaderboard(0);
  scoreSaved = false;
  scoreEntry.classList.remove("hidden");
  if (scoreName) {
    scoreName.value = normalizeName(lastName);
    scoreName.disabled = false;
    scoreName.focus();
  }
  if (scoreSave) {
    scoreSave.disabled = true;
    scoreSave.textContent = "Save";
  }
  if (scoreRestart) {
    scoreRestart.style.display = "";
  }
  updateScoreInput();
}

function closeScoreEntry() {
  if (!scoreEntry) return;
  scoreEntry.classList.add("hidden");
}

function ensureAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playTone(freq, duration, type = "square", gain = 0.06) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  amp.gain.exponentialRampToValueAtTime(gain, audioCtx.currentTime + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(amp).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration + 0.02);
}

function playJumpSound() {
  playTone(520, 0.12, "square", 0.08);
}

function playWallSound() {
  playTone(680, 0.14, "triangle", 0.08);
}

function playCoinSound() {
  playTone(880, 0.08, "square", 0.06);
}

function playStompSound() {
  playTone(220, 0.12, "sawtooth", 0.07);
}

function playPowerSound() {
  playTone(980, 0.16, "triangle", 0.09);
  playTone(520, 0.2, "square", 0.04);
}

function playLoseSound() {
  playTone(180, 0.2, "sawtooth", 0.06);
}

function triggerDeath() {
  if (state === "lose" || state === "dying") return;
  state = "dying";
  deathSlowTimer = DEATH_SLOW_DURATION;
  deathFocus = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
  currentTip = pickRandomTip();
  tipIndex += 1;
  spawnDeathSplash();
  playLoseSound();
}

function setMusic(on) {
  musicOn = on;
  if (musicButton) {
    musicButton.textContent = musicOn ? "Music: On" : "Music: Off";
  }
  if (!musicAudio) return;
  musicAudio.src = encodeURI(MUSIC_SRC);
  musicAudio.loop = true;
  musicAudio.volume = 0.6;
  if (musicOn) {
    const playPromise = musicAudio.play();
    if (playPromise?.catch) playPromise.catch(() => {});
  } else {
    musicAudio.pause();
  }
}

function currentBiome() {
  const index = Math.floor(maxHeight / BIOME_STEP) % BIOMES.length;
  return BIOMES[index];
}

function addPlatform(x, y, w) {
  platforms.push({ id: platformIdCounter++, x, y, w, h: PLATFORM_HEIGHT });
}

function addCoin(x, y) {
  coins.push({ x, y, w: 8, h: 8, collected: false });
}

function addEnemy(x, y) {
  enemies.push({ x, y, w: 12, h: 12 });
}

function addPowerup(x, y) {
  powerups.push({ x, y, w: 10, h: 12, collected: false });
}

function spawnSparkles(x, y) {
  for (let i = 0; i < 8; i += 1) {
    sparkles.push({
      x,
      y,
      vx: rand(-60, 60),
      vy: rand(-120, -40),
      life: 0.45 + Math.random() * 0.2,
    });
  }
}

function spawnBlood(x, y) {
  for (let i = 0; i < 10; i += 1) {
    bloodParticles.push({
      x,
      y,
      vx: rand(-90, 90),
      vy: rand(-180, -40),
      life: 0.55 + Math.random() * 0.3,
    });
  }
  const stainCount = rand(2, 4);
  for (let i = 0; i < stainCount; i += 1) {
    bloodStains.push({
      x: x + rand(-6, 6),
      y: y + rand(0, 3),
      r: rand(3, 6),
      alpha: 0.35 + Math.random() * 0.25,
    });
  }
  if (bloodStains.length > BLOOD_STAIN_LIMIT) {
    bloodStains.splice(0, bloodStains.length - BLOOD_STAIN_LIMIT);
  }
}

function spawnComboPopup(text, x, y, color = "#ffe285") {
  comboPopups.push({
    text,
    x,
    y,
    vy: -40,
    life: 0.65,
    color,
  });
}

function pickRandomTip() {
  if (!TIPS.length) return "";
  let index = Math.floor(Math.random() * TIPS.length);
  if (TIPS.length > 1 && index === lastTipIndex) {
    index = (index + 1) % TIPS.length;
  }
  lastTipIndex = index;
  return TIPS[index];
}

function spawnDeathSplash() {
  deathSplashTimer = DEATH_SPLASH_DURATION;
  deathSplashDrops = [];
  for (let i = 0; i < DEATH_SPLASH_COUNT; i += 1) {
    deathSplashDrops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: rand(10, 26),
      alpha: 0.25 + Math.random() * 0.35,
    });
  }
}

function spawnPlatformAbove() {
  const gap = rand(22, 36);
  nextPlatformY -= gap;
  const width = rand(50, 110);
  const x = rand(0, canvas.width - width);
  addPlatform(x, nextPlatformY, width);

  if (Math.random() < 0.65) {
    addCoin(x + width / 2 - 4, nextPlatformY - 14);
  }

  const roll = Math.random();
  if (roll < 0.01) {
    const itemX = clamp(x + rand(6, Math.max(6, width - 18)), 4, canvas.width - 16);
    addPowerup(itemX, nextPlatformY - 14);
  } else if (roll < 0.24) {
    const enemyX = clamp(x + rand(6, Math.max(6, width - 18)), 4, canvas.width - 16);
    addEnemy(enemyX, nextPlatformY - 12);
  }
}

function ensurePlatforms() {
  const topLimit = cameraY - 140;
  while (nextPlatformY > topLimit) {
    spawnPlatformAbove();
  }

  const bottomLimit = cameraY + canvas.height + 80;
  platforms = platforms.filter((platform) => platform.y < bottomLimit);
  coins = coins.filter((coin) => !coin.collected && coin.y < bottomLimit);
  enemies = enemies.filter((enemy) => enemy.y < bottomLimit);
  powerups = powerups.filter((powerup) => !powerup.collected && powerup.y < bottomLimit);
}

function resetGame() {
  platforms = [];
  coins = [];
  enemies = [];
  powerups = [];
  state = "play";
  maxHeight = 0;
  score = 0;
  coinsCollected = 0;
  coinScore = 0;
  enemyScore = 0;
  powerScore = 0;
  styleScore = 0;
  streakScore = 0;
  elapsedTime = 0;
  scrollSpeed = 0;
  animTime = 0;
  landSquash = 0;
  wallCombo = 0;
  lastWallJumpTime = -999;
  comboTimer = 0;
  comboScore = 0;
  slideWindow = 0;
  sparkles = [];
  bloodParticles = [];
  bloodStains = [];
  comboPopups = [];
  paceLevel = 0;
  lastPlateauHeight = 0;
  spinTime = 0;
  spinDir = 1;
  wallJumpLockSide = 0;
  invincibleTimer = 0;
  bannerTimer = 0;
  bannerBiomeIndex = 0;
  doubleJumpAvailable = false;
  safeBarTimer = 0;
  levelsEarned = 1;
  deathSlowTimer = 0;
  youDiedTimer = 0;
  tipIndex = 0;
  currentTip = TIPS[0];
  lastTipIndex = -1;
  deathSplashTimer = 0;
  deathSplashDrops = [];
  floorStreak = 0;
  lastLandingPlatformId = null;
  platformIdCounter = 1;
  airStartX = 0;
  airMaxDistance = 0;
  airTime = 0;
  closeScoreEntry();

  const baseY = canvas.height - 20;
  addPlatform(20, baseY, 140);
  startY = baseY - 14;

  player = {
    x: 40,
    y: startY,
    w: 12,
    h: 14,
    vx: 0,
    vy: 0,
    onGround: true,
    facing: 1,
  };

  cameraY = 0;
  nextPlatformY = baseY - 30;
  for (let i = 0; i < 12; i += 1) {
    spawnPlatformAbove();
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function update(dt) {
  const realDt = dt;
  if (deathSplashTimer > 0) {
    deathSplashTimer = Math.max(0, deathSplashTimer - realDt);
  }
  if (state === "dead") {
    youDiedTimer -= realDt;
    if (youDiedTimer <= 0) {
      state = "lose";
      openScoreEntry();
    }
    return;
  }
  if (state !== "play" && state !== "dying") return;
  if (state === "dying") {
    dt *= DEATH_SLOW_FACTOR;
  }
  const controlsEnabled = state === "play";

  const ACCEL = 900;
  const FRICTION = 1100;
  const JUMP = 360;
  const GRAVITY = 980;
  const MAX_FALL = 700;
  const WALL_PUSH = 170;
  const WALL_COMBO_WINDOW = 2.0;
  const SPIN_DURATION = 0.35;
  const BOUNCE_BOOST = 1.12;

  invincibleTimer = Math.max(0, invincibleTimer - dt);
  if (invincibleTimer > 0) {
    powerScore += POWER_BONUS_RATE * dt;
  }
  const powerMultiplier = invincibleTimer > 0 ? 1.3 : 1;

  const input = controlsEnabled ? (keys.right ? 1 : 0) - (keys.left ? 1 : 0) : 0;
  if (input !== 0) {
    player.vx += input * ACCEL * dt;
    player.facing = input;
  } else if (player.vx !== 0) {
    if (player.vx > 0) player.vx = Math.max(0, player.vx - FRICTION * dt);
    if (player.vx < 0) player.vx = Math.min(0, player.vx + FRICTION * dt);
  }
  player.vx = clamp(player.vx, -MAX_SPEED, MAX_SPEED);
  const speedRatio = Math.abs(player.vx) / MAX_SPEED;
  const superReady = speedRatio >= SUPER_JUMP_THRESHOLD;

  const wasOnGround = player.onGround;
  const nextX = player.x + player.vx * dt;
  const touchingLeft = nextX <= 1;
  const touchingRight = nextX + player.w >= canvas.width - 1;
  const wallSide = touchingLeft ? -1 : touchingRight ? 1 : 0;
  if (wallJumpLockSide !== 0) {
    const oppositeTouch = (wallJumpLockSide === -1 && touchingRight) || (wallJumpLockSide === 1 && touchingLeft);
    if (oppositeTouch || player.onGround) wallJumpLockSide = 0;
  }
  const canWallJump = !player.onGround && wallSide !== 0 && wallJumpLockSide === 0;

  if (jumpQueued && controlsEnabled) {
    if (player.onGround) {
      const speedBoost = Math.min(Math.abs(player.vx) * 0.45, 90);
      const comboHop = comboTimer > 0 && slideWindow > 0;
      const superMultiplier = superReady ? SUPER_JUMP_MULT : 1;
      if (comboHop) {
        wallCombo += 1;
        comboTimer = WALL_COMBO_WINDOW;
        const hopMultiplier = 1 + wallCombo * 0.25;
        const hopGain = Math.round(COMBO_HOP_POINTS * hopMultiplier);
        comboScore += hopGain;
        spawnSparkles(player.x + player.w / 2, player.y + player.h / 2);
        spawnComboPopup(`+${hopGain}`, player.x + player.w / 2, player.y - 6);
      }
      const hopBoost = comboHop ? 1 + Math.min(wallCombo * 0.05, 0.3) : 1;
      player.vy = -(JUMP * hopBoost * powerMultiplier * superMultiplier + speedBoost);
      if (superReady) {
        styleScore += STYLE_SUPER_JUMP;
        spawnComboPopup(`SUPER +${STYLE_SUPER_JUMP}`, player.x + player.w / 2, player.y - 16, "#7fffd2");
      }
      player.onGround = false;
      doubleJumpAvailable = false;
      slideWindow = 0;
      playJumpSound();
    } else if (canWallJump) {
      wallCombo = elapsedTime - lastWallJumpTime <= WALL_COMBO_WINDOW ? wallCombo + 1 : 1;
      lastWallJumpTime = elapsedTime;
      comboTimer = WALL_COMBO_WINDOW;
      const comboMultiplier = 1 + wallCombo * 0.25;
      const comboGain = Math.round(80 * wallCombo * comboMultiplier);
      comboScore += comboGain;
      const wallStyle = STYLE_WALL_JUMP + Math.round(speedRatio * 40);
      styleScore += wallStyle;

      const comboBoost = 1 + Math.min(wallCombo * 0.08, 0.4);
      player.vy = -(JUMP * 0.95 * comboBoost * powerMultiplier);
      player.vx = wallSide === -1 ? WALL_PUSH : -WALL_PUSH;
      player.facing = wallSide === -1 ? 1 : -1;
      spinTime = SPIN_DURATION;
      spinDir = wallSide === -1 ? 1 : -1;
      wallJumpLockSide = wallSide;
      doubleJumpAvailable = true;
      spawnComboPopup(`+${comboGain}`, player.x + player.w / 2, player.y - 8);
      spawnComboPopup(`STYLE +${wallStyle}`, player.x + player.w / 2, player.y - 20, "#7fffd2");
      playWallSound();
    } else if (doubleJumpAvailable) {
      player.vy = -(JUMP * 0.9 * powerMultiplier);
      doubleJumpAvailable = false;
      playJumpSound();
    }
  }
  jumpQueued = false;
  if (!controlsEnabled) {
    jumpHeld = false;
  }

  const gravityScale = jumpHeld && controlsEnabled && player.vy < 0 ? 0.65 : 1;
  player.vy = Math.min(player.vy + GRAVITY * gravityScale * dt, MAX_FALL);

  const prevY = player.y;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.x = clamp(player.x, 0, canvas.width - player.w);

  player.onGround = false;
  let landedPlatform = null;
  if (player.vy >= 0) {
    for (const platform of platforms) {
      const platformTop = platform.y;
      const intersects =
        player.x + player.w > platform.x &&
        player.x < platform.x + platform.w;
      if (intersects && prevY + player.h <= platformTop && player.y + player.h >= platformTop) {
        player.y = platformTop - player.h;
        player.vy = 0;
        player.onGround = true;
        landedPlatform = platform;
        break;
      }
    }
  }

  if (!player.onGround && wasOnGround) {
    airStartX = player.x;
    airMaxDistance = 0;
    airTime = 0;
  }
  if (!player.onGround) {
    airTime += dt;
    airMaxDistance = Math.max(airMaxDistance, Math.abs(player.x - airStartX));
  }

  if (player.onGround && !wasOnGround) {
    landSquash = 1;
    doubleJumpAvailable = false;
    if (landedPlatform) {
      if (landedPlatform.id === lastLandingPlatformId) {
        floorStreak = 1;
      } else {
        floorStreak = Math.max(1, floorStreak + 1);
        if (floorStreak > 1) {
          const streakGain = STREAK_BASE_POINTS * floorStreak;
          streakScore += streakGain;
          spawnComboPopup(`STREAK x${floorStreak} +${streakGain}`, player.x + player.w / 2, player.y - 18, "#b7f5ff");
        }
      }
      lastLandingPlatformId = landedPlatform.id;
    } else {
      floorStreak = 0;
      lastLandingPlatformId = null;
    }
    if (airMaxDistance >= LONG_JUMP_DISTANCE) {
      styleScore += STYLE_LONG_JUMP;
      spawnComboPopup(`LONG +${STYLE_LONG_JUMP}`, player.x + player.w / 2, player.y - 30, "#7fffd2");
    }
    if (Math.abs(player.vx) >= SPEED_STYLE_THRESHOLD) {
      styleScore += STYLE_SPEED;
      spawnComboPopup(`SPEED +${STYLE_SPEED}`, player.x + player.w / 2, player.y - 42, "#7fffd2");
    }
    if (comboTimer > 0) {
      slideWindow = SLIDE_WINDOW;
    }
    if (maxHeight > lastPlateauHeight + 80) {
      paceLevel += 1;
      lastPlateauHeight = maxHeight;
    }
  }
  landSquash = Math.max(0, landSquash - dt * 3);
  spinTime = Math.max(0, spinTime - dt);
  bannerTimer = Math.max(0, bannerTimer - dt);
  safeBarTimer = Math.max(0, safeBarTimer - dt);
  if (slideWindow > 0) {
    slideWindow = Math.max(0, slideWindow - dt);
    if (slideWindow === 0 && player.onGround && comboTimer > 0) {
      comboTimer = 0;
      wallCombo = 0;
    }
  }
  if (comboTimer > 0) {
    comboTimer = Math.max(0, comboTimer - dt);
    if (comboTimer === 0) wallCombo = 0;
  }

  for (const coin of coins) {
    if (!coin.collected && overlaps(player, coin)) {
      coin.collected = true;
      coinsCollected += 1;
      const coinMultiplier = comboTimer > 0 ? 1 + wallCombo * 0.2 : 1;
      coinScore += Math.round(TOKEN_POINTS * coinMultiplier);
      playCoinSound();
    }
  }

  for (const powerup of powerups) {
    if (!powerup.collected && overlaps(player, powerup)) {
      powerup.collected = true;
      invincibleTimer = POWERUP_DURATION;
      playPowerSound();
    }
  }

  for (const enemy of enemies) {
    enemy.dead = false;
  }

  for (const enemy of enemies) {
    if (enemy.dead) continue;
    if (!overlaps(player, enemy)) continue;
    const stomp = player.vy > 0 && prevY + player.h <= enemy.y + 6;
    if (stomp) {
      enemy.dead = true;
      enemyScore += ENEMY_POINTS + STOMP_BONUS;
      player.vy = -(JUMP * 0.95 * BOUNCE_BOOST * powerMultiplier);
      doubleJumpAvailable = true;
      spawnBlood(enemy.x + enemy.w / 2, enemy.y + enemy.h - 2);
      playStompSound();
    } else if (invincibleTimer > 0 || safeBarTimer > 0) {
      enemy.dead = true;
      enemyScore += ENEMY_POINTS;
      playStompSound();
    } else {
      triggerDeath();
    }
  }

  enemies = enemies.filter((enemy) => !enemy.dead);

  const height = Math.max(0, startY - player.y);
  if (height > maxHeight) {
    maxHeight = height;
    const levelNow = Math.floor(maxHeight / BIOME_STEP) + 1;
    if (levelNow > levelsEarned) levelsEarned = levelNow;
    const biomeIndex = Math.floor(maxHeight / BIOME_STEP) % BIOMES.length;
    if (biomeIndex !== bannerBiomeIndex) {
      bannerBiomeIndex = biomeIndex;
      bannerTimer = 2.2;
      safeBarTimer = 2.2;
    }
  }

  elapsedTime += dt;
  animTime += dt;
  scrollSpeed = 8 + paceLevel * 3 + Math.min(maxHeight * 0.003, 6);

  cameraY -= scrollSpeed * dt;
  const targetCamera = player.y - canvas.height * 0.45;
  if (targetCamera < cameraY) cameraY = targetCamera;

  score =
    Math.floor(maxHeight) +
    coinScore +
    comboScore +
    enemyScore +
    Math.round(powerScore) +
    styleScore +
    streakScore;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("jumpnbean_highscore", String(highScore));
  }

  if (state === "play" && player.y > cameraY + canvas.height + 50 && safeBarTimer <= 0) {
    triggerDeath();
  }

  if (sparkles.length) {
    sparkles.forEach((sparkle) => {
      sparkle.x += sparkle.vx * dt;
      sparkle.y += sparkle.vy * dt;
      sparkle.vy += 180 * dt;
      sparkle.life -= dt;
    });
    sparkles = sparkles.filter((sparkle) => sparkle.life > 0);
  }

  if (bloodParticles.length) {
    bloodParticles.forEach((drop) => {
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.vy += 320 * dt;
      drop.life -= dt;
    });
    bloodParticles = bloodParticles.filter((drop) => drop.life > 0);
  }

  if (comboPopups.length) {
    comboPopups.forEach((popup) => {
      popup.y += popup.vy * dt;
      popup.life -= dt;
    });
    comboPopups = comboPopups.filter((popup) => popup.life > 0);
  }

  ensurePlatforms();

  if (state === "dying") {
    deathSlowTimer -= realDt;
    if (deathSlowTimer <= 0) {
      state = "dead";
      youDiedTimer = YOU_DIED_DURATION;
    }
  }
}

function drawBackground() {
  const biome = currentBiome();
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, biome.bgTop);
  gradient.addColorStop(1, biome.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawBiomeBackdrop(biome);
}

function drawBiomeBackdrop(biome) {
  const offsetSlow = mod(cameraY * 0.08, canvas.height + 120);
  const offsetFast = mod(cameraY * 0.2, canvas.height + 120);

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = biome.haze;
  for (let i = 0; i < 4; i += 1) {
    const y = offsetSlow + i * 70 - 120;
    ctx.fillRect(0, y, canvas.width, 24);
  }
  ctx.restore();

  if (biome.name === "Paper Plains") {
    ctx.save();
    ctx.strokeStyle = "rgba(120, 110, 90, 0.25)";
    ctx.lineWidth = 1;
    const lineOffset = mod(cameraY * 0.15, 18);
    for (let y = -20; y < canvas.height + 20; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y + lineOffset);
      ctx.lineTo(canvas.width, y + lineOffset);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    for (let i = 0; i < 6; i += 1) {
      const x = (i * 60 + Math.sin(animTime * 0.4 + i) * 12) % canvas.width;
      const y = (i * 80 + offsetFast) % (canvas.height + 80) - 40;
      ctx.fillRect(x, y, 26, 16);
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(x + 2, y + 2, 22, 3);
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    }
    ctx.restore();
  } else if (biome.name === "Ink Archives") {
    ctx.save();
    ctx.fillStyle = "rgba(20, 24, 30, 0.45)";
    const shelfOffset = mod(cameraY * 0.12, 90);
    for (let x = 0; x < canvas.width + 40; x += 70) {
      const y = shelfOffset - 90;
      ctx.fillRect(x, y, 40, canvas.height + 120);
      ctx.fillStyle = "rgba(60, 70, 80, 0.4)";
      for (let k = 0; k < 6; k += 1) {
        ctx.fillRect(x + 6, y + 16 + k * 26, 26, 10);
      }
      ctx.fillStyle = "rgba(20, 24, 30, 0.45)";
    }
    ctx.restore();
  } else if (biome.name === "Stamp City") {
    ctx.save();
    ctx.fillStyle = "rgba(45, 20, 16, 0.4)";
    const gearOffset = mod(cameraY * 0.18, 140);
    for (let i = 0; i < 4; i += 1) {
      const x = 40 + i * 70;
      const y = gearOffset + i * 50 - 120;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 4, y - 24, 8, 12);
      ctx.fillRect(x - 4, y + 12, 8, 12);
    }
    ctx.restore();
  } else if (biome.name === "Red Tape Ridge") {
    ctx.save();
    ctx.strokeStyle = "rgba(120, 70, 30, 0.35)";
    ctx.lineWidth = 6;
    const stripeOffset = mod(cameraY * 0.2, 40);
    for (let i = -4; i < 12; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-40, i * 28 + stripeOffset);
      ctx.lineTo(canvas.width + 40, i * 28 + stripeOffset + 30);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (bannerTimer > 0) {
    const strength = Math.min(1, bannerTimer / 0.6);
    ctx.save();
    ctx.globalAlpha = 0.55 * strength;
    ctx.fillStyle = biome.decor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.25 * strength;
    ctx.fillStyle = biome.haze;
    for (let y = 0; y < canvas.height; y += 22) {
      ctx.fillRect(0, y, canvas.width, 6);
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillText(`SAFE ${biome.name.toUpperCase()}`, 12, 24);
    ctx.restore();
  }
}

function drawSpeedLines() {
  const speedFactor = clamp((scrollSpeed - 30) / 140, 0, 1);
  if (speedFactor <= 0) return;
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 * speedFactor})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i += 1) {
    const y = ((animTime * 90 * speedFactor + i * 22) % (canvas.height + 40)) - 20;
    const x = (i * 37 + animTime * 28) % canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12, y + 6);
    ctx.stroke();
  }
}

function drawPowerFlash() {
  if (invincibleTimer <= 0) return;
  const phase = Math.floor(elapsedTime * 12) % 2;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = phase ? "#2cff7a" : "#ff4d6d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 12; i += 1) {
    const x = (i * 37 + animTime * 80) % canvas.width;
    const y = (i * 29 + animTime * 90) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

function drawPlatforms(biome) {
  const depth = 4;
  for (const platform of platforms) {
    if (platform.y > cameraY + canvas.height + 20 || platform.y + platform.h < cameraY - 20) {
      continue;
    }
    ctx.fillStyle = biome.platformTop;
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = biome.platformFace;
    ctx.fillRect(platform.x, platform.y + platform.h, platform.w, depth);
    ctx.fillStyle = biome.platformSide;
    ctx.fillRect(platform.x + platform.w - 2, platform.y + 1, 2, platform.h + depth - 1);
    ctx.fillStyle = biome.trim;
    ctx.fillRect(platform.x, platform.y, platform.w, 2);
  }
}

function drawCoins(biome) {
  for (const coin of coins) {
    if (coin.collected) continue;
    if (coin.y > cameraY + canvas.height + 20 || coin.y + coin.h < cameraY - 20) {
      continue;
    }
    ctx.fillStyle = biome.coinDark;
    ctx.fillRect(coin.x, coin.y, coin.w, coin.h);
    ctx.fillStyle = biome.coinMid;
    ctx.fillRect(coin.x + 1, coin.y + 1, coin.w - 2, coin.h - 2);
    ctx.fillStyle = biome.coinLight;
    ctx.fillRect(coin.x + 2, coin.y + 2, 3, 3);
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (enemy.y > cameraY + canvas.height + 20 || enemy.y + enemy.h < cameraY - 20) {
      continue;
    }
    ctx.fillStyle = "#55363f";
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    ctx.fillStyle = "#7a4a55";
    ctx.fillRect(enemy.x + 1, enemy.y + 1, enemy.w - 2, 4);
    ctx.fillStyle = "#f5e7c8";
    ctx.fillRect(enemy.x + 3, enemy.y + 5, 2, 2);
    ctx.fillRect(enemy.x + 7, enemy.y + 5, 2, 2);
    ctx.fillStyle = "#b54b4b";
    ctx.fillRect(enemy.x + 3, enemy.y + 9, 6, 2);
  }
}

function drawPowerups() {
  for (const powerup of powerups) {
    if (powerup.collected) continue;
    if (powerup.y > cameraY + canvas.height + 20 || powerup.y + powerup.h < cameraY - 20) {
      continue;
    }
    ctx.fillStyle = "#c9c1b1";
    ctx.fillRect(powerup.x, powerup.y, powerup.w, powerup.h);
    ctx.fillStyle = "#8c7a5e";
    ctx.fillRect(powerup.x + 1, powerup.y + 1, powerup.w - 2, 3);
    ctx.fillStyle = "#f5e7c8";
    ctx.fillRect(powerup.x + 2, powerup.y + 5, powerup.w - 4, 6);
    ctx.fillStyle = "#5a3b2a";
    ctx.fillRect(powerup.x + 3, powerup.y + 2, powerup.w - 6, 2);
  }
}

function drawSparkles() {
  if (!sparkles.length) return;
  ctx.fillStyle = "#fff6d2";
  sparkles.forEach((sparkle) => {
    if (sparkle.y > cameraY + canvas.height + 20 || sparkle.y + 2 < cameraY - 20) return;
    ctx.fillRect(sparkle.x, sparkle.y, 2, 2);
  });
}

function drawBloodStains() {
  if (!bloodStains.length) return;
  ctx.save();
  ctx.fillStyle = "rgba(120, 12, 18, 0.6)";
  bloodStains.forEach((stain) => {
    if (stain.y > cameraY + canvas.height + 30 || stain.y + stain.r < cameraY - 30) return;
    ctx.globalAlpha = stain.alpha;
    ctx.beginPath();
    ctx.arc(stain.x, stain.y, stain.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawBloodParticles() {
  if (!bloodParticles.length) return;
  ctx.save();
  ctx.fillStyle = "#a3161f";
  bloodParticles.forEach((drop) => {
    if (drop.y > cameraY + canvas.height + 30 || drop.y + 2 < cameraY - 30) return;
    const size = 2;
    ctx.fillRect(drop.x - 1, drop.y - 1, size, size);
  });
  ctx.restore();
}

function drawComboPopups() {
  if (!comboPopups.length) return;
  ctx.save();
  comboPopups.forEach((popup) => {
    if (popup.y > cameraY + canvas.height + 20 || popup.y < cameraY - 40) return;
    const alpha = Math.max(0, Math.min(1, popup.life / 0.65));
    const scale = 1 + (1 - alpha) * 0.2;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = popup.color;
    ctx.font = `${Math.round(14 * scale)}px 'Courier New', monospace`;
    ctx.textAlign = "center";
    ctx.fillText(popup.text, popup.x, popup.y);
  });
  ctx.textAlign = "left";
  ctx.restore();
}

function drawDeathSplash() {
  if (deathSplashTimer <= 0) return;
  const t = deathSplashTimer / DEATH_SPLASH_DURATION;
  const alpha = Math.min(1, t * 1.1);
  ctx.save();
  ctx.globalAlpha = 0.6 * alpha;
  ctx.fillStyle = "#5d0b12";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.85 * alpha;
  ctx.fillStyle = "#a3161f";
  deathSplashDrops.forEach((drop) => {
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawPlayer() {
  const moving = Math.abs(player.vx) > 5;
  const inAir = !player.onGround;
  const frame = moving ? Math.floor(animTime * 10) % 2 : 0;
  const stretch = inAir ? (player.vy < 0 ? 1.08 : 0.92) : 1 - landSquash * 0.18;
  const bodyH = Math.max(8, Math.round(player.h * stretch));
  const yOffset = player.h - bodyH;
  const spinProgress = spinTime > 0 ? 1 - spinTime / 0.35 : 0;
  const rotation = spinTime > 0 ? spinDir * spinProgress * Math.PI * 2 : 0;

  if (player.onGround) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#1d0f09";
    ctx.beginPath();
    ctx.ellipse(player.x + player.w / 2, player.y + player.h + 2, player.w * 0.7, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  const centerX = player.x + player.w / 2;
  const centerY = player.y + yOffset + bodyH / 2;
  ctx.translate(centerX, centerY);
  if (rotation !== 0) ctx.rotate(rotation);
  ctx.translate(-player.w / 2, -bodyH / 2);
  if (invincibleTimer > 0) {
    const glowPhase = Math.floor(elapsedTime * 12) % 2;
    ctx.shadowColor = glowPhase ? "#2cff7a" : "#ff4d6d";
    ctx.shadowBlur = 8;
  }
  ctx.fillStyle = "#2c150b";
  ctx.fillRect(-1, -1, player.w + 2, bodyH + 2);
  ctx.fillStyle = "#7b4a2a";
  ctx.fillRect(0, 0, player.w, bodyH);
  ctx.fillStyle = "#a96b3f";
  ctx.fillRect(4, 2, 3, Math.max(4, bodyH - 4));
  ctx.fillStyle = "#b77a4e";
  ctx.fillRect(1, 1, player.w - 2, 2);
  ctx.fillStyle = "#f5e7c8";
  const eyeX = player.facing > 0 ? 8 : 3;
  ctx.fillRect(eyeX, 4, 2, 2);
  if (player.onGround) {
    ctx.fillStyle = "#5a341e";
    if (frame === 0) {
      ctx.fillRect(2, bodyH - 2, 3, 2);
      ctx.fillRect(7, bodyH - 2, 3, 2);
    } else {
      ctx.fillRect(3, bodyH - 2, 3, 2);
      ctx.fillRect(6, bodyH - 2, 3, 2);
    }
  }
  ctx.restore();
}

function drawUI() {
  const biome = currentBiome();
  const compactHud = window.innerWidth < 520 || window.innerHeight < 420;
  const speedRatio = Math.min(1, Math.abs(player.vx) / MAX_SPEED);
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 4;
  if (compactHud) {
    let y = 16;
    ctx.fillStyle = "#ffe285";
    ctx.font = "8px 'Courier New', monospace";
    ctx.fillText(`Score ${score}`, 10, y);
    y += 12;
    ctx.fillStyle = "#b7f5ff";
    ctx.fillText(`Lv ${levelsEarned}`, 10, y);
    y += 10;
    ctx.fillStyle = "#f3ead7";
    ctx.font = "7px 'Courier New', monospace";
    ctx.fillText(`High ${highScore}`, 10, y);
    y += 10;
    if (invincibleTimer > 0) {
      ctx.fillStyle = "#7fffd2";
      ctx.fillText(`Power ${invincibleTimer.toFixed(1)}s`, 10, y);
      y += 10;
    }
    const meterWidth = 54;
    const meterHeight = 3;
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(10, y, meterWidth, meterHeight);
    ctx.fillStyle = speedRatio >= SUPER_JUMP_THRESHOLD ? "#7fffd2" : "#ffe285";
    ctx.fillRect(10, y, meterWidth * speedRatio, meterHeight);
  } else {
    let y = 20;
    ctx.fillStyle = "#ffe285";
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillText(`Score ${score}`, 12, y);
    y += 14;
    ctx.fillStyle = "#b7f5ff";
    ctx.fillText(`Levels ${levelsEarned}`, 12, y);
    y += 14;
    ctx.fillStyle = "#f3ead7";
    ctx.font = "8px 'Courier New', monospace";
    ctx.fillText(`High ${highScore}`, 12, y);
    y += 10;
    ctx.fillText(`${biome.name}`, 12, y);
    y += 10;
    if (comboTimer > 0 && wallCombo > 0) {
      ctx.fillStyle = "#ffe285";
      ctx.fillText(`Wall Combo x${wallCombo}`, 12, y);
      y += 10;
    }
    if (invincibleTimer > 0) {
      ctx.fillStyle = "#7fffd2";
      ctx.fillText(`Power ${invincibleTimer.toFixed(1)}s`, 12, y);
      y += 10;
    }
    const meterWidth = 80;
    const meterHeight = 4;
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(12, y + 2, meterWidth, meterHeight);
    ctx.fillStyle = speedRatio >= SUPER_JUMP_THRESHOLD ? "#7fffd2" : "#ffe285";
    ctx.fillRect(12, y + 2, meterWidth * speedRatio, meterHeight);
  }
  ctx.restore();

  if (state === "dead") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#b80f1a";
    ctx.font = "24px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("YOU DIED", canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = "#ffe285";
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillText(`💡 ${currentTip}`, canvas.width / 2, canvas.height / 2 + 18);
    ctx.textAlign = "left";
  }
}

function render() {
  drawBackground();
  drawSpeedLines();

  const biome = currentBiome();

  ctx.save();
  const zooming = state === "dying" || state === "dead";
  let zoom = 1;
  if (zooming) {
    const progress = 1 - Math.max(0, deathSlowTimer) / DEATH_SLOW_DURATION;
    zoom = 1 + Math.min(0.12, progress * 0.12);
  }
  const focusX = deathFocus.x;
  const focusY = deathFocus.y - cameraY;
  if (zooming && zoom !== 1) {
    ctx.translate(focusX, focusY);
    ctx.scale(zoom, zoom);
    ctx.translate(-focusX, -focusY);
  }
  ctx.translate(0, -cameraY);
  drawPlatforms(biome);
  drawBloodStains();
  drawCoins(biome);
  drawPowerups();
  drawEnemies();
  drawBloodParticles();
  drawSparkles();
  drawComboPopups();
  drawPlayer();
  ctx.restore();

  drawPowerFlash();
  drawDeathSplash();
  drawUI();
}

let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = Math.min(0.05, (timestamp - lastTime) / 1000);
  lastTime = timestamp;
  accumulator += delta;
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }
  render();
  requestAnimationFrame(gameLoop);
}

function resizeDisplay() {
  const wrap = document.querySelector(".wrap");
  let extraHeight = 0;
  if (wrap) {
    for (const child of wrap.children) {
      if (child === canvas) continue;
      const style = window.getComputedStyle(child);
      extraHeight += child.getBoundingClientRect().height;
      extraHeight += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    }
  }
  const availableWidth = Math.max(200, window.innerWidth - 32);
  const availableHeight = Math.max(200, window.innerHeight - extraHeight - 32);
  const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
  const finalScale = scale < 1 ? scale : Math.max(1, Math.floor(scale));
  canvas.style.width = `${Math.floor(canvas.width * finalScale)}px`;
  canvas.style.height = `${Math.floor(canvas.height * finalScale)}px`;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

window.addEventListener("resize", resizeDisplay);
window.addEventListener("fullscreenchange", resizeDisplay);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && document.activeElement === musicButton) {
    event.preventDefault();
    musicButton.blur();
  }
  if (event.metaKey && event.code === "KeyD") {
    event.preventDefault();
    highScores = [];
    saveHighScores();
    return;
  }
  if (scoreEntry && !scoreEntry.classList.contains("hidden") && event.code === "Enter") {
    event.preventDefault();
    if (!scoreSaved) {
      if (scoreSave && !scoreSave.disabled) scoreSave.click();
    } else {
      resetGame();
    }
    return;
  }
  if (event.repeat) return;
  ensureAudio();
  if (event.code === "ArrowLeft" || event.code === "KeyA") keys.left = true;
  if (event.code === "ArrowRight" || event.code === "KeyD") keys.right = true;
  if (event.code === "Space") {
    if (!jumpHeld) jumpQueued = true;
    jumpHeld = true;
  }
  if (event.code === "ArrowUp" || event.code === "KeyW") {
    if (!jumpHeld) jumpQueued = true;
    jumpHeld = true;
  }
  if (event.code === "KeyF") toggleFullscreen();
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") keys.left = false;
  if (event.code === "ArrowRight" || event.code === "KeyD") keys.right = false;
  if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
    jumpHeld = false;
  }
});

window.addEventListener("pointerdown", ensureAudio, { once: true });

if (musicButton) {
  musicButton.addEventListener("click", () => {
    ensureAudio();
    setMusic(!musicOn);
    musicButton.blur();
  });
}

function bindHoldButton(button, onDown, onUp) {
  if (!button) return;
  button.addEventListener(
    "pointerdown",
    (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      onDown();
    },
    { passive: false }
  );
  const end = (event) => {
    event.preventDefault();
    button.releasePointerCapture?.(event.pointerId);
    onUp();
  };
  button.addEventListener("pointerup", end, { passive: false });
  button.addEventListener("pointercancel", end, { passive: false });
  button.addEventListener("pointerleave", end, { passive: false });
}

bindHoldButton(
  touchLeft,
  () => {
    ensureAudio();
    keys.left = true;
  },
  () => {
    keys.left = false;
  }
);

bindHoldButton(
  touchRight,
  () => {
    ensureAudio();
    keys.right = true;
  },
  () => {
    keys.right = false;
  }
);

bindHoldButton(
  touchJump,
  () => {
    ensureAudio();
    if (!jumpHeld) jumpQueued = true;
    jumpHeld = true;
  },
  () => {
    jumpHeld = false;
  }
);

if (scoreSave) {
  scoreSave.addEventListener("click", () => {
    if (!scoreName) return;
    if (scoreSaved) {
      resetGame();
      return;
    }
    const name = normalizeName(scoreName.value.trim());
    if (name.length !== 3) return;
    highScores = [
      ...highScores.map((entry) => ({ ...entry, is_latest: false })),
      { name, score, levels: levelsEarned, is_latest: true },
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, LEADERBOARD_LIMIT);
    saveHighScores();
    lastName = name;
    localStorage.setItem(LAST_NAME_KEY, lastName);
    submitScore(name, score).then((ok) => {
      if (ok) {
        leaderboardOffset = 0;
        fetchLeaderboard(0);
      }
    });
    scoreName.disabled = true;
    scoreSave.disabled = true;
    scoreSave.textContent = "Saved";
    scoreSaved = true;
    if (scoreRestart) {
      scoreRestart.style.display = "none";
    }
    scoreSave.disabled = false;
    scoreSave.textContent = "New Run";
  });
}

if (scoreRestart) {
  scoreRestart.addEventListener("click", () => {
    resetGame();
  });
}

if (scorePrev) {
  scorePrev.addEventListener("click", () => {
    if (leaderboardLoading) return;
    const nextOffset = Math.max(0, leaderboardOffset - LEADERBOARD_LIMIT);
    if (nextOffset !== leaderboardOffset) {
      fetchLeaderboard(nextOffset);
    }
  });
}

if (scoreNext) {
  scoreNext.addEventListener("click", () => {
    if (leaderboardLoading) return;
    const total = Math.max(leaderboardTotal, highScores.length);
    const totalPages = Math.max(1, Math.ceil(total / LEADERBOARD_LIMIT));
    const nextPage = Math.floor(leaderboardOffset / LEADERBOARD_LIMIT) + 1;
    if (nextPage < totalPages) {
      fetchLeaderboard(nextPage * LEADERBOARD_LIMIT);
    }
  });
}

function updateScoreInput() {
  if (!scoreName) return;
  const cleaned = normalizeName(scoreName.value);
  scoreName.value = cleaned;
  if (scoreSave) scoreSave.disabled = cleaned.length !== 3;
}

if (scoreName) {
  scoreName.addEventListener("input", updateScoreInput);
}

renderScoreList();
fetchLeaderboard(0);

function renderGameToText() {
  const biome = currentBiome();
  const visiblePlatforms = platforms
    .filter((platform) => platform.y > cameraY - 20 && platform.y < cameraY + canvas.height + 20)
    .map((platform) => ({ x: Math.round(platform.x), y: Math.round(platform.y), w: platform.w }));
  const visibleCoins = coins
    .filter((coin) => !coin.collected)
    .filter((coin) => coin.y > cameraY - 20 && coin.y < cameraY + canvas.height + 20)
    .map((coin) => ({ x: Math.round(coin.x), y: Math.round(coin.y) }));

  const payload = {
    mode: state,
    version: GAME_VERSION,
    coord: "origin top-left, +x right, +y down",
    player: {
      x: Math.round(player.x),
      y: Math.round(player.y),
      vx: Number(player.vx.toFixed(2)),
      vy: Number(player.vy.toFixed(2)),
      onGround: player.onGround,
    },
    cameraY: Math.round(cameraY),
    biome: biome.name,
    score,
    levels: levelsEarned,
    highScore,
    coinsCollected,
    coinScore,
    enemyScore,
    powerScore: Math.round(powerScore),
    styleScore,
    streakScore,
    floorStreak,
    speed: Number(Math.abs(player.vx).toFixed(2)),
    scrollSpeed: Number(scrollSpeed.toFixed(1)),
    time: Number(elapsedTime.toFixed(2)),
    wallCombo,
    comboTimer: Number(comboTimer.toFixed(2)),
    comboScore,
    slideWindow: Number(slideWindow.toFixed(2)),
    paceLevel,
    musicOn,
    invincibleTimer: Number(invincibleTimer.toFixed(2)),
    doubleJumpAvailable,
    safeBarTimer: Number(safeBarTimer.toFixed(2)),
    highScores: highScores.slice(0, 5),
    enemies: enemies.length,
    powerups: powerups.length,
    bannerTimer: Number(bannerTimer.toFixed(2)),
    platforms: visiblePlatforms,
    coins: visibleCoins,
  };

  return JSON.stringify(payload);
}

window.render_game_to_text = renderGameToText;
window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) {
    update(FIXED_DT);
  }
  render();
};

resetGame();
resizeDisplay();
requestAnimationFrame(gameLoop);
