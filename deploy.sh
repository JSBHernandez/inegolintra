#!/bin/bash
# Script de despliegue para Hostinger

echo "🚀 Iniciando despliegue en Hostinger..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --only=production

# Generar cliente de Prisma
echo "🗄️ Generando cliente de Prisma..."
npx prisma generate

# Ejecutar migraciones
echo "🔄 Ejecutando migraciones de base de datos..."
npx prisma migrate deploy

# Iniciar aplicación
echo "✅ Iniciando aplicación..."
npm start
