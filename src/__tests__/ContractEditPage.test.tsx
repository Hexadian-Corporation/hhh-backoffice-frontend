import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import ContractEditPage from "@/pages/ContractEditPage"

describe("ContractEditPage", () => {
  it("renders the contract id from route params", () => {
    render(
      <MemoryRouter initialEntries={["/contracts/42"]}>
        <Routes>
          <Route path="/contracts/:id" element={<ContractEditPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Edit Contract")).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
  })
})
