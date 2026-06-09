# dtapp (V-plus-plus)

Minimal React + Vite app with Firebase Cloud Functions (Razorpay integration).

## Features
- React 19 + Vite (rolldown fork)
- React Router
- Firebase v2 Cloud Functions (Razorpay order creation & payment verification)
- FullCalendar, pdf-lib, react-hot-toast
- ESLint config for app and functions

## Repo structure (important files)
- /src — React app (components, pages, context, firebase config)
- /public — static assets
- /functions — Firebase Cloud Functions (index.js, package.json)
- vite.config.js, package.json, firebase.json, .firebaserc

## Prerequisites
- Node.js (16+ for frontend; functions require Node 20 per functions/package.json)
- npm
- Firebase CLI (authenticated & project selected)

## Setup
1. Install root deps:
   - npm install
2. Install functions deps:
   - cd functions && npm install

## Local development
- Run frontend dev server:
  - npm run dev
- Run functions emulator:
  - cd functions && npm run serve

## Build & preview
- Build frontend:
  - npm run build
- Preview production build:
  - npm run preview

## Lint
- Frontend (root):
  - npm run lint
- Functions:
  - cd functions && npm run lint

## Firebase deploy
- Deploy only functions (configured in root package.json):
  - npm run deploy
  - or from functions folder:
    - cd functions && npm run deploy
- Note: firebase.json predeploy runs `npm --prefix "$RESOURCE_DIR" run lint`.

## Environment / Secrets
- Razorpay keys used by functions:
  - The project includes functions/.env.dtapp-228b6 for local/dev only. For production, set secrets via Firebase params or environment (do NOT commit secrets).
  - Functions use `defineString("RAZORPAY_KEY_ID")` and `defineString("RAZORPAY_KEY_SECRET")` — deploy with secure parameter configuration.

## Notes
- Functions are implemented with Firebase v2 APIs. Verify your Firebase CLI version supports v2.
- If you change Node runtime for functions, update functions/package.json `engines.node`.
- Adjust ESLint rules in eslint.config.js and functions/.eslintrc.js as needed.
