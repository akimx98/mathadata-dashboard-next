# CLAUDE.md — `akimx98/mathadata-dashboard-next`

Ce dépôt contient uniquement l'application interactive Next.js déployée sur le projet Vercel Hobby
personnel associé à `mathadata-dashboard-next.vercel.app`.

## Périmètre

- Interface : `app/` et `components/`.
- Données runtime : `public/data/`, avec `Mathadata20260210.csv` comme fallback.
- Synchronisation Capytale : `app/api/csv/route.ts`.
- Persistance de production : Vercel Blob.
- Variables locales : `.env.local`, jamais versionné.

Les analyses reproductibles, le glossaire canonique, les rapports et GitHub Pages sont dans
[`mathadata/enquete-usages`](https://github.com/mathadata/enquete-usages). Les calculs historiques
du dashboard ne doivent pas être présentés comme les définitions canoniques de l'enquête.

## Vérifications

Avant tout push :

```bash
npm ci
npm run build
```

Ne modifier ni les domaines, ni les variables Vercel, ni le Blob store sans demande explicite.
Les pushes sur `main` déclenchent le déploiement Vercel de production.

## Git

Préférence du mainteneur : commits directs sur `main`, messages concis en français.
