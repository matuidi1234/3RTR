# Étape de construction
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production uniquement
RUN npm ci --omit=dev

# Copier le reste des fichiers
COPY . .

# Exposer le port 3100
EXPOSE 3100

# Commande pour démarrer l'application
CMD ["node", "src/app.js"]