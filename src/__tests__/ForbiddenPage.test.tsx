import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ForbiddenPage from "@/pages/ForbiddenPage";

describe("ForbiddenPage", () => {
  it("renders the insufficient permissions heading", () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Insufficient Permissions")).toBeInTheDocument();
  });

  it("renders the descriptive message", () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/You do not have the required permissions/),
    ).toBeInTheDocument();
  });

  it("renders a link back to dashboard", () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /back to dashboard/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
