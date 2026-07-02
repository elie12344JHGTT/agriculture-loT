# Deploiement Railway - Backend Laravel

Ce dossier est pret pour un deploiement moderne sur Railway.
Le frontend React sera deploye separement sur Vercel.

## 1. Creer le service backend

Dans Railway :

1. New Project
2. Deploy from GitHub repo
3. Selectionner le depot `agriculture-loT`
4. Dans les settings du service, mettre :

```txt
Root Directory = agro-iot-backend
```

Railway lira alors `agro-iot-backend/railway.json`.

## 2. Ajouter MySQL

Dans le meme projet Railway :

1. Add service
2. Database
3. MySQL

Railway va fournir les variables MySQL :

```txt
MYSQLHOST
MYSQLPORT
MYSQLDATABASE
MYSQLUSER
MYSQLPASSWORD
```

## 3. Variables Laravel a mettre dans Railway

Copier le contenu de `railway.env.example` dans les variables du service Laravel, puis remplacer :

```txt
APP_KEY
APP_URL
FRONTEND_URLS
```

Pour generer `APP_KEY` localement :

```powershell
php artisan key:generate --show
```

Exemple :

```txt
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
```

`APP_URL` doit etre l'URL publique Railway du backend.
`FRONTEND_URLS` devra contenir l'URL Vercel du frontend apres le deploiement.

## 4. Commandes Railway deja configurees

Le fichier `railway.json` configure :

```txt
Build: composer install --no-dev --optimize-autoloader
Start: php artisan config:clear && php artisan route:clear && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT}
```

Au demarrage, Railway lance donc automatiquement les migrations Laravel.

## 5. Healthcheck

Railway verifie cette route :

```txt
/api/test-connection
```

Si cette route repond, le backend est considere comme en ligne.

## 6. Points importants

- Ne jamais pousser le vrai `.env`.
- Mettre `APP_DEBUG=false` en ligne.
- Garder `SESSION_DRIVER=file`, `CACHE_STORE=file`, `QUEUE_CONNECTION=sync` pour un premier deploiement simple.
- Apres deploiement du frontend Vercel, mettre son URL dans `FRONTEND_URLS`.
- Si le frontend change de domaine, mettre a jour `FRONTEND_URLS` dans Railway.

