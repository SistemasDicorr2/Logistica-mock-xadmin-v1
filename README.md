# Panel de Logística - XAdmin Web

Mock frontend estático para un módulo de logística quirúrgica compatible con XAdmin Web.

El proyecto usa HTML, CSS, Bootstrap 4, JavaScript simple, jQuery, Leaflet y archivos JSON locales. No requiere backend, build step ni servidor Node.

## Estructura

```text
/
  index.html
  logistica_dashboard.html
  logistica_mobile.html
  logistica.js
  logistica.css
  /data
    cirugias.json
    eventos.json
    usuarios.json
  README.md
```

## Demo

Dashboard:

```text
/logistica_dashboard.html
```

Mobile:

```text
/logistica_mobile.html
```

Entrada simple:

```text
/index.html
```

## Uso Local

La forma recomendada es servir la carpeta como sitio estático para que `fetch` pueda leer los JSON:

```bash
python -m http.server 8080
```

Luego abrir:

```text
http://localhost:8080/
http://localhost:8080/logistica_dashboard.html
http://localhost:8080/logistica_mobile.html
```

También puede abrirse el HTML directo con doble click. En ese caso algunos navegadores bloquean `fetch` sobre `file://`; `logistica.js` conserva un fallback embebido para que la demo siga funcionando.

## Datos Mock

Los datos principales se cargan desde:

- `./data/cirugias.json`
- `./data/eventos.json`
- `./data/usuarios.json`

Cada cirugía mock incluye expediente RDP, paciente, cliente, médico, fecha, estado general, preparación, institución, dirección legible y coordenadas internas.

## Reglas Del Mock

Estado general permitido:

- Pendiente
- Autorizado
- En tránsito

Preparación permitida:

- Sin preparar
- Congelado
- Congelado con faltantes
- Retirado
- Enviado

Acciones disponibles:

- `Marcar como Retirado`: cambia solo `Preparación` a `Retirado`.
- `Marcar como Enviado`: cambia `Preparación` a `Enviado` y, si corresponde, deriva `Estado` a `En tránsito`.
- `Modificar estado`: cambia solo `Estado`.
- `Agregar nota`: agrega trazabilidad sin cambiar Estado ni Preparación.
- `Reportar problema`: requiere nota y no cambia Estado ni Preparación automáticamente.

## Geolocalización

La geolocalización se solicita al confirmar acciones. Si no hay permiso o ubicación disponible, se bloquea la confirmación.

La UI no muestra lat/lng crudo. La trazabilidad muestra una ubicación legible, por ejemplo:

```text
Bolívar 1334, Corrientes
```

Internamente el mock conserva lat/lng para mapa y futura integración.

## Deploy En Vercel

Este proyecto funciona como sitio estático.

Pasos:

1. Subir estos archivos a un repositorio de GitHub.
2. Importar el repositorio en Vercel.
3. Usar la configuración por defecto, sin framework.
4. Abrir `/`, `/logistica_dashboard.html` o `/logistica_mobile.html`.

No se necesita `package.json`, backend, Express ni rutas dinámicas.

## Integración Futura

El punto principal para conectar backend está en `registerLogisticEvent` dentro de `logistica.js`.

La carga inicial desde JSON puede reemplazarse por endpoints reales de XAdmin/RDP cuando exista backend.
