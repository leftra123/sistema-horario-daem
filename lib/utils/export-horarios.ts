import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BloqueHorario, DIAS, BloqueConfig, Docente, Establecimiento } from '@/types';

// ===== EXCEL EXPORTS =====

export function exportarHorarioCursoExcel(
  cursoNombre: string,
  establecimientoNombre: string,
  horarioData: Record<string, BloqueHorario>,
  bloques: BloqueConfig[]
) {
  // Validar parámetros
  const cursoTexto = cursoNombre || 'Curso sin nombre';
  const establecimientoTexto = establecimientoNombre || 'Establecimiento sin nombre';

  // INCLUIR TODOS los bloques (clase, recreo, colación)
  const tableData = bloques.map(bloque => {
    const row: Record<string, string> = {
      'Bloque': `${bloque.id}`,
      'Horario': `${bloque.horaInicio} - ${bloque.horaFin}`
    };

    // Si es recreo o colación, marcar en todas las columnas
    if (bloque.tipo === 'recreo') {
      DIAS.forEach(dia => {
        row[dia] = '☕ RECREO';
      });
    } else if (bloque.tipo === 'colacion') {
      DIAS.forEach(dia => {
        row[dia] = '🍽️ COLACIÓN';
      });
    } else {
      // Es clase normal
      DIAS.forEach(dia => {
        const bloqueKey = `${dia}-${bloque.id}`;
        const bloqueInfo = horarioData[bloqueKey];

        if (bloqueInfo && bloqueInfo.asignatura && bloqueInfo.asignatura.nombre && bloqueInfo.docenteNombre) {
          row[dia] = `${bloqueInfo.asignatura.nombre}\n${bloqueInfo.docenteNombre}`;
        } else if (bloqueInfo && bloqueInfo.asignatura && bloqueInfo.asignatura.nombre) {
          // Datos corruptos: tiene asignatura pero no docente
          row[dia] = `${bloqueInfo.asignatura.nombre}\n⚠️ Docente no encontrado`;
        } else {
          row[dia] = '';
        }
      });
    }

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(tableData);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 15 },
    ...DIAS.map(() => ({ wch: 25 }))
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, cursoTexto.substring(0, 31)); // Excel sheet names max 31 chars

  const filename = `Horario_${establecimientoTexto.replace(/\s/g, '_')}_${cursoTexto.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}

export function exportarHorarioDocenteExcel(
  docente: Docente,
  horarios: Record<string, Record<string, BloqueHorario>>,
  bloques: BloqueConfig[],
  establecimientoNombre: string
) {
  // Buscar todos los bloques donde aparece este docente
  const bloquesClase = bloques.filter(b => b.tipo === 'clase');

  const tableData = bloquesClase.map(bloque => {
    const row: Record<string, string> = {
      'Bloque': `${bloque.id}`,
      'Horario': `${bloque.horaInicio} - ${bloque.horaFin}`
    };

    DIAS.forEach(dia => {
      const bloqueKey = `${dia}-${bloque.id}`;
      let asignado = '';

      // Buscar en todos los cursos
      Object.keys(horarios).forEach(cursoKey => {
        const bloqueData = horarios[cursoKey]?.[bloqueKey];
        if (bloqueData?.docenteId === docente.id) {
          const [, nivel, seccion] = cursoKey.split('-');
          asignado = `${nivel}-${seccion}: ${bloqueData.asignatura.nombre}`;
        }
      });

      row[dia] = asignado;
    });

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(tableData);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 15 },
    ...DIAS.map(() => ({ wch: 30 }))
  ];

  const docenteNombre = docente?.nombre || 'Docente_sin_nombre';

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, docenteNombre.substring(0, 31)); // Excel sheet names max 31 chars

  const filename = `Horario_Docente_${docenteNombre.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}

export function exportarTodosHorariosEstablecimientoExcel(
  establecimiento: Establecimiento,
  horarios: Record<string, Record<string, BloqueHorario>>,
  bloques: BloqueConfig[]
) {
  const wb = XLSX.utils.book_new();

  // Generar todos los cursos del establecimiento
  const niveles = establecimiento.niveles.split('-').map(n => parseInt(n));
  const secciones = establecimiento.secciones || ['A'];

  for (let nivel = niveles[0]; nivel <= niveles[1]; nivel++) {
    secciones.forEach(seccion => {
      // IMPORTANTE: Generar la clave igual que en el constructor de horarios
      const nombreCurso = nivel <= 8
        ? `${nivel}° Básico ${seccion}`
        : `${nivel - 8}° Medio ${seccion}`;

      const cursoKey = `${establecimiento.id}-${nombreCurso}`;
      const horarioData = horarios[cursoKey] || {};

      // INCLUIR TODOS los bloques (clase, recreo, colación)
      const tableData = bloques.map(bloque => {
        const row: Record<string, string> = {
          'Bloque': `${bloque.id}`,
          'Horario': `${bloque.horaInicio} - ${bloque.horaFin}`
        };

        // Si es recreo o colación, marcar en todas las columnas
        if (bloque.tipo === 'recreo') {
          DIAS.forEach(dia => {
            row[dia] = '☕ RECREO';
          });
        } else if (bloque.tipo === 'colacion') {
          DIAS.forEach(dia => {
            row[dia] = '🍽️ COLACIÓN';
          });
        } else {
          // Es clase normal
          DIAS.forEach(dia => {
            const bloqueKey = `${dia}-${bloque.id}`;
            const bloqueInfo = horarioData[bloqueKey];

            if (bloqueInfo && bloqueInfo.asignatura && bloqueInfo.asignatura.nombre && bloqueInfo.docenteNombre) {
              row[dia] = `${bloqueInfo.asignatura.nombre}\n${bloqueInfo.docenteNombre}`;
            } else if (bloqueInfo && bloqueInfo.asignatura && bloqueInfo.asignatura.nombre) {
              row[dia] = `${bloqueInfo.asignatura.nombre}\n⚠️ Docente no encontrado`;
            } else {
              row[dia] = '';
            }
          });
        }

        return row;
      });

      if (tableData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(tableData);
        ws['!cols'] = [{ wch: 8 }, { wch: 15 }, ...DIAS.map(() => ({ wch: 25 }))];

        const sheetName = `${nivel}${nivel <= 8 ? 'B' : 'M'}-${seccion}`;
        XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
      }
    });
  }

  const filename = `Horarios_${establecimiento.nombre.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}

// ===== PDF EXPORTS =====

/**
 * Convierte un color hex a RGB
 */
function hexToRGB(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [100, 100, 100];
}

export function exportarHorarioCursoPDF(
  cursoNombre: string,
  establecimientoNombre: string,
  horarioData: Record<string, BloqueHorario>,
  bloques: BloqueConfig[]
) {
  const doc = new jsPDF('landscape');

  // Validar parámetros
  const cursoTexto = cursoNombre || 'Curso sin nombre';
  const establecimientoTexto = establecimientoNombre || 'Establecimiento sin nombre';

  // Header con diseño mejorado
  doc.setFillColor(16, 185, 129); // emerald-600
  doc.rect(0, 0, 297, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Horario ${cursoTexto}`, 14, 12);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(establecimientoTexto, 14, 20);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 14, 27);

  doc.setTextColor(0, 0, 0); // Restaurar color de texto

  // Tabla con TODOS los bloques (incluye recreos y colaciones)
  const headers = ['#', 'Horario', ...DIAS];
  const rows = bloques.map(bloque => {
    const row = [
      bloque.id.toString(),
      `${bloque.horaInicio}\n${bloque.horaFin}`
    ];

    // Si es recreo o colación
    if (bloque.tipo === 'recreo') {
      DIAS.forEach(() => row.push('☕ RECREO'));
    } else if (bloque.tipo === 'colacion') {
      DIAS.forEach(() => row.push('🍽️ COLACIÓN'));
    } else {
      // Es clase normal
      DIAS.forEach(dia => {
        const bloqueKey = `${dia}-${bloque.id}`;
        const bloqueInfo = horarioData[bloqueKey];

        if (bloqueInfo && bloqueInfo.asignatura && bloqueInfo.asignatura.nombre && bloqueInfo.docenteNombre) {
          row.push(`${bloqueInfo.asignatura.nombre}\n${bloqueInfo.docenteNombre}`);
        } else {
          row.push('—');
        }
      });
    }

    return row;
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 40,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [16, 185, 129], // emerald-600
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: {
        cellWidth: 12,
        halign: 'center',
        fillColor: [243, 244, 246], // gray-100
        fontStyle: 'bold'
      },
      1: {
        cellWidth: 20,
        halign: 'center',
        fillColor: [243, 244, 246], // gray-100
        fontSize: 7
      }
    },
    didParseCell: function(data) {
      // Colorear celdas según el tipo de bloque
      if (data.section === 'body' && data.column.index >= 2) {
        const rowIndex = data.row.index;
        const diaIndex = data.column.index - 2;
        const dia = DIAS[diaIndex];
        const bloque = bloques[rowIndex];

        if (bloque) {
          // Si es recreo - fondo amarillo claro
          if (bloque.tipo === 'recreo') {
            data.cell.styles.fillColor = [255, 251, 235]; // amber-50
            data.cell.styles.textColor = [146, 64, 14]; // amber-900
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.halign = 'center';
          }
          // Si es colación - fondo verde claro
          else if (bloque.tipo === 'colacion') {
            data.cell.styles.fillColor = [240, 253, 244]; // green-50
            data.cell.styles.textColor = [20, 83, 45]; // green-900
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.halign = 'center';
          }
          // Si es clase normal
          else {
            const bloqueKey = `${dia}-${bloque.id}`;
            const bloqueInfo = horarioData[bloqueKey];

            if (bloqueInfo && bloqueInfo.asignatura && bloqueInfo.asignatura.color) {
              const rgb = hexToRGB(bloqueInfo.asignatura.color);
              data.cell.styles.fillColor = rgb;
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.fillColor = [249, 250, 251]; // gray-50
              data.cell.styles.textColor = [209, 213, 219]; // gray-300
            }
          }
        }
      }
    }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Sistema de Carga Horaria DAEM - Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  const filename = `Horario_${establecimientoTexto.replace(/\s/g, '_')}_${cursoTexto.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);

  return filename;
}

export function exportarHorarioDocentePDF(
  docente: Docente,
  horarios: Record<string, Record<string, BloqueHorario>>,
  bloques: BloqueConfig[],
  establecimientoNombre: string
) {
  // Validar parámetros
  const establecimientoTexto = establecimientoNombre || 'Establecimiento sin nombre';
  const docenteNombre = docente?.nombre || 'Docente sin nombre';
  const docenteRut = docente?.rut || 'Sin RUT';

  const doc = new jsPDF('landscape');
  const bloquesClase = bloques.filter(b => b.tipo === 'clase');

  // Header con diseño mejorado
  doc.setFillColor(20, 184, 166); // teal-600
  doc.rect(0, 0, 297, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Horario Docente`, 14, 12);

  doc.setFontSize(14);
  doc.text(docenteNombre, 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`RUT: ${docenteRut} | ${establecimientoTexto}`, 14, 28);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 14, 35);

  doc.setTextColor(0, 0, 0);

  // Recolectar datos de bloques con asignaturas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bloquesAsignados = new Map<string, { curso: string; asignatura: any }>();
  Object.entries(horarios).forEach(([cursoKey, horarioCurso]) => {
    Object.entries(horarioCurso).forEach(([bloqueKey, bloqueData]) => {
      if (bloqueData.docenteId === docente.id) {
        const [, nivel, seccion] = cursoKey.split('-');
        bloquesAsignados.set(bloqueKey, {
          curso: `${nivel}-${seccion}`,
          asignatura: bloqueData.asignatura
        });
      }
    });
  });

  const headers = ['#', 'Horario', ...DIAS];
  const rows = bloquesClase.map(bloque => {
    const row = [
      bloque.id.toString(),
      `${bloque.horaInicio}\n${bloque.horaFin}`
    ];

    DIAS.forEach(dia => {
      const bloqueKey = `${dia}-${bloque.id}`;
      const asignacion = bloquesAsignados.get(bloqueKey);

      if (asignacion && asignacion.asignatura) {
        const asignaturaNombre = asignacion.asignatura.nombre || asignacion.asignatura.codigo || 'Sin nombre';
        row.push(`${asignacion.curso}\n${asignaturaNombre}`);
      } else {
        row.push('—');
      }
    });

    return row;
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 45,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [20, 184, 166], // teal-600
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: {
        cellWidth: 12,
        halign: 'center',
        fillColor: [243, 244, 246],
        fontStyle: 'bold'
      },
      1: {
        cellWidth: 20,
        halign: 'center',
        fillColor: [243, 244, 246],
        fontSize: 7
      }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index >= 2) {
        const rowIndex = data.row.index;
        const diaIndex = data.column.index - 2;
        const dia = DIAS[diaIndex];
        const bloque = bloquesClase[rowIndex];

        if (bloque) {
          const bloqueKey = `${dia}-${bloque.id}`;
          const asignacion = bloquesAsignados.get(bloqueKey);

          if (asignacion && asignacion.asignatura && asignacion.asignatura.color) {
            const rgb = hexToRGB(asignacion.asignatura.color);
            data.cell.styles.fillColor = rgb;
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.fillColor = [249, 250, 251];
            data.cell.styles.textColor = [209, 213, 219];
          }
        }
      }
    }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Sistema de Carga Horaria DAEM - Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  const filename = `Horario_Docente_${docenteNombre.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);

  return filename;
}
