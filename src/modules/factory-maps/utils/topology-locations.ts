// RCS's own topology export lists every map node as a row in `nodeArr`,
// with `nodeKeys` naming each column (x, y, type, content, name, ...). The
// node `type` says what the node physically is — only these three carry a
// location we track: Charger Area, Parking Area, and a rack (which could be
// either a Production or a Warehouse Location — the topology can't say, so
// the operator picks per rack when uploading the map).
export const TOPOLOGY_NODE_TYPE = {
  RACK: 1,
  CHARGER: 6,
  PARKING: 7,
} as const;

export interface TopologyLocation {
  code: string;
  name: string;
}

export interface TopologyLocations {
  chargers: TopologyLocation[];
  parkings: TopologyLocation[];
  racks: TopologyLocation[];
}

export function extractTopologyLocations(raw: unknown): TopologyLocations {
  const result: TopologyLocations = { chargers: [], parkings: [], racks: [] };
  if (!raw || typeof raw !== 'object') return result;

  const { nodeArr, nodeKeys } = raw as {
    nodeArr?: unknown;
    nodeKeys?: unknown;
  };
  if (!Array.isArray(nodeArr) || !Array.isArray(nodeKeys)) return result;

  const typeIndex = nodeKeys.indexOf('type');
  const contentIndex = nodeKeys.indexOf('content');
  const nameIndex = nodeKeys.indexOf('name');
  if (typeIndex < 0 || contentIndex < 0) return result;

  const buckets: Record<
    number,
    { list: TopologyLocation[]; seen: Set<string> }
  > = {
    [TOPOLOGY_NODE_TYPE.CHARGER]: { list: result.chargers, seen: new Set() },
    [TOPOLOGY_NODE_TYPE.PARKING]: { list: result.parkings, seen: new Set() },
    [TOPOLOGY_NODE_TYPE.RACK]: { list: result.racks, seen: new Set() },
  };

  for (const node of nodeArr) {
    if (!Array.isArray(node)) continue;
    const bucket = buckets[Number(node[typeIndex])];
    if (!bucket) continue;

    const code = String(node[contentIndex] ?? '').trim();
    if (!code || bucket.seen.has(code)) continue;
    bucket.seen.add(code);

    const name = nameIndex >= 0 ? String(node[nameIndex] ?? '').trim() : '';
    bucket.list.push({ code, name: name || code });
  }

  return result;
}
