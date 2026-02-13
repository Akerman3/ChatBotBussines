# 🚀 Despliegue en Oracle Cloud (Always Free)

Sigue estos pasos una vez que tengas acceso a tu consola de Oracle Cloud:

## 1. Crear la Instancia de Computación
1. Ve al menú (hamburguesa) -> **Computate** -> **Instances**.
2. Dale a **Create Instance**.
3. **Imagen**: Elige **Ubuntu 22.04** o **Oracle Linux 8**.
4. **Shape (Forma)**: 
   - Busca el que dice **Ampere (Arm-based processor)**.
   - Configúralo con: **4 OCPUs** y **24 GB de RAM**. (Es el máximo gratuito).
   - *Nota: Si no hay disponibilidad de Ampere, elige la **VM.Standard.E2.1.Micro** (la de 1GB RAM).*
5. **Networking**: Deja todo por defecto, pero asegúrate de que diga "Assign a public IPv4 address".
6. **SSH Keys**: Dale a **Save Private Key** (¡No pierdas este archivo, es tu llave para entrar!).
7. Dale a **Create**.

## 2. Abrir los Puertos (Firewall)
Para que tu App de Android pueda hablar con el bot:
1. En la página de tu instancia, haz clic en tu **Subnet**.
2. Haz clic en **Default Security List**.
3. Dale a **Add Ingress Rules**:
   - Source CIDR: `0.0.0.0/0`
   - Protocol: `TCP`
   - Destination Port Range: `3001` (El de tu servidor)
   - Description: `WhatsApp Bot Socket`

## 3. Comandos de Instalación (Copiar y Pegar)
Conéctate por SSH y ejecuta esto:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar dependencias para el navegador (WhatsApp-web.js)
sudo apt-get install -y libgbm-dev wget unzip fontconfig locales gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils

# Instalar PM2 para que el bot no se apague
sudo npm install -y pm2 -g

# Clonar tu código (Deberás subirlo a GitHub primero)
# git clone TU_REPO
# cd server
# npm install
# pm2 start index.js
```

## 4. Conectar la App de Android
En tu `App.tsx` (Frontend), deberás cambiar:
`const socket = io('http://localhost:3001');`
por:
`const socket = io('http://TU_IP_DE_ORACLE:3001');`
