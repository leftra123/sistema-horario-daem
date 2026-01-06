'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Docente, Asignacion, CARGOS, DIAS, SUBVENCIONES, Subvencion } from '@/types';
import { validarRut, formatearRut } from '@/lib/utils/validaciones';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface DocenteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docenteToEdit?: Docente | null;
}

export function DocenteFormModal({ open, onOpenChange, docenteToEdit }: DocenteFormModalProps) {
  const { establecimientos, docentes, addDocente, updateDocente } = useAppStore();
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

  const resetForm = () => {
    setNombre('');
    setRut('');
    setAsignaciones([]);
  };

  // Cargar datos si estamos editando
  useEffect(() => {
    if (docenteToEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNombre(docenteToEdit.nombre);
      setRut(docenteToEdit.rut);
      setAsignaciones([...docenteToEdit.asignaciones]);
    } else {
      resetForm();
    }
  }, [docenteToEdit, open]);

  const handleAddAsignacion = () => {
    if (establecimientos.length === 0) {
      toast.error('No hay establecimientos disponibles');
      return;
    }

    const nuevaAsignacion: Asignacion = {
      establecimientoId: establecimientos[0].id,
      establecimientoNombre: establecimientos[0].nombre,
      cargo: CARGOS[0],
      horasContrato: 10,
      tipo: 'Titular',
    };

    setAsignaciones([...asignaciones, nuevaAsignacion]);
  };

  const handleRemoveAsignacion = (index: number) => {
    setAsignaciones(asignaciones.filter((_, i) => i !== index));
  };

  const handleUpdateAsignacion = (index: number, field: keyof Asignacion, value: unknown) => {
    const updated = [...asignaciones];

    if (field === 'establecimientoId') {
      const estId = parseInt(value as string);
      const est = establecimientos.find(e => e.id === estId);
      if (est) {
        updated[index].establecimientoId = estId;
        updated[index].establecimientoNombre = est.nombre;
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updated[index] as any)[field] = value;
    }

    setAsignaciones(updated);
  };

  const toggleDiaBloqueado = (asigIdx: number, dia: string) => {
    const newAsigs = [...asignaciones];
    const bloqueados = newAsigs[asigIdx].diasBloqueados || [];

    if (bloqueados.includes(dia)) {
      newAsigs[asigIdx].diasBloqueados = bloqueados.filter(d => d !== dia);
    } else {
      newAsigs[asigIdx].diasBloqueados = [...bloqueados, dia];
    }

    setAsignaciones(newAsigs);
  };

  const toggleSubvencion = (asigIdx: number, subvencion: Subvencion) => {
    const newAsigs = [...asignaciones];
    const subvenciones = newAsigs[asigIdx].subvenciones || [];

    if (subvenciones.includes(subvencion)) {
      newAsigs[asigIdx].subvenciones = subvenciones.filter(s => s !== subvencion);
    } else {
      // Limitar a máximo 3 subvenciones
      if (subvenciones.length >= 3) {
        toast.error('Máximo 3 subvenciones por asignación');
        return;
      }
      newAsigs[asigIdx].subvenciones = [...subvenciones, subvencion];
    }

    setAsignaciones(newAsigs);
  };

  const handleSubmit = () => {
    // Validaciones
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!rut.trim()) {
      toast.error('El RUT es obligatorio');
      return;
    }

    if (!validarRut(rut)) {
      toast.error('El RUT no es válido');
      return;
    }

    if (asignaciones.length === 0) {
      toast.error('Debe agregar al menos una asignación');
      return;
    }

    // Validar horas
    for (const asig of asignaciones) {
      if (asig.horasContrato < 1 || asig.horasContrato > 44) {
        toast.error('Las horas de contrato deben estar entre 1 y 44');
        return;
      }
    }

    const totalHoras = asignaciones.reduce((sum, a) => sum + a.horasContrato, 0);
    if (totalHoras > 44) {
      toast.error(`Total de horas (${totalHoras}h) excede el máximo de 44h`);
      return;
    }

    // Verificar RUT duplicado (solo si no estamos editando o si cambió el RUT)
    const rutFormateado = formatearRut(rut);
    const existeRut = docentes.find(
      d => d.rut === rutFormateado && (!docenteToEdit || d.id !== docenteToEdit.id)
    );

    if (existeRut) {
      toast.error('Ya existe un docente con ese RUT');
      return;
    }

    if (docenteToEdit) {
      // Editar docente existente
      const docenteActualizado: Docente = {
        id: docenteToEdit.id,
        nombre: nombre.trim(),
        rut: rutFormateado,
        asignaciones: asignaciones,
      };

      updateDocente(docenteToEdit.id, docenteActualizado);
      toast.success(`Docente ${docenteActualizado.nombre} actualizado correctamente`);
    } else {
      // Agregar nuevo docente
      const nuevoDocente: Docente = {
        id: Date.now(),
        nombre: nombre.trim(),
        rut: rutFormateado,
        asignaciones: asignaciones,
      };

      addDocente(nuevoDocente);
      toast.success(`Docente ${nuevoDocente.nombre} agregado correctamente`);
    }

    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {docenteToEdit ? 'Editar Docente' : 'Agregar Nuevo Docente'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Datos Personales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Datos Personales</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: María González Pérez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rut">RUT *</Label>
                <Input
                  id="rut"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  onBlur={() => setRut(rut ? formatearRut(rut) : '')}
                  placeholder="Ej: 12.345.678-9"
                />
              </div>
            </div>
          </div>

          {/* Asignaciones */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm text-gray-700">Asignaciones</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAsignacion}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Asignación
              </Button>
            </div>

            {asignaciones.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                <p className="text-sm">No hay asignaciones</p>
                <p className="text-xs mt-1">Haz clic en &quot;Agregar Asignación&quot; para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {asignaciones.map((asig, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Asignación {idx + 1}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAsignacion(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Establecimiento</Label>
                        <Select
                          value={asig.establecimientoId.toString()}
                          onValueChange={(value) => handleUpdateAsignacion(idx, 'establecimientoId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {establecimientos.map(e => (
                              <SelectItem key={e.id} value={e.id.toString()}>
                                {e.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Cargo</Label>
                        <Select
                          value={asig.cargo}
                          onValueChange={(value) => handleUpdateAsignacion(idx, 'cargo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CARGOS.map(cargo => (
                              <SelectItem key={cargo} value={cargo}>
                                {cargo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={asig.tipo}
                          onValueChange={(value) => handleUpdateAsignacion(idx, 'tipo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Titular">Titular</SelectItem>
                            <SelectItem value="Contrata">Contrata</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Horas Contrato</Label>
                        <Input
                          type="number"
                          min="1"
                          max="44"
                          value={asig.horasContrato}
                          onChange={(e) => handleUpdateAsignacion(idx, 'horasContrato', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Días Bloqueados */}
                    <div className="space-y-2 border-t pt-3">
                      <Label className="text-xs text-gray-600 flex items-center gap-2">
                        <span>🚫</span>
                        Días NO disponibles en este establecimiento
                        <span className="text-[10px] text-gray-400">(trabaja en otra escuela)</span>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {DIAS.map(dia => {
                          const bloqueado = asig.diasBloqueados?.includes(dia) || false;
                          return (
                            <Button
                              key={dia}
                              type="button"
                              size="sm"
                              variant={bloqueado ? "destructive" : "outline"}
                              onClick={() => toggleDiaBloqueado(idx, dia)}
                              className="text-xs"
                            >
                              {bloqueado && '🚫 '}
                              {dia.substring(0, 3)}
                            </Button>
                          );
                        })}
                      </div>
                      {asig.diasBloqueados && asig.diasBloqueados.length > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ Este docente NO puede ser asignado los {asig.diasBloqueados.join(', ')} en {asig.establecimientoNombre}
                        </p>
                      )}
                    </div>

                    {/* Subvenciones */}
                    <div className="space-y-2 border-t pt-3">
                      <Label className="text-xs text-gray-600 flex items-center gap-2">
                        <span>💰</span>
                        Subvenciones asociadas a esta asignación
                        <span className="text-[10px] text-gray-400">(máximo 3)</span>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {SUBVENCIONES.map(subv => {
                          const seleccionada = asig.subvenciones?.includes(subv.value) || false;
                          return (
                            <Button
                              key={subv.value}
                              type="button"
                              size="sm"
                              variant={seleccionada ? "default" : "outline"}
                              onClick={() => toggleSubvencion(idx, subv.value)}
                              className="text-xs"
                              style={{
                                backgroundColor: seleccionada ? subv.color : 'transparent',
                                borderColor: subv.color,
                                color: seleccionada ? 'white' : subv.color
                              }}
                            >
                              {seleccionada && '✓ '}
                              {subv.value}
                            </Button>
                          );
                        })}
                      </div>
                      {asig.subvenciones && asig.subvenciones.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                          <p className="text-xs text-blue-700">
                            <strong>Subvenciones activas:</strong> {asig.subvenciones.map(s => {
                              const subv = SUBVENCIONES.find(sv => sv.value === s);
                              return subv?.label || s;
                            }).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {asignaciones.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-900">
                  Total de horas: {asignaciones.reduce((sum, a) => sum + a.horasContrato, 0)}h / 44h
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {docenteToEdit ? 'Guardar Cambios' : 'Agregar Docente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
