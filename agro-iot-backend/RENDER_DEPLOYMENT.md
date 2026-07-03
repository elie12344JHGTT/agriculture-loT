# Deploiement Render - Backend Laravel

Ce dossier est pret pour deployer le backend Laravel sur Render avec Docker.
Le frontend React restera separe, idealement sur Vercel.

Sources consultees :
- Render recommande Docker pour deployer Laravel.
- Render recommande aussi de forcer HTTPS en production pour Laravel.

## 1. Creer le service Render

Dans Render :

1. New +
2. Web Service
3. Connecter le depot GitHub `agriculture-loT`
4. Configurer le service :

```txt
Name: agro-iot-backend
Root Directory: agro-iot-backend
Runtime: Docker
Branch: main
```

Render detectera le fichier :

```txt
agro-iot-backend/Dockerfile
```

## 2. Base de donnees

Important : Render propose surtout PostgreSQL comme base managee.
Notre projet Laravel est actuellement configure pour MySQL.

Pour eviter de modifier tout le backend maintenant, utiliser une base MySQL externe :

```txt
Aiven MySQL
Clever Cloud MySQL
PlanetScale-compatible MySQL
serveur MySQL d'un hebergeur
```

Ensuite mettre les informations dans les variables Render :

```txt
DB_CONNECTION=mysql
DB_HOST=...
DB_PORT=3306
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
```

## 3. Variables d'environnement Render

Copier le contenu de :

```txt
render.env.example
```

Dans les Environment Variables du service Render.

Variables a remplacer obligatoirement :

```txt
APP_KEY
APP_URL
ASSET_URL
DB_HOST
DB_DATABASE
DB_USERNAME
DB_PASSWORD
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

## 4. Commande de demarrage

La commande est deja dans le Dockerfile :

```txt
php artisan package:discover --ansi
php artisan config:clear
php artisan route:clear
php artisan migrate --force
php -S 0.0.0.0:${PORT:-10000} -t public
```

Au demarrage, Render applique donc automatiquement les migrations, puis lance le serveur PHP natif sur le port fourni par Render.

## 5. Verification apres deploiement

Quand Render donne l'URL du backend, tester :

```txt
https://votre-backend.onrender.com/api/test-connection
```

Reponse attendue :

```json
{
  "message": "Connexion reussie avec Laravel !",
  "status": "success"
}
```

## 6. CORS avec Vercel

Apres le deploiement du frontend sur Vercel, ajouter l'URL Vercel dans :

```txt
FRONTEND_URLS=https://votre-frontend.vercel.app,http://localhost:5174
```

Si le frontend change de domaine, mettre a jour cette variable dans Render.

## 7. Points importants

- Ne jamais pousser le vrai `.env`.
- Garder `APP_DEBUG=false` en production.
- `SESSION_DRIVER=file`, `CACHE_STORE=file` et `QUEUE_CONNECTION=sync` sont suffisants pour le premier deploiement.
- Le service Render gratuit peut dormir apres inactivite, donc la premiere requete peut etre lente.
- Si vous voulez utiliser PostgreSQL Render plus tard, il faudra adapter `DB_CONNECTION=pgsql` et verifier les migrations.

