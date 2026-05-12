# Sistema de Registro de Entregas con Foto de Evidencia

## Descripción
Sistema completo para que los domiciliarios registren el historial de entregas con:
- Fecha y hora de entrega
- Nombre de quien recibe
- Dirección y ciudad
- Foto de evidencia capturada con la cámara web
- Observaciones

## Archivos Creados

### 1. **API Routes**
- `app/api/historial_entrega/route.ts` - API para obtener historial y registrar entregas

### 2. **Componentes React**
- `app/user/domiciliario/HistorialEntregas/HistorialEntregasClient.tsx` - Cliente principal
- `app/user/domiciliario/HistorialEntregas/EntregaCard.tsx` - Card individual de entrega
- `app/user/domiciliario/HistorialEntregas/CameraCapture.tsx` - Componente de cámara
- `app/user/domiciliario/HistorialEntregas/page.tsx` - Página (actualizada)

### 3. **Base de Datos**
- `migrations/001_add_evidencia_columns.sql` - Script SQL para agregar columnas

## Instalación

### Paso 1: Ejecutar Migración SQL

Conecta a tu base de datos PostgreSQL y ejecuta:

```sql
-- Para Neon DB (como en tu caso)
ALTER TABLE public.entrega
ADD COLUMN IF NOT EXISTS foto_evidencia TEXT NULL;

COMMENT ON COLUMN public.entrega.foto_evidencia IS 'Foto de evidencia de la entrega en formato Base64';

CREATE INDEX IF NOT EXISTS idx_entrega_domiciliario_estado 
ON public.entrega(id_domiciliario, estado_entrega);

CREATE INDEX IF NOT EXISTS idx_entrega_fecha_entrega 
ON public.entrega(fecha_entrega DESC);
```

### Paso 2: Verificar Instalación

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'entrega'
ORDER BY ordinal_position;
```

### Paso 3: Prueba en la Aplicación

1. Navega a: `/user/domiciliario/HistorialEntregas`
2. Verás el historial de entregas del domiciliario autenticado
3. Puedes filtrar por estado
4. Para registrar una entrega:
   - Click en "Registrar Entrega"
   - La cámara se abrirá
   - Toma una foto
   - Confirma para guardar

## Características

### Historial de Entregas
- ✅ Filtrado por estado (Todos, Entregado, Pendiente, En camino, No entregado)
- ✅ Paginación (10 entregas por página)
- ✅ Información completa de cada entrega
- ✅ Vista de fotos con modal

### Captura de Foto
- ✅ Acceso a cámara web del dispositivo
- ✅ Preview antes de confirmar
- ✅ Opción de retomar foto
- ✅ Almacenamiento en Base64 en BD

### Seguridad
- ✅ Solo domiciliarios autenticados pueden ver su historial
- ✅ Solo pueden registrar entregas que les pertenecen
- ✅ Validación en backend

## API Endpoints

### GET `/api/historial_entrega`
Obtiene el historial de entregas del domiciliario autenticado

**Parámetros Query:**
- `estado` (opcional): "entregado", "pendiente", "en camino", "no entregado"
- `limit` (opcional): Default 20
- `offset` (opcional): Default 0

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "idEntrega": 1,
      "idPedido": 123,
      "nombreRecibe": "Juan Pérez",
      "direccionEntrega": "Calle 123",
      "ciudad": "Bogotá",
      "estadoEntrega": "entregado",
      "fechaSalida": "2024-01-15T08:00:00",
      "fechaEntrega": "2024-01-15T10:00:00",
      "fotoEvidencia": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "costoEnvio": "5000",
      "observacion": null
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "pages": 3
  }
}
```

### POST `/api/historial_entrega`
Registra una entrega con foto de evidencia

**Body:**
```json
{
  "idEntrega": 1,
  "nombreRecibe": "Juan Pérez",
  "fotoEvidencia": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "observacion": "Entrega completada sin problemas"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "message": "Entrega registrada exitosamente"
}
```

## Estructura de Datos en BD

### Tabla `entrega` (después de migración)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_entrega | INT PRIMARY KEY | ID único |
| id_pedido | INT | Referencia al pedido |
| id_domiciliario | INT | Domiciliario asignado |
| nombre_recibe | VARCHAR(150) | Nombre de quien recibe |
| direccion_entrega | VARCHAR(255) | Dirección |
| ciudad | VARCHAR(100) | Ciudad |
| estado_entrega | VARCHAR(20) | Estado actual |
| fecha_salida | TIMESTAMP | Fecha de salida |
| fecha_entrega | TIMESTAMP | Fecha de entrega |
| **foto_evidencia** | TEXT | **Foto en Base64 (NUEVA)** |
| costo_envio | NUMERIC(12,2) | Costo |
| observacion | TEXT | Observaciones |

## Notas Importantes

### Almacenamiento de Fotos
Las fotos se guardan en **Base64** dentro de la columna `foto_evidencia` de tipo TEXT. Esto:
- ✅ No requiere almacenamiento externo (Cloudinary, S3, etc.)
- ✅ Es simple de implementar
- ⚠️ Aumenta tamaño de BD (foto JPEG típica: 100-500 KB base64)

**Si necesitas optimizar espacio en BD:**
Cambia a almacenamiento externo (CloudinaryStorage, AWS S3, Firebase Storage)

### Límites de Foto
- Típicamente: máx 5-10 MB por foto en navegadores modernos
- Se comprime JPEG a 85% de calidad para reducir tamaño

### Navegadores Soportados
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari (iOS 14.5+)
- ✅ Edge
- ⚠️ Opera (con permisos)

## Próximos Pasos (Opcionales)

### 1. Optimización de Almacenamiento
```javascript
// Usar Cloudinary, AWS S3 o Firebase Storage
// En lugar de Base64
```

### 2. Compresión de Imágenes
```javascript
// Agregar librería: sharp o canvas-based compression
```

### 3. Firma Digital
```javascript
// Agregar canvas para capturar firma digital además de foto
```

### 4. Notificaciones
```javascript
// Notificar al cliente cuando su paquete fue entregado
```

### 5. Historial de Cambios
```javascript
// Grabar cada cambio de estado en una tabla de auditoría
```

## Troubleshooting

### La cámara no funciona
- Verifica permisos en navegador
- Asegúrate de usar HTTPS (requerido para mediaDevices)
- En localhost funciona, pero en producción necesita HTTPS

### Fotos no se guardan
- Verifica que la sesión de usuario sea válida
- Revisa console del navegador para errores
- Verifica logs del servidor

### Base64 muy grande
- Reduce resolución de cámara en CameraCapture.tsx
- Aumenta compresión JPEG (línea 53: toDataURL third param)

## Soporte
Para dudas o errores, verifica:
1. Los logs del servidor
2. Network tab en DevTools
3. Permisos de acceso a BD
