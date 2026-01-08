import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Docente, HorarioData, Establecimiento, Asignatura, BloqueHorario, BloqueConfig, BLOQUES_DEFAULT } from '@/types';
import {
  getHorasUsadasEnBloques,
  getHorasDisponiblesParaBloques
} from '@/lib/utils/calculos-horas';

import { ESTABLECIMIENTOS_INICIALES } from './datos_iniciales';

interface AppState {
  docentes: Docente[];
  horarios: HorarioData;
  establecimientos: Establecimiento[];
  bloquesConfig: Record<number, BloqueConfig[]>; // key = establecimientoId

  // Acciones (Functions)
  addDocente: (docente: Docente) => void;
  updateDocente: (docenteId: number, docente: Docente) => void;
  removeDocente: (docenteId: number) => void;
  importarDocentes: (nuevos: Docente[]) => void;
  addEstablecimiento: (establecimiento: Establecimiento) => void;
  updateEstablecimiento: (establecimientoId: number, establecimiento: Partial<Establecimiento>) => void;
  deleteEstablecimiento: (establecimientoId: number) => void;
  togglePrioritarios: (establecimientoId: number) => void;
  setSecciones: (establecimientoId: number, secciones: string[]) => void;

  // Acciones de Horario
  asignarBloque: (
    cursoKey: string,
    dia: string,
    bloqueId: number,
    asignatura: Asignatura,
    docenteId: number
  ) => { success: boolean; error?: string };
  updateHorario: (cursoKey: string, bloqueKey: string, data: BloqueHorario) => void;
  removeBloque: (cursoKey: string, bloqueKey: string) => void;

  // Acciones de Bloques Configurables
  setBloquesPorEstablecimiento: (estId: number, bloques: BloqueConfig[]) => void;
  getBloquesPorEstablecimiento: (estId: number) => BloqueConfig[];
  resetBloquesDefault: (estId: number) => void;

  // Utilidades
  // NOTA: getHorasUsadasDocente y tieneConflictoHorario se movieron a calculos-horas.ts
  repararDatosCorruptos: () => { reparados: number; eliminados: number };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ESTADO INICIAL - Sistema inicia vacío
      docentes: [],
      establecimientos: ESTABLECIMIENTOS_INICIALES,
      horarios: {},
      bloquesConfig: {},

      // FUNCIONES DE DOCENTES
      addDocente: (docente) => set((state) => ({
        docentes: [...state.docentes, docente]
      })),

      updateDocente: (docenteId, docenteActualizado) => set((state) => ({
        docentes: state.docentes.map(d =>
          d.id === docenteId ? { ...docenteActualizado, id: docenteId } : d
        )
      })),

      removeDocente: (docenteId) => set((state) => {
        // Limpiar horarios del docente eliminado
        const newHorarios: HorarioData = {};
        Object.entries(state.horarios).forEach(([cursoKey, horarioCurso]) => {
          const newHorarioCurso: Record<string, BloqueHorario> = {};
          Object.entries(horarioCurso).forEach(([bloqueKey, bloque]) => {
            if (bloque.docenteId !== docenteId) {
              newHorarioCurso[bloqueKey] = bloque;
            }
          });
          newHorarios[cursoKey] = newHorarioCurso;
        });

        return {
          docentes: state.docentes.filter(d => d.id !== docenteId),
          horarios: newHorarios
        };
      }),

      importarDocentes: (nuevos) => set((state) => ({
        docentes: [...state.docentes, ...nuevos]
      })),

      // FUNCIONES DE ESTABLECIMIENTOS
      addEstablecimiento: (establecimiento) => set((state) => ({
        establecimientos: [...state.establecimientos, establecimiento]
      })),

      updateEstablecimiento: (establecimientoId, establecimientoActualizado) => set((state) => ({
        establecimientos: state.establecimientos.map(e =>
          e.id === establecimientoId ? { ...e, ...establecimientoActualizado } : e
        )
      })),

      deleteEstablecimiento: (establecimientoId) => set((state) => {
        // Limpiar bloques configurables del establecimiento
        const newBloquesConfig = { ...state.bloquesConfig };
        delete newBloquesConfig[establecimientoId];

        // Limpiar horarios de cursos del establecimiento
        const newHorarios: HorarioData = {};
        Object.entries(state.horarios).forEach(([cursoKey, horarioCurso]) => {
          const [estId] = cursoKey.split('-');
          if (parseInt(estId) !== establecimientoId) {
            newHorarios[cursoKey] = horarioCurso;
          }
        });

        return {
          establecimientos: state.establecimientos.filter(e => e.id !== establecimientoId),
          bloquesConfig: newBloquesConfig,
          horarios: newHorarios
        };
      }),

      togglePrioritarios: (establecimientoId) => set((state) => ({
        establecimientos: state.establecimientos.map(e =>
          e.id === establecimientoId ? { ...e, prioritarios: !e.prioritarios } : e
        )
      })),

      setSecciones: (establecimientoId, secciones) => set((state) => ({
        establecimientos: state.establecimientos.map(e =>
          e.id === establecimientoId ? { ...e, secciones } : e
        )
      })),

      // FUNCIONES DE HORARIO
      asignarBloque: (cursoKey, dia, bloqueId, asignatura, docenteId) => {
        const state = get();
        const docente = state.docentes.find(d => d.id === docenteId);

        if (!docente) {
          return { success: false, error: 'Docente no encontrado' };
        }

        // Extraer establecimiento ID del cursoKey
        const [estIdStr] = cursoKey.split('-');
        const estId = parseInt(estIdStr);
        const asignacion = docente.asignaciones.find(a => a.establecimientoId === estId);

        if (!asignacion) {
          return {
            success: false,
            error: `⚠️ ${docente.nombre} no tiene asignación en este establecimiento`
          };
        }

        // ✅ VALIDACIÓN 1: Verificar que Directiva no intente asignar bloques
        if (asignacion.tipoAsignacion === "Directiva") {
          return {
            success: false,
            error: `🚫 Las horas Directiva NO pueden asignarse en bloques. Son horas administrativas (no lectivas).`
          };
        }

        // ✅ VALIDACIÓN 2: Verificar que PIE no intente asignar bloques
        if (asignacion.tipoAsignacion === "PIE") {
          return {
            success: false,
            error: `🚫 Las horas PIE NO pueden asignarse en bloques. Son horas adicionales fuera del horario regular.`
          };
        }

        // ✅ VALIDACIÓN 3: Verificar día bloqueado
        if (asignacion.diasBloqueados?.includes(dia)) {
          return {
            success: false,
            error: `🚫 ${docente.nombre} NO está disponible los ${dia} en este establecimiento`
          };
        }

        // ✅ VALIDACIÓN 4: Verificar conflicto de horario
        const bloqueKey = `${dia}-${bloqueId}`;
        for (const [cursoKeyCheck, horarioCurso] of Object.entries(state.horarios)) {
          if (cursoKeyCheck === cursoKey) continue;

          const bloque = horarioCurso[bloqueKey];
          if (bloque && bloque.docenteId === docenteId) {
            const [, nivel, seccion] = cursoKeyCheck.split('-');
            const [estIdConflicto] = cursoKeyCheck.split('-');
            const establecimiento = state.establecimientos.find(e => e.id === parseInt(estIdConflicto));
            return {
              success: false,
              error: `⚠️ ${docente.nombre} ya tiene clase en este horario en ${nivel} ${seccion}${establecimiento ? ` (${establecimiento.nombre})` : ''}`
            };
          }
        }

        // ✅ VALIDACIÓN 5: Verificar horas disponibles (CORREGIDO - usa horasLectivas)
        const horasLectivasDisponibles = getHorasDisponiblesParaBloques(asignacion);
        const horasUsadas = getHorasUsadasEnBloques(docenteId, state.horarios);

        if (horasUsadas >= horasLectivasDisponibles) {
          return {
            success: false,
            error: `⚠️ ${docente.nombre} no tiene horas lectivas disponibles (${horasUsadas}/${horasLectivasDisponibles}h)`
          };
        }

        // ✅ Asignar el bloque
        set((state) => ({
          horarios: {
            ...state.horarios,
            [cursoKey]: {
              ...(state.horarios[cursoKey] || {}),
              [bloqueKey]: {
                asignatura,
                docenteId,
                docenteNombre: docente.nombre
              }
            }
          }
        }));

        return { success: true };
      },

      updateHorario: (cursoKey, bloqueKey, data) => set((state) => ({
        horarios: {
          ...state.horarios,
          [cursoKey]: {
            ...(state.horarios[cursoKey] || {}),
            [bloqueKey]: data
          }
        }
      })),

      removeBloque: (cursoKey, bloqueKey) => set((state) => {
        if (!state.horarios[cursoKey]) return state;
        const nuevoCurso = { ...state.horarios[cursoKey] };
        delete nuevoCurso[bloqueKey];
        return { horarios: { ...state.horarios, [cursoKey]: nuevoCurso } };
      }),

      // FUNCIONES DE BLOQUES CONFIGURABLES
      getBloquesPorEstablecimiento: (estId) => {
        const state = get();
        return state.bloquesConfig[estId] || BLOQUES_DEFAULT;
      },

      setBloquesPorEstablecimiento: (estId, bloques) => set((state) => ({
        bloquesConfig: { ...state.bloquesConfig, [estId]: bloques }
      })),

      resetBloquesDefault: (estId) => set((state) => ({
        bloquesConfig: { ...state.bloquesConfig, [estId]: BLOQUES_DEFAULT }
      })),

      // UTILIDADES
      // NOTA: getHorasUsadasDocente y tieneConflictoHorario se movieron a calculos-horas.ts
      // Usar: import { getHorasUsadasEnBloques, tieneConflictoHorario } from '@/lib/utils/calculos-horas'

      repararDatosCorruptos: () => {
        const state = get();
        let reparados = 0;
        let eliminados = 0;

        const nuevosHorarios: HorarioData = {};

        Object.entries(state.horarios).forEach(([cursoKey, horarioCurso]) => {
          const nuevoCurso: Record<string, BloqueHorario> = {};

          Object.entries(horarioCurso).forEach(([bloqueKey, bloque]) => {
            // Verificar si el bloque tiene todos los datos necesarios
            if (!bloque.docenteNombre || !bloque.asignatura || !bloque.docenteId) {
              // Intentar reparar
              const docente = state.docentes.find(d => d.id === bloque.docenteId);

              if (docente && bloque.asignatura) {
                // Reparar el bloque
                nuevoCurso[bloqueKey] = {
                  ...bloque,
                  docenteNombre: docente.nombre,
                  docenteId: docente.id
                };
                reparados++;
              } else {
                // No se puede reparar, eliminar
                eliminados++;
              }
            } else {
              // Bloque está bien, mantener
              nuevoCurso[bloqueKey] = bloque;
            }
          });

          if (Object.keys(nuevoCurso).length > 0) {
            nuevosHorarios[cursoKey] = nuevoCurso;
          }
        });

        set({ horarios: nuevosHorarios });

        return { reparados, eliminados };
      },
    }),
    {
      name: 'sistema-horario-storage',
    }
  )
);