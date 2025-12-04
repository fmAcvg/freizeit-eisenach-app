# einfache multi-stage build: erst web export, dann per nginx ausliefern
FROM node:20-bullseye AS builder

# arbeitsverzeichnis setzen
WORKDIR /app

# nur paketdateien kopieren (cache für installs)
COPY package*.json ./

# deps installieren (sauber & reproduzierbar)
RUN npm ci

# rest vom projekt kopieren
COPY . .

# API-URL für Web-Build (per Nginx als /api proxied)
ENV EXPO_PUBLIC_API_URL=/api

# statisches Web-Build erstellen
RUN npx expo export --platform web --output-dir dist

## nginx stage
FROM nginx:alpine

# eigene nginx config kopieren (spa + /api proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# gebautes web in den nginx webroot
COPY --from=builder /app/dist /usr/share/nginx/html

# port 80 exposen
EXPOSE 80

# nginx starten
CMD ["nginx", "-g", "daemon off;"]


