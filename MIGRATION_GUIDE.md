# Migración de Client Cases desde SQL

Este documento explica cómo migrar los datos de Client Cases y Case Notes desde el archivo SQL de respaldo a tu base de datos actual.

## 📋 Prerequisitos

1. ✅ Archivo SQL ubicado en: `temp/u511627749_Inegol.sql`
2. ✅ Base de datos configurada y accesible
3. ✅ Variables de entorno configuradas (`.env` con `DATABASE_URL`)
4. ✅ Prisma Client generado (`npx prisma generate`)

## ⚠️ Importante - ANTES de ejecutar

### 1. Hacer un respaldo de tu base de datos

```bash
# Ejemplo para MySQL/MariaDB
mysqldump -u [usuario] -p [nombre_base_datos] > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Verificar que el archivo SQL esté en la ubicación correcta

El script buscará el archivo en: `temp/u511627749_Inegol.sql`

## 🚀 Ejecución del Script

### Paso 1: Ejecutar el script de migración

```bash
node scripts/migrate-client-cases.js
```

### Paso 2: Revisar el resumen

El script te mostrará:
- Número de Client Cases encontrados
- Número de Case Notes encontradas
- Pedirá confirmación antes de insertar datos

### Paso 3: Confirmar la migración

Cuando el script pregunte:
```
¿Deseas continuar? (si/no):
```

Escribe `si` o `s` para continuar, o `no` para cancelar.

## 📊 Qué hace el script

1. **Lee el archivo SQL** ubicado en `temp/u511627749_Inegol.sql`
2. **Extrae los datos** de las tablas:
   - `client_cases`
   - `case_notes`
3. **Verifica registros existentes** - NO sobrescribe datos
4. **Inserta nuevos registros** preservando los IDs originales
5. **Muestra progreso** cada 10 casos y 50 notas
6. **Genera un resumen** al finalizar

## 🔍 Datos Migrados

### Client Cases
- ✅ ID (preservado)
- ✅ Nombre del cliente
- ✅ Tipo de caso
- ✅ Notas
- ✅ Contrato total
- ✅ Paralegal asignado
- ✅ Fecha de creación
- ✅ Fecha de actualización
- ✅ Estado (Active/Completed)

### Case Notes
- ✅ ID (preservado)
- ✅ Contenido de la nota
- ✅ Fecha de creación
- ✅ Relación con Client Case

## 📈 Ejemplo de Salida

```
🚀 Iniciando migración de Client Cases...

📖 Leyendo archivo SQL...
🔍 Extrayendo datos de client_cases...
🔍 Extrayendo datos de case_notes...

📊 Datos encontrados:
   - Client Cases: 156
   - Case Notes: 160

⚠️  ADVERTENCIA: Este script insertará datos en tu base de datos.
   - Los registros existentes NO serán sobrescritos
   - Se recomienda hacer un respaldo antes de continuar

¿Deseas continuar? (si/no): si

📝 Migrando Client Cases...
   ✅ 10 casos migrados...
   ✅ 20 casos migrados...
   ...
   ✅ 150 casos migrados...

✅ Client Cases migrados: 156
⏭️  Client Cases saltados (ya existían): 0

📝 Migrando Case Notes...
   ✅ 50 notas migradas...
   ✅ 100 notas migradas...
   ✅ 150 notas migradas...

✅ Case Notes migradas: 160
⏭️  Case Notes saltadas: 0

🎉 ¡Migración completada!

📊 Resumen Final:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Client Cases:
     ✅ Insertados: 156
     ⏭️  Saltados: 0
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Case Notes:
     ✅ Insertadas: 160
     ⏭️  Saltadas: 0
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## ❓ Resolución de Problemas

### Error: "No se encontró el archivo SQL"
**Solución**: Verifica que el archivo `u511627749_Inegol.sql` esté en la carpeta `temp/`

### Error: "Case ID X no existe, saltando nota"
**Causa**: Una nota referencia un case que no existe o no se pudo insertar
**Solución**: Normal, el script continúa con las demás notas

### Error de conexión a la base de datos
**Solución**: Verifica tu `DATABASE_URL` en el archivo `.env`

### Registros duplicados
**No hay problema**: El script verifica IDs existentes y los salta automáticamente

## 🔄 Si necesitas volver a ejecutar

El script es **idempotente**, lo que significa que:
- ✅ Puedes ejecutarlo múltiples veces
- ✅ NO creará duplicados
- ✅ Solo insertará registros nuevos
- ✅ Saltará los que ya existan

## ✅ Verificación Post-Migración

### 1. Verificar conteo de registros

```bash
# En MySQL/MariaDB
mysql -u [usuario] -p [base_datos]

SELECT COUNT(*) as total_cases FROM client_cases;
SELECT COUNT(*) as total_notes FROM case_notes;
```

### 2. Verificar algunos registros

```sql
-- Ver los últimos 10 casos
SELECT id, clientName, caseType, status 
FROM client_cases 
ORDER BY id DESC 
LIMIT 10;

-- Ver casos con sus notas
SELECT cc.clientName, COUNT(cn.id) as num_notes
FROM client_cases cc
LEFT JOIN case_notes cn ON cc.id = cn.clientCaseId
GROUP BY cc.id
ORDER BY num_notes DESC
LIMIT 10;
```

### 3. Probar en la aplicación

1. Inicia tu aplicación: `npm run dev`
2. Navega al módulo de Client Cases
3. Verifica que los datos se muestren correctamente
4. Prueba abrir un caso y ver sus notas

## 📞 Soporte

Si encuentras algún problema durante la migración:
1. Revisa los mensajes de error en la consola
2. Verifica que tu base de datos esté accesible
3. Asegúrate de tener permisos de escritura
4. Revisa el archivo SQL para datos corruptos

## 🎯 Siguiente Paso

Una vez completada la migración exitosamente:
- ✅ Verifica los datos en la aplicación
- ✅ Prueba crear nuevos casos
- ✅ Asegúrate de que las relaciones funcionen
- ✅ Guarda el archivo SQL en un lugar seguro como respaldo
