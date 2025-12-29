# Usar imagen oficial de Node.js basada en Debian (versión más actual)
FROM node:22-bullseye

ARG NGROK_AUTH_TOKEN

# Instalar dependencias adicionales y PowerShell 7
RUN apt-get update && apt-get install -y \
    git \
    wget \
    apt-transport-https \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Instalar PowerShell 7
RUN wget -q https://packages.microsoft.com/config/debian/11/packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y powershell \
    && rm -rf /var/lib/apt/lists/*

# Instalar módulo de PowerShell para Exchange Online
RUN pwsh -Command "Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber"

# Instalar ngrok
RUN wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
RUN tar -xvzf ngrok-v3-stable-linux-amd64.tgz
RUN mv ngrok /usr/local/bin/ngrok \
    && chmod +x /usr/local/bin/ngrok \
    && rm ngrok-v3-stable-linux-amd64.tgz

# Configurar ngrok con el token de autenticación
RUN ngrok config add-authtoken ${NGROK_AUTH_TOKEN}

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias primero
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Crear script de inicio
RUN echo '#!/bin/bash\n\
# Iniciar ngrok en segundo plano\n\
nohup ngrok http 8080 --log=stdout --log-level=info > /app/ngrok.log 2>&1 &\n\
# Esperar un momento para que ngrok se inicie\n\
sleep 10\n\
# Mostrar la URL pública\n\
echo "Ngrok is starting... Check /app/ngrok.log for details"\n\
# Iniciar la aplicación principal\n\
exec npx tsx ./src/index.ts run start' > /app/start.sh \
    && chmod +x /app/start.sh

# Mantener el contenedor en ejecución para trabajo manual
CMD ["/app/start.sh"]