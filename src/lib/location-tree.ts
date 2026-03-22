import type { Location } from "@/types/location";

export interface LocationTreeNode {
  location: Location;
  children: LocationTreeNode[];
}

/**
 * Build a tree structure from a flat list of locations using parent_id.
 * Root nodes are those with parent_id === null or whose parent is not in the list.
 */
export function buildLocationTree(locations: Location[]): LocationTreeNode[] {
  const idSet = new Set(locations.map((l) => l.id));
  const childrenMap = new Map<string | null, Location[]>();

  for (const loc of locations) {
    // Treat as root if parent_id is null or parent is not in the list
    const key = loc.parent_id !== null && idSet.has(loc.parent_id) ? loc.parent_id : null;
    const siblings = childrenMap.get(key) ?? [];
    siblings.push(loc);
    childrenMap.set(key, siblings);
  }

  function buildNodes(parentId: string | null): LocationTreeNode[] {
    const children = childrenMap.get(parentId) ?? [];
    return children
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((loc) => ({
        location: loc,
        children: buildNodes(loc.id),
      }));
  }

  return buildNodes(null);
}
