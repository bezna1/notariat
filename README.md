# Aktomat

Webowy prototyp UX dla kancelarii notarialnej do testowania generowania aktów z szablonów DOCX.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Dev uruchamia:

- frontend Vite,
- lokalny backend testowy Express pod `/api`.

## Konta testowe

- `admin` / `admin123`
- `notariusz` / `notariusz123`
- `sekretariat` / `sekretariat123`

## API testowe

- `GET /api/health`
- `GET /api/templates`
- `GET /api/projects`
- `POST /api/projects`

Na Vercel endpointy `/api/*` działają jako serverless functions. Lokalnie `npm run dev`
uruchamia Expressa i frontend Vite równolegle.
