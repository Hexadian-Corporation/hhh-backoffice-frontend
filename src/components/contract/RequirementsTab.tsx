import { useState } from "react";
import type { Requirements } from "@/types/contract";
import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";

interface RequirementsTabProps {
  requirements: Requirements;
  errors: Record<string, string>;
  onChange: (requirements: Requirements) => void;
}

export default function RequirementsTab({
  requirements,
  errors,
  onChange,
}: RequirementsTabProps) {
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !requirements.required_ship_tags.includes(tag)) {
      onChange({
        ...requirements,
        required_ship_tags: [...requirements.required_ship_tags, tag],
      });
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    onChange({
      ...requirements,
      required_ship_tags: requirements.required_ship_tags.filter(
        (t) => t !== tag,
      ),
    });
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

  return (
    <div className="space-y-4">
      {/* Min Reputation */}
      <div>
        <label
          htmlFor="min_reputation"
          className="block text-sm font-medium mb-1"
        >
          Min Reputation (0–5)
        </label>
        <div className="flex items-center gap-3">
          <input
            id="min_reputation"
            type="number"
            min={0}
            max={5}
            value={requirements.min_reputation}
            onChange={(e) =>
              onChange({
                ...requirements,
                min_reputation: Math.min(5, Math.max(0, Number(e.target.value))),
              })
            }
            className="w-20 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          <div className="flex gap-0.5" aria-label="Reputation stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= requirements.min_reputation
                    ? "fill-[var(--color-warning)] text-[var(--color-warning)]"
                    : "text-[var(--color-border)]"
                }`}
              />
            ))}
          </div>
        </div>
        {errors.min_reputation && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">
            {errors.min_reputation}
          </p>
        )}
      </div>

      {/* Required Ship Tags */}
      <div>
        <label
          htmlFor="ship_tag_input"
          className="block text-sm font-medium mb-1"
        >
          Required Ship Tags
        </label>
        <div className="flex gap-2">
          <input
            id="ship_tag_input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add a tag…"
            className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        {requirements.required_ship_tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {requirements.required_ship_tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--color-accent)]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="hover:text-[var(--color-danger)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Max Crew Size */}
      <div>
        <label
          htmlFor="max_crew_size"
          className="block text-sm font-medium mb-1"
        >
          Max Crew Size
        </label>
        <input
          id="max_crew_size"
          type="number"
          min={1}
          value={requirements.max_crew_size ?? ""}
          onChange={(e) =>
            onChange({
              ...requirements,
              max_crew_size:
                e.target.value === "" ? null : Number(e.target.value),
            })
          }
          placeholder="Optional"
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.max_crew_size && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">
            {errors.max_crew_size}
          </p>
        )}
      </div>
    </div>
  );
}
