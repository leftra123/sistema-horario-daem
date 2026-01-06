#!/usr/bin/env node
// Script para generar archivo Excel de ejemplo con datos hardcodeados

import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const dataDir = join(rootDir, 'data');

// Asegurar que existe el directorio data
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Datos de ejemplo con todos los tipos de cargo y escenarios
const datosEjemplo = [
  {
    RUT: '12.345.678-9',
    NOMBRE: 'MARÍA GONZÁLEZ PÉREZ',
    FUNCION: 'DOCENTE DE AULA',
    TITULARIDAD: 'Titular',
    HRS: 44
  },
  {
    RUT: '11.222.333-4',
    NOMBRE: 'JUAN CARLOS MUÑOZ',
    FUNCION: 'DOCENTE DE AULA',
    TITULARIDAD: 'Contrata',
    HRS: 44
  },
  {
    RUT: '13.456.789-0',
    NOMBRE: 'PATRICIA LÓPEZ SILVA',
    FUNCION: 'DOCENTE DE AULA',
    TITULARIDAD: 'Titular',
    HRS: 40
  },
  {
    RUT: '14.567.890-1',
    NOMBRE: 'ROBERTO SÁNCHEZ TORRES',
    FUNCION: 'DOCENTE DE AULA',
    TITULARIDAD: 'Contrata',
    HRS: 30
  },
  {
    RUT: '15.678.901-2',
    NOMBRE: 'CLAUDIA RAMÍREZ FERNÁNDEZ',
    FUNCION: 'DOCENTE PIE',
    TITULARIDAD: 'Titular',
    HRS: 44
  },
  {
    RUT: '16.789.012-3',
    NOMBRE: 'FERNANDO CASTRO MIRANDA',
    FUNCION: 'DOCENTE PIE',
    TITULARIDAD: 'Contrata',
    HRS: 35
  },
  {
    RUT: '17.890.123-4',
    NOMBRE: 'ANDREA MORALES VARGAS',
    FUNCION: 'DOCENTE EIB',
    TITULARIDAD: 'Titular',
    HRS: 44
  },
  {
    RUT: '18.901.234-5',
    NOMBRE: 'LUIS ALBERTO REYES',
    FUNCION: 'DOCENTE EIB',
    TITULARIDAD: 'Contrata',
    HRS: 30
  },
  {
    RUT: '19.012.345-6',
    NOMBRE: 'VERÓNICA NÚÑEZ PAREDES',
    FUNCION: 'DIRECTIVO',
    TITULARIDAD: 'Titular',
    HRS: 44
  },
  {
    RUT: '20.123.456-7',
    NOMBRE: 'SERGIO CAMPOS ORTIZ',
    FUNCION: 'DIRECTIVO UTP',
    TITULARIDAD: 'Titular',
    HRS: 44
  },
  {
    RUT: '21.234.567-8',
    NOMBRE: 'DANIELA ROJAS MEDINA',
    FUNCION: 'DOCENTE DE AULA',
    TITULARIDAD: 'Contrata',
    HRS: 20
  },
  {
    RUT: '22.345.678-9',
    NOMBRE: 'CARLOS HERRERA BRAVO',
    FUNCION: 'DOCENTE DE AULA',
    TITULARIDAD: 'Titular',
    HRS: 38
  },
  {
    RUT: '23.456.789-0',
    NOMBRE: 'ISABEL FLORES GUTIÉRREZ',
    FUNCION: 'DOCENTE PIE',
    TITULARIDAD: 'Contrata',
    HRS: 25
  },
  {
    RUT: '24.567.890-1',
    NOMBRE: 'MIGUEL ÁNGEL VALDÉS',
    FUNCION: 'DOCENTE DE AULA',
    TITULARIDAD: 'Titular',
    HRS: 42
  },
  {
    RUT: '25.678.901-2',
    NOMBRE: 'GABRIELA PINTO CORTÉS',
    FUNCION: 'DOCENTE DE AULA',
    TITULARIDAD: 'Contrata',
    HRS: 33
  }
];

// Crear workbook
const wb = XLSX.utils.book_new();

// Crear hoja con los datos
const ws = XLSX.utils.json_to_sheet(datosEjemplo);

// Establecer ancho de columnas
ws['!cols'] = [
  { wch: 15 }, // RUT
  { wch: 35 }, // NOMBRE
  { wch: 20 }, // FUNCION
  { wch: 12 }, // TITULARIDAD
  { wch: 8 }   // HRS
];

// Agregar la hoja al workbook
XLSX.utils.book_append_sheet(wb, ws, 'Dotación Docente');

// Guardar archivo
const outputPath = join(dataDir, 'ejemplo_dotacion_docente.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Archivo Excel de ejemplo creado exitosamente:');
console.log(`📁 ${outputPath}`);
console.log('');
console.log('📋 Columnas requeridas:');
console.log('   - RUT: RUT del docente (formato: 12.345.678-9)');
console.log('   - NOMBRE: Nombre completo del docente');
console.log('   - FUNCION: Tipo de cargo (DOCENTE DE AULA, DOCENTE PIE, DOCENTE EIB, DIRECTIVO, OTRO)');
console.log('   - TITULARIDAD: Tipo de contrato (Titular, Contrata)');
console.log('   - HRS: Horas de contrato (máximo 44)');
console.log('');
console.log('💡 El archivo contiene ' + datosEjemplo.length + ' docentes de ejemplo con diferentes cargos y horas.');
