import { test, expect, APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const CREDENTIALS = { email: 'direccion@acme-repair.com', password: 'ChangeMe123!' };

async function apiLogin(request: APIRequestContext) {
  const response = await request.post(`${API_URL}/auth/login`, { data: CREDENTIALS });
  const body = await response.json();
  return { token: body.access_token as string, user: body.user as { branchId: number } };
}

test.describe('Pending sales handling in POS', () => {
  test('offers Continuar/Cancelar/Ignorar for a customer with a pending sale, never blocking the flow', async ({
    page,
    request,
  }) => {
    const { token, user } = await apiLogin(request);
    const authHeaders = { Authorization: `Bearer ${token}` };

    const uniqueSuffix = Date.now();
    const customerName = `Cliente Pendiente E2E ${uniqueSuffix}`;
    const customerRes = await request.post(`${API_URL}/customers`, {
      headers: authHeaders,
      data: { name: customerName, phone: `521${uniqueSuffix}`.slice(0, 13) },
    });
    const customer = await customerRes.json();

    const registersRes = await request.get(`${API_URL}/cash/registers?branchId=${user.branchId}`, {
      headers: authHeaders,
    });
    const registers = await registersRes.json();
    const cashRegisterId = registers[0].id;

    const stockRes = await request.get(`${API_URL}/stock?pageSize=1`, { headers: authHeaders });
    const stockBody = await stockRes.json();
    const variantId = stockBody.data[0].variantId;
    const unitPrice = Number(stockBody.data[0].variant.price) || 100;

    // No `payments` sent at all -> the sale stays PENDIENTE (see sales.service.ts create()).
    const saleRes = await request.post(`${API_URL}/sales`, {
      headers: authHeaders,
      data: {
        branchId: user.branchId,
        customerId: customer.id,
        cashRegisterId,
        lines: [{ variantId, description: 'Producto de prueba E2E', qty: 1, unitPrice }],
      },
    });
    const pendingSale = await saleRes.json();
    expect(pendingSale.status).toBe('PENDIENTE');

    await page.goto('/login');
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    await page.goto('/dashboard/sales');
    await page.click('text=+ Nueva Venta');
    await page.fill('input[placeholder="CLIENTE DE MOSTRADOR"]', customerName);

    const pendingSalesResponse = page.waitForResponse(
      (res) => res.url().includes('/sales?') && res.url().includes('status=PENDIENTE') && res.url().includes(`customerId=${customer.id}`)
    );
    await page.getByRole('button', { name: customerName }).click();
    await pendingSalesResponse;

    await expect(page.getByRole('heading', { name: 'Documentos pendientes de este cliente' })).toBeVisible();
    // The folio also appears in the sales table behind the modal (same-page background data);
    // the modal renders after it in the DOM, so `.last()` reliably targets the modal's row.
    await expect(page.locator(`text=${pendingSale.folio}`).last()).toBeVisible();

    // The new-sale form must remain usable while the modal is open.
    await expect(page.locator('text=PAGAR')).toBeEnabled();

    // Ignoring must close the modal without blocking the flow.
    await page.getByRole('button', { name: 'Ignorar' }).click();
    await expect(page.getByRole('heading', { name: 'Documentos pendientes de este cliente' })).not.toBeVisible();
  });
});
