import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import DashboardPage from "@/pages/DashboardPage"

describe("DashboardPage", () => {
  it("renders the dashboard heading and button", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Get Started" })).toBeInTheDocument()
  })
})
