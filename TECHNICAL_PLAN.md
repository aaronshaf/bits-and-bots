# Technical Plan: Bits and Bots

This document outlines the technical and procedural plan for creating "Bits and Bots," a 2D, top-down, dual-player game built with TypeScript and Bun.

## 1. Elevator Pitch

A cute and chill 2D game where two bots, controlled via gamepads, float through an expanding digital realm to collect "bits" and "bytes" while dodging and battling ever-evolving "bugs".

## 2. Core Gameplay Loop

1.  **Explore:** Players navigate their bots around the screen, which represents the entire game world.
2.  **Collect:** Players scoop up valuable "bits" and "bytes" to increase their score.
3.  **Defend:** Players must avoid or fight off "bugs" that threaten to steal their collections and damage their bots.
4.  **Power-up:** Players can find and utilize special power-ups to enhance their bot's abilities.
5.  **Survive:** The game gets progressively harder as new and tougher bugs appear. The goal is to survive as long as possible and achieve a high score.

## 3. Key Features

-   **Two-Player Local Co-op:** Two players on the same screen.
-   **Gamepad API Control:** Primary input method for an authentic, retro feel.
-   **Dynamic Game World:** The play area is the full size of the browser window.
-   **Entities:**
    -   **Bots:** Cute, player-controlled characters.
    -   **Bits & Bytes:** Collectible scoring items.
    -   **Bugs:** Enemies with evolving difficulty.
-   **Player Abilities:** Movement, collection, attack, and defense.
-   **Power-Ups:** Temporary enhancements for bots.
-   **Minimalist UI:** Player stats displayed cleanly in the top corners of the screen.
-   **Artful Audio:** A substantial, non-repetitive, lo-fi/SNES-inspired musical score.

## 4. Technical Plan

### 4.1. Technology Stack

-   **Language:** TypeScript
-   **Runtime / Bundler / Task Runner:** Bun
-   **Rendering:** HTML5 Canvas API (2D Context)
-   **Version Control:** Git / GitHub
-   **CI/CD:** GitHub Actions

### 4.2. Proposed Project Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions for deployment
├── .husky/
│   └── pre-commit          # Pre-commit hook script
├── dist/                   # Build output directory
├── src/
│   ├── audio/
│   │   └── background.mp3
│   ├── styles/
│   │   └── main.css
│   ├── game/
│   │   ├── Bot.ts
│   │   ├── Bug.ts
│   │   ├── Bit.ts
│   │   ├── PowerUp.ts
│   │   └── index.ts        # Main game logic
│   ├── main.ts             # Entry point
│   └── index.html
├── bun.lockb
├── package.json
├── tsconfig.json
└── TECHNICAL_PLAN.md
```

### 4.3. Development Roadmap

#### Phase 1: Foundation & Core Mechanics (The "Walking Skeleton")

1.  **Project Setup:** Initialize the project with `bun init`. Configure `tsconfig.json` for strict TypeScript.
2.  **HTML Canvas:** Set up `index.html` with a fullscreen canvas element.
3.  **Game Loop:** Create the main game loop in `src/game/index.ts` using `requestAnimationFrame`.
4.  **Bot Rendering:** Implement the `Bot` class and draw a simple representation (e.g., a circle or square) on the canvas.
5.  **Gamepad Control:** Integrate the Gamepad API to read input and move the two player bots independently.

#### Phase 2: Gameplay Elements

1.  **Collectibles:** Implement `Bit` and `Byte` classes. Spawn them randomly within the canvas bounds.
2.  **Collection:** Add logic for bots to "collect" bits when they overlap.
3.  **Scoring:** Implement a scoring system and display scores on the UI.
4.  **Bugs:** Implement a basic `Bug` class that moves around the screen.
5.  **Collision Detection:** Implement simple circle-based collision detection between entities (Bot/Bug, Bot/Bit).
6.  **Combat & Defense:** Give bots basic attack (e.g., shooting a projectile) and defense (e.g., a temporary shield) abilities, triggered by gamepad buttons.

#### Phase 3: Progression & Polish

1.  **Progressive Difficulty:** Enhance the `Bug` logic. Make them faster, more numerous, or introduce new bug types over time.
2.  **Power-Ups:** Implement the `PowerUp` class and spawn mechanics. Examples: speed boost, rapid-fire, shield enhancement.
3.  **Audio Integration:**
    -   Source or compose a 1-2 minute lo-fi, SNES-inspired musical piece.
    -   Use the Web Audio API to load and play the background music on a loop.
    -   Add simple sound effects for collection, shooting, and collisions.
4.  **Art & Aesthetics:** Replace placeholder shapes with cute, custom-designed sprites for the bots and bugs.

## 5. Procedural Plan

### 5.1. Pre-commit Hook: File Length Check

We will use `husky` to manage git hooks.

1.  **Install Husky:** `bun add -d husky`
2.  **Enable Hooks:** `bun husky install`
3.  **Add Hook:** `bun husky add .husky/pre-commit "bun check:lines"`
4.  **Create Script:** Add a script to `package.json` that finds all `.ts` files and checks their line count.

```json
"scripts": {
  "check:lines": "find src -name '*.ts' -exec wc -l {} + | awk '$1 > 600 {print $2 " has more than 600 lines"; exit 1}'"
}
```
This script will fail the commit if any TypeScript file in the `src` directory exceeds 600 lines.

### 5.2. GitHub Actions: Deploy to GitHub Pages

We will create a workflow file at `.github/workflows/deploy.yml` to automate the build and deployment process.

**Workflow Steps:**

1.  **Trigger:** The workflow will run on every push to the `main` branch.
2.  **Setup:** It will check out the code and set up the Bun environment.
3.  **Install Dependencies:** Run `bun install`.
4.  **Build:** Run a `bun run build` script (to be created) that bundles all TypeScript and assets into the `dist` directory.
5.  **Deploy:** Use a community action (e.g., `peaceiris/actions-gh-pages`) to deploy the contents of the `dist` directory to the `gh-pages` branch, making it live on GitHub Pages.
