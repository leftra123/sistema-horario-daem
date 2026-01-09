# 🏫 Sistema de Carga Horaria - DAEM Galvarino

Sistema web para la gestión integral de carga horaria docente según la **Ley 20.903 de Carrera Docente** del DAEM (Departamento de Administración de Educación Municipal) de Galvarino.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth-green?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Inicio Rápido](#-inicio-rápido)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Documentación](#-documentación)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### 🔐 **Autenticación Segura**
- Magic Link OTP (código de verificación por email)
- Control de acceso basado en roles (RBAC)
- Dominios restringidos: `@galvarinochile.cl` y `@edugalvarino.cl`
- Rate limiting para prevenir ataques
- Recuperación automática de sesión

### 👥 **Gestión de Usuarios**
- 3 roles: **Admin**, **Profesor**, **Visualizador**
- Permisos granulares por rol
- Creación de usuarios con OTP
- Edición de perfil de usuario

### 👨‍🏫 **Gestión de Docentes**
- Registro de información personal (RUT, nombre)
- Múltiples asignaciones por establecimiento
- Soporte para docentes que trabajan en **ambos ciclos** (1º-4º y 5º-8º básico)
- Días bloqueados (docente trabaja en otra escuela)
- Validación automática de RUT chileno

### 📊 **Cumplimiento Ley 20.903**
- Cálculo automático de horas lectivas/no lectivas
- Proporciones **60/40** y **65/35** según ciclo de enseñanza
- Límite de **44 horas semanales** máximo
- Distribución por tipo de asignación: Normal, SEP, EIB, Directiva, PIE
- Consideración de establecimientos prioritarios

### 📅 **Gestión de Horarios**
- Asignación de bloques horarios por día
- Configuración personalizada de horarios por establecimiento
- Exportación a Excel/PDF
- Visualización por docente, curso o establecimiento

### 🎨 **Interfaz Moderna**
- Diseño responsivo (mobile-first)
- Tema personalizado con Tailwind CSS
- Componentes reutilizables con Shadcn/ui
- Notificaciones con Sonner
- Animaciones fluidas

---

## 🛠️ Tecnologías

### **Frontend**
- [Next.js 16.1.1](https://nextjs.org/) - Framework React con App Router
- [TypeScript 5.0](https://www.typescriptlang.org/) - Tipado estático
- [Tailwind CSS 3.4](https://tailwindcss.com/) - Estilos utility-first
- [Shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Lucide Icons](https://lucide.dev/) - Iconos

### **Backend & Auth**
- [Supabase](https://supabase.com/) - Backend as a Service
- [Supabase Auth](https://supabase.com/docs/guides/auth) - Autenticación con OTP
- Row Level Security (RLS) - Seguridad a nivel de base de datos

### **Estado & Datos**
- [Zustand](https://zustand-demo.pmnd.rs/) - Gestión de estado global
- localStorage - Persistencia local (migración a Supabase en progreso)

### **Utilidades**
- [Sonner](https://sonner.emilkowal.ski/) - Notificaciones toast
- [ExcelJS](https://www.npmjs.com/package/exceljs) - Exportación a Excel

---

## 🚀 Inicio Rápido

### **1. Prerrequisitos**

```bash
Node.js >= 18.17
npm >= 9.0
Cuenta en Supabase (https://supabase.com)
```

### **2. Clonar el Repositorio**

```bash
git clone https://github.com/tu-usuario/sistema-horario.git
cd sistema-horario
```

### **3. Instalar Dependencias**

```bash
npm install
```

### **4. Configurar Variables de Entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica

# Dominios permitidos
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS=galvarinochile.cl,edugalvarino.cl
```

### **5. Configurar Supabase**

Ejecuta los scripts SQL en tu proyecto Supabase (ver `docs/02-instalacion.md`):

```sql
-- Crear tabla users
-- Configurar RLS
-- Crear triggers
```

### **6. Iniciar Servidor de Desarrollo**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### **7. Crear Primer Usuario Admin**

Ve al dashboard de Supabase y crea manualmente el primer usuario admin (ver `docs/02-instalacion.md#crear-primer-admin`).

---

## 📁 Estructura del Proyecto

```
sistema-horario/
├── app/                          # Next.js App Router
│   ├── admin/                    # Rutas de administración
│   │   ├── crear-usuario/        # Crear nuevos usuarios
│   │   └── usuarios/             # Gestión de usuarios
│   ├── api/                      # API Routes
│   │   ├── docentes/             # Endpoints de docentes
│   │   └── horarios/             # Endpoints de horarios
│   ├── auth/                     # Autenticación
│   │   └── callback/             # Callback OTP verification
│   ├── docentes/                 # Gestión de docentes
│   ├── horario/                  # Gestión de horarios
│   ├── login/                    # Login con OTP
│   ├── perfil/                   # Edición de perfil
│   └── page.tsx                  # Página principal
│
├── components/                   # Componentes React
│   ├── auth/                     # Componentes de autenticación
│   │   └── ProtectedRoute.tsx   # HOC para proteger rutas
│   ├── docentes/                 # Componentes de docentes
│   │   ├── DocenteFormModal.tsx # Formulario de docentes
│   │   └── DocentesList.tsx     # Lista de docentes
│   ├── ui/                       # Componentes UI base (Shadcn)
│   └── Navigation.tsx            # Navegación principal
│
├── lib/                          # Lógica de negocio
│   ├── hooks/                    # Custom React Hooks
│   │   └── useAuth.ts            # Hook de autenticación
│   ├── supabase/                 # Configuración Supabase
│   │   ├── client.ts             # Cliente para componentes
│   │   └── server.ts             # Cliente para servidor
│   ├── utils/                    # Utilidades
│   │   ├── calculos-horas.ts    # Cálculos Ley 20.903
│   │   ├── export-horarios.ts   # Exportación a Excel
│   │   └── validaciones.ts      # Validaciones (RUT, etc)
│   └── store.ts                  # Zustand store
│
├── types/                        # Definiciones TypeScript
│   └── index.ts                  # Tipos globales
│
├── docs/                         # Documentación
│   ├── 01-inicio-rapido.md
│   ├── 02-instalacion.md
│   ├── 03-arquitectura.md
│   ├── 04-autenticacion.md
│   ├── 05-gestion-docentes.md
│   ├── 06-gestion-horarios.md
│   ├── 07-ley-20903.md
│   ├── 08-api-reference.md
│   ├── 09-deployment.md
│   └── 10-contribuir.md
│
├── public/                       # Archivos estáticos
│   └── DAEM.png                  # Logo
│
├── .env.local                    # Variables de entorno (no commiteado)
├── .gitignore
├── middleware.ts                 # Middleware de autenticación
├── next.config.ts                # Configuración Next.js
├── package.json
├── tailwind.config.ts            # Configuración Tailwind
├── tsconfig.json                 # Configuración TypeScript
└── README.md                     # Este archivo
```

---

## 📚 Documentación

La documentación completa está disponible en el directorio [`docs/`](./docs/):

1. **[Inicio Rápido](./docs/01-inicio-rapido.md)** - Guía rápida de 5 minutos
2. **[Instalación](./docs/02-instalacion.md)** - Instalación paso a paso
3. **[Arquitectura](./docs/03-arquitectura.md)** - Estructura y patrones del proyecto
4. **[Autenticación](./docs/04-autenticacion.md)** - Sistema de autenticación y roles
5. **[Gestión de Docentes](./docs/05-gestion-docentes.md)** - Cómo gestionar docentes
6. **[Gestión de Horarios](./docs/06-gestion-horarios.md)** - Asignación de horarios
7. **[Ley 20.903](./docs/07-ley-20903.md)** - Cálculos y normativa
8. **[API Reference](./docs/08-api-reference.md)** - Documentación de API
9. **[Deployment](./docs/09-deployment.md)** - Despliegue a producción
10. **[Contribuir](./docs/10-contribuir.md)** - Guía para contribuidores

---

## 👥 Roles y Permisos

| Funcionalidad | Admin | Profesor | Visualizador |
|--------------|-------|----------|--------------|
| Ver docentes | ✅ | ❌ | ✅ |
| Crear/Editar docentes | ✅ | ❌ | ❌ |
| Ver horarios | ✅ | ✅ (solo propios) | ✅ |
| Crear/Editar horarios | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Exportar datos | ✅ | ✅ (solo propios) | ✅ |
| Editar perfil propio | ✅ | ✅ | ✅ |

---

## 🧪 Testing

```bash
# TypeScript type checking
npm run type-check

# Build de producción
npm run build

# Linting
npm run lint
```

---

## 📦 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
npm run type-check   # Verificación de tipos TypeScript
```

---

## 🔒 Seguridad

- ✅ Autenticación con Magic Link OTP
- ✅ Rate limiting en login (5 intentos / 15 minutos)
- ✅ Row Level Security (RLS) en Supabase
- ✅ Validación de dominios de email
- ✅ Protección de rutas con middleware
- ✅ Recuperación automática de sesión
- ✅ HTTPS obligatorio en producción
- ✅ Variables de entorno seguras

---

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor:

1. Verifica que no esté reportado en [Issues](https://github.com/tu-usuario/sistema-horario/issues)
2. Crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots (si aplica)
   - Entorno (OS, navegador, versión Node)

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Lee la [Guía de Contribución](./docs/10-contribuir.md) para más información.

### **Flujo de Contribución**

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: Amazing feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo [LICENSE](./LICENSE) para más detalles.

---

## 👨‍💻 Autores

- **DAEM Galvarino** - Desarrollo y mantenimiento

---

## 🙏 Agradecimientos

- Ministerio de Educación de Chile por la Ley 20.903
- Comunidad educativa de Galvarino
- Next.js y Vercel por el framework
- Supabase por el backend
- Shadcn/ui por los componentes

---

## 📞 Contacto

- **Email**: contacto@galvarinochile.cl
- **Sitio Web**: https://www.galvarinochile.cl

---

## 🗺️ Roadmap

### **v1.0 (Actual)**
- ✅ Sistema de autenticación con OTP
- ✅ Gestión de docentes y asignaciones
- ✅ Cálculos automáticos Ley 20.903
- ✅ Control de acceso por roles
- ✅ Exportación a Excel

### **v1.1 (Próximo)**
- 🔄 Migración completa a Supabase
- 🔄 Gestión de horarios por curso
- 🔄 Generación de PDF personalizado
- 🔄 Panel de analytics

### **v2.0 (Futuro)**
- 📋 Sistema de reportes avanzados
- 📋 Integración con SIGE (Sistema de Información General de Estudiantes)
- 📋 App móvil nativa
- 📋 Notificaciones push

---

**Hecho con ❤️ para la educación pública chilena**
