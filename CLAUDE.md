# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sistema de Carga Horaria** - A Chilean educational hours management system for DAEM (Departamento de Administración de Educación Municipal). Built to manage teacher schedules, contract hours, and classroom timetables across multiple schools while complying with Chilean educational law (Ley 20.903 - Carrera Docente).

## Development Commands

```bash
# Development
cd sistema-horario
npm run dev          # Start development server at http://localhost:3000

# Production
npm run build        # Build for production
npm start            # Run production build

# Linting
npm run lint         # Run ESLint
```

## Architecture Overview

### State Management (Zustand)

The application uses Zustand with localStorage persistence (`lib/store.ts`). The store manages:

- **Docentes** (Teachers): Teacher data with contract hours and assignments
- **Establecimientos** (Schools): School configurations with grade levels and priority settings
- **Horarios** (Schedules): Schedule data structured as `Record<cursoKey, Record<bloqueKey, BloqueHorario>>`
  - `cursoKey` format: `"[establecimientoId]-[nivel]-[seccion]"` (e.g., `"1-5B-A"`)
  - `bloqueKey` format: `"[dia]-[bloqueId]"` (e.g., `"Lunes-1"`)
- **BloquesConfig**: Customizable time blocks per school (class periods, recess, lunch)

### Chilean Education Context

**Critical Domain Logic:**
- **60/40 vs 65/35 Ratio**: Schools use either 60% lectivas (teaching hours) / 40% no lectivas (non-teaching) OR 65/35 split
- **Horas Lectivas**: Teaching hours in classroom (counted in schedules)
- **Horas No Lectivas**: Preparation, meetings, administrative work (not in schedules)
- **Max Contract Hours**: 44 hours per week per teacher (validated in system)
- **Conflicts**: Teachers cannot be in two courses at the same time/block

**Validation Flow:**
1. Teacher has `horasContrato` from Excel import
2. System calculates `horasLectivas` using tables in `lib/constants/tablas-horas.ts` (60/40 or 65/35)
3. When assigning schedule blocks, validates: available hours, conflicts, course existence
4. `getHorasUsadasDocente()` counts actual assigned blocks in schedules

### Directory Structure

```
sistema-horario/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (docentes, horarios)
│   ├── dashboard/         # Teacher management page
│   ├── horario/          # Schedule builder page (main feature)
│   └── docentes/         # Teacher list page
├── components/
│   ├── ui/               # Shadcn UI components (button, select, card, etc.)
│   ├── forms/            # Form components (FormularioDocente, FormularioEstablecimiento)
│   └── Navigation.tsx    # Global navigation bar
├── lib/
│   ├── constants/        # tablas-horas.ts (60/40 and 65/35 calculation tables)
│   ├── utils/            # calculos-horas.ts, validaciones.ts
│   ├── store.ts          # Zustand store
│   └── datos_iniciales.ts # Initial data (currently empty by design)
└── types/index.ts        # TypeScript types and constants
```

## Key Data Structures

### Docente (Teacher)
```typescript
{
  id: number,
  rut: string,           // Chilean national ID
  nombre: string,
  asignaciones: Asignacion[]  // Can work at multiple schools
}
```

### Asignacion (Assignment)
```typescript
{
  establecimientoId: number,
  establecimientoNombre: string,
  cargo: Cargo,           // "DOCENTE DE AULA" | "DOCENTE PIE" | "DIRECTIVO" | etc.
  horasContrato: number,  // Total contract hours
  tipo: string,           // "Titular" | "Contrata"
  ciclo?: "primero" | "segundo" | "media",
  desglose?: {            // Optional detailed breakdown
    plan110: number,      // Regular curriculum hours
    plan10: number,       // Special plan hours
    pie: number,          // Integration program hours
    codocencia: number    // Co-teaching hours
  }
}
```

### BloqueHorario (Schedule Block)
```typescript
{
  asignatura: Asignatura,    // Subject with color for UI
  docenteId: number,
  docenteNombre: string
}
```

## Important Patterns

### Schedule Assignment Logic
When assigning a block in `lib/store.ts`:
1. Check teacher exists
2. Check for time conflicts using `tieneConflictoHorario()` across all courses
3. Check available hours: `getHorasUsadasDocente(docenteId) < totalHoras`
4. If all pass, add block to `horarios[cursoKey][bloqueKey]`

### Excel Import (`components/forms/FormularioDocente.tsx`)
Required columns: `RUT`, `NOMBRE`, `FUNCION`, `TITULARIDAD`, `HRS`
- Validates all columns present
- Filters invalid rows (missing data, hours > 44)
- Auto-adjusts hours over 44 to max limit
- Shows detailed error messages with missing column names

### Hours Calculation (`lib/utils/calculos-horas.ts`)
- `getHorasLectivasDocente()`: Calculates teaching hours using proportion tables
- `getHorasUsadasDocente()`: Counts blocks assigned in schedules
- `getHorasDisponiblesDocente()`: Lectivas - Usadas
- Always reference tables in `lib/constants/tablas-horas.ts` for 60/40 or 65/35

### Configurable Blocks
Schools can customize their time blocks (default in `types/index.ts:BLOQUES_DEFAULT`):
- 45-minute class periods
- 15-minute recess breaks
- 30-minute lunch period
- Total of 14 blocks (8:00 AM - 4:45 PM)

## Path Aliases

`@/*` maps to root directory (configured in `tsconfig.json`)

Example:
```typescript
import { useAppStore } from '@/lib/store';
import { Docente } from '@/types';
```

## Data Flow

1. **Initial Setup**: Users add schools (establecimientos) from dashboard
2. **Teacher Import**: Import teachers via Excel or add manually
3. **Schedule Creation**: Go to "Constructor de Horarios" (`/horario`)
   - Select school and course (nivel + sección)
   - Select subject (asignatura)
   - Select teacher
   - Click grid cell to assign
4. **Real-time Validation**: System prevents conflicts and hour overages
5. **Persistence**: All data persists to localStorage via Zustand

## Current State

The system starts completely empty (`lib/datos_iniciales.ts` has empty arrays). All data is user-provided. This is intentional - see `MIGRATION_SUMMARY.md` for context on the clean slate approach.

## Technology Stack

- Next.js 16 (App Router)
- TypeScript (strict mode)
- Tailwind CSS 4
- Zustand (state + persistence)
- Shadcn UI components
- XLSX (SheetJS) for Excel import
- Sonner for toast notifications
