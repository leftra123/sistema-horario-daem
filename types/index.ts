// types/index.ts

export interface Establecimiento {
  id: number;
  nombre: string;
  niveles: string; // "1-8" o "7-12"
  prioritarios: boolean; // 80%+ alumnos prioritarios (afecta tabla 60/40 vs 65/35)
  // NOTA: proporcion se movió a Asignacion (depende del ciclo de enseñanza)
  secciones?: string[]; // ["A", "B"]

  // Asignaturas personalizadas del establecimiento
  asignaturas?: Asignatura[];  // Si no existe, usa ASIGNATURAS_BASE

  // Configuración de horarios personalizada
  configuracionHorario?: {
    horaInicio: string;           // "08:00"
    horaTermino: string;          // "16:45"
    duracionBloque: number;       // 45 (minutos)
    recreos: {
      bloque: number;             // Después de bloque N
      duracionMinutos: number;    // 15
    }[];
    colacion?: {
      bloque: number;             // Después de bloque N
      duracionMinutos: number;    // 30
    };
    usarConfiguracionPersonalizada: boolean;
  };
}

export type Cargo = "DOCENTE DE AULA" | "DOCENTE PIE" | "DOCENTE EIB" | "DIRECTIVO" | "OTRO" | string;

export const CARGOS: Cargo[] = [
  "DOCENTE DE AULA",
  "DOCENTE PIE",
  "DOCENTE EIB",
  "DIRECTIVO",
  "OTRO"
];

export type Subvencion = "PIE" | "SEP" | "SN";

export const SUBVENCIONES: { value: Subvencion; label: string; color: string }[] = [
  { value: "PIE", label: "PIE (Programa Integración Escolar)", color: "#3b82f6" },
  { value: "SEP", label: "SEP (Subvención Escolar Preferencial)", color: "#10b981" },
  { value: "SN", label: "SN (Subvención Normal)", color: "#8b5cf6" }
];

// NUEVO: Tipo de asignación según Ley 20.903
export type TipoAsignacion = "Normal" | "SEP" | "EIB" | "Directiva" | "PIE";

export const TIPOS_ASIGNACION: { value: TipoAsignacion; label: string; color: string; permiteBloque: boolean }[] = [
  { value: "Normal", label: "Subvención Normal", color: "#8b5cf6", permiteBloque: true },
  { value: "SEP", label: "SEP (Subvención Escolar Preferencial)", color: "#10b981", permiteBloque: true },
  { value: "EIB", label: "EIB (Educación Intercultural Bilingüe)", color: "#eab308", permiteBloque: true },
  { value: "Directiva", label: "Directiva (No Lectivas)", color: "#64748b", permiteBloque: false },
  { value: "PIE", label: "PIE (Adicional - No suma en contrato)", color: "#3b82f6", permiteBloque: false }
];

// Tipo de ciclo de enseñanza (afecta proporción lectiva/no lectiva)
export type CicloEnsenanza = "Primer Ciclo" | "Segundo Ciclo";

export const CICLOS_ENSENANZA: { value: CicloEnsenanza; label: string }[] = [
  { value: "Primer Ciclo", label: "Primer Ciclo (1º-4º básico)" },
  { value: "Segundo Ciclo", label: "Segundo Ciclo (5º-8º básico, media)" }
];

// Tipo de proporción lectiva/no lectiva
export type Proporcion = "60/40" | "65/35";

export interface Asignatura {
  id: number;
  codigo: string;
  nombre: string;
  color: string;
  editable?: boolean; // Para "Otras"
}

export interface Asignacion {
  id: string;                      // Identificador único de la asignación
  establecimientoId: number;
  establecimientoNombre: string;
  cargo: Cargo;                    // Viene de columna "FUNCION" del Excel
  horasContrato: number;           // Jornada semanal total (Ej: 44 horas)
  titularidad: string;             // Titular/Contrata (antes "tipo")

  // ✅ NUEVO: Tipo de asignación según Ley 20.903
  tipoAsignacion: TipoAsignacion;  // "Normal" | "SEP" | "EIB" | "Directiva" | "PIE"

  // ✅ NUEVO: Ciclo de enseñanza (obligatorio)
  ciclo: CicloEnsenanza;           // "Primer Ciclo" | "Segundo Ciclo"

  // ✅ NUEVO: Proporción lectiva/no lectiva (derivada del ciclo + establecimiento)
  proporcion: Proporcion;          // "60/40" | "65/35"

  // ✅ NUEVO: Horas lectivas (calculadas según tabla normativa Ley 20.903)
  // Se obtiene de getHorasLectivasDeTabla(horasContrato, proporcion)
  horasLectivas: number;           // Horas frente a alumnos (READ-ONLY)

  // ✅ NUEVO: Horas no lectivas (calculadas)
  // Fórmula: horasNoLectivas = horasContrato - horasLectivas
  horasNoLectivas: number;         // Horas administrativas/planificación (READ-ONLY)

  // Bloques asignados (SOLO para Normal/SEP/EIB - NO para Directiva/PIE)
  bloquesAsignados?: string[];     // IDs de bloques ["1-Lunes-1", "1-Martes-2"]

  // Modelo detallado (opcional - para compatibilidad con importación)
  desglose?: {
    plan110: number;
    plan10: number;
    pie: number;
    codocencia: number;
  };

  // Días bloqueados (docente trabaja en otra escuela esos días)
  diasBloqueados?: string[];       // ["Lunes", "Martes"] = NO disponible estos días

  // Subvenciones (DEPRECADO - usar tipoAsignacion)
  subvenciones?: ("PIE" | "SEP" | "SN")[];
}

export interface Docente {
  id: number;
  rut: string;            // Viene de columna "RUT"
  nombre: string;         // Viene de columna "NOMBRE"
  asignaciones: Asignacion[];
}

export interface BloqueHorario {
  asignatura: Asignatura;
  docenteId: number;
  docenteNombre: string;
}

// Configuración de bloques horarios
export interface BloqueConfig {
  id: number;
  horaInicio: string;
  horaFin: string;
  tipo: "clase" | "recreo" | "colacion";
  duracionMinutos: number;
}

// Estructura del Horario (Escuela-Curso -> Dia-Bloque -> Datos)
export type HorarioData = Record<string, Record<string, BloqueHorario>>;

export const ASIGNATURAS_BASE: Asignatura[] = [
  { id: 1, codigo: "LyC", nombre: "Lenguaje y Comunicación", color: "#ef4444" }, // red-500
  { id: 2, codigo: "Mat", nombre: "Matemática", color: "#3b82f6" }, // blue-500
  { id: 3, codigo: "CN", nombre: "Ciencias Naturales", color: "#8b5cf6" }, // violet-500
  { id: 4, codigo: "HGyCs", nombre: "Historia, Geografía y Cs. Sociales", color: "#ec4899" }, // pink-500
  { id: 5, codigo: "Ing", nombre: "Inglés", color: "#10b981" }, // emerald-500
  { id: 6, codigo: "EF", nombre: "Educación Física y Salud", color: "#06b6d4" }, // cyan-500
  { id: 7, codigo: "AV", nombre: "Artes Visuales", color: "#f59e0b" }, // amber-500
  { id: 8, codigo: "Mus", nombre: "Música", color: "#a855f7" }, // purple-500
  { id: 9, codigo: "Tec", nombre: "Tecnología", color: "#64748b" }, // slate-500
  { id: 10, codigo: "LI", nombre: "Lengua Indígena", color: "#eab308" }, // yellow-500
  { id: 11, codigo: "O", nombre: "Orientación", color: "#14b8a6" }, // teal-500
  { id: 12, codigo: "Rel", nombre: "Religión", color: "#d946ef" }, // fuchsia-500
  { id: 13, codigo: "TA", nombre: "Taller A", color: "#f97316" }, // orange-500
  { id: 14, codigo: "TB", nombre: "Taller B", color: "#84cc16" }, // lime-500
  { id: 15, codigo: "TC", nombre: "Taller C", color: "#0ea5e9" }, // sky-500
  { id: 16, codigo: "Otras", nombre: "Otras", color: "#6b7280", editable: true }, // gray-500
];

// Días de la semana
export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Bloques horarios (10 bloques de 45 minutos) - DEPRECADO, usar BLOQUES_DEFAULT
export const BLOQUES = [
  { id: 1, hora: "08:00 - 08:45" },
  { id: 2, hora: "08:45 - 09:30" },
  { id: 3, hora: "09:45 - 10:30" },
  { id: 4, hora: "10:30 - 11:15" },
  { id: 5, hora: "11:30 - 12:15" },
  { id: 6, hora: "12:15 - 13:00" },
  { id: 7, hora: "14:00 - 14:45" },
  { id: 8, hora: "14:45 - 15:30" },
  { id: 9, hora: "15:45 - 16:30" },
  { id: 10, hora: "16:30 - 17:15" },
];

// Bloques configurables por defecto (incluye recreos y colación)
export const BLOQUES_DEFAULT: BloqueConfig[] = [
  { id: 1, horaInicio: "08:00", horaFin: "08:45", tipo: "clase", duracionMinutos: 45 },
  { id: 2, horaInicio: "08:45", horaFin: "09:30", tipo: "clase", duracionMinutos: 45 },
  { id: 3, horaInicio: "09:30", horaFin: "09:45", tipo: "recreo", duracionMinutos: 15 },
  { id: 4, horaInicio: "09:45", horaFin: "10:30", tipo: "clase", duracionMinutos: 45 },
  { id: 5, horaInicio: "10:30", horaFin: "11:15", tipo: "clase", duracionMinutos: 45 },
  { id: 6, horaInicio: "11:15", horaFin: "11:30", tipo: "recreo", duracionMinutos: 15 },
  { id: 7, horaInicio: "11:30", horaFin: "12:15", tipo: "clase", duracionMinutos: 45 },
  { id: 8, horaInicio: "12:15", horaFin: "13:00", tipo: "clase", duracionMinutos: 45 },
  { id: 9, horaInicio: "13:00", horaFin: "13:30", tipo: "colacion", duracionMinutos: 30 },
  { id: 10, horaInicio: "13:30", horaFin: "14:15", tipo: "clase", duracionMinutos: 45 },
  { id: 11, horaInicio: "14:15", horaFin: "15:00", tipo: "clase", duracionMinutos: 45 },
  { id: 12, horaInicio: "15:00", horaFin: "15:15", tipo: "recreo", duracionMinutos: 15 },
  { id: 13, horaInicio: "15:15", horaFin: "16:00", tipo: "clase", duracionMinutos: 45 },
  { id: 14, horaInicio: "16:00", horaFin: "16:45", tipo: "clase", duracionMinutos: 45 },
];
