'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { School, Plus, X, AlertTriangle, Palette } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { generarBloquesDesdeConfiguracion, validarConfiguracionHorario } from '@/lib/utils/generador-bloques';
import { crearAsignatura } from '@/lib/utils/generador-asignaturas';
import { BLOQUES_DEFAULT, Establecimiento, Asignatura, ASIGNATURAS_BASE } from '@/types';

interface FormularioEstablecimientoProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  establecimientoToEdit?: Establecimiento | null;
}

export default function FormularioEstablecimiento({
  open: controlledOpen,
  onOpenChange,
  establecimientoToEdit
}: FormularioEstablecimientoProps = {}) {
  const { addEstablecimiento, updateEstablecimiento, setBloquesPorEstablecimiento } = useAppStore();
  const [internalOpen, setInternalOpen] = useState(false);

  // Usar controlled open si se proporciona, sino usar internal
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Estado del formulario
  const [nombre, setNombre] = useState('');
  const [niveles, setNiveles] = useState('1-8');
  const [prioritarios, setPrioritarios] = useState(false);
  const [proporcion, setProporcion] = useState('60/40');
  const [secciones, setSecciones] = useState<string[]>(['A']);
  const [nuevaSeccion, setNuevaSeccion] = useState('');

  // Asignaturas personalizadas
  const [asignaturasSeleccionadas, setAsignaturasSeleccionadas] = useState<Asignatura[]>([]);
  const [nuevaAsignaturaNombre, setNuevaAsignaturaNombre] = useState('');

  // Configuración de horarios
  const [usarPersonalizada, setUsarPersonalizada] = useState(false);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaTermino, setHoraTermino] = useState('16:45');
  const [duracionBloque, setDuracionBloque] = useState(45);
  const [recreos, setRecreos] = useState<{ bloque: number; duracionMinutos: number }[]>([
    { bloque: 2, duracionMinutos: 15 },
    { bloque: 5, duracionMinutos: 15 },
    { bloque: 9, duracionMinutos: 15 }
  ]);
  const [tieneColacion, setTieneColacion] = useState(true);
  const [colacionBloque, setColacionBloque] = useState(6);
  const [colacionDuracion, setColacionDuracion] = useState(30);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (establecimientoToEdit) {
      setNombre(establecimientoToEdit.nombre);
      setNiveles(establecimientoToEdit.niveles);
      setPrioritarios(establecimientoToEdit.prioritarios);
      setProporcion(establecimientoToEdit.proporcion || '60/40');
      setSecciones(establecimientoToEdit.secciones || ['A']);

      // Cargar asignaturas personalizadas si existen
      setAsignaturasSeleccionadas(establecimientoToEdit.asignaturas || []);

      // Cargar configuración de horario si existe
      if (establecimientoToEdit.configuracionHorario) {
        const config = establecimientoToEdit.configuracionHorario;
        setUsarPersonalizada(config.usarConfiguracionPersonalizada || false);
        setHoraInicio(config.horaInicio);
        setHoraTermino(config.horaTermino);
        setDuracionBloque(config.duracionBloque);
        setRecreos(config.recreos);
        setTieneColacion(!!config.colacion);
        if (config.colacion) {
          setColacionBloque(config.colacion.bloque);
          setColacionDuracion(config.colacion.duracionMinutos);
        }
      }
    } else {
      resetForm();
    }
  }, [establecimientoToEdit, open]);

  const resetForm = () => {
    setNombre('');
    setNiveles('1-8');
    setPrioritarios(false);
    setProporcion('60/40');
    setSecciones(['A']);
    setAsignaturasSeleccionadas([]);
    setNuevaAsignaturaNombre('');
    setUsarPersonalizada(false);
    setHoraInicio('08:00');
    setHoraTermino('16:45');
    setDuracionBloque(45);
    setRecreos([
      { bloque: 2, duracionMinutos: 15 },
      { bloque: 5, duracionMinutos: 15 },
      { bloque: 9, duracionMinutos: 15 }
    ]);
    setTieneColacion(true);
    setColacionBloque(6);
    setColacionDuracion(30);
  };

  const handleAgregarSeccion = () => {
    if (nuevaSeccion.trim() && !secciones.includes(nuevaSeccion.trim().toUpperCase())) {
      setSecciones([...secciones, nuevaSeccion.trim().toUpperCase()]);
      setNuevaSeccion('');
    }
  };

  const handleEliminarSeccion = (seccion: string) => {
    if (secciones.length <= 1) {
      toast.error('Debe haber al menos una sección');
      return;
    }

    // Solo confirmación si hay más de 3 secciones (para evitar molestias innecesarias)
    if (secciones.length > 3) {
      const confirmar = window.confirm(`¿Eliminar la sección ${seccion}?`);
      if (!confirmar) return;
    }

    setSecciones(secciones.filter(s => s !== seccion));
    toast.success(`Sección ${seccion} eliminada`);
  };

  const handleToggleAsignatura = (asignatura: Asignatura) => {
    const exists = asignaturasSeleccionadas.some(a => a.id === asignatura.id);
    if (exists) {
      setAsignaturasSeleccionadas(asignaturasSeleccionadas.filter(a => a.id !== asignatura.id));
    } else {
      setAsignaturasSeleccionadas([...asignaturasSeleccionadas, asignatura]);
    }
  };

  const handleAgregarAsignatura = () => {
    if (!nuevaAsignaturaNombre.trim()) {
      toast.error('Ingresa un nombre para la asignatura');
      return;
    }
    const nueva = crearAsignatura(nuevaAsignaturaNombre, asignaturasSeleccionadas);
    setAsignaturasSeleccionadas([...asignaturasSeleccionadas, nueva]);
    setNuevaAsignaturaNombre('');
    toast.success(`Asignatura "${nueva.nombre}" agregada con código ${nueva.codigo}`);
  };

  const handleEliminarAsignatura = (asignaturaId: number) => {
    setAsignaturasSeleccionadas(asignaturasSeleccionadas.filter(a => a.id !== asignaturaId));
  };

  const handleAgregarRecreo = () => {
    setRecreos([...recreos, { bloque: recreos.length + 1, duracionMinutos: 15 }]);
  };

  const handleEliminarRecreo = (index: number) => {
    setRecreos(recreos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validaciones básicas
    if (!nombre.trim()) {
      toast.error('El nombre del establecimiento es obligatorio');
      return;
    }

    if (secciones.length === 0) {
      toast.error('Debe haber al menos una sección');
      return;
    }

    // Crear configuración de horarios
    let configuracionHorario = undefined;
    let bloques = BLOQUES_DEFAULT;

    if (usarPersonalizada) {
      const config = {
        horaInicio,
        horaTermino,
        duracionBloque,
        recreos,
        colacion: tieneColacion ? { bloque: colacionBloque, duracionMinutos: colacionDuracion } : undefined,
        usarConfiguracionPersonalizada: true
      };

      // Validar configuración
      const validacion = validarConfiguracionHorario(config);
      if (!validacion.valido) {
        toast.error(validacion.errores[0]);
        return;
      }

      // Generar bloques
      bloques = generarBloquesDesdeConfiguracion(config);
      configuracionHorario = config;
    }

    if (establecimientoToEdit) {
      // Editar establecimiento existente
      const establecimientoActualizado: Establecimiento = {
        id: establecimientoToEdit.id,
        nombre: nombre.trim(),
        niveles,
        prioritarios,
        proporcion,
        secciones,
        asignaturas: asignaturasSeleccionadas.length > 0 ? asignaturasSeleccionadas : undefined,
        configuracionHorario
      };

      updateEstablecimiento(establecimientoToEdit.id, establecimientoActualizado);
      setBloquesPorEstablecimiento(establecimientoToEdit.id, bloques);

      toast.success(`Establecimiento ${nombre} actualizado correctamente`);
    } else {
      // Crear nuevo establecimiento
      const nuevoEstablecimiento = {
        id: Date.now(),
        nombre: nombre.trim(),
        niveles,
        prioritarios,
        proporcion,
        secciones,
        asignaturas: asignaturasSeleccionadas.length > 0 ? asignaturasSeleccionadas : undefined,
        configuracionHorario
      };

      addEstablecimiento(nuevoEstablecimiento);
      setBloquesPorEstablecimiento(nuevoEstablecimiento.id, bloques);

      toast.success(`Establecimiento ${nombre} agregado correctamente`);
    }

    resetForm();
    setOpen(false);
  };

  // Vista previa de bloques generados
  const bloquesPreview = usarPersonalizada
    ? generarBloquesDesdeConfiguracion({
        horaInicio,
        horaTermino,
        duracionBloque,
        recreos,
        colacion: tieneColacion ? { bloque: colacionBloque, duracionMinutos: colacionDuracion } : undefined
      })
    : BLOQUES_DEFAULT;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!onOpenChange && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <School className="h-4 w-4" />
            Agregar Establecimiento
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {establecimientoToEdit ? 'Editar Establecimiento' : 'Agregar Nuevo Establecimiento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sección 1: Datos Básicos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Datos Básicos</h3>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Establecimiento *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Escuela Básica Los Aromos"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="niveles">Niveles</Label>
                <Select value={niveles} onValueChange={setNiveles}>
                  <SelectTrigger id="niveles">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-6">1° a 6° Básico</SelectItem>
                    <SelectItem value="1-8">1° a 8° Básico</SelectItem>
                    <SelectItem value="7-8">7° a 8° Básico</SelectItem>
                    <SelectItem value="7-12">7° Básico a 4° Medio</SelectItem>
                    <SelectItem value="9-12">1° a 4° Medio</SelectItem>
                    <SelectItem value="1-12">1° Básico a 4° Medio (Completo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proporcion">Proporción Horas Lectivas</Label>
                <Select value={proporcion} onValueChange={setProporcion}>
                  <SelectTrigger id="proporcion">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60/40">60% Lectivas / 40% No Lectivas</SelectItem>
                    <SelectItem value="65/35">65% Lectivas / 35% No Lectivas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                <input
                  type="checkbox"
                  checked={prioritarios}
                  onChange={e => setPrioritarios(e.target.checked)}
                  className="mr-2"
                />
                Establecimiento Prioritario
              </Label>
              <p className="text-xs text-gray-500">
                Los establecimientos prioritarios tienen ventajas en la distribución de horas
              </p>
            </div>

            <div className="space-y-2">
              <Label>Secciones (letras)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {secciones.map(seccion => (
                  <Badge key={seccion} variant="secondary" className="gap-1">
                    {seccion}
                    <button onClick={() => handleEliminarSeccion(seccion)} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={nuevaSeccion}
                  onChange={e => setNuevaSeccion(e.target.value.toUpperCase())}
                  placeholder="Ej: B, C, D"
                  maxLength={1}
                  className="w-20"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAgregarSeccion}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sección 2: Asignaturas Personalizadas */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-sm text-gray-700">Asignaturas del Establecimiento</h3>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                Selecciona las asignaturas que se imparten en este establecimiento.
                Si no seleccionas ninguna, se usarán las asignaturas base por defecto.
              </AlertDescription>
            </Alert>

            {/* Checkboxes de asignaturas base */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Asignaturas Base</Label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                {ASIGNATURAS_BASE.filter(a => !a.editable).map(asignatura => {
                  const isSelected = asignaturasSeleccionadas.some(a => a.id === asignatura.id);
                  return (
                    <div
                      key={asignatura.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-white transition-colors"
                    >
                      <Checkbox
                        id={`asig-${asignatura.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleAsignatura(asignatura)}
                      />
                      <label
                        htmlFor={`asig-${asignatura.id}`}
                        className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
                      >
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: asignatura.color }}
                        />
                        <span className="font-mono text-xs font-bold text-gray-500">
                          {asignatura.codigo}
                        </span>
                        <span className="flex-1">{asignatura.nombre}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asignaturas personalizadas agregadas */}
            {asignaturasSeleccionadas.filter(a => a.editable).length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Asignaturas Personalizadas</Label>
                <div className="flex flex-wrap gap-2">
                  {asignaturasSeleccionadas.filter(a => a.editable).map(asignatura => (
                    <Badge
                      key={asignatura.id}
                      variant="secondary"
                      className="gap-2 pl-1 pr-2 py-1"
                      style={{ borderLeftColor: asignatura.color, borderLeftWidth: '4px' }}
                    >
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: asignatura.color }}
                      />
                      <span className="font-mono text-xs font-bold">{asignatura.codigo}</span>
                      <span className="text-xs">{asignatura.nombre}</span>
                      <button
                        onClick={() => handleEliminarAsignatura(asignatura.id)}
                        className="hover:text-red-600 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Agregar nueva asignatura */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Agregar Asignatura Personalizada</Label>
              <div className="flex gap-2">
                <Input
                  value={nuevaAsignaturaNombre}
                  onChange={e => setNuevaAsignaturaNombre(e.target.value)}
                  placeholder="Ej: Robótica, Ajedrez, Huerto..."
                  className="flex-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAgregarAsignatura();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAgregarAsignatura}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                El código y color se generarán automáticamente
              </p>
            </div>

            {/* Resumen de asignaturas seleccionadas */}
            {asignaturasSeleccionadas.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>{asignaturasSeleccionadas.length}</strong> asignatura(s) seleccionada(s) para este establecimiento
                </p>
              </div>
            )}
          </div>

          {/* Sección 3: Configuración de Horarios */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm text-gray-700">Configuración de Horarios</h3>
              <Button
                type="button"
                size="sm"
                variant={usarPersonalizada ? "default" : "outline"}
                onClick={() => setUsarPersonalizada(!usarPersonalizada)}
              >
                {usarPersonalizada ? "Usando Personalizada" : "Usar Configuración Estándar"}
              </Button>
            </div>

            {!usarPersonalizada && (
              <Alert>
                <AlertDescription>
                  Se usará la configuración estándar: 8:00 - 16:45, bloques de 45 min con 3 recreos y colación.
                </AlertDescription>
              </Alert>
            )}

            {usarPersonalizada && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horaInicio">Hora Inicio</Label>
                    <Input
                      id="horaInicio"
                      type="time"
                      value={horaInicio}
                      onChange={e => setHoraInicio(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horaTermino">Hora Término</Label>
                    <Input
                      id="horaTermino"
                      type="time"
                      value={horaTermino}
                      onChange={e => setHoraTermino(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duracionBloque">Duración Bloque (min)</Label>
                    <Input
                      id="duracionBloque"
                      type="number"
                      value={duracionBloque}
                      onChange={e => setDuracionBloque(parseInt(e.target.value))}
                      min={30}
                      max={90}
                    />
                  </div>
                </div>

                {/* Recreos */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Recreos</Label>
                    <Button type="button" size="sm" variant="outline" onClick={handleAgregarRecreo}>
                      <Plus className="w-3 h-3 mr-1" /> Agregar Recreo
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {recreos.map((recreo, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-sm w-32">Después del bloque:</span>
                        <Input
                          type="number"
                          value={recreo.bloque}
                          onChange={e => {
                            const newRecreos = [...recreos];
                            newRecreos[idx].bloque = parseInt(e.target.value);
                            setRecreos(newRecreos);
                          }}
                          className="w-20"
                          min={1}
                        />
                        <span className="text-sm w-20">Duración:</span>
                        <Input
                          type="number"
                          value={recreo.duracionMinutos}
                          onChange={e => {
                            const newRecreos = [...recreos];
                            newRecreos[idx].duracionMinutos = parseInt(e.target.value);
                            setRecreos(newRecreos);
                          }}
                          className="w-20"
                          min={10}
                          max={30}
                        />
                        <span className="text-sm">min</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEliminarRecreo(idx)}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colación */}
                <div className="space-y-2">
                  <Label>
                    <input
                      type="checkbox"
                      checked={tieneColacion}
                      onChange={e => setTieneColacion(e.target.checked)}
                      className="mr-2"
                    />
                    Incluir Colación
                  </Label>

                  {tieneColacion && (
                    <div className="flex gap-2 items-center ml-6">
                      <span className="text-sm w-32">Después del bloque:</span>
                      <Input
                        type="number"
                        value={colacionBloque}
                        onChange={e => setColacionBloque(parseInt(e.target.value))}
                        className="w-20"
                        min={1}
                      />
                      <span className="text-sm w-20">Duración:</span>
                      <Input
                        type="number"
                        value={colacionDuracion}
                        onChange={e => setColacionDuracion(parseInt(e.target.value))}
                        className="w-20"
                        min={15}
                        max={60}
                      />
                      <span className="text-sm">min</span>
                    </div>
                  )}
                </div>

                {/* Vista Previa */}
                <div className="space-y-2 border-t pt-3">
                  <Label>Vista Previa del Horario Generado</Label>
                  <div className="bg-white p-3 rounded border max-h-60 overflow-y-auto">
                    <div className="space-y-1 text-xs">
                      {bloquesPreview.map(bloque => (
                        <div
                          key={bloque.id}
                          className={`flex justify-between items-center p-2 rounded ${
                            bloque.tipo === 'clase' ? 'bg-blue-50' : bloque.tipo === 'recreo' ? 'bg-green-50' : 'bg-orange-50'
                          }`}
                        >
                          <span className="font-mono font-bold">#{bloque.id}</span>
                          <span className="font-mono">{bloque.horaInicio} - {bloque.horaFin}</span>
                          <span className="font-semibold">
                            {bloque.tipo === 'clase' && '📚 Clase'}
                            {bloque.tipo === 'recreo' && '☕ Recreo'}
                            {bloque.tipo === 'colacion' && '🍽️ Colación'}
                          </span>
                          <span className="text-gray-500">{bloque.duracionMinutos} min</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                      <strong>Total:</strong> {bloquesPreview.length} bloques |
                      <strong className="ml-2">Clases:</strong> {bloquesPreview.filter(b => b.tipo === 'clase').length} |
                      <strong className="ml-2">Recreos:</strong> {bloquesPreview.filter(b => b.tipo === 'recreo').length} |
                      <strong className="ml-2">Colación:</strong> {bloquesPreview.filter(b => b.tipo === 'colacion').length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {establecimientoToEdit ? 'Guardar Cambios' : 'Agregar Establecimiento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
