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

  it("applies glow hover on default variant", () => {
    render(<Button>Save</Button>)
    const btn = screen.getByRole("button", { name: "Save" })
    expect(btn.className).toContain("hover:shadow-[0_0_12px_var(--color-glow)]")
    expect(btn.className).toContain("hover:bg-[var(--color-accent-hover)]")
  })

  it("applies danger glow on destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>)
    const btn = screen.getByRole("button", { name: "Delete" })
    expect(btn.className).toContain("hover:shadow-[0_0_12px_var(--color-danger-glow)]")
  })

  it("applies glow hover on outline variant", () => {
    render(<Button variant="outline">Cancel</Button>)
    const btn = screen.getByRole("button", { name: "Cancel" })
    expect(btn.className).toContain("hover:shadow-[0_0_12px_var(--color-glow)]")
  })

  it("applies glow hover on ghost variant", () => {
    render(<Button variant="ghost">Menu</Button>)
    const btn = screen.getByRole("button", { name: "Menu" })
    expect(btn.className).toContain("hover:shadow-[0_0_12px_var(--color-glow)]")
  })

  it("uses transition-all for smooth shadow animations", () => {
    render(<Button>Animate</Button>)
    const btn = screen.getByRole("button", { name: "Animate" })
    expect(btn.className).toContain("transition-all")
  })
})
