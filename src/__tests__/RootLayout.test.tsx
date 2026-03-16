import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import RootLayout from "@/layouts/RootLayout"

describe("RootLayout", () => {
  it("renders the sidebar with branding and navigation links", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <RootLayout />
      </MemoryRouter>,
    )

    expect(screen.getByText("H³ Backoffice")).toBeInTheDocument()
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Contratos")).toBeInTheDocument()
    expect(screen.getByText("Ubicaciones")).toBeInTheDocument()
    expect(screen.getByText("Users")).toBeInTheDocument()
  })

  it("renders Contratos as a link to /contracts", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <RootLayout />
      </MemoryRouter>,
    )

    const link = screen.getByRole("link", { name: /contratos/i })
    expect(link).toHaveAttribute("href", "/contracts")
  })

  it("renders Ubicaciones as a link to /locations", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <RootLayout />
      </MemoryRouter>,
    )

    const link = screen.getByRole("link", { name: /ubicaciones/i })
    expect(link).toHaveAttribute("href", "/locations")
  })

  it("renders Users as a link to /users", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <RootLayout />
      </MemoryRouter>,
    )

    const link = screen.getByRole("link", { name: /users/i })
    expect(link).toHaveAttribute("href", "/users")
  })
})
