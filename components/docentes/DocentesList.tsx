'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, ChevronDown, ChevronRight, FileSpreadsheet, FileDown, Search } from 'lucide-react';
import { DocenteFormModal } from './DocenteFormModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import ExplicacionHoras from './ExplicacionHoras';
import VistaHorarioDocente from './VistaHorarioDocente';
import { getHorasLectivasDocente, getHorasUsadasEnBloques, getTotalHorasUsadasDocente } from '@/lib/utils/calculos-horas';
import {
  exportarHorarioDocenteExcel,
  exportarHorarioDocentePDF
} from '@/lib/utils/export-horarios';
import { Docente, SUBVENCIONES } from '@/types';
import { toast } from 'sonner';

export function DocentesList() {
  const { docentes, establecimientos, horarios, removeDocente, getBloquesPorEstablecimiento } = useAppStore();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para confirmación de eliminación
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [docenteToDelete, setDocenteToDelete] = useState<{ id: number; nombre: string } | null>(null);

  // Filtrar docentes por búsqueda (optimizado con useMemo)
  const docentesFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return docentes;

    const termLower = searchTerm.toLowerCase().trim();
    return docentes.filter(d =>
      d.nombre.toLowerCase().includes(termLower) ||
      d.rut.includes(termLower) ||
      d.asignaciones.some(a =>
        a.establecimientoNombre.toLowerCase().includes(termLower) ||
        a.cargo.toLowerCase().includes(termLower)
      )
    );
  }, [docentes, searchTerm]);

  const handleDeleteClick = (docenteId: number, docenteNombre: string) => {
    setDocenteToDelete({ id: docenteId, nombre: docenteNombre });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!docenteToDelete) return;

    removeDocente(docenteToDelete.id);
    toast.success(`Docente ${docenteToDelete.nombre} eliminado correctamente`);

    setDeleteConfirmOpen(false);
    setDocenteToDelete(null);
  };

  const handleEdit = (docente: Docente) => {
    setEditingDocente(docente);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingDocente(null);
  };

  if (docentes.length === 0) {
    return (
      <Card>
        <CardContent className="py-20">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">No hay docentes registrados</p>
            <p className="text-sm mt-2">Usa el botón &quot;Agregar Docente&quot; para comenzar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-4">
            <CardTitle>Planta Docente ({docentesFiltrados.length}{searchTerm ? ` de ${docentes.length}` : ''})</CardTitle>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por nombre, RUT, establecimiento o cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead className="text-center">Asignaciones</TableHead>
                <TableHead className="text-center">Horas Totales</TableHead>
                <TableHead className="text-center">Horas Lectivas</TableHead>
                <TableHead className="text-center">Horas Usadas</TableHead>
                <TableHead className="text-center">Disponibles</TableHead>
                <TableHead className="text-center">Explicación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docentesFiltrados.map((docente) => {
                const horasLectivas = getHorasLectivasDocente(docente, establecimientos);
                const horasUsadas = getHorasUsadasEnBloques(docente.id, horarios);
                const horasDisponibles = Math.max(0, horasLectivas - horasUsadas);
                const totalHoras = getTotalHorasUsadasDocente(docente);
                const porcentajeUsado = horasLectivas > 0 ? (horasUsadas / horasLectivas) * 100 : 0;
                const isExpanded = expandedId === docente.id;

                return (
                  <>
                    <TableRow key={docente.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : docente.id)}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{docente.nombre}</TableCell>
                      <TableCell className="text-sm">{docente.rut}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{docente.asignaciones.length}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">{totalHoras}h</TableCell>
                      <TableCell className="text-center font-mono text-sm font-semibold text-blue-600">
                        {horasLectivas}h
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono text-sm">{horasUsadas}h</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${horasUsadas >= horasLectivas ? 'bg-red-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, porcentajeUsado)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={horasDisponibles > 0 ? "default" : "secondary"}
                          className={horasDisponibles > 0 ? "bg-emerald-500" : "bg-gray-400"}
                        >
                          {horasDisponibles}h
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <ExplicacionHoras docente={docente} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <VistaHorarioDocente docente={docente} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Obtener el establecimiento principal (primera asignación)
                              const est = establecimientos.find(e => e.id === docente.asignaciones[0]?.establecimientoId);
                              if (est) {
                                const bloques = getBloquesPorEstablecimiento(est.id);
                                const filename = exportarHorarioDocenteExcel(
                                  docente,
                                  horarios,
                                  bloques
                                );
                                toast.success(`✅ Exportado: ${filename}`);
                              }
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Exportar a Excel"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const est = establecimientos.find(e => e.id === docente.asignaciones[0]?.establecimientoId);
                              if (est) {
                                const bloques = getBloquesPorEstablecimiento(est.id);
                                const filename = exportarHorarioDocentePDF(
                                  docente,
                                  horarios,
                                  bloques,
                                  est.nombre
                                );
                                toast.success(`✅ Exportado: ${filename}`);
                              }
                            }}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="Exportar a PDF"
                          >
                            <FileDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(docente)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(docente.id, docente.nombre)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row - Muestra asignaciones */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={10} className="bg-gray-50 p-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-gray-700">Asignaciones por Establecimiento:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {docente.asignaciones.map((asig, idx) => {
                                const est = establecimientos.find(e => e.id === asig.establecimientoId);
                                return (
                                  <div
                                    key={idx}
                                    className="bg-white border rounded-lg p-3 flex justify-between items-start"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{est?.nombre || 'Establecimiento desconocido'}</p>
                                      <div className="flex gap-2 mt-1 flex-wrap">
                                        <Badge variant="outline" className="text-xs">{asig.cargo}</Badge>
                                        <Badge variant="secondary" className="text-xs">{asig.titularidad}</Badge>
                                      </div>
                                      {asig.subvenciones && asig.subvenciones.length > 0 && (
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                          {asig.subvenciones.map(s => {
                                            const subv = SUBVENCIONES.find(sv => sv.value === s);
                                            return (
                                              <Badge
                                                key={s}
                                                className="text-[10px] px-2 py-0.5"
                                                style={{
                                                  backgroundColor: subv?.color,
                                                  color: 'white',
                                                  border: 'none'
                                                }}
                                              >
                                                💰 {s}
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {asig.desglose && (
                                        <div className="mt-2 text-xs text-gray-500">
                                          <p>Plan 110: {asig.desglose.plan110}h | Plan 10: {asig.desglose.plan10}h</p>
                                          <p>PIE: {asig.desglose.pie}h | Codocencia: {asig.desglose.codocencia}h</p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-lg">{asig.horasContrato}h</p>
                                      <p className="text-xs text-gray-500">contrato</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <DocenteFormModal
        open={formOpen}
        onOpenChange={handleCloseForm}
        docenteToEdit={editingDocente}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar docente?"
        description={
          docenteToDelete
            ? `¿Estás seguro de eliminar a ${docenteToDelete.nombre}? ${
                getHorasUsadasEnBloques(docenteToDelete.id, horarios) > 0
                  ? `⚠️ Este docente tiene ${getHorasUsadasEnBloques(docenteToDelete.id, horarios)} horas asignadas en horarios que también se eliminarán.`
                  : 'Esta acción no se puede deshacer.'
              }`
            : ''
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </>
  );
}
