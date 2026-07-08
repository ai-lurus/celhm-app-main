# Aviso de documentos pendientes al iniciar una nueva venta (PDV)

**Fecha:** 2026-07-08
**Repos afectados:** `celhm-app-main` (frontend), `celhm-api-main` (backend)

## Contexto / problema

En el módulo de Punto de Venta (PDV), al iniciar una nueva venta para un cliente
que ya tiene una venta en estado `PENDIENTE` (creada pero sin pago completo, no
cancelada), el cajero no tiene ninguna señal dentro del flujo de venta. Hoy la
única forma de detectar y resolver esos pendientes es saliendo al listado de
Ventas (filtrando por `PENDIENTE`) — un flujo manual y disruptivo para un caso
de uso diario.

## Definiciones

- **"Documento/ticket pendiente"** = un registro `Sale` con `status = PENDIENTE`
  asociado al `customerId` seleccionado (no se refiere a `Ticket` de reparación).
- Toda venta se crea con `status = PENDIENTE` (`sales.service.ts:78`) y pasa a
  `PAGADO` únicamente si el pago cubre el total en el mismo request. El stock se
  descuenta de inmediato al crear la venta (`sales.service.ts:205-238`),
  independientemente del status.

## Comportamiento esperado

1. Al seleccionar un cliente real (no "Cliente de Mostrador") en
   `CustomerSelector` dentro de `CashRegister.tsx`, se consulta
   `GET /sales?customerId={id}&status=PENDIENTE` (endpoint existente, sin
   cambios de backend).
2. Si hay resultados, se abre un modal (`PendingSalesModal`) con una fila por
   pendiente mostrando: folio, fecha, total, abonado, saldo.
3. Cada fila tiene tres acciones: **Continuar**, **Cancelar**, **Ignorar**.
4. El flujo de creación de venta nueva **nunca se bloquea**: el formulario del
   PDV permanece habilitado y guardable sin importar si el modal sigue abierto,
   se cerró sin decidir, o quedan pendientes sin resolver.
5. Cerrar el modal con la "X" equivale a "Ignorar" todas las filas.
6. Resolver una fila (Continuar/Cancelar/Ignorar) no afecta a las demás filas
   del mismo cliente — cada pendiente no resuelto reaparecerá la próxima vez
   que se seleccione a ese cliente.

## Acción "Continuar" (recrear, sin conservar folio)

Precarga en el formulario actual del PDV las líneas (productos, cantidades,
descuento) de la venta pendiente elegida, y guarda en memoria el id de esa
venta original. Al guardar la venta nueva:

1. Se llama `cancelSale(idOriginal)` (ver abajo) para liberar el stock y marcar
   la venta original como `CANCELADO`.
2. Se ejecuta el flujo normal `createSale(...)` con las líneas precargadas,
   generando un **folio nuevo**.

Si el cajero cambia de cliente antes de guardar, se descarta la referencia a
la venta original (no se cancela nada).

No se modifica el endpoint de creación de ventas (`POST /sales`).

## Acción "Cancelar"

Requiere un endpoint nuevo: `POST /sales/:id/cancel`.

Reglas de negocio:
- Rechaza con 400 si `sale.status !== PENDIENTE`.
- Rechaza con 409 si la venta tiene algún pago registrado (`paidAmount > 0`),
  con mensaje "No se puede cancelar una venta con abono registrado". En ese
  caso el botón "Cancelar" aparece deshabilitado en el modal con un tooltip
  explicando el motivo; la resolución de ese pendiente se hace manualmente
  desde el módulo de Ventas.
- En una transacción: por cada línea con `variantId` (y
  `product.tracksInventory !== false`), crea un `Movement` tipo `DEV` (mismo
  tipo usado en devoluciones) y hace `increment` del `Stock` correspondiente;
  actualiza `sale.status = CANCELADO`.
- Usa el mismo guard de autenticación/rol que ya protege la creación de ventas
  en el PDV — no se introduce un permiso nuevo.

## Acción "Ignorar" / cerrar modal

Solo oculta la fila (o el modal completo) en el cliente. No hace ninguna
llamada al backend. El pendiente sigue existiendo y reaparecerá la próxima vez
que se seleccione a ese cliente.

## Fuera de alcance

- No se bloquea ni interrumpe la creación de la venta nueva en ningún caso.
- No se redirige al módulo de "Documentos pendientes" (listado de Ventas) como
  único camino de resolución — ese módulo sigue existiendo para gestión
  general, pero esta funcionalidad resuelve el caso de uso dentro del PDV.
- No se agrega un endpoint para editar líneas de una venta ya existente
  (`PATCH /sales/:id/lines`); "Continuar" recrea la venta en vez de editarla
  en sitio.
- No se maneja aquí el reembolso de pagos parciales ya registrados — se
  bloquea la cancelación en ese caso (ver arriba).

## Componentes y archivos afectados

**Backend (`celhm-api-main`)**
- `src/sales/sales.service.ts`: nuevo método `cancelSale(id, user)`.
- `src/sales/sales.controller.ts`: nuevo endpoint `POST /sales/:id/cancel`.
- `src/sales/sales.service.spec.ts`: casos de prueba para `cancelSale`.

**Frontend (`celhm-app-main`)**
- `src/lib/hooks/useSales.ts`: nuevos hooks `usePendingSalesByCustomer(customerId)`
  (React Query sobre `GET /sales`) y `useCancelSale()` (mutation).
- `src/app/dashboard/sales/_components/PendingSalesModal.tsx` (nuevo componente).
- `src/app/dashboard/sales/_components/CashRegister.tsx`: integra el modal al
  seleccionar cliente y maneja la referencia a "venta a cancelar al guardar"
  para la acción Continuar.

## Testing

**Backend**
- `cancelSale` rechaza si `status !== PENDIENTE`.
- `cancelSale` rechaza si `paidAmount > 0`.
- `cancelSale` restaura stock correctamente (movimiento `DEV` + incremento de
  `Stock`) y actualiza `status = CANCELADO`.
- E2E: `POST /sales/:id/cancel` con los casos anteriores.

**Frontend**
- `PendingSalesModal`: renderiza una fila por pendiente con folio/fecha/total/
  abonado/saldo; botón "Cancelar" deshabilitado cuando `paidAmount > 0`;
  "Ignorar" oculta la fila; cerrar el modal equivale a ignorar todas las filas.
- E2E (Playwright): crear una venta pendiente para un cliente → iniciar una
  venta nueva para el mismo cliente → verificar que aparece el modal →
  ejercitar cada acción (Continuar/Cancelar/Ignorar) → verificar que en todos
  los casos la venta nueva se puede guardar sin bloqueo.
