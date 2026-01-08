# Análisis Técnico: Sistema de Gestión de Horarios

**Fecha:** 8 de Enero, 2026
**Proyecto:** Sistema Horario (Carga Horaria DAEM)
**Sistema Operativo:** Darwin (macOS)

Este documento proporciona un análisis técnico exhaustivo del proyecto, detallando el stack tecnológico, la arquitectura, los riesgos detectados y una evaluación estratégica para el despliegue.

---

## 1. Stack Tecnológico

El proyecto utiliza una arquitectura moderna basada en React y Next.js, priorizando el rendimiento y una experiencia de usuario fluida (Single Page Application feel).

### Core
*   **Framework:** `Next.js 16.1.1` (App Router). Uso de rutas híbridas (Server/Client).
*   **Biblioteca UI:** `React 19.2.3` & `React DOM 19.2.3`.
*   **Lenguaje:** `TypeScript 5`. Tipado estricto para modelos complejos.

### Estilos & Diseño
*   **Motor de Estilos:** `Tailwind CSS 4`.
*   **Componentes:** `Radix UI` (primitivos accesibles), `Lucide React` (iconos), `Sonner` (notificaciones).
*   **Visualización:** `Recharts 3.6.0`.

### Gestión de Estado & Lógica
*   **Estado Global:** `Zustand 5.0.9`. Persistencia actual vía `localStorage`.
*   **Procesamiento:** `xlsx` (Excel), `jspdf` (Reportes).

---

## 2. Estructura y Arquitectura

El proyecto sigue la estructura del **App Router** de Next.js.

### Directorios Principales
*   **`app/`**: Rutas (`dashboard`, `docentes`, `horario`, `api`).
*   **`components/`**: UI (`ui`) y dominio (`dashboard`, `docentes`).
*   **`lib/`**: Lógica pura. `store.ts` (estado), `utils/` (cálculos), `constants/` (tablas legales).
*   **`types/`**: Definiciones TypeScript compartidas (`Docente`, `HorarioData`, `Establecimiento`).

---

## 3. Análisis Detallado de Archivos Clave

### A. `types/index.ts` (Modelos de Datos)
Define el contrato de datos.
*   **`Establecimiento`**: Configuración de la escuela, incluyendo `proporcion` (60/40 vs 65/35) y `configuracionHorario`.
*   **`Docente`**: Contiene `asignaciones` complejas (horas, desglose, días bloqueados).
*   **`HorarioData`**: Estructura anidada `ClaveCurso -> ClaveBloque -> BloqueHorario`.

### B. `lib/store.ts` (Gestor de Estado)
*   Fuente de verdad actual.
*   Contiene lógica de negocio mezclada con gestión de estado (validaciones de conflicto, asignación).
*   Persiste todo en el navegador del cliente.

### C. `lib/utils/calculos-horas.ts` (Lógica de Negocio)
*   Implementa la **Ley 20.903**.
*   Calcula horas lectivas/no lectivas basándose en tablas normativas.

---

## 4. Hallazgos e Inconsistencias Críticas

Se han detectado problemas técnicos y de lógica de negocio que comprometen la escalabilidad y la corrección legal del sistema.

### 🔴 1. Violación de Normativa (Ley 20.903) en Validaciones
*   **El Problema:** El Store (`lib/store.ts`) valida la asignación de bloques comparando contra `horasContrato` (total) en lugar de `horasLectivas`.
*   **Impacto:** El sistema permite asignar a un profesor 44 horas de clases frente a alumnos, lo cual es ilegal. Un profesor de 44 horas solo debería tener ~30-32 horas lectivas máximas (según régimen 60/40 o 65/35).
*   **Ubicación:** `store.ts` -> función `asignarBloque`.

### 🔴 2. Error en Asignación de Proporción (Ciclo vs Establecimiento)
*   **El Problema:** Actualmente, la propiedad `proporcion` (60/40 o 65/35) se define en el `Establecimiento`.
*   **La Realidad:** La proporción lectiva es un atributo dependiente del **ciclo de enseñanza** del docente, no de la escuela completa.
    *   **Primer Ciclo:** Corresponde régimen 60/40.
    *   **Segundo Ciclo:** Corresponde régimen 65/35.
    *   **Docentes Mixtos:** Si un docente enseña en ambos ciclos dentro de la misma escuela, el sistema actual no sabe qué tabla aplicar, forzando una única proporción para todas sus horas. Esto genera cálculos erróneos de horas lectivas disponibles.
*   **Ubicación:** `types/index.ts` (Interfaz `Establecimiento`) y `lib/utils/calculos-horas.ts` (función `getTablaHoras`).

### 🟠 3. Duplicación de Lógica (Violación DRY)
*   **El Problema:** Funciones críticas existen en dos lugares con implementaciones desconectadas.
    *   `getHorasUsadasDocente`: Existe en `store.ts` y en `utils/calculos-horas.ts`.
    *   `tieneConflictoHorario`: Existe en ambos archivos.
*   **Riesgo:** Si se ajusta la lógica de conflictos en un archivo y se olvida el otro, el frontend mostrará datos diferentes a los que validará el backend o el reporte.

### 🟡 4. Fragilidad en Claves de Horario
*   **El Problema:** El sistema depende de strings compuestos manuales: `"ID-NIVEL-SECCION"` (ej: `"1-1º-A"`). Se usa `.split('-')` para recuperar el ID del establecimiento.
*   **Riesgo:** Si un nombre de curso o sección contiene un guion, la lógica de parseo fallará, corrompiendo la asociación de datos.

### 🟡 5. Gestión de Identificadores (IDs)
*   **El Problema:** Los IDs de docentes y establecimientos se manejan manualmente o se confía en la importación.
*   **Riesgo:** Alta probabilidad de colisión de IDs al trabajar con múltiples usuarios o al importar múltiples Excels.

---

## 5. Estrategia de Persistencia: ¿Es Supabase la solución?

Para desplegar en **Vercel** y profesionalizar el sistema (DAEM), el uso de `localStorage` es inviable (pérdida de datos al cambiar de PC, sin colaboración).

### Evaluación de Supabase (PostgreSQL)

**Veredicto: ✅ SÍ, es la opción recomendada.**

#### Por qué es mejor que las alternativas:

1.  **Naturaleza Relacional de los Datos:**
    *   El modelo del sistema es altamente relacional: `Establecimientos` <-> `Docentes` <-> `Asignaciones` <-> `Horarios`.
    *   Una base de datos SQL (Postgres) es superior a NoSQL (Firebase/Mongo) para consultas complejas como *"Buscar todos los conflictos de horario del Docente X en todas las escuelas"*.

2.  **Integración con Next.js y Vercel:**
    *   Supabase expone una API `PostgREST` instantánea y tiene bibliotecas de cliente (`@supabase/ssr`) que funcionan nativamente con los Server Components de Next.js 16.
    *   Permite autenticación y **Row Level Security (RLS)**. Esto es vital para el DAEM: un director de escuela solo debería poder editar su escuela, mientras que el admin DAEM ve todo.

3.  **Solución al Problema del Ciclo (Punto #2):**
    *   Un modelo relacional permite definir la proporción en la tabla `asignaciones` o incluso por `bloque` si fuera necesario, desvinculándola de la tabla `establecimientos`.

4.  **Manejo de Tipos (TypeScript):**
    *   Supabase puede generar definiciones de TypeScript automáticamente desde la base de datos, lo que resolvería la inconsistencia actual entre `types/index.ts` y los datos reales.

5.  **Costos y Mantenimiento:**
    *   Capa gratuita generosa para proyectos de este tamaño.
    *   Es "Backend as a Service", ahorrando la configuración de servidores API complejos (NestJS/Express) para operaciones CRUD básicas.

### Ruta de Migración Recomendada

1.  **Refactorización Previa (Limpieza):**
    *   Centralizar toda la lógica de cálculo en `utils/calculos-horas.ts`.
    *   Eliminar la lógica duplicada en `store.ts`.
    *   Corregir la validación de horas lectivas y re-diseñar el tipo `Asignacion` para incluir el ciclo/proporción.

2.  **Modelado de Base de Datos:**
    *   Crear tablas en Supabase: `establecimientos`, `docentes`, `asignaciones` (tabla intermedia), `bloques_horarios`.
    *   Sustituir las claves frágiles (`"1-1º-A"`) por claves foráneas reales (`establecimiento_id`, `curso_id`).

3.  **Conexión:**
    *   Reemplazar la persistencia de `Zustand` por llamadas asíncronas a la API de Supabase (Server Actions).
