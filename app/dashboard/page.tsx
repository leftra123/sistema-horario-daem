'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FormularioEstablecimiento from '@/components/forms/FormularioEstablecimiento';
import { GraficosCumplimiento } from '@/components/dashboard/GraficosCumplimiento';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Users, GraduationCap, Briefcase, School, Download, Pencil, Trash2 } from 'lucide-react';
import { getHorasLectivasDocente, getHorasUsadasEnBloques } from '@/lib/utils/calculos-horas';
import { exportarTodosHorariosEstablecimientoExcel } from '@/lib/utils/export-horarios';
import { toast } from 'sonner';
import { Establecimiento } from '@/types';

export default function DashboardPage() {
    const { establecimientos, docentes, horarios, removeDocente, getBloquesPorEstablecimiento, deleteEstablecimiento } = useAppStore();
    const [selectedEstId, setSelectedEstId] = useState<string>("all");
    const [editingEstablecimiento, setEditingEstablecimiento] = useState<Establecimiento | null>(null);
    const [formEstablecimientoOpen, setFormEstablecimientoOpen] = useState(false);
    const [deleteEstConfirmOpen, setDeleteEstConfirmOpen] = useState(false);
    const [estToDelete, setEstToDelete] = useState<{ id: number; nombre: string } | null>(null);

    // --- CÁLCULOS GLOBALES (Optimizado con useMemo) ---
    const globalStats = useMemo(() => {
        let aula = 0, pie = 0, eib = 0, directiva = 0;
        let aulaUsadas = 0, pieUsadas = 0, eibUsadas = 0, directivaUsadas = 0;

        docentes.forEach(d => {
            const horasUsadas = getHorasUsadasEnBloques(d.id, horarios);

            d.asignaciones.forEach(a => {
                const cargo = a.cargo.toUpperCase();
                const horasLectivas = getHorasLectivasDocente(d, establecimientos);
                const proporcion = horasLectivas > 0 ? horasUsadas / horasLectivas : 0;
                const horasUsadasCargo = a.horasContrato * proporcion;

                if (cargo.includes("AULA")) {
                    aula += a.horasContrato;
                    aulaUsadas += horasUsadasCargo;
                } else if (cargo.includes("PIE")) {
                    pie += a.horasContrato;
                    pieUsadas += horasUsadasCargo;
                } else if (cargo.includes("EIB")) {
                    eib += a.horasContrato;
                    eibUsadas += horasUsadasCargo;
                } else if (cargo.includes("DIRECTIVA") || cargo.includes("UTP")) {
                    directiva += a.horasContrato;
                    directivaUsadas += horasUsadasCargo;
                }
            });
        });

        return {
            aula, pie, eib, directiva,
            aulaUsadas: Math.round(aulaUsadas),
            pieUsadas: Math.round(pieUsadas),
            eibUsadas: Math.round(eibUsadas),
            directivaUsadas: Math.round(directivaUsadas)
        };
    }, [docentes, establecimientos, horarios]);

    // --- CÁLCULOS POR ESTABLECIMIENTO ---
    const getEstadisticasEstablecimiento = (estId: number) => {
        const docentesDelEst = docentes.filter(d =>
            d.asignaciones.some(a => a.establecimientoId === estId)
        );

        const totalHoras = docentesDelEst.reduce((sum, d) => {
            const asig = d.asignaciones.find(a => a.establecimientoId === estId);
            return sum + (asig?.horasContrato || 0);
        }, 0);

        return {
            dotacion: docentesDelEst.length,
            horas: totalHoras
        };
    };

    // --- HANDLERS DE ESTABLECIMIENTOS ---
    const handleEditEstablecimiento = (est: Establecimiento) => {
        setEditingEstablecimiento(est);
        setFormEstablecimientoOpen(true);
    };

    const handleDeleteEstClick = (estId: number, estNombre: string) => {
        setEstToDelete({ id: estId, nombre: estNombre });
        setDeleteEstConfirmOpen(true);
    };

    const handleDeleteEstConfirm = () => {
        if (!estToDelete) return;

        deleteEstablecimiento(estToDelete.id);
        toast.success(`Establecimiento ${estToDelete.nombre} eliminado correctamente`);

        // Si era el establecimiento seleccionado, volver a "all"
        if (selectedEstId === estToDelete.id.toString()) {
            setSelectedEstId("all");
        }

        setDeleteEstConfirmOpen(false);
        setEstToDelete(null);
    };

    const handleCloseFormEstablecimiento = () => {
        setFormEstablecimientoOpen(false);
        setEditingEstablecimiento(null);
    };

    // --- RENDERIZADO ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-emerald-50 p-6 space-y-8">

            {/* Header y Selector Principal Mejorado */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white p-8 rounded-2xl shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
                            📊 Panel de Control
                        </h1>
                        <p className="text-blue-100 text-lg">Gestión de Dotación y Carga Horaria</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
                        <div className="w-full md:w-80">
                            <label className="text-xs font-bold text-white/80 uppercase mb-2 block tracking-wide">
                                Establecimiento
                            </label>
                            <Select value={selectedEstId} onValueChange={setSelectedEstId}>
                                <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-2 border-white/50 h-12 text-base font-semibold">
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">🌐 Resumen Global (Todas)</SelectItem>
                                    {establecimientos.map(e => (
                                        <SelectItem key={e.id} value={e.id.toString()}>
                                            {e.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {selectedEstId !== "all" && (
                                <Button
                                    onClick={() => {
                                        const est = establecimientos.find(e => e.id === parseInt(selectedEstId));
                                        if (est) {
                                            const bloques = getBloquesPorEstablecimiento(est.id);
                                            const filename = exportarTodosHorariosEstablecimientoExcel(est, horarios, bloques);
                                            toast.success(`✅ Exportado: ${filename}`);
                                        }
                                    }}
                                    className="gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-lg"
                                >
                                    <Download className="w-4 h-4" />
                                    Exportar Horarios
                                </Button>
                            )}
                            <FormularioEstablecimiento />
                            {/* TODO: Reemplazar FormularioDocente - Ver TAREA 4 */}
                        </div>
                    </div>
                </div>
            </div>

            {/* VISTA GLOBAL */}
            {selectedEstId === "all" ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    
                    {/* Tarjetas de KPIs Globales Mejoradas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-bold">Horas Aula</CardTitle>
                                <GraduationCap className="h-6 w-6 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold mb-3">{globalStats.aulaUsadas}/{globalStats.aula} hrs</div>
                                <div className="mt-2 h-2.5 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white shadow-lg transition-all"
                                        style={{ width: `${Math.min(100, (globalStats.aulaUsadas / globalStats.aula) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-blue-100 mt-2 font-medium">
                                    Docencia regular • {Math.round((globalStats.aulaUsadas / globalStats.aula) * 100)}% asignadas
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-bold">Horas PIE</CardTitle>
                                <Users className="h-6 w-6 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold mb-3">{globalStats.pieUsadas}/{globalStats.pie} hrs</div>
                                <div className="mt-2 h-2.5 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white shadow-lg transition-all"
                                        style={{ width: `${Math.min(100, (globalStats.pieUsadas / globalStats.pie) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-purple-100 mt-2 font-medium">
                                    Integración Escolar • {Math.round((globalStats.pieUsadas / (globalStats.pie || 1)) * 100)}% asignadas
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-bold">Horas EIB</CardTitle>
                                <School className="h-6 w-6 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold mb-3">{globalStats.eibUsadas}/{globalStats.eib} hrs</div>
                                <div className="mt-2 h-2.5 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white shadow-lg transition-all"
                                        style={{ width: `${Math.min(100, (globalStats.eibUsadas / (globalStats.eib || 1)) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-amber-100 mt-2 font-medium">
                                    Educación Intercultural • {Math.round((globalStats.eibUsadas / (globalStats.eib || 1)) * 100)}% asignadas
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-bold">Horas Directiva</CardTitle>
                                <Briefcase className="h-6 w-6 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold mb-3">{globalStats.directivaUsadas}/{globalStats.directiva} hrs</div>
                                <div className="mt-2 h-2.5 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white shadow-lg transition-all"
                                        style={{ width: `${Math.min(100, (globalStats.directivaUsadas / (globalStats.directiva || 1)) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-emerald-100 mt-2 font-medium">
                                    UTP y Dirección • {Math.round((globalStats.directivaUsadas / (globalStats.directiva || 1)) * 100)}% asignadas
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gráficos de Cumplimiento */}
                    <GraficosCumplimiento />

                    {/* Tabla Resumen de Gestión */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen de Gestión por Establecimiento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Establecimiento</TableHead>
                                        <TableHead>Niveles</TableHead>
                                        <TableHead>Prioritario</TableHead>
                                        <TableHead className="text-center">Dotación Actual</TableHead>
                                        <TableHead className="text-right">Horas Totales</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {establecimientos.map(est => {
                                        const stats = getEstadisticasEstablecimiento(est.id);
                                        return (
                                            <TableRow key={est.id}>
                                                <TableCell className="font-medium">{est.nombre}</TableCell>
                                                <TableCell>{est.niveles}</TableCell>
                                                <TableCell>
                                                    {est.prioritarios ? (
                                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Sí</Badge>
                                                    ) : (
                                                        <Badge variant="outline">No</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="bg-slate-100">{stats.dotacion} Docentes</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold font-mono">
                                                    {stats.horas} h
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditEstablecimiento(est)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            title="Editar"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteEstClick(est.id, est.nombre)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                /* VISTA LOCAL */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {(() => {
                        const est = establecimientos.find(e => e.id.toString() === selectedEstId);
                        const stats = est ? getEstadisticasEstablecimiento(est.id) : { dotacion: 0, horas: 0 };
                        const docentesLocal = docentes.filter(d => d.asignaciones.some(a => a.establecimientoId.toString() === selectedEstId));

                        return (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card className="bg-white border-l-4 border-l-blue-500">
                                        <CardContent className="pt-6">
                                            <div className="text-sm text-gray-500">Dotación Actual</div>
                                            <div className="text-3xl font-bold text-gray-800">{stats.dotacion}</div>
                                            <div className="text-xs text-blue-600 mt-1">Docentes asignados</div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-white border-l-4 border-l-emerald-500">
                                        <CardContent className="pt-6">
                                            <div className="text-sm text-gray-500">Carga Horaria Total</div>
                                            <div className="text-3xl font-bold text-gray-800">{stats.horas}</div>
                                            <div className="text-xs text-emerald-600 mt-1">Horas cronológicas</div>
                                        </CardContent>
                                    </Card>
                                    <div className="flex items-center justify-end">
                                        {/* TODO: Reemplazar FormularioDocente - Ver TAREA 4 */}
                                    </div>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center">
                                            <span>Planta Docente: {est?.nombre}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {docentesLocal.length === 0 ? (
                                            <div className="text-center py-10 text-gray-500">
                                                No hay docentes registrados en este establecimiento.
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Nombre</TableHead>
                                                        <TableHead>RUT</TableHead>
                                                        <TableHead>Función</TableHead>
                                                        <TableHead className="text-center">Horas Contrato</TableHead>
                                                        <TableHead className="text-center">Horas Lectivas</TableHead>
                                                        <TableHead className="text-center">Horas Usadas</TableHead>
                                                        <TableHead className="text-center">Disponibles</TableHead>
                                                        <TableHead className="text-right">Acciones</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {docentesLocal.map((docente) => {
                                                        const asignacion = docente.asignaciones.find(a => a.establecimientoId.toString() === selectedEstId);
                                                        const horasLectivas = getHorasLectivasDocente(docente, establecimientos);
                                                        const horasUsadas = getHorasUsadasEnBloques(docente.id, horarios);
                                                        const horasDisponibles = Math.max(0, horasLectivas - horasUsadas);
                                                        const porcentajeUsado = horasLectivas > 0 ? (horasUsadas / horasLectivas) * 100 : 0;

                                                        return (
                                                            <TableRow key={docente.id}>
                                                                <TableCell className="font-medium">{docente.nombre}</TableCell>
                                                                <TableCell className="text-sm">{docente.rut}</TableCell>
                                                                <TableCell><Badge variant="outline" className="text-xs">{asignacion?.cargo}</Badge></TableCell>
                                                                <TableCell className="text-center font-mono text-sm">{asignacion?.horasContrato}h</TableCell>
                                                                <TableCell className="text-center font-mono text-sm font-semibold text-blue-600">{horasLectivas}h</TableCell>
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
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={() => removeDocente(docente.id)}
                                                                    >
                                                                        Eliminar
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        );
                    })()}
                </div>
            )}

            {/* Modal de edición de establecimiento (controlado) */}
            <FormularioEstablecimiento
                open={formEstablecimientoOpen}
                onOpenChange={handleCloseFormEstablecimiento}
                establecimientoToEdit={editingEstablecimiento}
            />

            {/* Diálogo de confirmación de eliminación de establecimiento */}
            <ConfirmDialog
                open={deleteEstConfirmOpen}
                onOpenChange={setDeleteEstConfirmOpen}
                onConfirm={handleDeleteEstConfirm}
                title="¿Eliminar establecimiento?"
                description={
                    estToDelete
                        ? `¿Estás seguro de eliminar ${estToDelete.nombre}? Esto eliminará también todos los horarios asociados a este establecimiento. Esta acción no se puede deshacer.`
                        : ''
                }
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />
        </div>
    );
}