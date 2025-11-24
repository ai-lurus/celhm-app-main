import { test, expect } from '@playwright/test';

test.describe('Tickets Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as laboratorio user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'laboratorio@acme-repair.com');
    await page.fill('input[type="password"]', 'ChangeMe123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to tickets page', async ({ page }) => {
    await page.click('text=Tickets');
    await expect(page).toHaveURL('/dashboard/tickets');
  });

  test('should display tickets list', async ({ page }) => {
    await page.goto('/dashboard/tickets');
    
    // Should show tickets table or list
    await expect(page.locator('text=Tickets')).toBeVisible();
    
    // Should show ticket items (mock data)
    const ticketItems = page.locator('[data-testid="ticket-item"]');
    await expect(ticketItems.first()).toBeVisible();
  });

  test('should filter tickets by state', async ({ page }) => {
    await page.goto('/dashboard/tickets');
    
    // Click on filter dropdown
    await page.click('[data-testid="state-filter"]');
    
    // Select a state
    await page.click('text=RECIBIDO');
    
    // Should show filtered results
    await expect(page.locator('[data-testid="ticket-item"]')).toBeVisible();
  });

  test('should search tickets', async ({ page }) => {
    await page.goto('/dashboard/tickets');
    
    // Type in search box
    await page.fill('[data-testid="search-input"]', 'iPhone');
    
    // Should show filtered results
    await expect(page.locator('[data-testid="ticket-item"]')).toBeVisible();
  });

  test('should create new ticket', async ({ page }) => {
    await page.goto('/dashboard/tickets');
    
    // Click create ticket button
    await page.click('text=Nuevo Ticket');
    
    // Fill form
    await page.fill('[data-testid="customer-name"]', 'John Doe');
    await page.fill('[data-testid="customer-phone"]', '+52 555 123 4567');
    await page.fill('[data-testid="customer-email"]', 'john@example.com');
    await page.fill('[data-testid="device"]', 'iPhone 12');
    await page.fill('[data-testid="brand"]', 'Apple');
    await page.fill('[data-testid="model"]', 'iPhone 12');
    await page.fill('[data-testid="problem"]', 'Screen is cracked and not working');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to ticket detail or show success message
    await expect(page.locator('text=Ticket creado exitosamente, text=Ticket Details')).toBeVisible();
  });

  test('should view ticket details', async ({ page }) => {
    await page.goto('/dashboard/tickets');
    
    // Click on first ticket
    await page.click('[data-testid="ticket-item"]:first-child');
    
    // Should show ticket details
    await expect(page.locator('text=Ticket Details')).toBeVisible();
    await expect(page.locator('text=Folio:')).toBeVisible();
    await expect(page.locator('text=Cliente:')).toBeVisible();
    await expect(page.locator('text=Dispositivo:')).toBeVisible();
    await expect(page.locator('text=Problema:')).toBeVisible();
  });

  test('should update ticket state', async ({ page }) => {
    await page.goto('/dashboard/tickets');
    
    // Click on first ticket
    await page.click('[data-testid="ticket-item"]:first-child');
    
    // Click on state dropdown
    await page.click('[data-testid="state-dropdown"]');
    
    // Select new state
    await page.click('text=DIAGNOSTICO');
    
    // Add notes
    await page.fill('[data-testid="state-notes"]', 'Initial diagnosis completed');
    
    // Submit
    await page.click('button:has-text("Actualizar Estado")');
    
    // Should show success message
    await expect(page.locator('text=Estado actualizado exitosamente')).toBeVisible();
  });

  test('should add parts to ticket', async ({ page }) => {
    await page.goto('/dashboard/tickets');
    
    // Click on first ticket
    await page.click('[data-testid="ticket-item"]:first-child');
    
    // Go to parts tab
    await page.click('text=Piezas');
    
    // Click add part button
    await page.click('text=Agregar Pieza');
    
    // Select variant
    await page.click('[data-testid="variant-select"]');
    await page.click('text=Pantalla LCD iPhone 12 Negro');
    
    // Set quantity
    await page.fill('[data-testid="quantity-input"]', '1');
    
    // Submit
    await page.click('button:has-text("Agregar")');
    
    // Should show success message
    await expect(page.locator('text=Pieza agregada exitosamente')).toBeVisible();
  });

  test('should show ticket history', async ({ page }) => {
    await page.goto('/dashboard/tickets');
    
    // Click on first ticket
    await page.click('[data-testid="ticket-item"]:first-child');
    
    // Go to history tab
    await page.click('text=Historial');
    
    // Should show history items
    await expect(page.locator('[data-testid="history-item"]')).toBeVisible();
  });
});

