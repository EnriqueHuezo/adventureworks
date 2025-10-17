# Sistema de Facturación Electrónica (ES-SV)

Sistema completo de facturación electrónica para El Salvador, con gestión de inventario, clientes, proveedores y reportes.

## 🏗️ Arquitectura

### Backend
- **Framework**: Express + TypeScript
- **ORM**: Prisma
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT
- **Validación**: Zod
- **Arquitectura**: Capas (Controllers → Services → Repositories)

### Frontend
- **Framework**: Next.js 15 + React 19
- **UI**: shadcn/ui + tweakcn theme
- **Estado**: Context API
- **HTTP Client**: Axios
- **Formularios**: React Hook Form + Zod
- **Estilos**: Tailwind CSS

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 20+ 
- PostgreSQL 14+
- npm o pnpm

### 1. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/billing_db?schema=public"
# JWT_SECRET="tu-secreto-super-seguro"
# CORS_ORIGIN="http://localhost:3000"

# Generar Prisma Client
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Poblar base de datos con datos de prueba
npm run prisma:seed

# Iniciar servidor de desarrollo
npm run dev
```

El backend estará disponible en `http://localhost:4000`

### 2. Frontend

```bash
# En la raíz del proyecto
npm install

# Crear archivo de variables de entorno
# (Opcional si el backend está en localhost:4000)
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1" > .env.local

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## 👥 Usuarios de Prueba

Después de ejecutar el seed, tendrás estos usuarios:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `password123` | Administrador |
| `gerente` | `password123` | Gerente |
| `cajero` | `password123` | Cajero |

## 📋 Funcionalidades

### Por Rol

#### Administrador
- ✅ Todas las funciones de Gerente
- ✅ Gestión completa de usuarios (CRUD)
- ✅ Asignación de roles
- ✅ Configuración de sucursales y secuencias

#### Gerente
- ✅ Dashboard con KPIs y gráficos
- ✅ Emisión y anulación de facturas
- ✅ Gestión de productos (CRUD + control de stock)
- ✅ Gestión de proveedores (CRUD)
- ✅ Edición y eliminación de clientes
- ✅ Reportes con filtros avanzados
- ✅ Alertas de productos con bajo stock

#### Cajero
- ✅ Emisión de facturas
- ✅ Consulta de clientes
- ✅ Historial de ventas del día
- ✅ Vista de su cuenta

### Características Principales

1. **Facturación Electrónica**
   - IVA 13% automático
   - Retención renta 10% (opcional)
   - Retención IVA 1% (opcional)
   - Generación de código DTE (UUID)
   - Número de control secuencial por sucursal
   - Sello de recepción

2. **Gestión de Inventario**
   - Control de stock en tiempo real
   - Movimientos de entrada/salida/ajuste
   - Alertas de bajo stock
   - Distinción entre productos y servicios

3. **Reportes**
   - Filtros por fecha, tipo, estado, cliente, sucursal
   - Búsqueda global
   - Exportación a PDF
   - Métricas y KPIs del dashboard

4. **Diseño y UX**
   - Tema tweakcn (purple theme)
   - Sidebar colapsable
   - Responsive (mobile-first)
   - Formato ES-SV (DD/MM/AAAA, USD, 24h)
   - Accesibilidad WCAG AA

## 📁 Estructura del Proyecto

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── routes/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── facturacion/
│   │   ├── productos/
│   │   ├── clientes/
│   │   └── ...
│   ├── components/
│   │   ├── ui/
│   │   └── layout/
│   ├── contexts/
│   ├── lib/
│   └── types/
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Autenticación
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Usuarios (Admin)
- `GET /api/v1/users`
- `POST /api/v1/users`
- `PUT /api/v1/users/:id`
- `DELETE /api/v1/users/:id`
- `PATCH /api/v1/users/:id/roles`
- `PATCH /api/v1/users/:id/status`

### Clientes
- `GET /api/v1/clients`
- `GET /api/v1/clients/lookup?dui=...`
- `GET /api/v1/clients/:id`
- `PUT /api/v1/clients/:id` (Gerente/Admin)
- `DELETE /api/v1/clients/:id` (Gerente/Admin)

### Productos (Gerente/Admin)
- `GET /api/v1/products`
- `GET /api/v1/products/low-stock`
- `POST /api/v1/products`
- `PUT /api/v1/products/:id`
- `DELETE /api/v1/products/:id`
- `POST /api/v1/products/:id/stock`

### Proveedores (Gerente/Admin)
- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers`
- `PUT /api/v1/suppliers/:id`
- `DELETE /api/v1/suppliers/:id`

### Facturas
- `POST /api/v1/invoices/preview`
- `POST /api/v1/invoices` (Gerente/Admin)
- `GET /api/v1/invoices`
- `GET /api/v1/invoices/today`
- `GET /api/v1/invoices/dashboard-metrics` (Gerente/Admin)
- `GET /api/v1/invoices/:id`
- `POST /api/v1/invoices/:id/void` (Gerente/Admin)

### Sucursales
- `GET /api/v1/branches`
- `GET /api/v1/branches/:id`
- `GET /api/v1/branches/:id/sequences`
- `POST /api/v1/branches/:id/sequences` (Admin)

## 🧪 Desarrollo

### Backend

```bash
cd backend

# Desarrollo con hot-reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar producción
npm start

# Crear nueva migración
npm run prisma:migrate

# Abrir Prisma Studio
npx prisma studio
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar producción
npm start

# Lint
npm run lint
```

## 📦 Despliegue

### Backend
1. Configurar variables de entorno en producción
2. Ejecutar migraciones: `npm run prisma:deploy`
3. Compilar: `npm run build`
4. Iniciar: `npm start`

### Frontend
1. Configurar `NEXT_PUBLIC_API_URL` en producción
2. Build: `npm run build`
3. Deploy en Vercel, Netlify, o servidor Node.js

## 🔒 Seguridad

- ✅ JWT para autenticación
- ✅ RBAC (Role-Based Access Control)
- ✅ Helmet.js para headers HTTP seguros
- ✅ Rate limiting
- ✅ Validación de entrada con Zod
- ✅ Protección CSRF con SameSite cookies
- ✅ Sanitización de datos

## 📝 Notas Técnicas

### Cálculo de Facturas
```
subtotal = Σ (cantidad × precio_unitario - descuento)
IVA 13% = subtotal × 0.13
Retención Renta 10% = subtotal × 0.10 (opcional)
Retención IVA 1% = IVA × 0.01 (opcional)
TOTAL = subtotal + IVA - retenciones
```

### Secuencias
- Cada sucursal tiene secuencias independientes por serie (FAC, CCF, etc.)
- Lock optimista con `FOR UPDATE` para evitar duplicados
- Formato: `SERIE-00000001`

### Stock
- Solo productos tipo `PRODUCTO` afectan inventario
- Servicios no tienen stock
- Movimientos: IN (entrada), OUT (salida), ADJUST (ajuste)
- Reversión automática al anular factura

## 🐛 Troubleshooting

### Error de conexión a BD
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -U postgres -d billing_db
```

### Error al ejecutar migraciones
```bash
# Reset completo (⚠️ elimina todos los datos)
npx prisma migrate reset

# Regenerar cliente
npx prisma generate
```

### Puerto 4000 en uso
```bash
# Cambiar puerto en backend/.env
PORT=4001
```

## 📄 Licencia

MIT License - ver archivo LICENSE

## 👨‍💻 Desarrollo

Este proyecto fue desarrollado como sistema de facturación completo para El Salvador, cumpliendo con regulaciones locales de IVA y retenciones.

---

Para soporte o preguntas, crear un issue en el repositorio.
