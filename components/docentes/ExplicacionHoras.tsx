'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { Docente } from '@/types';
import { TABLA_60_40, TABLA_65_35 } from '@/lib/constants/tablas-horas';
import { 
  getTotalHorasUsadasDocente, 
  getTotalHorasLectivasDocente, 
  getTotalHorasNoLectivasDocente, 
  getTotalHorasPIE, 
  getTotalHorasDirectiva 
} from '@/lib/utils/calculos-horas';

interface Props {
  docente: Docente;
}

export default function ExplicacionHoras({ docente }: Props) {
  const getTablaEntry = (proporcion: string, horasContrato: number) => {
    const tabla = proporcion === '65/35' ? TABLA_65_35 : TABLA_60_40;
    return tabla[horasContrato] || { horasLectivas: 0, horasNoLectivas: 0 };
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          <Info className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📊 Explicación de Horas - {docente.nombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Introducción */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-sm text-blue-900 font-semibold">
              📊 Cálculo según Ley 20.903 - Proporción por ciclo y establecimiento
            </p>
          </div>

          {/* Desglose por asignación */}
          {docente.asignaciones.map((asig, idx) => {
            // Usar la proporción de la asignación directamente (ya calculada al crear/editar)
            const proporcion = asig.proporcion;
            const tablaEntry = getTablaEntry(proporcion, asig.horasContrato);
            const porcentajeLectivas = proporcion === '65/35' ? 65 : 60;
            const porcentajeNoLectivas = proporcion === '65/35' ? 35 : 40;

            return (
              <div key={idx} className="border rounded-lg p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-gray-800">{asig.establecimientoNombre}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">{asig.cargo}</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">{asig.ciclo}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">{proporcion}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Horas Contrato */}
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">Horas Contrato</p>
                    <p className="text-3xl font-bold text-gray-800">{asig.horasContrato}</p>
                    <p className="text-xs text-gray-400 mt-1">horas/semana</p>
                  </div>

                  {/* Horas Lectivas */}
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-700 uppercase mb-1">✅ Horas Lectivas</p>
                    <p className="text-3xl font-bold text-green-700">{tablaEntry.horasLectivas}</p>
                    <p className="text-xs text-green-600 mt-1">{porcentajeLectivas}% en aula</p>
                  </div>

                  {/* Horas No Lectivas */}
                  <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-3 text-center">
                    <p className="text-xs text-orange-700 uppercase mb-1">📋 Horas No Lectivas</p>
                    <p className="text-3xl font-bold text-orange-700">{tablaEntry.horasNoLectivas}</p>
                    <p className="text-xs text-orange-600 mt-1">{porcentajeNoLectivas}% prep./admin.</p>
                  </div>
                </div>

                {/* Explicación del cálculo */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-900 mb-2">📐 Resultado:</p>
                  <div className="font-mono text-xs text-blue-800">
                    <p>
                      <strong>{asig.horasContrato}h contrato</strong> →{' '}
                      <strong className="text-green-700">{tablaEntry.horasLectivas}h lectivas</strong> +{' '}
                      <strong className="text-orange-700">{tablaEntry.horasNoLectivas}h no lectivas</strong>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      (Según tabla {proporcion}: {porcentajeLectivas}% lectivas / {porcentajeNoLectivas}% no lectivas)
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Resumen Total */}
          {docente.asignaciones.length > 1 && (
            <div className="border-t-2 pt-4">
              <h3 className="font-bold text-gray-800 mb-3">📈 Resumen Total</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-gray-100 rounded p-3 text-center">
                  <p className="text-xs text-gray-600">Total Contrato</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {getTotalHorasUsadasDocente(docente)}h
                  </p>
                </div>
                <div className="bg-green-100 rounded p-3 text-center">
                  <p className="text-xs text-green-700">Total Lectivas</p>
                  <p className="text-2xl font-bold text-green-700">
                    {getTotalHorasLectivasDocente(docente)}h
                  </p>
                </div>
                <div className="bg-orange-100 rounded p-3 text-center">
                  <p className="text-xs text-orange-700">Total No Lectivas</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {getTotalHorasNoLectivasDocente(docente)}h
                  </p>
                </div>
                {getTotalHorasPIE(docente) > 0 && (
                  <div className="bg-blue-100 rounded p-3 text-center">
                    <p className="text-xs text-blue-700">Total PIE</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {getTotalHorasPIE(docente)}h
                    </p>
                  </div>
                )}
                {getTotalHorasDirectiva(docente) > 0 && (
                  <div className="bg-emerald-100 rounded p-3 text-center">
                    <p className="text-xs text-emerald-700">Total Directiva</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {getTotalHorasDirectiva(docente)}h
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advertencia importante */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start gap-2">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900 mb-1">Importante:</p>
                <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Solo las <strong>horas lectivas</strong> pueden asignarse en los horarios de clase.</li>
                  <li>Las <strong>horas no lectivas</strong> se destinan a preparación de clases, corrección de evaluaciones, reuniones, y tareas administrativas.</li>
                  <li>El sistema bloquea automáticamente la asignación cuando se alcanzan las horas lectivas disponibles.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
