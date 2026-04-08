# GTFS Schema Explorer

Applicazione React per esplorare la struttura GTFS con schema interattivo delle relazioni.

## Requisiti

- Node.js 18+

## Avvio in locale

```bash
npm install
npm run dev
```

Apri l'URL mostrato dal terminale (di default `http://localhost:5173`).

## Build produzione

```bash
npm run build
```

L'output viene generato in `dist/`.

## Deploy su Vercel

### Metodo 1: da dashboard Vercel (consigliato)

1. Pusha il repository su GitHub.
2. Vai su Vercel e fai `Add New Project`.
3. Importa questo repository.
4. Vercel rileva automaticamente Vite (`framework: vite`).
5. Deploy.

### Metodo 2: da CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

## Struttura file principale

- `app.jsx`: UI e logica dello schema GTFS
- `main.jsx`: bootstrap React
- `index.html`: entry HTML
- `vercel.json`: configurazione deploy Vercel