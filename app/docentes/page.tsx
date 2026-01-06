'use client';

import { useState } from 'react';
import { DocentesList } from '@/components/docentes/DocentesList';
import { DocenteFormModal } from '@/components/docentes/DocenteFormModal';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Users } from 'lucide-react';

export default function DocentesPage() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Mejorado */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-8 rounded-2xl shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
                <Users className="w-10 h-10" />
                Gestión de Docentes
              </h1>
              <p className="text-blue-100 text-lg">Administra la planta docente del DAEM Galvarino</p>
            </div>
            <Button
              onClick={() => setFormOpen(true)}
              className="gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-base px-6 py-6 shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              Agregar Docente
            </Button>
          </div>
        </div>

        {/* Tabla de Docentes */}
        <DocentesList />

        {/* Modal de Formulario */}
        <DocenteFormModal open={formOpen} onOpenChange={setFormOpen} />
      </div>
    </div>
  );
}
