import { Establecimiento, Docente } from "@/types";

// Sistema inicia vacío - Los datos se cargan mediante importación Excel o ingreso manual
// NOTA: proporcion se movió a nivel de Asignacion (depende del ciclo de enseñanza)
export const ESTABLECIMIENTOS_INICIALES: Establecimiento[] = [
  { id: 1, nombre: "Escuela Aillinco", niveles: "1-8", prioritarios: true },
  { id: 2, nombre: "Escuela Chacaico", niveles: "1-6", prioritarios: true },
  { id: 3, nombre: "Escuela El Capricho", niveles: "1-8", prioritarios: true },
  { id: 4, nombre: "Escuela Fortín Ñielol", niveles: "1-8", prioritarios: true },
  { id: 5, nombre: "Escuela Gabriela Mistral", niveles: "1-8", prioritarios: true },
  { id: 6, nombre: "Escuela Huampomallin", niveles: "1-8", prioritarios: true },
  { id: 7, nombre: "Escuela La Piedra", niveles: "1-8", prioritarios: true },
  { id: 8, nombre: "Escuela Llufquentue", niveles: "1-8", prioritarios: true },
  { id: 9, nombre: "Escuela Mañiuco", niveles: "1-8", prioritarios: true },
  { id: 10, nombre: "Escuela Nilpe", niveles: "1-6", prioritarios: true },
  { id: 11, nombre: "Escuela Pangueco", niveles: "1-8", prioritarios: true },
  { id: 12, nombre: "Escuela Pelantaro", niveles: "1-8", prioritarios: true },
  { id: 13, nombre: "Escuela Quetre", niveles: "1-6", prioritarios: true },
  { id: 14, nombre: "Escuela Quinahue", niveles: "1-6", prioritarios: true },
  { id: 15, nombre: "Escuela Río Quillem", niveles: "1-8", prioritarios: true },
  { id: 16, nombre: "Escuela Rucatraro Alto", niveles: "1-8", prioritarios: true },
  { id: 17, nombre: "Escuela Santa Margarita", niveles: "1-8", prioritarios: true },
  { id: 18, nombre: "Escuela Trabunquillem", niveles: "1-6", prioritarios: true },
  { id: 19, nombre: "Escuela Trif Trifco", niveles: "1-6", prioritarios: true },
  { id: 20, nombre: "Liceo Gregorio Urrutia", niveles: "7-12", prioritarios: true } // 7° a 4° Medio
];

export const DOCENTES_LA_PIEDRA: Docente[] = [];
