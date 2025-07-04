# Bloc 3 : Déploiement Docker et Kubernetes

Ce document explique comment construire et pousser les images Docker pour le backend et le frontend de l'application **Incident Tracker**.

---

## **Images Docker**

### **1. Backend**
- **Image**: `node:20-alpine`
- **Port exposé**: `3000`
- **Dockerfile**: `docker/backend/Dockerfile`

### **2. Frontend**
- **Image**: `nginx:alpine` (multi-stage build avec `node:20-alpine` pour la construction)
- **Port exposé**: `80`
- **Dockerfile**: `docker/frontend/Dockerfile`

---

## **Commandes pour Build et Push**

### **1. Build des images**
```bash
# Backend
docker build -t matuidi1234/incident-backend:latest -f docker/backend/Dockerfile .

# Frontend
docker build -t matuidi1234/incident-frontend:latest -f docker/frontend/Dockerfile .