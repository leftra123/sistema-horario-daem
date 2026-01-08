# TAREAS PARA CLAUDE CODE - SISTEMA GESTIÓN DE HORARIOS
**Proyecto:** Sistema Horario (Carga Horaria DAEM)  
**Fecha:** 8 de Enero, 2026  
**Prioridad:** CRÍTICA - Correcciones de Ley 20.903

---

## CONTEXTO CRÍTICO

### Fórmula Fundamental (Ley 20.903)
```
Jornada Semanal (hrs) - Horas Lectivas (hrs) = Horas No Lectivas (hrs)
```

### Tablas Normativas
- **Tabla 65/35**: 65% lectivas, 35% no lectivas (2º ciclo básico, enseñanza media)
- **Tabla 60/40**: 60% lectivas, 40% no lectivas (1º ciclo básico con 80%+ alumnos prioritarios)

Fuente: `tablas_horas_lectivas_2019.xlsx` - estas son las tablas legales de cálculo.

### Tipos de Horas (REGLAS CRÍTICAS)
1. **Directiva**: NO permite bloques. Solo suma como "horas no lectivas". Sin espacios de asignación.
2. **Subvención Normal + SEP + EIB**: Suma AMBAS (horas lectivas + no lectivas)
3. **PIE (Programa Integración Escolar)**: NO suma en total. Es adicional, no computa contra horas contrato.

---

## TAREAS EN ORDEN DE EJECUCIÓN

### ⚠️ PREGUNTA 1: CLARIDAD DE CONTEXTO
Antes de empezar, responde estas preguntas para confirmar que entiendo bien:

1. **¿Dónde está tu código actualmente?** (ruta del repositorio local)
   - Necesito saber si está en `/ruta/proyecto/` con estructura `app/`, `lib/`, `types/`

2. **¿Existe ya una tabla de "Directiva" como tipo de asignación?**
   - ¿O solo tienes "Subvención Normal", "SEP", "EIB", "PIE"?

3. **¿Cómo manejas actualmente el ciclo de enseñanza?**
   - ¿Lo guardas en la tabla `Docente` o en `Asignacion`?
   - ¿O no lo manejas y por eso la proporción está en `Establecimiento`?

---

## TAREAS ORDENADAS

### TAREA 1: Refactorizar `types/index.ts` - Modelo de Datos
**Objetivo:** Corregir la proporción (60/40 vs 65/35) para que sea por asignación, no por establecimiento.

**Cambios requeridos:**

```typescript
// ANTES (INCORRECTO)
interface Establecimiento {
  id: string;
  nombre: string;
  proporcion: "60/40" | "65/35"; // ❌ GLOBAL - INCORRECTO
}

// DESPUÉS (CORRECTO)
interface Establecimiento {
  id: string;
  nombre: string;
  // La proporción se define POR ASIGNACIÓN, no aquí
}

interface Asignacion {
  id: string;
  docenteId: string;
  horasContrato: number; // Ej: 44 horas
  tipo: "Normal" | "SEP" | "EIB" | "Directiva" | "PIE";
  ciclo: "Primer Ciclo" | "Segundo Ciclo"; // ✅ NUEVO
  proporcion: "60/40" | "65/35"; // ✅ NUEVO - Derivado del ciclo + establecimiento
  
  // Cálculos derivados (READ-ONLY)
  horasLectivas: number; // Lookup en tabla normativa
  horasNoLectivas: number; // horasContrato - horasLectivas
  
  // Bloques asignados (para Subvención, NO para Directiva/PIE)
  bloquesAsignados: string[]; // IDs de bloques
}
```

**Checklist:**
- [ ] Agregar `ciclo` a `Asignacion`
- [ ] Mover `proporcion` de `Establecimiento` a `Asignacion`
- [ ] Agregar `tipo` a `Asignacion` con valores: "Normal", "SEP", "EIB", "Directiva", "PIE"
- [ ] Documentar que `horasLectivas` se calcula con tabla normativa
- [ ] Documentar que `horasNoLectivas = horasContrato - horasLectivas`

---

### TAREA 2: Crear/Refactorizar `lib/utils/calculos-horas.ts` - Lógica Centralizada
**Objetivo:** Centralizar TODA la lógica de cálculo de horas. Eliminar duplicación en `store.ts`.

**Funciones Requeridas:**

```typescript
/**
 * Busca en tabla normativa cuántas horas lectivas corresponden
 * @param horasContrato Horas de jornada semanal (44, 43, 42, etc.)
 * @param proporcion "60/40" | "65/35"
 * @returns Horas lectivas en HA (entero)
 * @throws Si horasContrato > 44 o < 1
 * @throws Si proporcion no es válida
 */
export function getHorasLectivasDeTabla(
  horasContrato: number,
  proporcion: "60/40" | "65/35"
): number {
  // Implementar lookup en la tabla normativa
  // Ej: getHorasLectivasDeTabla(44, "65/35") → 38
  // Ej: getHorasLectivasDeTabla(44, "60/40") → 35
}

/**
 * Calcula las horas no lectivas
 * Fórmula: Jornada - Lectivas = No Lectivas
 * @param horasContrato Jornada semanal
 * @param horasLectivas Horas en aula
 * @returns Horas no lectivas
 */
export function calcularHorasNoLectivas(
  horasContrato: number,
  horasLectivas: number
): number {
  return horasContrato - horasLectivas;
}

/**
 * Determina la proporción correcta basada en ciclo y establecimiento
 * @param ciclo "Primer Ciclo" | "Segundo Ciclo"
 * @param esEstablecimientoPrioritario boolean (80%+ alumnos prioritarios)
 * @returns "60/40" | "65/35"
 */
export function getProporcionalidad(
  ciclo: "Primer Ciclo" | "Segundo Ciclo",
  esEstablecimientoPrioritario: boolean
): "60/40" | "65/35" {
  if (ciclo === "Primer Ciclo" && esEstablecimientoPrioritario) {
    return "60/40";
  }
  return "65/35"; // Default para segundo ciclo y primer ciclo sin 80%+
}

/**
 * Calcula horas disponibles para asignación EN BLOQUES
 * REGLA: Directiva y PIE NO usan bloques
 * REGLA: Normal + SEP + EIB SÍ usan bloques
 * @param asignacion Asignación del docente
 * @returns Horas disponibles para bloques (0 si es Directiva o PIE)
 */
export function getHorasDisponiblesParaBloques(
  asignacion: Asignacion
): number {
  if (asignacion.tipo === "Directiva" || asignacion.tipo === "PIE") {
    return 0; // ✅ NO se asignan bloques
  }
  return asignacion.horasLectivas; // Normal, SEP, EIB SÍ pueden tener bloques
}

/**
 * Obtiene horas TOTALES usadas por un docente (SUMA DE TODAS SUS ASIGNACIONES)
 * REGLA: PIE NO suma en total
 * @param docente Docente
 * @returns Total horas que computan contra contrato
 */
export function getTotalHorasUsadasDocente(docente: Docente): number {
  return docente.asignaciones
    .filter(a => a.tipo !== "PIE") // ✅ PIE NO suma
    .reduce((sum, a) => sum + a.horasLectivas, 0);
}

/**
 * Valida que no se haya excedido la jornada semanal
 * @param docente Docente
 * @throws Si total de horas (sin PIE) > horasContrato
 */
export function validarNoExcesoHoras(docente: Docente): void {
  const horas_usadas = getTotalHorasUsadasDocente(docente);
  const horas_contrato = docente.horasContrato;
  
  if (horas_usadas > horas_contrato) {
    throw new Error(
      `Docente ${docente.nombre} excede su contrato: ` +
      `${horas_usadas}h asignadas > ${horas_contrato}h contrato. ` +
      `(PIE no suma en este cálculo)`
    );
  }
}

/**
 * Valida que "Directiva" no tenga bloques asignados
 * @param asignacion Asignación
 * @throws Si Directiva tiene bloquesAsignados.length > 0
 */
export function validarDirectivaNoTieneBloques(
  asignacion: Asignacion
): void {
  if (
    asignacion.tipo === "Directiva" &&
    asignacion.bloquesAsignados &&
    asignacion.bloquesAsignados.length > 0
  ) {
    throw new Error(
      `Error: Asignación de tipo "Directiva" no puede tener bloques asignados. ` +
      `Las horas directivas son "no lectivas" y no se imparten en aula.`
    );
  }
}
```

**Checklist:**
- [ ] Crear función `getHorasLectivasDeTabla(horasContrato, proporcion)`
- [ ] Crear función `calcularHorasNoLectivas(horasContrato, horasLectivas)`
- [ ] Crear función `getProporcionalidad(ciclo, esEstablecimientoPrioritario)`
- [ ] Crear función `getHorasDisponiblesParaBloques(asignacion)` - Directiva/PIE retornan 0
- [ ] Crear función `getTotalHorasUsadasDocente(docente)` - Excluir PIE
- [ ] Crear función `validarNoExcesoHoras(docente)` - Comparar contra horasLectivas, NO horasContrato
- [ ] Crear función `validarDirectivaNoTieneBloques(asignacion)`
- [ ] Documentar cada función con ejemplos

---

### TAREA 3: Refactorizar `lib/store.ts` - Validaciones Corregidas
**Objetivo:** Reemplazar lógica duplicada con llamadas a `calculos-horas.ts`. Corregir validaciones.

**Cambios requeridos:**

#### 3.1: Función `asignarBloque`
```typescript
// ❌ ANTES (INCORRECTO)
function asignarBloque(docenteId: string, bloqueId: string) {
  const docente = ...;
  const horasUsadas = getHorasUsadasDocente(docente); // local
  
  if (horasUsadas + 1 > docente.horasContrato) { // ❌ INCORRECTO: compara contra horasContrato
    throw "No hay horas disponibles";
  }
}

// ✅ DESPUÉS (CORRECTO)
function asignarBloque(docenteId: string, bloqueId: string) {
  const docente = ...;
  
  // 1. Validar que Directiva no intente asignar bloques
  const asignacionConBloques = docente.asignaciones
    .filter(a => a.bloquesAsignados?.includes(bloqueId))[0];
  
  if (asignacionConBloques?.tipo === "Directiva") {
    throw new Error("Directiva no puede tener bloques");
  }
  
  // 2. Validar que no se exceda horasLectivas (importado de calculos-horas)
  const horasDisponibles = asignacionConBloques?.horasLectivas ?? 0;
  const horasUsadasEnBloques = asignacionConBloques?.bloquesAsignados?.length ?? 0;
  
  if (horasUsadasEnBloques >= horasDisponibles) {
    throw new Error(
      `No hay horas lectivas disponibles. ` +
      `Disponibles: ${horasDisponibles}, Usadas: ${horasUsadasEnBloques}`
    );
  }
  
  // 3. Asignar bloque
  docente.asignaciones[idx].bloquesAsignados.push(bloqueId);
}
```

#### 3.2: Limpiar Duplicación
- [ ] Eliminar `getHorasUsadasDocente()` de `store.ts` (importar de `calculos-horas.ts`)
- [ ] Eliminar `tieneConflictoHorario()` de `store.ts` si existe en `calculos-horas.ts`
- [ ] Eliminar lógica manual de cálculo de horas no lectivas

#### 3.3: Agregar Validaciones en Store
- [ ] Al crear `Asignacion`: validar con `validarDirectivaNoTieneBloques`
- [ ] Al crear `Docente`: validar con `validarNoExcesoHoras`
- [ ] Al asignar bloque: validar con `getHorasDisponiblesParaBloques`

**Checklist:**
- [ ] Reemplazar `asignarBloque()` para validar contra `horasLectivas`, no `horasContrato`
- [ ] Eliminar funciones duplicadas de `store.ts`
- [ ] Importar funciones de `calculos-horas.ts`
- [ ] Validar que PIE nunca suma en cálculos totales
- [ ] Validar que Directiva nunca tenga bloques

---

### TAREA 4: Crear Componente/Lógica para Creación de Docente - Única Vía (`/docente`)
**Objetivo:** Asegurar que hay UNA SOLA forma de crear docente, en la ruta `/docente`.

**Contexto:** Mencionas que hay "doble forma de crear un docente". Esto debe consolidarse.

**Cambios requeridos:**

1. **Buscar todas las rutas que crean docentes:**
   ```bash
   grep -r "new Docente\|createDocente\|addDocente" app/ components/
   ```

2. **Unificar en `/app/docentes/page.tsx` o `/app/docentes/nuevo/page.tsx`**

3. **Formulario único debe:**
   - [ ] Pedir: Nombre, RUT, Horas Contrato, Ciclo (Primer/Segundo)
   - [ ] Calcular automáticamente `proporcion` basado en ciclo + establecimiento
   - [ ] Mostrar las horas lectivas/no lectivas que corresponden (tabla normativa)
   - [ ] No permitir crear con datos inválidos

4. **Eliminar:**
   - [ ] Cualquier otro lugar donde se cree docentes
   - [ ] Imports redundantes

**Checklist:**
- [ ] Localizar TODAS las vías de creación de docente
- [ ] Consolidar en una ruta única `/docentes/nuevo` (o similar)
- [ ] Validar ciclo de enseñanza
- [ ] Mostrar tabla de horas lectivas derivadas

---

### TAREA 5: Refactorizar Componente de Asignación - Diferenciar Tipos
**Objetivo:** El UI debe diferenciar claramente entre Directiva, Normal+SEP+EIB, y PIE.

**Cambios requeridos:**

En el componente de asignación (donde asignas bloques):

```typescript
// UI debe mostrar TRES SECCIONES

// 1️⃣ DIRECTIVA
<Section title="Directiva">
  <p>⚠️ No permite bloques. Solo suma como horas no lectivas.</p>
  <Input type="number" placeholder="Horas Directiva" />
  {/* Sin selector de bloques */}
</Section>

// 2️⃣ HORAS LECTIVAS (Normal + SEP + EIB)
<Section title="Horas Lectivas - Subvención">
  <Select>
    <option>Normal</option>
    <option>SEP</option>
    <option>EIB</option>
  </Select>
  <p>Disponibles: {getHorasDisponiblesParaBloques(asignacion)} horas</p>
  {/* Selector de bloques AQUÍ */}
  <BlockSelector maxHoras={getHorasDisponiblesParaBloques(asignacion)} />
</Section>

// 3️⃣ PIE (Adicional)
<Section title="PIE - Programa Integración Escolar">
  <p>⚠️ NO suma contra horas contrato. Adicional.</p>
  <Input type="number" placeholder="Horas PIE" />
  {/* Sin selector de bloques */}
</Section>

// RESUMEN
<Summary>
  Total horas (sin PIE): {getTotalHorasUsadasDocente(docente)}
  Total PIE (adicional): {docente.asignaciones.filter(a => a.tipo === 'PIE').reduce(...)}
</Summary>
```

**Checklist:**
- [ ] Separar UI por tipo de asignación
- [ ] Mostrar mensajes de advertencia para Directiva/PIE
- [ ] Bloquear asignación de bloques para Directiva
- [ ] Mostrar "Adicional" para PIE
- [ ] Mostrar tabla de horas lectivas/no lectivas disponibles

---

### TAREA 6: Actualizar Validaciones en Asignación de Bloques
**Objetivo:** Asegurar que la validación sea correcta en el momento de asignar bloques.

**Cambios requeridos:**

```typescript
// En asignación de bloques (ej: cuando arrastra bloque a grilla)
function validarYAsignarBloque(
  docenteId: string,
  asignacionId: string,
  bloqueId: string
) {
  const docente = getDocente(docenteId);
  const asignacion = docente.asignaciones.find(a => a.id === asignacionId);
  
  // ✅ Validar 1: Directiva no tiene bloques
  if (asignacion.tipo === "Directiva") {
    throw new Error(
      "No se pueden asignar bloques a horas Directiva. " +
      "Las horas directivas no se imparten en aula."
    );
  }
  
  // ✅ Validar 2: PIE no tiene bloques
  if (asignacion.tipo === "PIE") {
    throw new Error(
      "No se pueden asignar bloques a PIE. " +
      "PIE es un servicio adicional sin horario de bloques."
    );
  }
  
  // ✅ Validar 3: No exceder horas lectivas de la asignación
  const horasDisponibles = asignacion.horasLectivas;
  const horasUsadas = asignacion.bloquesAsignados.length;
  
  if (horasUsadas >= horasDisponibles) {
    throw new Error(
      `No hay horas disponibles. ` +
      `Máximo: ${horasDisponibles}h, Usadas: ${horasUsadas}h`
    );
  }
  
  // ✅ Validar 4: No exceder total de horas contrato
  try {
    validarNoExcesoHoras(docente); // Función de calculos-horas.ts
  } catch (e) {
    throw new Error(`${e.message} (Total incluyendo este bloque)`);
  }
  
  // ✅ Si pasa todas las validaciones, asignar
  asignacion.bloquesAsignados.push(bloqueId);
}
```

**Checklist:**
- [ ] Validar que Directiva no tenga bloques
- [ ] Validar que PIE no tenga bloques
- [ ] Validar que no se exceda `horasLectivas` de la asignación
- [ ] Validar que total de docente no exceda su contrato
- [ ] Mostrar mensajes claros de error al usuario

---

### TAREA 7: Crear Función para Calcular Resumen Final del Docente
**Objetivo:** Generar el resumen de horas como aparece en la última columna del Excel.

**Cambios requeridos:**

```typescript
export interface ResumenHorasDocente {
  nombre: string;
  horasContrato: number;
  horasLectivas: number;
  horasNoLectivas: number;
  horasPIE: number; // Adicional
  detalleAsignaciones: {
    tipo: string;
    horas: number;
  }[];
}

/**
 * Genera resumen de horas para un docente
 * Fórmula: Horas Contrato - Horas Lectivas = Horas No Lectivas
 * PIE es adicional (no resta de contrato)
 */
export function generarResumenDocente(docente: Docente): ResumenHorasDocente {
  const asignacionesSinPIE = docente.asignaciones.filter(a => a.tipo !== "PIE");
  const asignacionesPIE = docente.asignaciones.filter(a => a.tipo === "PIE");
  
  const horasLectivas = asignacionesSinPIE.reduce((sum, a) => sum + a.horasLectivas, 0);
  const horasNoLectivas = docente.horasContrato - horasLectivas;
  const horasPIE = asignacionesPIE.reduce((sum, a) => sum + a.horasLectivas, 0);
  
  return {
    nombre: docente.nombre,
    horasContrato: docente.horasContrato,
    horasLectivas,
    horasNoLectivas,
    horasPIE,
    detalleAsignaciones: docente.asignaciones.map(a => ({
      tipo: a.tipo,
      horas: a.horasLectivas,
    })),
  };
}
```

**Checklist:**
- [ ] Crear función `generarResumenDocente()`
- [ ] Retornar: horasContrato, horasLectivas, horasNoLectivas, horasPIE
- [ ] Mostrar en UI como tabla/resumen
- [ ] Validar fórmula: Contrato - Lectivas = No Lectivas

---

### TAREA 8: Actualizar Exportación a Excel con Nuevas Columnas
**Objetivo:** Exportar reporte que incluya nuevas validaciones y cálculos.

**Cambios requeridos:**

En componente de exportación (`generateExcel`, `generatePDF`, etc.):

```typescript
// Agregar columnas:
// - Tipo de Asignación (Normal, SEP, EIB, Directiva, PIE)
// - Ciclo (Primer Ciclo, Segundo Ciclo)
// - Proporción (60/40, 65/35)
// - Horas Lectivas
// - Horas No Lectivas
// - TOTAL (Contrato - Lectivas)
// - PIE (Adicional)

export function exportarReporte(docentes: Docente[]) {
  const datos = docentes.map(d => {
    const resumen = generarResumenDocente(d);
    return {
      nombre: d.nombre,
      rut: d.rut,
      horasContrato: d.horasContrato,
      horasLectivas: resumen.horasLectivas,
      horasNoLectivas: resumen.horasNoLectivas,
      horasPIE: resumen.horasPIE,
      detalleAsignaciones: resumen.detalleAsignaciones.map(a => `${a.tipo}: ${a.horas}h`).join(" | "),
    };
  });
  
  // Exportar a Excel con estos datos
  return generarExcel(datos);
}
```

**Checklist:**
- [ ] Agregar columnas: Tipo, Ciclo, Proporción
- [ ] Agregar columnas: Horas Lectivas, No Lectivas
- [ ] Agregar columna: TOTAL (Contrato - Lectivas)
- [ ] Agregar columna: PIE (si hay)
- [ ] Validar que fórmula Excel coincida con cálculo en código

---

## ORDEN DE EJECUCIÓN RECOMENDADO

1. **PRIMERO:** Responder las 3 preguntas de PREGUNTA 1
2. **SEGUNDO:** TAREA 1 (Types) + TAREA 2 (Calculos)
3. **TERCERO:** TAREA 3 (Store refactorizado)
4. **CUARTO:** TAREA 4 (Creación de docente única)
5. **QUINTO:** TAREA 5 + TAREA 6 (UI y validaciones)
6. **SEXTO:** TAREA 7 (Resumen)
7. **SÉPTIMO:** TAREA 8 (Exportación)

---

## RESUMEN DE REGLAS CRÍTICAS (Para Referencia)

| Tipo | Bloques | Suma Total | Fórmula |
|------|---------|-----------|---------|
| **Normal** | ✅ Sí | ✅ Sí | Horas = Bloques × 1h |
| **SEP** | ✅ Sí | ✅ Sí | Horas = Bloques × 1h |
| **EIB** | ✅ Sí | ✅ Sí | Horas = Bloques × 1h |
| **Directiva** | ❌ No | ✅ Sí | Horas = Input manual |
| **PIE** | ❌ No | ❌ No (Adicional) | Horas = Input manual |

**Fórmula Final:**
```
Horas No Lectivas = Horas Contrato - Horas Lectivas (sin PIE)
```

---

## REFERENCIAS

- **Ley 20.903:** Sistema de Desarrollo Profesional Docente
- **Tablas Normativas:** `tablas_horas_lectivas_2019.xlsx`
  - Tabla 65/35: Segundo ciclo (general)
  - Tabla 60/40: Primer ciclo (80%+ alumnos prioritarios)
