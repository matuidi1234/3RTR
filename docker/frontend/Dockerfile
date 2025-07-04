# Étape de construction (build)
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier les fichiers sources
COPY . .

# Construire l'application
RUN npm run build

# Étape d'exécution (nginx)
FROM nginx:alpine

# Copier les fichiers construits depuis l'étape builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Commande par défaut de nginx (déjà incluse dans l'image de base)
CMD ["nginx", "-g", "daemon off;"]