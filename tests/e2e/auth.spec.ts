import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Iniciar Sesión');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'direccion@acme-repair.com');
    await page.fill('input[type="password"]', 'ChangeMe123!');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Error al iniciar sesión')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Invalid email')).toBeVisible();
  });

  test('should use mock login buttons in demo mode', async ({ page }) => {
    // Should show mock login buttons
    await expect(page.locator('text=Modo Demo - Usuarios de prueba:')).toBeVisible();
    
    // Click on first mock user
    await page.click('button:has-text("Juan Pérez")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Juan Pérez')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'direccion@acme-repair.com');
    await page.fill('input[type="password"]', 'ChangeMe123!');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('button:has-text("Cerrar Sesión")');

    // Should redirect to home page
    await expect(page).toHaveURL('/');
  });
});

