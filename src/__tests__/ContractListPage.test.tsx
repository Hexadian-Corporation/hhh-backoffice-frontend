import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import ContractListPage from "@/pages/ContractListPage"

describe("ContractListPage", () => {
  it("renders the contratos heading", () => {
    render(
      <MemoryRouter>
        <ContractListPage />
      </MemoryRouter>,
    )

    expect(screen.getByText("Contratos")).toBeInTheDocument()
  })
})
