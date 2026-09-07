# 🧹 Ad Sparkling Cleaning — Ecosistema Digital v2

**Landing pública + Panel administrativo completo** para el negocio de limpieza residencial de Anggie en Miami-Dade & Broward, FL.

---

## 🎯 ¿Qué incluye esta versión?

### Landing Pública (`index.html`)
- ✅ **Sin precios visibles** — solo servicios incluidos, adicionales y "no incluido"
- ✅ **Galería de fotos** (placeholder listo para reemplazar)
- ✅ **Formulario de solicitud de cotización** — el cliente describe su hogar, selecciona adicionales con burbujas, y escribe notas
- ✅ **Los adicionales y "no incluidos" son dinámicos** — se configuran desde el panel de Anggie
- ✅ **Responsive** — se ve bien en móvil

### Panel Administrativo (`admin.html`)
- ✅ **Funciona 100% offline** con localStorage — no necesita Supabase para operar
- ✅ **Dashboard** — ingresos, gastos, ganancia neta, margen, clientes activos, citas próximas, clientes inactivos (+30 días), solicitudes nuevas
- ✅ **Solicitudes (Leads)** — ver quién pidió cotización, cambiar estado, enviar WhatsApp pre-llenado, cotizar con precio personalizado, convertir a cliente
- ✅ **Clientes** — CRUD completo (crear, editar, eliminar, buscar), cambiar estado (activo/pausado/inactivo), agendar cita rápida
- ✅ **Citas** — CRUD completo, autocompletado de precio desde cliente, registrar tiempo de limpieza, marcar como completada
- ✅ **Gastos** — registrar por categoría, eliminar, ver totales
- ✅ **Cotizador** — tabla de precios de referencia visible, cálculo automático, **pero Anggie puede ajustar el precio final manualmente**, enviar por WhatsApp, guardar como lead o cliente
- ✅ **Finanzas** — gráfico de barras ingresos vs gastos (últimos 6 meses), gráfico circular de gastos por categoría (mes actual)
- ✅ **Configuración** — editar adicionales, "no incluidos", categorías de gastos, datos de empresa. Todo se refleja en la landing automáticamente.
- ✅ **Datos de demo precargados** — para que Anggie vea cómo funciona inmediatamente
- ✅ **Resetear datos** — botón de emergencia para borrar todo y empezar de cero

---

## 🚀 Despliegue (5 minutos)

### Opción 1: Vercel (recomendado)
1. Ve a https://vercel.com/new
2. Arrastra la carpeta `ad-sparkling-cleaning-v2`
3. Listo — tendrás una URL como `https://ad-sparkling-cleaning.vercel.app`

### Opción 2: Netlify
1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta
3. Listo

### Opción 3: GitHub Pages
1. Sube la carpeta a un repo de GitHub
2. Activa GitHub Pages en Settings
3. Listo

---

## 📱 Cómo usar

### Para Anggie (panel admin)
1. Abre `https://TU-URL.vercel.app/admin.html`
2. El panel carga con datos de demo para que explores
3. Para empezar de verdad: ve a **Configuración** → **Resetear todos los datos** → escribe BORRAR
4. Personaliza adicionales, no-incluidos y categorías de gastos
5. Empieza a recibir solicitudes desde la landing

### Para clientes (landing)
1. Abren `https://TU-URL.vercel.app`
2. Llenan el formulario de solicitud
3. La solicitud aparece instantáneamente en el panel de Anggie

---

## 🔧 Personalización rápida

### Cambiar número de WhatsApp
Edita `assets/js/admin.js` línea 55 y `assets/js/app.js` (busca 13050000000).

### Agregar fotos reales a la galería
1. Sube fotos a `assets/images/`
2. Ve al panel → **Configuración** → (próximamente: subir fotos desde el panel)
3. Por ahora, edita `assets/js/admin.js` en `initData()` → `gallery: ['assets/images/foto1.jpg', ...]`

### Cambiar precios de referencia
Edita el objeto `PRICING` en `assets/js/admin.js` (líneas 22-29).

---

## 🗄 Base de datos

Todo se guarda en **localStorage del navegador**.

| Key | Qué guarda |
|-----|-----------|
| `asc_config` | Configuración de empresa, adicionales, no-incluidos, categorías |
| `asc_leads` | Solicitudes de cotización |
| `asc_clients` | Clientes activos |
| `asc_appointments` | Citas/visitas |
| `asc_expenses` | Gastos |
| `asc_initialized` | Flag de datos de demo cargados |

**Importante:** Si Anggie limpia caché o cambia de navegador, pierde los datos. Para producción real, conecta Supabase (instrucciones en v1).

---

## 📊 Flujo de trabajo recomendado

1. **Cliente llena formulario** en la landing
2. **Anggie ve la solicitud** en Dashboard → Solicitudes
3. **Anggie cotiza** usando el Cotizador (tabla de referencia + ajuste manual)
4. **Anggie envía WhatsApp** con precio personalizado
5. **Cliente confirma** → Anggie convierte lead a cliente
6. **Anggie agenda cita** desde el panel
7. **Después de limpiar**, marca cita como completada y registra tiempo
8. **Registra gastos** semanalmente
9. **Revisa Finanzas** mensualmente para ver ganancias reales

---

Hecho con ❤️ para Ad Sparkling Cleaning LLC
