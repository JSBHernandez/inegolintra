# Alternativa con Outlook/Hotmail (más fácil de configurar)
# Reemplaza estas líneas en tu .env si Gmail no funciona:

SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="tu-email@outlook.com"  # o @hotmail.com
SMTP_PASS="tu-contraseña-normal"  # La contraseña normal de Outlook
SMTP_FROM="Inegol Intranet <tu-email@outlook.com>"

# O con Gmail pero puerto diferente:
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="sebastianbhforjobs@gmail.com"
SMTP_PASS="tu-contraseña-de-aplicacion"
SMTP_FROM="Inegol Intranet <sebastianbhforjobs@gmail.com>"
