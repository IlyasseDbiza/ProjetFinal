# DataSpeak — Plateforme SaaS de génération de tableaux de bord par langage naturel

> **Projet #19 — B3 | Niveau : Avancé | Durée : 30 jours | Équipe : 3–4 personnes**

Une plateforme self-service qui transforme une question en langage naturel en une requête analytique SQL (via LLM) et génère automatiquement une visualisation interactive — sans écrire une seule ligne de code.

---

## Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 📁 **Import CSV** | Drag & drop d'un fichier CSV, profiling automatique des colonnes |
| 🔍 **Profiling des données** | Statistiques par colonne (min/max/moyenne, valeurs top, nulls) |
| 💬 **NL-to-SQL** | Conversion d'une question métier en requête DuckDB via Groq (llama3-8b-8192) |
| 📊 **Visualisation** | Génération automatique du type de graphique (bar, line, scatter, pie, histogram, table) |
| 📌 **Dashboards** | Sauvegarde et organisation des graphiques en tableaux de bord |
| 🔒 **Sécurité SQL** | Validation et blocage des requêtes non-SELECT |

---

## Architecture

```
ProjetFinal/
├── backend/               # FastAPI + DuckDB + Groq
│   ├── app/
│   │   ├── main.py        # Entrypoint FastAPI
│   │   ├── config.py      # Settings (pydantic-settings)
│   │   ├── database.py    # SQLAlchemy (SQLite pour les métadonnées)
│   │   ├── models/        # ORM models (DataSource, Dashboard, QueryHistory)
│   │   ├── routers/       # Endpoints REST
│   │   │   ├── datasources.py   # Upload, list, delete, profil
│   │   │   ├── queries.py       # NL → SQL → résultat → chart
│   │   │   └── dashboards.py    # CRUD dashboards
│   │   └── services/
│   │       ├── nl2query.py      # LLM NL-to-SQL
│   │       ├── duckdb_service.py # Import CSV, exécution requêtes
│   │       ├── profiler.py      # Profiling colonnes
│   │       └── chart_builder.py # Génération specs Plotly
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/              # React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api/client.ts  # Axios API client
│   │   ├── types/         # TypeScript interfaces
│   │   ├── components/    # Layout, ChartViewer, NLQueryInput, DataProfilePanel, QueryResultCard
│   │   └── pages/         # ExplorePage, DataSourcesPage, DashboardsPage
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend API | Python 3.11, FastAPI, Uvicorn |
| Moteur SQL | DuckDB (in-process, sans serveur) |
| Métadonnées | SQLite via SQLAlchemy |
| LLM | [Groq](https://console.groq.com) llama3-8b-8192 (gratuit) |
| Visualisation | Plotly (Python + JS) |
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS |
| State | TanStack Query (React Query) |
| Conteneurs | Docker + Docker Compose |

---

## Démarrage rapide

### Prérequis

- Python 3.11+
- Node.js 20+
- (Optionnel) Docker & Docker Compose

### 1. Backend

```bash
cd backend
cp .env.example .env
# Éditer .env et renseigner GROQ_API_KEY (clé gratuite sur https://console.groq.com)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

L'API sera disponible sur [http://localhost:8000](http://localhost:8000).  
La documentation Swagger est accessible sur [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application sera disponible sur [http://localhost:5173](http://localhost:5173).

### 3. Docker Compose (tout-en-un)

```bash
cp .env.example .env
# Éditer .env
docker-compose up --build
```

L'application sera disponible sur [http://localhost](http://localhost).

---

## Utilisation

1. **Importer des données** → onglet *Data Sources* → glisser-déposer un fichier CSV
2. **Explorer** → onglet *Explore* → sélectionner la source → poser une question en français ou anglais
3. **Sauvegarder** → cliquer *Save* sur un graphique pour l'ajouter à un dashboard
4. **Visualiser** → onglet *Dashboards* → voir tous les graphiques sauvegardés

### Exemples de questions

- `Montre le total des ventes par catégorie`
- `Quelle est la tendance mensuelle du chiffre d'affaires ?`
- `Affiche la distribution des âges clients`
- `Top 10 des produits par revenu`

---

## API REST

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/datasources/upload` | Upload CSV + profiling |
| GET | `/datasources/` | Liste des sources |
| GET | `/datasources/{id}` | Détail + profil |
| DELETE | `/datasources/{id}` | Supprimer |
| POST | `/queries/ask` | NL → SQL → Chart |
| GET | `/queries/history/{id}` | Historique |
| GET/POST | `/dashboards/` | CRUD dashboards |
| GET/PUT/DELETE | `/dashboards/{id}` | Dashboard par ID |

---

## Plan de travail (8 phases)

1. **Définir les formats** — Specs CSV/SQL acceptés, formats de sortie JSON
2. **Développer l'import** — Upload, validation, stockage DuckDB
3. **Profiler les données** — Statistiques colonnes, types, nulls, top values
4. **Construire le moteur NL-to-query** — Prompt engineering, validation SQL
5. **Générer les graphiques** — Sélection automatique du type de chart
6. **Ajouter les dashboards** — CRUD, persistence, grille responsive
7. **Sécuriser** — Validation SQL, rate limiting, taille maximale des uploads
8. **Déployer** — Docker Compose, variables d'environnement, CORS

---

## Compétences mobilisées

- Data apps & ingestion de données
- IA générative (NL-to-SQL, prompt engineering)
- SQL analytique (DuckDB)
- Visualisation de données (Plotly)
- Développement SaaS full-stack (FastAPI + React)
