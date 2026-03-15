import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Autocomplete from "@/components/ui/Autocomplete";
import type { AutocompleteOption } from "@/components/ui/Autocomplete";

const mockOptions: AutocompleteOption[] = [
  { id: "loc-1", label: "Port Olisar (station)" },
  { id: "loc-2", label: "Crusader (planet)" },
];

function renderAutocomplete(overrides: Partial<Parameters<typeof Autocomplete>[0]> = {}) {
  const props = {
    id: "test-autocomplete",
    value: "",
    placeholder: "Search location…",
    search: vi.fn(() => Promise.resolve(mockOptions)),
    onSelect: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };

  const result = render(<Autocomplete {...props} />);
  return { ...result, props };
}

describe("Autocomplete", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders search input when no value is selected", () => {
    renderAutocomplete();
    expect(
      screen.getByPlaceholderText("Search location…"),
    ).toBeInTheDocument();
  });

  it("shows selected display value with clear button when value is set", () => {
    renderAutocomplete({
      value: "loc-1",
      displayValue: "Port Olisar (station)",
    });

    expect(screen.getByText("Port Olisar (station)")).toBeInTheDocument();
    expect(screen.getByLabelText("Clear selection")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Search location…"),
    ).not.toBeInTheDocument();
  });

  it("shows raw value when displayValue is not provided", () => {
    renderAutocomplete({ value: "loc-1" });
    expect(screen.getByText("loc-1")).toBeInTheDocument();
  });

  it("triggers search after 300ms debounce", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { props } = renderAutocomplete();

    await user.type(screen.getByPlaceholderText("Search location…"), "Port");
    expect(props.search).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(300);

    expect(props.search).toHaveBeenCalledWith("Port");
  });

  it("shows dropdown results after search completes", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderAutocomplete();

    await user.type(screen.getByPlaceholderText("Search location…"), "Port");
    await vi.advanceTimersByTimeAsync(300);

    expect(
      await screen.findByRole("option", { name: /Port Olisar/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Crusader/ }),
    ).toBeInTheDocument();
  });

  it("calls onSelect when an option is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { props } = renderAutocomplete();

    await user.type(screen.getByPlaceholderText("Search location…"), "Port");
    await vi.advanceTimersByTimeAsync(300);

    const option = await screen.findByRole("option", { name: /Port Olisar/ });
    await user.click(option);

    expect(props.onSelect).toHaveBeenCalledWith(
      "loc-1",
      "Port Olisar (station)",
    );
  });

  it("calls onClear when clear button is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { props } = renderAutocomplete({
      value: "loc-1",
      displayValue: "Port Olisar (station)",
    });

    await user.click(screen.getByLabelText("Clear selection"));
    expect(props.onClear).toHaveBeenCalled();
  });

  it("does not search when query is empty or whitespace", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { props } = renderAutocomplete();

    const input = screen.getByPlaceholderText("Search location…");
    await user.type(input, "a");
    await user.clear(input);
    await vi.advanceTimersByTimeAsync(300);

    expect(props.search).not.toHaveBeenCalled();
  });

  it("clears results when query is cleared", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderAutocomplete();

    const input = screen.getByPlaceholderText("Search location…");
    await user.type(input, "Port");
    await vi.advanceTimersByTimeAsync(300);

    expect(
      await screen.findByRole("option", { name: /Port Olisar/ }),
    ).toBeInTheDocument();

    await user.clear(input);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes dropdown on outside click", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderAutocomplete();

    await user.type(screen.getByPlaceholderText("Search location…"), "Port");
    await vi.advanceTimersByTimeAsync(300);
    await screen.findByRole("option", { name: /Port Olisar/ });

    // Click outside
    await user.click(document.body);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("hides dropdown after selecting an option", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderAutocomplete();

    await user.type(screen.getByPlaceholderText("Search location…"), "Port");
    await vi.advanceTimersByTimeAsync(300);

    const option = await screen.findByRole("option", { name: /Port Olisar/ });
    await user.click(option);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("handles search errors gracefully", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderAutocomplete({
      search: vi.fn(() => Promise.reject(new Error("Network error"))),
    });

    await user.type(screen.getByPlaceholderText("Search location…"), "Port");
    await vi.advanceTimersByTimeAsync(300);

    // Should not show dropdown and should not throw
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
