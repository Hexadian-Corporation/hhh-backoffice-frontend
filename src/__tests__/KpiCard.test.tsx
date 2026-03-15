import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import KpiCard from "@/components/dashboard/KpiCard";
import { FileText } from "lucide-react";

const mockedNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockedNavigate };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("KpiCard", () => {
  it("renders title and count", () => {
    render(
      <MemoryRouter>
        <KpiCard title="Contracts" count={42} icon={<FileText />} href="/contracts" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Contracts")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <MemoryRouter>
        <KpiCard title="Contracts" count={null} icon={<FileText />} href="/contracts" loading />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <MemoryRouter>
        <KpiCard title="Contracts" count={null} icon={<FileText />} href="/contracts" error="Failed to load" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
  });

  it("shows breakdown badges", () => {
    const breakdown = [
      { label: "draft", count: 3 },
      { label: "active", count: 5 },
    ];

    render(
      <MemoryRouter>
        <KpiCard title="Contracts" count={8} icon={<FileText />} href="/contracts" breakdown={breakdown} />
      </MemoryRouter>,
    );

    expect(screen.getByText("draft: 3")).toBeInTheDocument();
    expect(screen.getByText("active: 5")).toBeInTheDocument();
  });

  it("navigates on click", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <KpiCard title="Contracts" count={10} icon={<FileText />} href="/contracts" />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button"));
    expect(mockedNavigate).toHaveBeenCalledWith("/contracts");
  });
});
