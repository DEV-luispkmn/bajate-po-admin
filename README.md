# Bájate Po — Panel Web de Administración

Panel web administrativo (**Comandancia Web**) de **Bájate Po**, construido con React, TypeScript, Vite y Tailwind CSS para operar sobre la API REST de `bajate-po-backend`.

## Stack

- **React** `18.3.1` y **TypeScript** `^5.7.3`
- **Vite** `^6.0.7`
- **Tailwind CSS** `^3.4.17` + PostCSS / Autoprefixer
- **Iconografía:** `lucide-react`

## Funcionalidades principales

- **Acceso restringido (`LoginView`):** autenticación de cuentas con rol de administrador, limpieza reactiva de errores, toggle para mostrar/ocultar contraseña y manejo inline de fallos sin diálogos nativos del navegador.
- **Layout y navegación (`Sidebar`, `Header`):**
  - Barra lateral colapsable a **modo riel compacto** con persistencia en `localStorage`, contadores de tareas pendientes y tooltips al pasar el puntero o enfocar con teclado.
  - Cabecera superior con botón de sincronización en vivo, estampa de última actualización y confirmación de cierre de sesión.
- **Puesto de Mando (`DashboardView`):** resumen general de métricas operativas y alertas rápidas hacia canchas en revisión o tickets pendientes.
- **Gestión de Canchas (`CanchasView`):**
  - Buscador en tiempo real, filtros por estado y región, ordenamiento y alternancia entre vista cuadrícula y tabla compacta.
  - Expediente técnico con galería de fotos, edición de datos/coordenadas, confirmación táctica antes de aprobar/rechazar/desactivar/reactivar y reasignación entre cancha de equipo o cancha abierta comunitaria.
- **Gestión de Equipos (`EquiposView`) y Operadores (`JugadoresView`):** búsqueda en tiempo real, consulta de fichas, activación/deshabilitación de equipos y administración de permisos de operadores.
- **Buzón de Tickets (`TicketsView`):**
  - Buscador en vivo, filtros por tipo (`CANCHA`, `SUGERENCIA`, `PROBLEMA`, `IDEA`, `OTRO / REACTIVACIÓN`) y por estado (`PENDIENTE`, `EN_REVISION`, `RESPONDIDO`, `CERRADO`).
  - Visor integrado para fotografías adjuntas en tickets de cancha (con ampliación tipo lightbox) y cierre rápido de modales con tecla `Escape`.

## Requisitos

- Node.js y npm
- Backend `bajate-po-backend` en ejecución (por defecto en `http://localhost:8080`)

## Instalación y ejecución local

### 1. Configurar variable de entorno (opcional)

Por defecto, `src/api.ts` apunta a `http://localhost:8080`. Si tu backend corre en otra URL, crea un archivo `.env` en `bajate-po-admin`:

```dotenv
VITE_API_URL="http://localhost:8080"
```

### 2. Instalar dependencias e iniciar servidor de desarrollo

Desde `bajate-po-admin`:

```bash
npm ci
npm run dev
```

El servidor de desarrollo queda disponible en `http://localhost:5173`.

### 3. Compilación para producción

```bash
npm run build
```

Genera la salida en `dist/`. Si `bajate-po-backend` y `bajate-po-admin` comparten carpeta padre, el backend detecta `../bajate-po-admin/dist` y publica el panel automáticamente en `/admin`.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor Vite de desarrollo en el puerto `5173` |
| `npm run build` | Verifica tipos con `tsc` y compila el bundle de producción con Vite |
| `npm run preview` | Sirve localmente la compilación generada en `dist/` |

## Estructura principal

```text
bajate-po-admin/
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── api.ts                                # Cliente HTTP y endpoints de administración
│   ├── types.ts                              # Tipos compartidos y regiones de Chile
│   ├── App.tsx                               # Enrutamiento por pestañas y sesión
│   ├── main.tsx / index.css                  # Punto de entrada y estilos base Tailwind
│   ├── components/
│   │   ├── Header.tsx                        # Sincronización en vivo y cierre de sesión
│   │   ├── Sidebar.tsx                       # Navegación lateral expandible / modo riel
│   │   └── ModalConfirmacionTactico.tsx      # Confirmaciones modales reutilizables
│   └── views/
│       ├── LoginView.tsx                     # Acceso de staff administrador
│       ├── DashboardView.tsx                 # Métricas y alertas operativas
│       ├── CanchasView.tsx                   # Moderación y edición de canchas
│       ├── EquiposView.tsx                   # Gestión de equipos y escuadrones
│       ├── JugadoresView.tsx                 # Gestión de operadores y permisos
│       └── TicketsView.tsx                   # Buzón de tickets y visor de evidencias
└── package.json
```
