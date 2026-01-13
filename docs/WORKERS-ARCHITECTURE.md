# Arquitectura de Workers

## 📋 Resumen

El sistema se divide en **3 procesos independientes** para asegurar escalabilidad y resiliencia:

1. **Express API** - Servidor HTTP que recibe webhooks
2. **ValidationWorker** - Valida mensajes y autoriza scraping
3. **ScraperWorker** - Ejecuta scraping con Playwright

## 🔄 Flujo Completo

```
┌─────────────────┐
│  Microsoft 365  │
└────────┬────────┘
         │ POST /result/webhook
         │ { messageId, clientState }
         ▼
┌─────────────────────────────────┐
│  Express API (index.ts)         │
│  - Valida clientState           │
│  - Envía messageId a SQS        │
│  - Responde 202 inmediatamente  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  SQS_VALIDATION_QUEUE_URL       │
│  { messageId }                  │
│  VisibilityTimeout: 60s         │
└────────┬────────────────────────┘
         │ polling cada 30s
         ▼
┌─────────────────────────────────┐
│  ValidationWorker               │
│  - Busca mensaje en Outlook     │
│  - Valida sender autorizado     │
│  - Guarda Result en BD          │
│  - Envía a cola de scraping     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  SQS_SCRAPER_QUEUE_URL          │
│  { messageId, sender, subject } │
│  VisibilityTimeout: 180s        │
└────────┬────────────────────────┘
         │ polling cada 30s
         ▼
┌─────────────────────────────────┐
│  ScraperWorker                  │
│  - Ejecuta Playwright           │
│  - Login + 2FA                  │
│  - Busca email                  │
│  - Captura screenshot           │
└─────────────────────────────────┘
```

## 🚀 Cómo ejecutar

### Desarrollo (3 terminales)

```bash
# Terminal 1 - Express API
npm run dev

# Terminal 2 - ValidationWorker
npm run dev:validation-worker

# Terminal 3 - ScraperWorker
npm run dev:scraper-worker
```

### Producción (Docker/PM2)

```bash
# Con PM2
pm2 start dist/index.js --name api
pm2 start dist/validation-worker-main.js --name validation-worker
pm2 start dist/scraper-worker-main.js --name scraper-worker

# Con Docker Compose (crear docker-compose.yml)
docker-compose up -d
```

## 📦 Colas SQS

### Cola 1: Validación (`SQS_VALIDATION_QUEUE_URL`)

**Propósito:** Recibe messageId desde webhook  
**Timeout:** 60 segundos  
**Procesador:** ValidationWorker

**Payload:**

```json
{
  "messageId": "AAMkAGM2..."
}
```

**DLQ recomendada:** Después de 3 reintentos

### Cola 2: Scraping (`SQS_SCRAPER_QUEUE_URL`)

**Propósito:** Recibe datos para scraping  
**Timeout:** 180 segundos (3 minutos)  
**Procesador:** ScraperWorker

**Payload:**

```json
{
  "messageId": "AAMkAGM2...",
  "sender": "user@example.com",
  "subject": "Test Subject"
}
```

**DLQ recomendada:** Después de 2 reintentos

## 🔧 Variables de Entorno

```env
# API Server
PORT=8080

# SQS - Colas separadas
SQS_VALIDATION_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/xxx/validation-queue
SQS_SCRAPER_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/xxx/scraper-queue

# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Database
SUPABASE_URL=
SUPABASE_SERVICE_ROLE=

# Outlook
OUTLOOK_CLIENT_STATE=
APP_ID=
CLIENT_SECRET=
TENANT_ID=

# Scraper
SCRAPER_EMAIL=
SCRAPER_PASSWORD=
```

## ⚠️ Ventajas de esta arquitectura

### ✅ Resiliencia

- Si Playwright crashea, no afecta Express
- Si Express se reinicia, workers siguen procesando
- Cada proceso puede reiniciarse independientemente

### ✅ Escalabilidad

- Puedes ejecutar múltiples instancias de ScraperWorker
- ValidationWorker puede procesar cientos de mensajes/minuto
- Express responde en < 500ms al webhook

### ✅ Observabilidad

- Logs separados por proceso
- Métricas de SQS (mensajes en cola, tiempos de procesamiento)
- DLQ para mensajes fallidos

### ✅ Mantenibilidad

- Código desacoplado
- Fácil de testear cada componente
- Cambios en scraping no afectan validación

## 🐛 Troubleshooting

### Webhook responde lento

- ✅ Webhook solo envía a SQS (< 100ms)
- ❌ Si tarda más, revisar latencia de SQS

### Mensajes duplicados en scraping

- Verificar que ValidationWorker elimine mensajes después de procesar
- Revisar VisibilityTimeout de la cola de validación

### Scraping falla constantemente

- Revisar logs de ScraperWorker
- Aumentar VisibilityTimeout si tarda > 180s
- Verificar credenciales y 2FA

### Mensajes no se procesan

- Verificar que workers estén corriendo
- Revisar DLQ de cada cola
- Verificar credenciales de AWS

## 📊 Monitoreo recomendado

1. **CloudWatch Metrics para SQS:**

   - `ApproximateNumberOfMessagesVisible`
   - `ApproximateAgeOfOldestMessage`
   - `NumberOfMessagesSent`

2. **Logs estructurados:**

   - ValidationWorker: Success rate, processing time
   - ScraperWorker: Playwright execution time, errors

3. **Alertas:**
   - DLQ no vacía > 5 mensajes
   - ValidationWorker sin procesar por > 5 min
   - ScraperWorker tarda > 3 minutos

## 🔐 Seguridad

- ✅ Webhook valida `clientState` antes de enviar a SQS
- ✅ ValidationWorker valida sender autorizado
- ✅ Credenciales solo en variables de entorno
- ✅ Cada worker solo tiene permisos necesarios
