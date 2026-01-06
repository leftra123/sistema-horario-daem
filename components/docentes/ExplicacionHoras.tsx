'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { Docente, Establecimiento } from '@/types';
import { TABLA_60_40, TABLA_65_35 } from '@/lib/constants/tablas-horas';

interface Props {
  docente: Docente;
  establecimientos: Establecimiento[];
}

export default function ExplicacionHoras({ docente, establecimientos }: Props) {
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

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📊 Explicación de Horas - {docente.nombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Introducción */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900">
              <strong>Ley 20.903 - Carrera Docente (Tabla 2019)</strong>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Las horas de contrato se distribuyen entre horas lectivas (en aula) y horas no lectivas (preparación, reuniones, administrativas).
            </p>
          </div>

          {/* Desglose por asignación */}
          {docente.asignaciones.map((asig, idx) => {
            const est = establecimientos.find(e => e.id === asig.establecimientoId);
            const proporcion = est?.proporcion || '60/40';
            const tablaEntry = getTablaEntry(proporcion, asig.horasContrato);
            const porcentajeLectivas = proporcion === '65/35' ? 65 : 60;
            const porcentajeNoLectivas = proporcion === '65/35' ? 35 : 40;

            return (
              <div key={idx} className="border rounded-lg p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-gray-800">{asig.establecimientoNombre}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">{asig.cargo}</span>
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
                  <p className="text-xs font-semibold text-blue-900 mb-2">📐 Cálculo según Tabla 2019:</p>
                  <div className="font-mono text-xs text-blue-800 space-y-1">
                    <p>
                      {asig.horasContrato} horas contrato × {porcentajeLectivas}% = <strong>{tablaEntry.horasLectivas}h lectivas</strong>
                    </p>
                    <p>
                      {asig.horasContrato} horas contrato × {porcentajeNoLectivas}% = <strong>{tablaEntry.horasNoLectivas}h no lectivas</strong>
                    </p>
                    <p className="border-t border-blue-300 pt-1 mt-2">
                      Verificación: {tablaEntry.horasLectivas}h + {tablaEntry.horasNoLectivas}h = {asig.horasContrato}h ✓
                    </p>
                  </div>
                </div>

                {/* Desglose si existe */}
                {asig.desglose && (
                  <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-900 mb-2">📊 Desglose Detallado:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Plan 110:</span>
                        <span className="font-bold">{asig.desglose.plan110}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Plan 10:</span>
                        <span className="font-bold">{asig.desglose.plan10}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">PIE:</span>
                        <span className="font-bold">{asig.desglose.pie}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Codocencia:</span>
                        <span className="font-bold">{asig.desglose.codocencia}h</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Resumen Total */}
          {docente.asignaciones.length > 1 && (
            <div className="border-t-2 pt-4">
              <h3 className="font-bold text-gray-800 mb-3">📈 Resumen Total</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-100 rounded p-3 text-center">
                  <p className="text-xs text-gray-600">Total Contrato</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {docente.asignaciones.reduce((sum, a) => sum + a.horasContrato, 0)}h
                  </p>
                </div>
                <div className="bg-green-100 rounded p-3 text-center">
                  <p className="text-xs text-green-700">Total Lectivas</p>
                  <p className="text-2xl font-bold text-green-700">
                    {docente.asignaciones.reduce((sum, a) => {
                      const est = establecimientos.find(e => e.id === a.establecimientoId);
                      const proporcion = est?.proporcion || '60/40';
                      const entry = getTablaEntry(proporcion, a.horasContrato);
                      return sum + entry.horasLectivas;
                    }, 0)}h
                  </p>
                </div>
                <div className="bg-orange-100 rounded p-3 text-center">
                  <p className="text-xs text-orange-700">Total No Lectivas</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {docente.asignaciones.reduce((sum, a) => {
                      const est = establecimientos.find(e => e.id === a.establecimientoId);
                      const proporcion = est?.proporcion || '60/40';
                      const entry = getTablaEntry(proporcion, a.horasContrato);
                      return sum + entry.horasNoLectivas;
                    }, 0)}h
                  </p>
                </div>
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
