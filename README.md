# HYDERABAD 2.0 - Open-world driving prototype

A Vite + Three.js browser game featuring a stylised procedural Hyderabad-inspired city, a third-person drivable car, landmark discovery, credits, desktop keyboard controls and mobile touch controls.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Build and preview

```bash
npm run build
npm run preview
```

The production site is generated in `dist/`.

## Publish on GitHub Pages

1. Create a GitHub repository and upload/push the contents of this folder to its `main` branch. Keep the `.github/workflows/deploy.yml` file.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Push to `main`. The included workflow installs dependencies, builds the Vite site and deploys `dist/` to GitHub Pages.
5. Open **Actions** and wait for the Pages workflow to finish. Your site URL will appear in **Settings → Pages**.

`vite.config.js` sets `base: './'` and the HTML uses relative source paths so the site works when hosted under a GitHub project URL such as `https://username.github.io/repository/`.

## Controls

- W / Up: accelerate
- S / Down: reverse
- A / Left and D / Right: steer
- Space: brake
- Shift: boost
- R: reset vehicle
- Mobile: use the on-screen arrow controls and BOOST button
- EXIT GAME: return to the landing page

## Firebase Hosting

Copy `firebase.json.example` to `firebase.json`, then run:

```bash
npm install
npm run build
firebase deploy --only hosting
```

Set the Firebase Hosting public directory to `dist`.

## Current prototype scope

Included: responsive landing page, procedural city blocks and road grid, third-person car, five landmark discovery points, credit rewards, speed/district HUD, keyboard and mobile touch controls.

Not included yet: accurate GIS street data, vehicle collision/physics simulation, traffic or pedestrian AI, audio, full mission scripting, user accounts, cloud saves, multiplayer, or native mobile apps. The landmarks and city blocks are procedural placeholder geometry; website photography is remote Unsplash imagery and requires an internet connection.
