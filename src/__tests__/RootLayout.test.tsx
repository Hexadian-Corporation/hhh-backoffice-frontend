import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { vi } from "vitest"
import RootLayout from "@/layouts/RootLayout"

vi.mock("@/lib/permissions", () => ({
  usePermissions: () => [
    "contracts:read", "contracts:write",
    "locations:read", "locations:write",
    "commodities:read", "commodities:write",
    "users:read", "users:admin",
  ],
  hasPermission: () => true,
  hasAnyPermission: () => true,
}))

describe("RootLayout", () => {
  it("renders the sidebar with branding and navigation links", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <RootLayout />
      </MemoryRouter>,
    )

    expect(screen.getByAltText("Hexadian")).toBeInTheDocument()
    expect(screen.getByText("Backoffice")).toBeInTheDocument()
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Contratos")).toBeInTheDocument()
    expect(screen.getByText("Ubicaciones")).toBeInTheDocument()
    expect(screen.getByText("Users")).toBeInTheDocument()
  })

  it("renders the Hexadian wordmark with correct src", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <RootLayout />
      </MemoryRouter>,
    )

    const wordmark = screen.getByAltText("Hexadian")
    expect(wordmark).toHaveAttribute("src", "/brand/HEXADIAN-Letters.png")
  })

  it("renders the circular logo watermark at sidebar bottom", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <RootLayout />
      </MemoryRouter>,
    )

    const watermark = container.querySelector(
      'img[src="/brand/HEXADIAN-Background_Round.png"]',
    )
    expect(watermark).toBeInTheDocument()
    expect(watermark).toHaveClass("opacity-30")
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
