from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

output = Path('output/pdf/revue_diagramme_deploiement_agro_iot.pdf')
output.parent.mkdir(parents=True, exist_ok=True)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name='DocTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=21,
    leading=27, alignment=TA_CENTER, textColor=colors.HexColor('#154727'), spaceAfter=10
))
styles.add(ParagraphStyle(
    name='Subtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=10.5,
    leading=15, alignment=TA_CENTER, textColor=colors.HexColor('#56685c'), spaceAfter=16
))
styles.add(ParagraphStyle(
    name='SectionTitle', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=14.5,
    leading=18, textColor=colors.HexColor('#1f2a24'), spaceBefore=10, spaceAfter=7
))
styles.add(ParagraphStyle(
    name='Body', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.5,
    leading=13.2, textColor=colors.HexColor('#1f2a24'), spaceAfter=6
))
styles.add(ParagraphStyle(
    name='DocBullet', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.2,
    leading=12.5, leftIndent=12, firstLineIndent=-8, textColor=colors.HexColor('#1f2a24'), spaceAfter=3
))
styles.add(ParagraphStyle(
    name='Small', parent=styles['BodyText'], fontName='Helvetica', fontSize=8.4,
    leading=11.2, textColor=colors.HexColor('#1f2a24')
))
styles.add(ParagraphStyle(
    name='TableHeader', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=8.6,
    leading=10.8, textColor=colors.white, alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name='TableCell', parent=styles['BodyText'], fontName='Helvetica', fontSize=8.1,
    leading=10.6, textColor=colors.HexColor('#1f2a24')
))

story = []

def p(text, style='Body'):
    story.append(Paragraph(text, styles[style]))

def section(title):
    story.append(Paragraph(title, styles['SectionTitle']))

def bullets(items):
    for item in items:
        story.append(Paragraph('- ' + item, styles['DocBullet']))

def table(data, widths):
    wrapped = []
    for r, row in enumerate(data):
        wrapped.append([Paragraph(str(cell), styles['TableHeader' if r == 0 else 'TableCell']) for cell in row])
    t = Table(wrapped, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2e7d32')),
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

story.append(Paragraph('Revue du diagramme de deploiement', styles['DocTitle']))
story.append(Paragraph('Projet Agro IoT - Verification du fichier Diagramme de deploiement.drawio', styles['Subtitle']))

section('1. Objectif de la revue')
p("Ce document resume les remarques faites sur le diagramme de deploiement Draw.io transmis par l equipe. Le but est de verifier que le schema correspond bien a l architecture reelle du projet Agro IoT : frontend React, backend Laravel, base de donnees MySQL, utilisateurs par role, securite API et composants IoT.")

section('2. Elements corrects dans le diagramme')
bullets([
    'Le diagramme separe globalement l utilisateur, le backend, la base de donnees, l ESP32, les capteurs et les actionneurs.',
    'Il montre une communication HTTP entre le navigateur et le systeme applicatif.',
    'Il montre une communication SQL entre le backend et la base de donnees.',
    'Il represente les liaisons GPIO, GPIO relais ou I2C entre l ESP32, les capteurs et les actionneurs.',
    'La presence de l ESP32, des capteurs et des actionneurs est coherente avec le projet IoT.',
])

section('3. Corrections importantes')
table([
    ['Point a corriger', 'Probleme observe', 'Correction recommandee'],
    ['Dashboard Web', 'Il est place dans le Serveur Backend.', 'Le placer dans le bloc Frontend React/Vite heberge sur Vercel.'],
    ['Couche presentation', 'Elle apparait cote backend.', 'La presentation appartient au frontend React : Login, Dashboard, Historique, Alertes, Administration, Terminal.'],
    ['Plateformes de deploiement', 'Vercel, Render et Aiven ne sont pas clairement indiques.', 'Ajouter Frontend React - Vercel, Backend Laravel - Render, Base MySQL - Aiven.'],
    ['API Rest', 'Le libelle est trop general.', 'Renommer en API REST Laravel et indiquer les routes principales.'],
    ['Securite API', 'Le token et les roles ne sont pas visibles.', 'Ajouter Authorization: Bearer Token, middleware agro.auth et verification des roles.'],
    ['Acces Donnees (DAO)', 'Le projet Laravel utilise plutot Eloquent ORM.', 'Remplacer par Eloquent ORM / Acces base de donnees.'],
    ['Nombre de capteurs', 'Le diagramme indique 5 capteurs.', 'Corriger en 6 capteurs : temperature, humidite air, humidite sol, CO2, luminosite, niveau eau.'],
    ['HTTP/MQTT', 'La presence de MQTT n est pas clarifiee.', 'Si MQTT est utilise, ajouter un Broker MQTT. Sinon indiquer HTTP/HTTPS ou API ESP32 vers Laravel.'],
], [3.7*cm, 5.8*cm, 7.0*cm])

section('4. Structure de deploiement recommandee')
p('La structure suivante correspond mieux au projet actuel :')
code_block([
    '[Utilisateur : Admin / Technicien / Agriculteur]',
    '        | Navigateur Web / PWA',
    '        v',
    '[Frontend React + Vite - Vercel]',
    '        | HTTPS JSON',
    '        | Authorization: Bearer Token',
    '        v',
    '[Backend Laravel API REST - Render]',
    '        | SQL securise',
    '        v',
    '[Base de donnees MySQL - Aiven]',
])

section('5. Bloc frontend a representer')
p('Le frontend doit etre un bloc separe du backend. Il contient l interface utilisateur et les pages principales.')
table([
    ['Bloc', 'Contenu conseille'],
    ['Frontend React/Vite - Vercel', 'Login, Dashboard, Historique, Alertes, Administration, Terminal, navigation responsive, PWA, Axios.'],
    ['Flux sortant', 'Requetes HTTPS JSON vers Laravel avec Authorization: Bearer Token.'],
], [5.0*cm, 11.5*cm])

section('6. Bloc backend a representer')
p('Le backend doit representer la logique Laravel et les protections cote serveur.')
table([
    ['Bloc', 'Contenu conseille'],
    ['Backend Laravel - Render', 'API REST, authentification, generation du token, verification des roles, logique metier, audit logs.'],
    ['Securite', 'Middleware agro.auth, verification Admin / Technicien / Agriculteur, throttle sur login.'],
    ['Routes principales', '/api/auth/login, /api/auth/me, /api/measurements/latest, /api/alerts/active, /api/users, /api/actuators/{actuator}.'],
], [5.0*cm, 11.5*cm])

section('7. Bloc base de donnees')
p('La base de donnees doit etre separee et clairement nommee selon le fournisseur utilise.')
table([
    ['Element', 'Details'],
    ['Base de donnees MySQL - Aiven', 'Base actuellement utilisee en ligne. Si le fournisseur change, remplacer Aiven par le nouveau service.'],
    ['Tables importantes', 'users, profils, mesures, capteurs, alertes, actionneurs, actions, historiques, seuils, audit_logs.'],
    ['Flux', 'Connexion SQL securisee depuis Laravel vers MySQL.'],
], [5.0*cm, 11.5*cm])

story.append(PageBreak())
section('8. Bloc IoT')
p('Le diagramme doit clarifier le role de l ESP32 et la connexion aux capteurs/actionneurs.')
table([
    ['Element IoT', 'Details a afficher'],
    ['ESP32', 'Microcontroleur charge de communiquer avec les capteurs et actionneurs.'],
    ['Capteurs', 'Temperature, humidite air, humidite sol, CO2, luminosite, niveau eau.'],
    ['Actionneurs', 'Pompe irrigation, ventilateur, lampe/eclairage.'],
    ['Liaisons physiques', 'GPIO, GPIO relais, I2C selon les composants.'],
    ['Communication applicative', 'HTTP/HTTPS vers Laravel ou MQTT via Broker MQTT si cette option est retenue.'],
], [5.0*cm, 11.5*cm])

section('9. Roles utilisateurs a faire apparaitre')
table([
    ['Role', 'Acces principaux'],
    ['Administrateur', 'Dashboard, historique, alertes, administration, terminal, gestion utilisateurs, audit, seuils et actionneurs.'],
    ['Technicien', 'Dashboard, historique, alertes, terminal, resolution alertes, modification seuils, controle actionneurs.'],
    ['Agriculteur', 'Consultation dashboard, historique et alertes. Pas de gestion utilisateurs ni terminal technique.'],
], [4.2*cm, 12.3*cm])

section('10. Version textuelle finale a transmettre')
p('Voici une version courte que le collegue peut utiliser pour corriger son diagramme :')
code_block([
    'Frontend React/Vite - Vercel : Login, Dashboard, Historique, Alertes, Administration, Terminal.',
    'Backend Laravel API REST - Render : Auth, token, roles, audit, logique metier.',
    'Base MySQL - Aiven : users, profils, mesures, alertes, actionneurs, actions, seuils, audit_logs.',
    'Flux Frontend -> Backend : HTTPS JSON avec Authorization: Bearer Token.',
    'Flux Backend -> MySQL : SQL securise.',
    'ESP32 -> capteurs/actionneurs : GPIO, I2C, relais.',
    'Ajouter les roles : Admin, Technicien, Agriculteur.',
    'Corriger 5 capteurs en 6 capteurs.',
    'Clarifier HTTP/MQTT : ajouter Broker MQTT si MQTT est vraiment utilise.'
])

section('11. Conclusion')
p("Le diagramme actuel est une bonne base, mais il doit etre ajuste pour correspondre au deploiement reel. Les corrections prioritaires sont de separer le frontend du backend, d ajouter Vercel/Render/Aiven, de representer le Bearer Token et les roles Laravel, de remplacer DAO par Eloquent ORM et de corriger le nombre de capteurs.")


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#66736b'))
    canvas.drawString(2*cm, 1.15*cm, 'Agro IoT - Revue du diagramme de deploiement')
    canvas.drawRightString(A4[0]-2*cm, 1.15*cm, f'Page {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate(
    str(output), pagesize=A4, rightMargin=2*cm, leftMargin=2*cm,
    topMargin=1.8*cm, bottomMargin=1.8*cm
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(output.resolve())
