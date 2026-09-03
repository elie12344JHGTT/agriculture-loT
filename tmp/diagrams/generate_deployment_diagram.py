from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out = Path('output/images/diagramme_deploiement_agro_iot.png')
out.parent.mkdir(parents=True, exist_ok=True)

W, H = 1800, 1200
img = Image.new('RGB', (W, H), '#eef3ef')
d = ImageDraw.Draw(img)

# Fonts
font_dir = Path('C:/Windows/Fonts')
def font(name, size):
    for candidate in [font_dir/name, font_dir/'arial.ttf']:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()

f_title = font('arialbd.ttf', 42)
f_h = font('arialbd.ttf', 26)
f_b = font('arial.ttf', 20)
f_s = font('arial.ttf', 17)
f_sm = font('arial.ttf', 15)
f_bold = font('arialbd.ttf', 19)

GREEN = '#2e7d32'
DARK = '#123f28'
BORDER = '#b7cbbd'
TEXT = '#1f2a24'
MUTED = '#5d6d64'
BLUE = '#1f6f8b'
YELLOW = '#f6e6a7'
WHITE = '#ffffff'
CARD = '#fbfdfb'
ORANGE = '#f2b35d'


def rounded_box(x, y, w, h, fill, outline=BORDER, radius=22, width=3):
    d.rounded_rectangle([x, y, x+w, y+h], radius=radius, fill=fill, outline=outline, width=width)


def center_text(text, box, fnt, fill=TEXT, line_gap=4):
    x, y, w, h = box
    lines = text.split('\n')
    heights = []
    widths = []
    for line in lines:
        bb = d.textbbox((0,0), line, font=fnt)
        widths.append(bb[2]-bb[0])
        heights.append(bb[3]-bb[1])
    total_h = sum(heights) + line_gap*(len(lines)-1)
    cy = y + (h-total_h)/2
    for line, tw, th in zip(lines, widths, heights):
        d.text((x+(w-tw)/2, cy), line, font=fnt, fill=fill)
        cy += th + line_gap


def text_block(lines, x, y, fnt=f_s, fill=TEXT, line_h=24):
    for i, line in enumerate(lines):
        d.text((x, y+i*line_h), line, font=fnt, fill=fill)


def arrow(x1, y1, x2, y2, color=DARK, width=4, label=None, label_offset=(0,0)):
    d.line([x1, y1, x2, y2], fill=color, width=width)
    # arrowhead
    import math
    angle = math.atan2(y2-y1, x2-x1)
    size = 16
    pts = []
    for a in [angle + math.pi*0.82, angle - math.pi*0.82]:
        pts.append((x2 + size*math.cos(a), y2 + size*math.sin(a)))
    d.polygon([(x2,y2), pts[0], pts[1]], fill=color)
    if label:
        lx = (x1+x2)/2 + label_offset[0]
        ly = (y1+y2)/2 + label_offset[1]
        bb = d.textbbox((0,0), label, font=f_sm)
        pad = 8
        d.rounded_rectangle([lx-pad, ly-pad, lx+(bb[2]-bb[0])+pad, ly+(bb[3]-bb[1])+pad], radius=9, fill='#ffffff', outline='#d6e3da')
        d.text((lx, ly), label, font=f_sm, fill=color)

# Title
center_text('Diagramme de deploiement - Agro IoT', (0, 30, W, 70), f_title, DARK)
center_text('Architecture corrigee : Frontend React/Vercel, Backend Laravel/Render, MySQL/Aiven, ESP32 et composants IoT', (0, 90, W, 36), f_s, MUTED)

# User roles block
rounded_box(80, 205, 300, 230, '#ffffff', '#d2e2d7')
center_text('Utilisateurs', (80, 220, 300, 36), f_h, DARK)
text_block(['- Administrateur', '- Technicien', '- Agriculteur', '', 'Acces via navigateur', 'ou application PWA'], 120, 275, f_b, TEXT, 29)

# Frontend
rounded_box(520, 170, 420, 310, '#e2f3e6', '#8ac49b')
center_text('Frontend React + Vite\nHebergement : Vercel', (520, 190, 420, 70), f_h, DARK)
text_block(['Pages :', '- Login', '- Dashboard', '- Historique', '- Alertes', '- Administration', '- Terminal', '', 'Axios + PWA + Responsive'], 565, 280, f_s, TEXT, 24)

# Backend
rounded_box(1120, 170, 520, 350, '#fff9e5', '#d6b24c')
center_text('Backend Laravel API REST\nHebergement : Render', (1120, 190, 520, 70), f_h, '#5a4100')
text_block(['Services :', '- Authentification + token signe', '- Middleware agro.auth', '- Verification des roles', '- Audit logs', '- Logique alertes / seuils / actionneurs', '- Eloquent ORM'], 1170, 285, f_s, TEXT, 24)

# DB
rounded_box(1140, 680, 480, 260, '#e5f0fb', '#85a9cf')
center_text('Base de donnees MySQL\nAiven', (1140, 700, 480, 70), f_h, '#17456c')
text_block(['Tables principales :', 'users, profils, mesures, capteurs,', 'alertes, actionneurs, actions,', 'historiques, seuils, audit_logs'], 1190, 800, f_s, TEXT, 25)

# ESP32
rounded_box(520, 700, 420, 220, '#f7ede1', '#d99a55')
center_text('Microcontroleur ESP32', (520, 720, 420, 45), f_h, '#724100')
text_block(['Firmware ESP32', 'Communication IoT :', '- HTTP/HTTPS vers Laravel', '- ou MQTT si Broker ajoute'], 565, 785, f_s, TEXT, 26)

# Sensors
rounded_box(120, 660, 300, 250, '#ffffff', '#d2e2d7')
center_text('6 Capteurs', (120, 680, 300, 40), f_h, DARK)
text_block(['- Temperature', '- Humidite air', '- Humidite sol', '- CO2', '- Luminosite', '- Niveau eau'], 160, 740, f_s, TEXT, 27)

# Actuators
rounded_box(120, 955, 300, 170, '#ffffff', '#d2e2d7')
center_text('Actionneurs', (120, 970, 300, 35), f_h, DARK)
text_block(['- Pompe irrigation', '- Ventilateur', '- Lampe / eclairage'], 160, 1025, f_s, TEXT, 29)

# Security small block
rounded_box(980, 545, 320, 95, '#ffffff', '#cfded4')
center_text('Securite API\nAuthorization: Bearer Token', (980, 555, 320, 75), f_bold, DARK)

# Arrows
arrow(380, 320, 520, 320, DARK, 4, 'Navigateur / PWA', (-70, -42))
arrow(940, 320, 1120, 320, GREEN, 4, 'HTTPS JSON', (-70, -45))
arrow(955, 375, 1120, 375, BLUE, 4, 'Bearer Token', (-60, 16))
arrow(1380, 520, 1380, 680, BLUE, 4, 'SQL securise', (18, -8))
arrow(940, 810, 1140, 810, BLUE, 4, 'Mesures / etats', (-80, -45))
arrow(730, 700, 730, 480, ORANGE, 4, 'Commandes API', (20, -10))
arrow(520, 810, 420, 785, ORANGE, 4, 'GPIO / I2C', (-112, -38))
arrow(520, 870, 420, 1035, ORANGE, 4, 'GPIO relais', (-125, 20))

# Backend routes note
rounded_box(1120, 965, 520, 130, CARD, '#d6e3da')
center_text('Routes API principales', (1120, 978, 520, 30), f_bold, DARK)
text_block(['/api/auth/login   /api/auth/me   /api/users', '/api/measurements/latest   /api/alerts/active', '/api/actuators/{actuator}   /api/access-logs'], 1160, 1025, f_sm, TEXT, 22)

# Legend
rounded_box(520, 955, 420, 145, CARD, '#d6e3da')
center_text('Regles de roles cote Laravel', (520, 970, 420, 30), f_bold, DARK)
text_block(['Admin : utilisateurs, audit, seuils, actionneurs', 'Technicien : alertes, seuils, actionneurs', 'Agriculteur : consultation dashboard / historique / alertes'], 545, 1015, f_sm, TEXT, 22)

# Footer
d.text((80, 1150), 'Agro IoT - Diagramme de deploiement corrige', font=f_sm, fill=MUTED)
d.text((1360, 1150), 'Frontend -> Backend -> Base de donnees + IoT', font=f_sm, fill=MUTED)

img.save(out, quality=95)
print(out.resolve())
