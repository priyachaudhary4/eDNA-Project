---
title: BioScope Backend API
emoji: 🧬
colorFrom: green
colorTo: cyan
sdk: docker
app_port: 7860
pinned: false
---

# BioScope FastAPI Backend

This is the backend API for the **BioScope eDNA Biodiversity Intelligence Platform**.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/metrics` | Dashboard metrics |
| GET | `/api/species` | All detected species |
| GET | `/api/samples` | All uploaded samples |
| GET | `/api/alerts` | Active alerts |
| POST | `/api/upload` | Upload eDNA sample |
| POST | `/api/alerts` | Create alert |
| DELETE | `/api/alerts/{id}` | Delete alert |

## CORS
All origins are allowed for development. Restrict in production.
