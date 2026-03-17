import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import InsufficientPermissionsPage from "@/pages/InsufficientPermissionsPage";

describe("InsufficientPermissionsPage", () => {
  it("renders the insufficient permissions heading", () => {
    render(
      <MemoryRouter>
        <InsufficientPermissionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Insufficient Permissions")).toBeInTheDocument();
  });

  it("renders the descriptive message", () => {
    render(
      <MemoryRouter>
        <InsufficientPermissionsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/You do not have the required permissions/),
    ).toBeInTheDocument();
  });

  it("renders a link back to dashboard", () => {
    render(
      <MemoryRouter>
        <InsufficientPermissionsPage />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /back to dashboard/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
