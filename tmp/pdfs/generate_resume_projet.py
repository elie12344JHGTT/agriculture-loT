from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

output = Path('output/pdf/resume_projet_agro_iot.pdf')
output.parent.mkdir(parents=True, exist_ok=True)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name='DocTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=22,
    leading=28, alignment=TA_CENTER, textColor=colors.HexColor('#154727'), spaceAfter=14
))
styles.add(ParagraphStyle(
    name='Subtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=11,
    leading=16, alignment=TA_CENTER, textColor=colors.HexColor('#56685c'), spaceAfter=18
))
styles.add(ParagraphStyle(
    name='SectionTitle', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=15,
    leading=19, textColor=colors.HexColor('#1f2a24'), spaceBefore=12, spaceAfter=8
))
styles.add(ParagraphStyle(
    name='Body', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.5,
    leading=13.5, textColor=colors.HexColor('#1f2a24'), spaceAfter=6
))
styles.add(ParagraphStyle(
    name='Small', parent=styles['BodyText'], fontName='Helvetica', fontSize=8.5,
    leading=11.5, textColor=colors.HexColor('#1f2a24')
))
styles.add(ParagraphStyle(
    name='DocBullet', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.2,
    leading=12.5, leftIndent=12, firstLineIndent=-8, textColor=colors.HexColor('#1f2a24'), spaceAfter=3
))
styles.add(ParagraphStyle(
    name='TableHeader', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=8.8,
    leading=11, textColor=colors.white, alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name='TableCell', parent=styles['BodyText'], fontName='Helvetica', fontSize=8.2,
    leading=10.8, textColor=colors.HexColor('#1f2a24')
))

story = []

def p(text, style='Body'):
    story.append(Paragraph(text, styles[style]))

def bullets(items):
    for item in items:
        story.append(Paragraph('- ' + item, styles['DocBullet']))

def section(title):
    story.append(Paragraph(title, styles['SectionTitle']))

def table(data, widths):
    wrapped = []
    for r, row in enumerate(data):
        wrapped.append([Paragraph(str(cell), styles['TableHeader' if r == 0 else 'TableCell']) for cell in row])
    t = Table(wrapped, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2e7d32')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#d7e4dc')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fbfdfb')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))

def code_block(lines):
    content = '<br/>'.join(lines)
    t = Table([[Paragraph(content, styles['Small'])]], colWidths=[16.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eef3ef')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#d7e4dc')),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))

story.append(Paragraph('Documentation de conception', styles['DocTitle']))
story.append(Paragraph('Projet Agro IoT - Application web de supervision agricole intelligente', styles['Subtitle']))

section('1. Resume du projet')
p("Le projet Agro IoT est une application web de suivi agricole intelligent. Elle permet de surveiller les donnees issues de capteurs IoT, de consulter l'historique des mesures, de gerer les alertes, de controler des actionneurs et d'administrer les utilisateurs selon leurs roles.")
p("L'application est composee d'un frontend React, d'un backend Laravel et d'une base de donnees MySQL hebergee en ligne sur Aiven. Le frontend est deploye sur Vercel et le backend sur Render.")

section('2. Technologies utilisees')
table([
    ['Partie', 'Technologies', 'Role dans le projet'],
    ['Frontend', 'React.js, Vite, JavaScript/JSX, CSS personnalise', "Construction de l'interface utilisateur, navigation, responsive et affichage dynamique."],
    ['Communication API', 'Axios', "Envoi des requetes HTTP vers Laravel avec le token d'authentification."],
    ['Backend', 'Laravel, PHP, Eloquent ORM', "Routes API, logique metier, securite, acces base de donnees."],
    ['Base de donnees', 'MySQL sur Aiven', "Stockage des utilisateurs, mesures, alertes, actions, historiques, seuils et logs d'audit."],
    ['Deploiement', 'Vercel, Render, Dockerfile', "Hebergement du frontend, du backend et configuration de production."],
    ['Outils', 'Git, GitHub, DBeaver, XAMPP/PHP natif, PowerShell/Batch', "Versioning, collaboration, consultation de la base et execution de commandes."],
], [3.1*cm, 5.3*cm, 8.1*cm])

section('3. Packages et bibliotheques')
p('Frontend - dependances principales :')
table([
    ['Package', 'Version', 'Utilisation'],
    ['react', '^18.3.1', 'Creation des composants et gestion de l interface.'],
    ['react-dom', '^18.3.1', 'Rendu de React dans le navigateur.'],
    ['axios', '^1.18.1', 'Requetes HTTP vers le backend Laravel.'],
    ['vite', '^5.3.3', 'Serveur de developpement et build de production.'],
    ['@vitejs/plugin-react', '^4.3.1', 'Support React dans Vite.'],
], [4.2*cm, 3.1*cm, 9.2*cm])
p('Backend - dependances principales :')
table([
    ['Package', 'Version', 'Utilisation'],
    ['laravel/framework', '^13.8', 'Framework backend PHP et routes API.'],
    ['laravel/tinker', '^3.0', 'Outil de test et interaction en console.'],
    ['phpunit/phpunit', '^12.5.12', 'Tests automatises cote Laravel.'],
    ['laravel/pint', '^1.27', 'Formatage du code PHP.'],
], [4.2*cm, 3.1*cm, 9.2*cm])

section('4. Template et design')
p("Le projet n'utilise pas de template externe complet comme Bootstrap, Tailwind ou Material UI. L'interface a ete construite avec des composants React personnalises, un CSS sur mesure, des assets locaux, des icones et des logos integres au projet.")
bullets([
    'Interface adaptee au domaine agricole IoT.',
    'Design responsive pour desktop, tablette et mobile.',
    'Navigation desktop avec sidebar, navigation mobile en bas, et adaptation tablette.',
    'Splash screen personnalise au lancement de l application.',
    'PWA installable comme application sur mobile, tablette ou ordinateur.',
])

section('5. Structure generale du projet')
code_block([
    'Agriculture _loT/',
    '  agro-iot-frontend/   -> application React/Vite',
    '  agro-iot-backend/    -> API Laravel',
    '  scripts/             -> scripts CLI/Batch pour les actionneurs',
    '  output/pdf/          -> documents generes'
])

section('6. Structure du frontend')
table([
    ['Dossier/Fichier', 'Role'],
    ['src/pages/', 'Pages principales : Login, Dashboard, Historique, Alertes, Administration, Terminal.'],
    ['src/components/', 'Composants reutilisables : cartes capteurs, graphiques, boutons, tableaux, splash screen.'],
    ['src/layout/', 'Header et Sidebar pour la structure de navigation.'],
    ['src/api/axios.js', 'Configuration Axios, URL backend et envoi automatique du token.'],
    ['src/api/audit.js', 'Journalisation des actions utilisateur.'],
    ['src/assets/', 'Logos et icones utilises dans l interface.'],
    ['src/styles.css', 'Styles globaux et responsive.'],
], [5.2*cm, 11.3*cm])

section('7. Pages principales')
table([
    ['Page', 'Fonction'],
    ['LoginPage', 'Connexion avec email et mot de passe.'],
    ['DashboardPage', 'Affichage des capteurs et controle des actionneurs.'],
    ['HistoryPage', 'Consultation des mesures, alertes et actions passees.'],
    ['AlertsPage', 'Suivi des alertes, seuils et regles automatiques.'],
    ['AdminPage', 'Gestion des utilisateurs, roles et audit.'],
    ['TerminalPage', 'Execution de commandes actionneurs depuis une interface terminal.'],
], [4.2*cm, 12.3*cm])

story.append(PageBreak())
section('8. Fonctionnalites par role')
table([
    ['Role', 'Actions autorisees'],
    ['Administrateur', "Acces au dashboard, historique, alertes, administration, terminal. Peut creer, modifier et supprimer des utilisateurs, attribuer les roles, changer les mots de passe, consulter l audit, modifier les seuils, resoudre les alertes et controler les actionneurs."],
    ['Technicien', "Acces au dashboard, historique, alertes et terminal. Peut consulter les mesures, resoudre les alertes, modifier certains seuils et controler les actionneurs. Ne gere pas les utilisateurs."],
    ['Agriculteur', "Acces au dashboard, historique et alertes en consultation. Peut suivre l etat de la serre et les mesures. Ne gere pas les utilisateurs, les seuils sensibles ni le terminal technique."],
], [3.6*cm, 12.9*cm])

section('9. Securite mise en place')
bullets([
    'Connexion avec email et mot de passe.',
    'Verification du mot de passe avec Hash::check cote Laravel.',
    'Generation d un token signe apres connexion.',
    'Envoi automatique du token dans les requetes avec Authorization: Bearer <token>.',
    'Middleware agro.auth pour proteger les routes API.',
    'Verification des roles cote Laravel pour les routes sensibles.',
    'Limitation des tentatives de connexion avec throttle:5,1.',
    'Route /api/auth/me pour recharger le vrai utilisateur depuis le backend.',
    'Journal d audit base sur l utilisateur authentifie et non sur les donnees declarees par le frontend.',
])
p('Routes protegees par role :')
table([
    ['Type de route', 'Role autorise'],
    ['Gestion des utilisateurs', 'Admin uniquement'],
    ['Journal d audit', 'Admin uniquement'],
    ['Commandes actionneurs', 'Admin ou Technicien'],
    ['Modification des seuils', 'Admin ou Technicien'],
    ['Resolution des alertes', 'Admin ou Technicien'],
], [6.5*cm, 10*cm])

section('10. Base de donnees')
p('La base de donnees est hebergee sur Aiven MySQL. Elle est consultee avec DBeaver et utilisee par Laravel via Eloquent ORM.')
table([
    ['Table', 'Utilisation'],
    ['users', 'Comptes utilisateurs et mots de passe hashes.'],
    ['profils', 'Informations de profil et role utilisateur.'],
    ['mesures', 'Valeurs envoyees par les capteurs.'],
    ['capteurs', 'Definition des capteurs installes.'],
    ['alertes', 'Alertes generees par le systeme.'],
    ['actionneurs', 'Equipements controlables : pompe, ventilation, lumiere.'],
    ['actions', 'Actions declenchees sur les actionneurs.'],
    ['historiques', 'Evenements historiques.'],
    ['seuils', 'Regles et valeurs limites.'],
    ['audit_logs', 'Traces de connexion, navigation et actions utilisateur.'],
], [4.5*cm, 12*cm])

section('11. Communication frontend/backend')
p('Le frontend communique avec Laravel via Axios. Apres login, le token est stocke cote frontend puis ajoute automatiquement aux requetes API protegees.')
code_block([
    'POST /api/auth/login',
    'GET  /api/auth/me',
    'GET  /api/measurements/latest',
    'POST /api/actuators/irrigation',
    'PUT  /api/alerts/{id}/resolve',
    'GET  /api/users'
])

section('12. Fonctionnement IoT')
p('Le systeme est prevu pour recevoir les donnees de plusieurs capteurs IoT et piloter des actionneurs agricoles. Les donnees sont stockees en base puis affichees dans le dashboard et l historique.')
table([
    ['Capteurs', 'Actionneurs'],
    ['Temperature, humidite air, humidite sol, CO2, luminosite, niveau d eau', 'Pompe irrigation, ventilateur, lampe/eclairage'],
], [8.2*cm, 8.3*cm])

section('13. Terminal et script CLI')
p('Le projet contient une page Terminal et des scripts Windows pour envoyer des commandes aux actionneurs.')
code_block([
    'scripts/actionneurs-cli.ps1',
    'scripts/actionneurs-cli.bat',
    'Exemples :',
    '  actionneurs-cli.bat arrosage start',
    '  actionneurs-cli.bat ventilation stop',
    '  actionneurs-cli.bat tout start batch'
])

section('14. Responsive et experience utilisateur')
bullets([
    'Desktop : sidebar fixe et grandes zones de contenu.',
    'Tablette : menu lateral vertical compact.',
    'Mobile : navigation basse comme une application mobile.',
    'Cartes capteurs adaptees aux petits ecrans.',
    'Gestion des debordements et amelioration des formulaires.',
    'Animation d ouverture avec splash screen.',
])

section('15. Deploiement')
table([
    ['Element', 'Plateforme', 'Details'],
    ['Frontend', 'Vercel', 'Application React/Vite compilee en production.'],
    ['Backend', 'Render', 'API Laravel avec variables d environnement.'],
    ['Base de donnees', 'Aiven MySQL', 'Base MySQL en ligne partagee entre developpeurs.'],
], [4.2*cm, 4.2*cm, 8.1*cm])
p('Variables importantes : APP_KEY, APP_URL, ASSET_URL, DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD, FRONTEND_URLS, VITE_API_URL.')

section('16. Conclusion')
p('Agro IoT est une application web complete de supervision agricole intelligente. Elle combine React, Laravel, MySQL en ligne, securite par token, gestion des roles, journal d audit, controle des actionneurs et interface responsive. Le projet est structure pour faciliter la collaboration entre frontend, backend et integration IoT.')


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#66736b'))
    canvas.drawString(2*cm, 1.15*cm, 'Agro IoT - Documentation de conception')
    canvas.drawRightString(A4[0]-2*cm, 1.15*cm, f'Page {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate(
    str(output), pagesize=A4, rightMargin=2*cm, leftMargin=2*cm,
    topMargin=1.8*cm, bottomMargin=1.8*cm
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(output.resolve())

