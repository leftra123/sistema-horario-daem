'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, AlertTriangle, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Docente } from '@/types';

interface FormularioDocenteProps {
    onDocenteAdded?: () => void;
}

export default function FormularioDocente({ onDocenteAdded }: FormularioDocenteProps) {
    const { addDocente, importarDocentes, establecimientos } = useAppStore();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [previewData, setPreviewData] = useState<Docente[] | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        rut: '',
        cargo: 'DOCENTE DE AULA',
        horas: '',
        tipo: 'TITULAR',
        escuelaId: establecimientos[0]?.id.toString() || "1"
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const COLUMNAS_REQUERIDAS = ['RUT', 'NOMBRE', 'FUNCION', 'TITULARIDAD', 'HRS'];

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (!data || data.length === 0) {
                    toast.error('❌ El archivo Excel está vacío');
                    return;
                }

                const primeraFila = data[0] as Record<string, unknown>;
                const columnasExcel = Object.keys(primeraFila || {}).map(k => k.toUpperCase().trim());

                const faltantes = COLUMNAS_REQUERIDAS.filter(col =>
                    !columnasExcel.some(excelCol => excelCol === col)
                );

                if (faltantes.length > 0) {
                    const msg = `Faltan las columnas: ${faltantes.join(', ')}`;
                    setError(msg);
                    toast.error(`❌ Error de formato: ${msg}`);
                    return;
                }

                const nuevosDocentes = (data as Record<string, unknown>[])
                    .map((row, index) => {
                        const horas = parseInt(String(row['HRS'] || row['Hrs'] || '0'));

                        if (isNaN(horas) || horas <= 0) {
                            toast.warning(`⚠️ Fila ${index + 2}: Horas inválidas, se omitirá este registro`);
                            return null;
                        }

                        if (horas > 44) {
                            toast.warning(`⚠️ Fila ${index + 2}: ${row['NOMBRE']} tiene ${horas}h (máx 44h), se ajustará a 44h`);
                        }

                        return {
                            id: Date.now() + index,
                            rut: String(row['RUT'] || row['Rut'] || 'Sin-RUT'),
                            nombre: String(row['NOMBRE'] || row['Nombre'] || 'Sin Nombre'),
                            asignaciones: [{
                                establecimientoId: establecimientos[0]?.id || 1,
                                establecimientoNombre: establecimientos[0]?.nombre || "Establecimiento",
                                cargo: String(row['FUNCION'] || row['Función'] || 'DOCENTE DE AULA'),
                                horasContrato: Math.min(horas, 44),
                                tipo: String(row['TITULARIDAD'] || 'CONTRATA')
                            }]
                        } as Docente;
                    })
                    .filter((d): d is Docente => d !== null);

                if (nuevosDocentes.length === 0) {
                    toast.error('❌ No se encontraron registros válidos en el archivo');
                    return;
                }

                // Mostrar preview en lugar de importar directamente
                setPreviewData(nuevosDocentes);
                setShowPreview(true);
                toast.info(`📋 Preview: ${nuevosDocentes.length} docentes listos para importar`);
            } catch (error) {
                console.error(error);
                toast.error("❌ Error al leer el archivo Excel. Verifica el formato.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirmImport = () => {
        if (!previewData || previewData.length === 0) return;

        importarDocentes(previewData);
        toast.success(`✅ ¡Éxito! Se cargaron ${previewData.length} docentes correctamente`);

        setPreviewData(null);
        setShowPreview(false);
        if (onDocenteAdded) onDocenteAdded();
        setOpen(false);
    };

    const handleCancelImport = () => {
        setPreviewData(null);
        setShowPreview(false);
    };

    const handleSubmit = () => {
        const horas = parseInt(formData.horas);

        if (!formData.nombre || !formData.rut) return setError("Falta nombre o RUT");
        if (isNaN(horas) || horas <= 0) return setError("Las horas deben ser mayor a 0");
        if (horas > 44) return setError("⚠️ Error: No puedes exceder las 44 horas legales.");

        const escuela = establecimientos.find(e => e.id.toString() === formData.escuelaId);

        addDocente({
            id: Date.now(),
            rut: formData.rut,
            nombre: formData.nombre,
            asignaciones: [{
                establecimientoId: escuela?.id || 1,
                establecimientoNombre: escuela?.nombre || "Escuela Desconocida",
                cargo: formData.cargo,
                horasContrato: horas,
                tipo: formData.tipo
            }]
        });

        toast.success("Docente agregado correctamente");
        setFormData({ ...formData, nombre: '', rut: '', horas: '' });
        setError('');
        if (onDocenteAdded) onDocenteAdded();
        setOpen(false);
    };

    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Agregar Docente
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-xl shadow-2xl backdrop-blur-sm sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Gestión de Docentes</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-6 py-2">
                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-xs text-blue-800">
                            <strong>Columnas requeridas Excel:</strong> RUT, NOMBRE, FUNCION, TITULARIDAD, HRS
                        </AlertDescription>
                    </Alert>

                    <div className="p-4 border-2 border-dashed border-emerald-100 rounded-lg bg-emerald-50/50 text-center transition-all hover:bg-emerald-100/50">
                        <Label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-2 text-emerald-700 font-medium hover:text-emerald-900">
                            <FileSpreadsheet className="w-8 h-8" />
                            <span>Cargar Planilla Excel</span>
                        </Label>
                        <Input id="excel-upload" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">O ingreso manual</span></div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-2">
                        <Label>Nombre Completo</Label>
                        <Input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: JUAN PEREZ" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>RUT</Label>
                            <Input value={formData.rut} onChange={e => setFormData({ ...formData, rut: e.target.value })} placeholder="12.345.678-9" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Horas Contrato</Label>
                            <Input
                                type="number"
                                value={formData.horas}
                                onChange={e => setFormData({ ...formData, horas: e.target.value })}
                                placeholder="44"
                                className={parseInt(formData.horas) > 44 ? "border-red-500 text-red-600 font-bold" : ""}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Función</Label>
                            <Select onValueChange={(v) => setFormData({ ...formData, cargo: v })} defaultValue={formData.cargo}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DOCENTE DE AULA">Docente de Aula</SelectItem>
                                    <SelectItem value="PIE">PIE</SelectItem>
                                    <SelectItem value="DOCENTE EIB">Docente EIB</SelectItem>
                                    <SelectItem value="DIRECTIVA">Directiva</SelectItem>
                                    <SelectItem value="UTP">UTP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Titularidad</Label>
                            <Select onValueChange={(v) => setFormData({ ...formData, tipo: v })} defaultValue={formData.tipo}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TITULAR">Titular</SelectItem>
                                    <SelectItem value="CONTRATA">Contrata</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button onClick={handleSubmit} className="w-full mt-2">Guardar Docente</Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* Dialog de Preview de Importación */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        Preview de Importación - {previewData?.length || 0} Docentes
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-800">
                            Revisa los datos antes de confirmar la importación. Los docentes se cargarán al primer establecimiento disponible.
                        </AlertDescription>
                    </Alert>

                    {previewData && previewData.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>RUT</TableHead>
                                        <TableHead>Cargo</TableHead>
                                        <TableHead className="text-center">Horas</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((docente, idx) => {
                                        const asig = docente.asignaciones[0];
                                        const horasOk = asig.horasContrato > 0 && asig.horasContrato <= 44;

                                        return (
                                            <TableRow key={idx} className={horasOk ? "" : "bg-amber-50"}>
                                                <TableCell className="font-mono text-sm text-gray-500">{idx + 1}</TableCell>
                                                <TableCell className="font-medium">{docente.nombre}</TableCell>
                                                <TableCell className="text-sm">{docente.rut}</TableCell>
                                                <TableCell>
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {asig.cargo}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-semibold">
                                                    {asig.horasContrato}h
                                                </TableCell>
                                                <TableCell className="text-sm">{asig.tipo}</TableCell>
                                                <TableCell className="text-center">
                                                    {horasOk ? (
                                                        <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-amber-500 mx-auto" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle className="w-5 h-5" />
                            <p className="font-semibold">
                                {previewData?.filter(d => d.asignaciones[0].horasContrato > 0 && d.asignaciones[0].horasContrato <= 44).length} docentes listos para importar
                            </p>
                        </div>
                        {previewData && previewData.some(d => d.asignaciones[0].horasContrato > 44 || d.asignaciones[0].horasContrato <= 0) && (
                            <p className="text-sm text-amber-700 mt-2">
                                ⚠️ {previewData.filter(d => d.asignaciones[0].horasContrato > 44 || d.asignaciones[0].horasContrato <= 0).length} docentes con horas ajustadas
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancelImport}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmImport} className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Confirmar Importación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}