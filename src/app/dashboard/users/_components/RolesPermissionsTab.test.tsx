import { render, screen, within } from "@testing-library/react";
import { RolesPermissionsTab } from "./RolesPermissionsTab";

describe("RolesPermissionsTab", () => {
  it("marks CAJERO as allowed to view catalog but not to manage users", () => {
    render(<RolesPermissionsTab />);

    const catalogRow = screen.getByText("Ver catálogo").closest("tr")!;
    const roleHeaders = within(
      catalogRow.closest("table")!.querySelector("thead")!,
    ).getAllByRole("columnheader");
    const cajeroIndex = roleHeaders.findIndex((th) => th.textContent === "Cajero");

    const catalogCells = within(catalogRow).getAllByRole("cell");
    expect(catalogCells[cajeroIndex]).toHaveTextContent("✓");

    const usersRow = screen.getByText("Gestionar usuarios").closest("tr")!;
    const usersCells = within(usersRow).getAllByRole("cell");
    expect(usersCells[cajeroIndex]).toHaveTextContent("—");
  });

  it("lists the default landing route for each role", () => {
    render(<RolesPermissionsTab />);

    expect(screen.getByText(/Vendedor:/)).toBeInTheDocument();
    expect(screen.getByText("/dashboard/sales")).toBeInTheDocument();
  });
});
