import { useEffect, useRef, useState } from "react";

export interface AutocompleteOption {
  id: string;
  label: string;
}

interface AutocompleteProps {
  id: string;
  value: string;
  displayValue?: string;
  placeholder?: string;
  search: (query: string) => Promise<AutocompleteOption[]>;
  onSelect: (id: string, label: string) => void;
  onClear: () => void;
}

export default function Autocomplete({
  id,
  value,
  displayValue,
  placeholder = "Search…",
  search,
  onSelect,
  onClear,
}: AutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AutocompleteOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      search(query)
        .then((items) => {
          if (!cancelled) {
            setResults(items);
            setShowDropdown(true);
          }
        })
        .catch(() => {
          // ignore search errors
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, search]);

  function handleQueryChange(newQuery: string) {
    setQuery(newQuery);
    if (!newQuery.trim()) {
      setResults([]);
      setShowDropdown(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(option: AutocompleteOption) {
    onSelect(option.id, option.label);
    setQuery("");
    setShowDropdown(false);
    setResults([]);
  }

  function handleClear() {
    onClear();
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  }

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{displayValue || value}</span>
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear selection"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-1"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
      />
      {showDropdown && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-lg max-h-48 overflow-y-auto"
        >
          {results.map((option) => (
            <li
              key={option.id}
              role="option"
              aria-selected={false}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-accent)]/10"
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
