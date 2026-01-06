# Solución de Problemas - Sistema de Carga Horaria

## 🚨 Problemas Resueltos

### 1. Asignación de Horarios Bloqueada
**Problema**: No se podían asignar horarios, las celdas no respondían a los clics.

**Causa**: Header sticky con z-index bloqueaba los clics en la grilla.

**Solución**: Removido `sticky top-0 z-index` del header del constructor.

---

### 2. "undefined" en Exportaciones
**Problema**: Al exportar horarios aparecía "1º Básico - undefined" en lugar del nombre del docente.

**Causa**: Datos corruptos en localStorage de versiones anteriores que no tenían el campo `docenteNombre`.

**Solución**:
- ✅ Validaciones mejoradas en todas las funciones de exportación
- ✅ Función de reparación automática de datos
- ✅ Página de administración de datos

---

### 3. Conflictos Fantasma
**Problema**: El sistema reportaba que el docente tiene clases en otro lado cuando no era cierto.

**Causa**: Datos corruptos o formato inconsistente de claves de curso.

**Solución**:
- ✅ Logs de depuración en consola
- ✅ Validación mejorada de conflictos
- ✅ Función de reparación automática

---

## 🔧 PASOS RECOMENDADOS (EN ORDEN)

### Paso 1: Reparar Datos Automáticamente ⭐ RECOMENDADO

1. **Ve a la página de limpieza**:
   ```
   http://localhost:3000/limpiar-datos.html
   ```

2. **Haz clic en "🔧 Reparar Datos Automáticamente"**

   Esto hará:
   - ✅ Buscar bloques con `docenteNombre` faltante
   - ✅ Completar el nombre desde la lista de docentes
   - ✅ Eliminar bloques que no se puedan reparar
   - ✅ Mantener todos tus docentes y establecimientos

3. **Verás un mensaje como**:
   ```
   ✅ Reparación completada: 5 bloques reparados, 2 bloques eliminados
   ```

4. **Vuelve al sistema** y prueba asignar horarios

---

### Paso 2: Si Aún No Funciona - Limpiar Solo Horarios

Si después de reparar sigues teniendo problemas:

1. **Ve a**: `http://localhost:3000/limpiar-datos.html`
2. **Exporta un backup** (por si acaso)
3. **Haz clic en "📅 Solo Limpiar Horarios"**

Esto mantendrá:
- ✅ Todos tus docentes
- ✅ Todos tus establecimientos
- ✅ Todas las configuraciones

Pero eliminará:
- ❌ Todos los horarios asignados

---

### Paso 3: Último Recurso - Empezar de Cero

Solo si los pasos anteriores no funcionan:

1. **Ve a**: `http://localhost:3000/limpiar-datos.html`
2. **Exporta un backup**
3. **Haz clic en "🗑️ Eliminar Todos los Datos"**
4. **Recarga la página principal**

---

## 🐛 Depuración Avanzada

Si quieres ver qué está pasando internamente:

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña "Console"**
3. **Intenta asignar un horario**
4. **Verás mensajes como**:

```
🔍 Verificando conflicto: {docenteId: 1, dia: "Lunes", bloqueId: 1, cursoActual: "1-1° Básico A"}
📚 Horarios existentes: ["1-1° Básico A", "1-2° Básico A"]
  Revisando curso: 1-1° Básico A, actual: 1-1° Básico A, son iguales: true
  ✓ Ignorando curso actual: 1-1° Básico A
  Revisando curso: 1-2° Básico A, actual: 1-1° Básico A, son iguales: false
  Bloque Lunes-1 en 1-2° Básico A: undefined
  ✅ No hay conflicto
```

Esto te ayudará a identificar si hay:
- ❌ Cursos duplicados
- ❌ Formatos de clave incorrectos
- ❌ Bloques fantasma

---

## 📋 Checklist de Verificación

Después de reparar, verifica que:

- [ ] Puedes hacer clic en las celdas verdes del horario
- [ ] Aparece el nombre del docente (no "undefined")
- [ ] Los conflictos solo aparecen cuando realmente existen
- [ ] Las exportaciones muestran nombres correctos
- [ ] No aparecen errores en la consola

---

## 🆘 Si Nada Funciona

Si después de todos estos pasos sigues teniendo problemas:

1. **Toma un screenshot** de la consola del navegador (F12 > Console)
2. **Anota** exactamente qué estás intentando hacer
3. **Describe** qué mensaje de error aparece

Los logs de depuración mostrarán exactamente dónde está el problema.

---

## 💾 Archivos Modificados

Para referencia técnica, estos son los archivos que se modificaron:

### Exportaciones Mejoradas
- `lib/utils/export-horarios.ts`
  - Validaciones de `docenteNombre`
  - Validaciones de `asignatura`
  - Mensajes claros cuando faltan datos

### Store con Reparación Automática
- `lib/store.ts`
  - Función `repararDatosCorruptos()`
  - Logs de depuración en `tieneConflictoHorario()`
  - Mensajes de error mejorados

### Herramienta de Limpieza
- `public/limpiar-datos.html`
  - Reparación automática
  - Limpieza selectiva
  - Exportación de backups

### Constructor de Horarios
- `app/horario/page.tsx`
  - Header sin sticky (no bloquea clics)

### Página Principal
- `app/page.tsx`
  - Espaciado corregido (sin solapamiento)

---

## ✅ Mejoras Implementadas

### Prevención de Datos Corruptos
- ✅ Validaciones estrictas al guardar bloques
- ✅ Verificación de campos obligatorios
- ✅ Logs detallados en consola

### Recuperación de Datos
- ✅ Función de reparación automática
- ✅ Detección de campos faltantes
- ✅ Reconstrucción desde docentes existentes

### Diagnóstico
- ✅ Logs detallados en consola
- ✅ Página de administración de datos
- ✅ Exportación de backups

---

## 🎯 Resultado Esperado

Después de seguir los pasos:

1. ✅ Las asignaciones de horario funcionan perfectamente
2. ✅ Las exportaciones muestran nombres correctos
3. ✅ Los conflictos se detectan solo cuando existen
4. ✅ No hay datos corruptos en el sistema

---

**Última actualización**: Enero 2026
**Versión**: 2.1 - Corrección de bugs y reparación automática
