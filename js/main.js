/**
 * Arcane Survivors - Main Entry Point
 * A Vampire Survivors-style Bullet Heaven Game
 */

import { Game } from "./engine/game.js";
import { AssetLoader } from "./engine/assets.js";
import { SaveManager } from "./meta/saveManager.js";
import { SoundManager } from "./engine/soundManager.js";
import { UI } from "./ui/ui.js";

// Global game instance
let game = null;

/**
 * Initialize the game
 */
async function init() {
  console.log("🎮 Arcane Survivors - Initializing...");

  // Initialize save data
  SaveManager.init();
  
  // Load sounds (parallel with assets)
  const soundPromise = SoundManager.loadAll();

  // Setup canvas
  const canvas = document.getElementById("game-canvas");
  const container = document.getElementById("game-container");

  // Set canvas size (using CSS size, not DPR scaling to avoid camera issues)
  function resizeCanvas() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Set canvas size to match container
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    if (game) {
      game.resize(width, height);
    }
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Load assets
  console.log("📦 Loading assets...");
  await AssetLoader.loadAll();
  console.log("✅ Assets loaded!");
  
  // Wait for sounds
  await soundPromise;

  // Create game instance AFTER canvas is sized
  game = new Game(canvas);
  
  // Link sound manager to game
  game.soundManager = SoundManager;
  
  // Ensure game has correct dimensions
  game.resize(canvas.width, canvas.height);

  // Initialize UI
  UI.init(game);

  // Show main menu
  UI.showMainMenu();

  console.log("🚀 Game ready!");
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Expose game for debugging
window.arcaneGame = { getGame: () => game, sound: SoundManager };