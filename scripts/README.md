# Scripts para Carga Masiva de Datos

Este directorio contiene scripts utilitarios para cargar múltiples casos a la base de datos de una sola vez.

## 🚀 Scripts Disponibles

### 1. load-sample-data.js - Cargar Datos de Muestra

Carga un conjunto predefinido de casos de ejemplo con diferentes estados y tipos de casos.

**Uso básico:**
```bash
node scripts/load-sample-data.js
```

**Limpiar todos los datos (¡CUIDADO!):**
```bash
node scripts/load-sample-data.js --clear
```

**Características:**
- ✅ Carga 7 casos de muestra con diferentes estados (Active, Completed, Other)
- ✅ Incluye diversos tipos de casos legales
- ✅ Algunos casos con contrato, otros sin especificar
- ✅ Crea notas iniciales automáticamente
- ✅ Muestra estadísticas después de la carga

### 2. csv-loader.js - Cargar desde CSV

Permite cargar casos desde un archivo CSV personalizado.

**Crear archivo CSV de ejemplo:**
```bash
node scripts/csv-loader.js --create-sample
```

**Cargar desde CSV:**
```bash
node scripts/csv-loader.js mi-archivo.csv
```

**Formato del CSV:**
```csv
clientName,caseType,status,notes,totalContract
"Nombre Cliente","Tipo de Caso","Active","Notas del caso",5000.00
"Otro Cliente","Otro Tipo","Completed","Más notas",
```

**Campos:**
- `clientName` (requerido): Nombre completo del cliente
- `caseType` (requerido): Tipo de caso legal
- `status` (opcional): Active, Completed, o Other (default: Active)
- `notes` (opcional): Notas del caso
- `totalContract` (opcional): Monto del contrato (puede estar vacío)

## 📋 Ejemplos de Uso

### Cargar datos de muestra rápidamente:
```bash
# Desde la raíz del proyecto
node scripts/load-sample-data.js
```

### Preparar y cargar tus propios datos:
```bash
# 1. Crear archivo de ejemplo
node scripts/csv-loader.js --create-sample

# 2. Editar sample-cases.csv con tus datos reales

# 3. Cargar los datos
node scripts/csv-loader.js sample-cases.csv
```

### Limpiar y recargar (desarrollo):
```bash
# ⚠️ Eliminar todos los datos existentes
node scripts/load-sample-data.js --clear

# Cargar datos frescos
node scripts/load-sample-data.js
```

## 🛠️ Uso Programático

También puedes usar estos scripts desde otros archivos JavaScript:

```javascript
const { loadSampleData, loadCustomData } = require('./scripts/load-sample-data')
const { loadFromCSV } = require('./scripts/csv-loader')

// Cargar datos personalizados
const misCasos = [
  {
    clientName: "Mi Cliente",
    caseType: "Mi Tipo",
    status: "Active",
    notes: "Notas importantes",
    totalContract: 1000.00
  }
]

loadCustomData(misCasos)

// O cargar desde CSV
loadFromCSV('mi-archivo.csv')
```

## ⚠️ Consideraciones Importantes

1. **Base de datos en producción**: Ten cuidado al ejecutar scripts en producción
2. **Duplicados**: Los scripts usan `skipDuplicates: true` para evitar errores
3. **Validaciones**: Los datos se validan según el esquema de la base de datos
4. **Backup**: Siempre haz backup antes de usar `--clear`

## 🔧 Requisitos

- Node.js instalado
- Prisma configurado
- Variables de entorno (.env) configuradas correctamente
- Conexión a la base de datos funcionando

## 📊 Tipos de Status Disponibles

- `Active`: Casos activos en progreso
- `Completed`: Casos completados/cerrados  
- `Other`: Casos en estado especial o consultoría

## 💰 Manejo de Contratos

- Puedes especificar montos decimales: `1500.50`
- Dejar vacío para casos sin contrato especificado
- Se almacena como NULL en la base de datos y muestra "N/A" en la UI
