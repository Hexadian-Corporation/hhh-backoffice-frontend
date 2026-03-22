import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, ChevronDown, Trash2 } from "lucide-react";
import type { Location } from "@/types/location";
import type { LocationTreeNode } from "@/lib/location-tree";
import { Button } from "@/components/ui/button";

interface LocationTreeViewProps {
  tree: LocationTreeNode[];
  canWrite: boolean;
  onDelete: (location: Location) => void;
}

interface TreeNodeProps {
  node: LocationTreeNode;
  depth: number;
  canWrite: boolean;
  onDelete: (location: Location) => void;
}

const TYPE_LABELS: Record<string, string> = {
  system: "System",
  planet: "Planet",
  moon: "Moon",
  station: "Station",
  city: "City",
  outpost: "Outpost",
};

function TreeNode({ node, depth, canWrite, onDelete }: TreeNodeProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(depth < 1);
  const loc = node.location;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[var(--color-surface-alt)] cursor-pointer group"
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        onClick={() => navigate(`/locations/${loc.id}`)}
        data-testid={`tree-node-${loc.id}`}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? `Collapse ${loc.name}` : `Expand ${loc.name}`}
            className="p-0.5 rounded hover:bg-[var(--color-border)] text-[var(--color-text-muted)]"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Location name */}
        <span className="font-medium text-sm">{loc.name}</span>

        {/* Type badge */}
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
          {TYPE_LABELS[loc.location_type] ?? loc.location_type}
        </span>

        {/* Trade terminal indicator */}
        {loc.has_trade_terminal && (
          <span className="text-xs text-[var(--color-success)]">Terminal</span>
        )}

        {/* Landing pad indicator */}
        {loc.has_landing_pad && (
          <span className="text-xs text-[var(--color-accent)]">
            Pad{loc.landing_pad_size ? ` (${loc.landing_pad_size})` : ""}
          </span>
        )}

        {/* Delete button */}
        {canWrite && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto opacity-0 group-hover:opacity-100 h-7 w-7"
            aria-label={`Delete ${loc.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(loc);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger)]" />
          </Button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.location.id}
              node={child}
              depth={depth + 1}
              canWrite={canWrite}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LocationTreeView({
  tree,
  canWrite,
  onDelete,
}: LocationTreeViewProps) {
  if (tree.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-[var(--color-text-muted)]">
        No locations found.
      </p>
    );
  }

  return (
    <div className="rounded-md border border-[var(--color-border)] py-1">
      {tree.map((node) => (
        <TreeNode
          key={node.location.id}
          node={node}
          depth={0}
          canWrite={canWrite}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
