/**
 * src/graph/lib/structure.js — graph structure derived from the content model.
 *
 * Edge list, adjacency, and root→node chains, all computed from entities'
 * `graph.parent` / `graph.edges`. Used by the SVG underlay (draw order),
 * hover 1-hop highlight, and pulse routing. Pure: no DOM.
 */

/** id → entity map. */
export function buildIndex(ents) {
  return new Map(ents.map((e) => [e.id, e]));
}

/**
 * Drawn edges as [from, to] pairs, parent→child direction.
 * Order matters (draw-in stagger): all tree edges in entity order first,
 * then authored extra edges in entity order — same as the prototype.
 */
export function buildEdges(ents) {
  const edges = [];
  for (const e of ents) {
    if (e.graph && e.graph.parent) edges.push([e.graph.parent, e.id]);
  }
  for (const e of ents) {
    for (const other of (e.graph && e.graph.edges) || []) edges.push([e.id, other]);
  }
  return edges;
}

/** Undirected adjacency: id → Set of neighbor ids. */
export function buildAdjacency(edges) {
  const adj = new Map();
  const add = (a, b) => {
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a).add(b);
  };
  for (const [a, b] of edges) {
    add(a, b);
    add(b, a);
  }
  return adj;
}

/**
 * Ancestor chain root→…→id via graph.parent (pulse routing path).
 * @param {Map} byId from buildIndex
 * @returns {string[]} e.g. ['oliver', 'agents', 'operator', 'day-4']
 */
export function pathFromRoot(byId, id) {
  const chain = [];
  let n = byId.get(id);
  let guard = 0;
  while (n) {
    if (++guard > 100) throw new Error(`structure: parent cycle at "${n.id}"`);
    chain.unshift(n.id);
    n = n.graph && n.graph.parent ? byId.get(n.graph.parent) : null;
  }
  return chain;
}

/** All member entities of a cluster: the group node + descendants (legend fly-to). */
export function clusterMembers(ents, byId, groupId) {
  return ents.filter((e) => {
    if (e.id === groupId) return true;
    let n = e;
    let guard = 0;
    while (n && n.graph && n.graph.parent && ++guard <= 100) {
      if (n.graph.parent === groupId) return true;
      n = byId.get(n.graph.parent);
    }
    return false;
  });
}
