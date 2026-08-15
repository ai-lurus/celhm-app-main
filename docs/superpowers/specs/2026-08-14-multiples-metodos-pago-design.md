# Múltiples métodos de pago al dividir (más de 2)

**Fecha:** 2026-08-14
**Repo afectado:** `celhm-app-main` (solo frontend, sin cambios de backend)

## Contexto / problema

Hoy, en el PDV (`CashRegister.tsx`), el botón **"+ Dividir pago"** solo
aparece mientras `form.payments.length < 2` (línea 559), y al hacer clic
mete exactamente 2 filas de pago (línea 560-577). No hay forma de agregar
un tercer método de pago desde la UI.

El backend no tiene esta limitación: `CreateSaleDto.payments` es un arreglo
sin tope (`create-sale.dto.ts:89-94`) y `SalesService.create()` procesa
cualquier cantidad de pagos con un `for` genérico
(`sales.service.ts:145-158`), sumando montos y marcando `PAGADO` cuando la
suma cubre el total. El límite de 2 es puramente una restricción del
frontend, no del dominio.

## Comportamiento esperado

1. **Sin tope de filas.** El botón para agregar un método de pago ya no se
   oculta a partir de 2 filas; se puede agregar cuantas filas se quiera.
   - Con 1 pago en el formulario, el botón dice **"+ Dividir pago"** (texto
     actual) y, al hacer clic, agrega una 2ª fila — comportamiento idéntico
     al de hoy (la 1ª fila se queda con el monto que ya tenía o el total
     completo si estaba en 0; la 2ª arranca en $0).
   - Con 2 o más pagos, el botón cambia su texto a **"+ Agregar método"** y
     cada clic agrega una fila más, arrancando en $0.
   - El método preseleccionado de cada fila nueva es el primero de la lista
     fija (`EFECTIVO`, `TARJETA_DEBITO`, `TARJETA_CREDITO`,
     `TRANSFERENCIA`, `CHEQUE`, `OTRO`) que todavía no esté en uso en
     ninguna fila existente; si ya están los 6 en uso, se repite `OTRO`.
     Esto es solo una comodidad para ahorrar un clic — no se impide que el
     usuario elija manualmente un método repetido en dos filas.

2. **Auto-cálculo generalizado a N filas.** Hoy, con exactamente 2 pagos,
   editar el monto de la fila 0 recalcula la fila 1 (y viceversa) para que
   la suma dé el total (líneas 606-619). La nueva regla, válida para
   cualquier cantidad de filas:
   - La **última fila** de la lista siempre actúa como "resto": su monto se
     recalcula automáticamente como `max(0, total - suma(montos de todas
     las demás filas))` cada vez que se edita el monto de **cualquier fila
     que no sea la última**.
   - Editar el monto de la última fila directamente la deja tal cual el
     usuario la escribió — no dispara ningún recálculo de las demás filas
     (igual que hoy: la fila "editada manualmente" no se toca a sí misma).

3. **Eliminar una fila (botón ×).** Se mantiene el comportamiento actual:
   - Si al eliminar queda 1 sola fila, su monto se fija al total completo
     (como hoy, línea 628).
   - Si quedan 2 o más filas, se recalcula la nueva última fila con la
     misma regla del punto 2, para que la suma siga cuadrando con el total
     tras el borrado.

4. **Contenedor con scroll.** El bloque de filas de pago vive en una
   columna de ancho fijo dentro del formulario. Se le agrega
   `max-h-40 overflow-y-auto` al contenedor de filas (línea 579) para que
   agregar muchas filas no rompa el layout del modal.

5. **Sin cambios fuera de este bloque.** El resto del flujo (modal de cobro
   en efectivo, envío a `POST /sales`, validaciones de backend) ya
   generaliza correctamente a N pagos — verificado que ningún otro punto
   del código asume exactamente 2 filas:
   - `change`, el modal de "Cobro en Efectivo" y `page.tsx` usan
     `payments.length === 1` vs. `> 1`, no `=== 2`.
   - `resolvedPayments` en `page.tsx:192-198` mapea el arreglo completo sin
     asumir tamaño.

## Fuera de alcance

- No se agrega validación de que la suma de pagos coincida exactamente con
  el total antes de habilitar "PAGAR" — ese comportamiento (o su ausencia)
  ya existe hoy y no se toca en este cambio.
- No se impide seleccionar el mismo método de pago en dos filas distintas.
- No hay cambios de backend — el endpoint ya soporta arreglos de pagos de
  cualquier longitud.

## Componentes y archivos afectados

- `src/app/dashboard/sales/_components/CashRegister.tsx`:
  - Línea 559: quitar la condición `form.payments.length < 2` que oculta el
    botón de agregar método.
  - Línea 560-577: generalizar el `onClick` del botón para que funcione
    tanto en el caso "1 → 2" (comportamiento actual) como en "agregar una
    fila más" a partir de 2, incluyendo la selección de método por
    defecto (primer método no usado).
  - Texto del botón: condicional entre "+ Dividir pago" (1 fila) y "+
    Agregar método" (2+ filas).
  - Línea 606-619 (`onChange` del input de monto): reemplazar el `if
    index === 0 / else if index === 1` hardcodeado por la regla general
    "recalcular la última fila si se edita cualquier fila que no sea la
    última".
  - Línea 623-635 (`onClick` del botón ×): tras filtrar la fila eliminada,
    aplicar la misma regla de recálculo de la última fila cuando queden 2+
    filas (además del caso ya existente de fijar el total cuando queda 1).
  - Línea 579: agregar `max-h-40 overflow-y-auto` al contenedor de filas.

## Testing

- No hay archivo de test existente para `CashRegister.tsx` (mismo caso que
  el spec de "Dejar pendiente"); se sigue el patrón del repo: verificar con
  `pnpm typecheck` y prueba manual en el navegador (`pnpm dev`):
  1. Agregar productos, dividir el pago en 2, luego agregar un 3er y 4to
     método y confirmar que el último siempre absorbe el restante al editar
     cualquiera de los anteriores.
  2. Eliminar filas intermedias y confirmar que la suma sigue cuadrando con
     el total.
  3. Crear la venta con 3+ métodos de pago y confirmar en el listado de
     Ventas que el detalle (`ViewSaleModal`) muestra todos los pagos
     correctamente y el estado queda `PAGADO`.
