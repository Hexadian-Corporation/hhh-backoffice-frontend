import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders with children text", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument()
  })

  it("applies variant classes", () => {
    render(<Button variant="destructive">Delete</Button>)
    const btn = screen.getByRole("button", { name: "Delete" })
    expect(btn.className).toContain("bg-[var(--color-danger)]")
  })
})
