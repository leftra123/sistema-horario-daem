import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Docente, HorarioData, Establecimiento, Asignatura, BloqueHorario, BloqueConfig, BLOQUES_DEFAULT } from '@/types';

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
  getHorasUsadasDocente: (docenteId: number) => number;
  tieneConflictoHorario: (docenteId: number, dia: string, bloqueId: number, cursoActual: string) => {
    conflicto: boolean;
    cursoKey?: string;
    establecimientoId?: number;
    establecimientoNombre?: string;
  };
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

        // NUEVO: Verificar día bloqueado
        const [estIdStr] = cursoKey.split('-');
        const estId = parseInt(estIdStr);
        const asignacion = docente.asignaciones.find(a => a.establecimientoId === estId);

        if (asignacion?.diasBloqueados?.includes(dia)) {
          return {
            success: false,
            error: `🚫 ${docente.nombre} NO está disponible los ${dia} en este establecimiento`
          };
        }

        // Verificar conflicto de horario
        const resultado = state.tieneConflictoHorario(docenteId, dia, bloqueId, cursoKey);
        if (resultado.conflicto) {
          const [, nivel, seccion] = resultado.cursoKey?.split('-') || ['', '', ''];
          const cursoConflicto = `${nivel} ${seccion}`;
          return {
            success: false,
            error: `⚠️ ${docente.nombre} ya tiene clase en este horario en ${cursoConflicto}${resultado.establecimientoNombre ? ` (${resultado.establecimientoNombre})` : ''}`
          };
        }

        // Verificar horas disponibles
        const horasUsadas = state.getHorasUsadasDocente(docenteId);
        const totalHoras = docente.asignaciones.reduce((sum, a) => sum + a.horasContrato, 0);

        if (horasUsadas >= totalHoras) {
          return {
            success: false,
            error: `⚠️ ${docente.nombre} no tiene horas disponibles (${horasUsadas}/${totalHoras}h)`
          };
        }

        // Asignar el bloque
        const bloqueKey = `${dia}-${bloqueId}`;
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
      getHorasUsadasDocente: (docenteId) => {
        const state = get();
        let horasUsadas = 0;
        Object.values(state.horarios).forEach(horarioCurso => {
          Object.values(horarioCurso).forEach(bloque => {
            if (bloque.docenteId === docenteId) {
              horasUsadas++;
            }
          });
        });
        return horasUsadas;
      },

      tieneConflictoHorario: (docenteId, dia, bloqueId, cursoActual) => {
        const state = get();
        const bloqueKey = `${dia}-${bloqueId}`;

        for (const [cursoKey, horarioCurso] of Object.entries(state.horarios)) {
          if (cursoKey === cursoActual) {
            continue; // Ignorar el curso actual
          }

          const bloque = horarioCurso[bloqueKey];

          if (bloque && bloque.docenteId === docenteId) {
            // Extraer establecimientoId del cursoKey (formato: "estId-nivel-seccion")
            const [estIdStr] = cursoKey.split('-');
            const estId = parseInt(estIdStr);
            const establecimiento = state.establecimientos.find(e => e.id === estId);

            return {
              conflicto: true,
              cursoKey,
              establecimientoId: estId,
              establecimientoNombre: establecimiento?.nombre || 'Establecimiento desconocido'
            };
          }
        }

        return { conflicto: false }; // No hay conflicto
      },

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