import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'direccion@acme-repair.com');
    await page.fill('input[type="password"]', 'ChangeMe123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard with user information', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Bienvenido, Juan Pérez')).toBeVisible();
  });

  test('should display KPI cards', async ({ page }) => {
    await expect(page.locator('text=Total Tickets')).toBeVisible();
    await expect(page.locator('text=Tickets Activos')).toBeVisible();
    await expect(page.locator('text=Stock Bajo')).toBeVisible();
    await expect(page.locator('text=Valor Inventario')).toBeVisible();
  });

  test('should display recent tickets section', async ({ page }) => {
    await expect(page.locator('text=Tickets Recientes')).toBeVisible();
    
    // Should show ticket items
    const ticketItems = page.locator('[data-testid="ticket-item"]');
    await expect(ticketItems.first()).toBeVisible();
  });

  test('should display stock alerts section', async ({ page }) => {
    await expect(page.locator('text=Alertas de Stock')).toBeVisible();
    
    // Should show stock alert items or "No hay alertas"
    const stockAlerts = page.locator('text=Crítico, text=No hay alertas de stock');
    await expect(stockAlerts.first()).toBeVisible();
  });

  test('should navigate to different sections', async ({ page }) => {
    // Test navigation to inventory
    await page.click('text=Inventario');
    await expect(page).toHaveURL('/dashboard/inventory');

    // Test navigation to tickets
    await page.click('text=Tickets');
    await expect(page).toHaveURL('/dashboard/tickets');

    // Test navigation to catalog
    await page.click('text=Catálogo');
    await expect(page).toHaveURL('/dashboard/catalog');

    // Test navigation back to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show user role in navigation', async ({ page }) => {
    await expect(page.locator('text=Juan Pérez (DIRECCION)')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Dashboard should still be functional
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Navigation should be accessible (might be in hamburger menu)
    await expect(page.locator('text=CELHM')).toBeVisible();
  });
});

