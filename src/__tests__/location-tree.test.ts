import { buildLocationTree } from "@/lib/location-tree";
import type { Location } from "@/types/location";

function makeLoc(overrides: Partial<Location> & { id: string; name: string }): Location {
  return {
    location_type: "station",
    parent_id: null,
    coordinates: { x: 0, y: 0, z: 0 },
    has_trade_terminal: false,
    has_landing_pad: false,
    landing_pad_size: null,
    ...overrides,
  };
}

describe("buildLocationTree", () => {
  it("returns empty array for empty input", () => {
    expect(buildLocationTree([])).toEqual([]);
  });

  it("returns flat list as root nodes when no parent_id", () => {
    const locations = [
      makeLoc({ id: "1", name: "Stanton", location_type: "system" }),
      makeLoc({ id: "2", name: "Pyro", location_type: "system" }),
    ];

    const tree = buildLocationTree(locations);
    expect(tree).toHaveLength(2);
    expect(tree[0].location.name).toBe("Pyro");
    expect(tree[1].location.name).toBe("Stanton");
    expect(tree[0].children).toEqual([]);
    expect(tree[1].children).toEqual([]);
  });

  it("builds parent-child hierarchy", () => {
    const locations = [
      makeLoc({ id: "sys-1", name: "Stanton", location_type: "system" }),
      makeLoc({ id: "p-1", name: "Crusader", location_type: "planet", parent_id: "sys-1" }),
      makeLoc({ id: "s-1", name: "Port Olisar", location_type: "station", parent_id: "p-1" }),
    ];

    const tree = buildLocationTree(locations);
    expect(tree).toHaveLength(1);
    expect(tree[0].location.name).toBe("Stanton");
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].location.name).toBe("Crusader");
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].location.name).toBe("Port Olisar");
  });

  it("treats locations with missing parent as root nodes", () => {
    const locations = [
      makeLoc({ id: "p-1", name: "Crusader", location_type: "planet", parent_id: "missing-system" }),
      makeLoc({ id: "s-1", name: "Port Olisar", location_type: "station", parent_id: "p-1" }),
    ];

    const tree = buildLocationTree(locations);
    expect(tree).toHaveLength(1);
    expect(tree[0].location.name).toBe("Crusader");
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].location.name).toBe("Port Olisar");
  });

  it("sorts children alphabetically by name", () => {
    const locations = [
      makeLoc({ id: "sys-1", name: "Stanton", location_type: "system" }),
      makeLoc({ id: "p-3", name: "microTech", location_type: "planet", parent_id: "sys-1" }),
      makeLoc({ id: "p-1", name: "ArcCorp", location_type: "planet", parent_id: "sys-1" }),
      makeLoc({ id: "p-2", name: "Crusader", location_type: "planet", parent_id: "sys-1" }),
    ];

    const tree = buildLocationTree(locations);
    expect(tree[0].children.map((c) => c.location.name)).toEqual([
      "ArcCorp",
      "Crusader",
      "microTech",
    ]);
  });

  it("handles multiple root systems with deep hierarchies", () => {
    const locations = [
      makeLoc({ id: "sys-1", name: "Stanton", location_type: "system" }),
      makeLoc({ id: "sys-2", name: "Pyro", location_type: "system" }),
      makeLoc({ id: "p-1", name: "Crusader", location_type: "planet", parent_id: "sys-1" }),
      makeLoc({ id: "m-1", name: "Yela", location_type: "moon", parent_id: "p-1" }),
      makeLoc({ id: "p-2", name: "Pyro I", location_type: "planet", parent_id: "sys-2" }),
    ];

    const tree = buildLocationTree(locations);
    expect(tree).toHaveLength(2);
    expect(tree[0].location.name).toBe("Pyro");
    expect(tree[0].children).toHaveLength(1);
    expect(tree[1].location.name).toBe("Stanton");
    expect(tree[1].children[0].children[0].location.name).toBe("Yela");
  });
});
