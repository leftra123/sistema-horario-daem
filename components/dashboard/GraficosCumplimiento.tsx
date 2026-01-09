'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { getHorasLectivasDocente, getHorasUsadasEnBloques } from '@/lib/utils/calculos-horas';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';

const COLORES_CUMPLIMIENTO = {
  completo: '#10b981', // green-500
  parcial: '#f59e0b', // amber-500
  bajo: '#ef4444', // red-500
  disponible: '#6b7280' // gray-500
};

const COLORES_SUBVENCIONES = {
  PIE: '#3b82f6', // blue-500
  SEP: '#10b981', // green-500
  SN: '#8b5cf6' // purple-500
};

export function GraficosCumplimiento() {
  const { establecimientos, docentes, horarios } = useAppStore();

  // Datos de cumplimiento por establecimiento
  const datosPorEstablecimiento = useMemo(() => {
    return establecimientos.map(est => {
      const docentesEst = docentes.filter(d =>
        d.asignaciones.some(a => a.establecimientoId === est.id)
      );

      const totalLectivas = docentesEst.reduce((sum, d) => {
        return sum + getHorasLectivasDocente(d);
      }, 0);

      const totalUsadas = docentesEst.reduce((sum, d) => {
        return sum + getHorasUsadasEnBloques(d.id, horarios);
      }, 0);

      const porcentaje = totalLectivas > 0 ? (totalUsadas / totalLectivas) * 100 : 0;

      return {
        nombre: est.nombre.length > 20 ? est.nombre.substring(0, 18) + '...' : est.nombre,
        nombreCompleto: est.nombre,
        lectivas: totalLectivas,
        usadas: totalUsadas,
        disponibles: Math.max(0, totalLectivas - totalUsadas),
        porcentaje: Math.round(porcentaje)
      };
    });
  }, [establecimientos, docentes, horarios]);

  // Datos de distribución de subvenciones
  const datosSubvenciones = useMemo(() => {
    const conteo = { PIE: 0, SEP: 0, SN: 0 };

    docentes.forEach(d => {
      d.asignaciones.forEach(a => {
        a.subvenciones?.forEach(s => {
          if (s in conteo) conteo[s as keyof typeof conteo]++;
        });
      });
    });

    return Object.entries(conteo).map(([nombre, valor]) => ({
      nombre,
      valor,
      porcentaje: Math.round((valor / Math.max(1, Object.values(conteo).reduce((a, b) => a + b, 0))) * 100)
    }));
  }, [docentes]);

  // Cumplimiento global
  const cumplimientoGlobal = useMemo(() => {
    const totalLectivas = docentes.reduce((sum, d) => {
      return sum + getHorasLectivasDocente(d);
    }, 0);

    const totalUsadas = docentes.reduce((sum, d) => {
      return sum + getHorasUsadasEnBloques(d.id, horarios);
    }, 0);

    const porcentaje = totalLectivas > 0 ? (totalUsadas / totalLectivas) * 100 : 0;

    return [
      {
        nombre: 'Cumplimiento',
        valor: porcentaje,
        fill: porcentaje >= 80 ? COLORES_CUMPLIMIENTO.completo :
              porcentaje >= 50 ? COLORES_CUMPLIMIENTO.parcial :
              COLORES_CUMPLIMIENTO.bajo
      }
    ];
  }, [docentes, establecimientos, horarios]);

  // Distribución por cargo
  const datosPorCargo = useMemo(() => {
    const conteo: Record<string, number> = {};

    docentes.forEach(d => {
      d.asignaciones.forEach(a => {
        conteo[a.cargo] = (conteo[a.cargo] || 0) + 1;
      });
    });

    return Object.entries(conteo)
      .map(([cargo, cantidad]) => ({
        cargo: cargo.length > 15 ? cargo.substring(0, 13) + '...' : cargo,
        cantidad
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [docentes]);

  if (establecimientos.length === 0 || docentes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-center text-gray-500">
            No hay datos suficientes para mostrar gráficos. Agrega establecimientos y docentes para ver las estadísticas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Cumplimiento Global */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cumplimiento Global de Horarios</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              data={cumplimientoGlobal}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                background
                dataKey="valor"
                cornerRadius={10}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-3xl font-bold"
                fill={cumplimientoGlobal[0].fill}
              >
                {Math.round(cumplimientoGlobal[0].valor)}%
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-gray-600 mt-2">
            {cumplimientoGlobal[0].valor >= 80 ? '✅ Excelente cumplimiento' :
             cumplimientoGlobal[0].valor >= 50 ? '⚠️ Cumplimiento moderado' :
             '❌ Cumplimiento bajo'}
          </p>
        </CardContent>
      </Card>

      {/* Gráfico de Subvenciones */}
      {datosSubvenciones.some(d => d.valor > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución de Subvenciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={datosSubvenciones.filter(d => d.valor > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(props: any) => `${props.nombre}: ${props.porcentaje}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {datosSubvenciones.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES_SUBVENCIONES[entry.nombre as keyof typeof COLORES_SUBVENCIONES]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Horas por Establecimiento */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Horas Lectivas por Establecimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosPorEstablecimiento}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="nombre"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => {
                  const labels: Record<string, string> = {
                    usadas: 'Horas Usadas',
                    disponibles: 'Horas Disponibles'
                  };
                  return [value + 'h', labels[name] || name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    usadas: 'Horas Usadas',
                    disponibles: 'Horas Disponibles'
                  };
                  return labels[value] || value;
                }}
              />
              <Bar dataKey="usadas" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="disponibles" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Docentes por Cargo */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Asignaciones por Cargo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datosPorCargo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="cargo" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="cantidad" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
