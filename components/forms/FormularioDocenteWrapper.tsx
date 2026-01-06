"use client";

import { useAppStore } from "@/lib/store";
import FormularioDocente from "./FormularioDocente";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function FormularioDocenteWrapper() {
    const docentes = useAppStore((state) => state.docentes);
    const removeDocente = useAppStore((state) => state.removeDocente);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Docentes</h2>
                <FormularioDocente />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Docentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="text-left">Nombre</th>
                                <th className="text-left">RUT</th>
                                <th className="text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docentes.map((docente) => (
                                <tr key={docente.id}>
                                    <td>{docente.nombre}</td>
                                    <td>{docente.rut}</td>
                                    <td>
                                        <Button
                                            variant="destructive"
                                            onClick={() => removeDocente(docente.id)}
                                        >
                                            Eliminar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
