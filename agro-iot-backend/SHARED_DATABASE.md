# Base de donnees partagee - Aiven MySQL

Ce fichier explique comment toi et ton collegue pouvez utiliser exactement la meme base de donnees.

## Principe

Pour utiliser la meme base, il faut avoir les memes variables de connexion dans `agro-iot-backend/.env`.
Le seeder ne choisit pas la base de donnees. Il sert seulement a ajouter des donnees de depart dans la base deja configuree.

## Configuration commune

Copier le contenu de :

```txt
agro-iot-backend/shared-database.env.example
```

Puis coller les valeurs dans le fichier local :

```txt
agro-iot-backend/.env
```

Variables importantes :

```env
DB_CONNECTION=mysql
DB_HOST=mysql-b28b9ca-ulc-bdb3.f.aivencloud.com
DB_PORT=14547
DB_DATABASE=defaultdb
DB_USERNAME=avnadmin
DB_PASSWORD=REMPLACER_PAR_LE_MOT_DE_PASSE_AIVEN
```

Chaque developpeur doit mettre le meme `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` et `DB_PASSWORD`.
Si ces valeurs sont identiques, vous utilisez la meme base.

## Configuration Render

Dans Render, mettre les memes valeurs dans les Environment Variables du service backend Laravel :

```env
DB_CONNECTION=mysql
DB_HOST=mysql-b28b9ca-ulc-bdb3.f.aivencloud.com
DB_PORT=14547
DB_DATABASE=defaultdb
DB_USERNAME=avnadmin
DB_PASSWORD=REMPLACER_PAR_LE_MOT_DE_PASSE_AIVEN
```

## Commandes utiles

Appliquer les migrations sur la base partagee :

```powershell
cd agro-iot-backend
php artisan migrate
```

Verifier l'etat des migrations :

```powershell
php artisan migrate:status
```

Tester rapidement la connexion Laravel :

```powershell
php artisan tinker
DB::connection()->getPdo();
```

## Attention avec les seeders

Sur une base partagee, ne lancez pas tous les deux les seeders sans coordination.

Commande a eviter sans accord :

```powershell
php artisan db:seed
```

Pourquoi :
- les seeders ajoutent des donnees de depart ;
- si deux personnes les lancent plusieurs fois, il peut y avoir des doublons ;
- sur une base partagee, une action d'un developpeur est visible par l'autre.

Regle conseillee :
- une seule personne lance les migrations ;
- une seule personne lance les seeders, seulement si la base est vide ;
- ensuite vous travaillez tous les deux sur la meme base.

## SSL Aiven

Aiven affiche `Mode SSL : requis`.
Dans beaucoup de cas, Laravel/PDO se connecte avec le port Aiven sans configuration supplementaire.
Si une erreur SSL apparait, il faudra telecharger le certificat CA Aiven et ajouter :

```env
MYSQL_ATTR_SSL_CA=/chemin/vers/ca.pem
```

Le vrai mot de passe Aiven ne doit pas etre commite dans GitHub.
