import { describe, it, expect } from 'vitest';
import { buildIndex, buildEdges, buildAdjacency, pathFromRoot, clusterMembers } from './structure.js';
import { allEntities } from '../../content/site.js';

const byId = buildIndex(allEntities);
const edges = buildEdges(allEntities);
const adj = buildAdjacency(edges);

describe('structure — edge list (Gate G1)', () => {
  it('29 tree edges + 2 authored cross-edges = 31', () => {
    expect(edges).toHaveLength(31);
  });

  it('tree edges first (draw-in order), cross-edges last', () => {
    const tree = edges.slice(0, 29);
    for (const [parent, child] of tree) {
      expect(byId.get(child).graph.parent).toBe(parent);
    }
    expect(edges.slice(29)).toEqual([['operator', 'mac-agent'], ['permit', 'license']]);
  });

  it('every edge endpoint resolves; drawn parent→child', () => {
    for (const [a, b] of edges) {
      expect(byId.has(a), a).toBe(true);
      expect(byId.has(b), b).toBe(true);
    }
    expect(edges).toContainEqual(['oliver', 'agents']);
    expect(edges).toContainEqual(['agents', 'operator']);
    expect(edges).toContainEqual(['operator', 'day-4']);
    expect(edges).toContainEqual(['mac-agent', 'mcp-tools']);
  });
});

describe('structure — adjacency', () => {
  it('symmetric', () => {
    for (const [id, nbs] of adj) {
      for (const nb of nbs) expect(adj.get(nb).has(id), `${id}↔${nb}`).toBe(true);
    }
  });

  it('covers all 30 nodes (graph is connected through the root tree)', () => {
    expect(adj.size).toBe(30);
    expect(adj.get('oliver').size).toBe(5); // the five group clusters
  });
});

describe('structure — pathFromRoot (pulse routing chains)', () => {
  it('root chain is itself', () => {
    expect(pathFromRoot(byId, 'oliver')).toEqual(['oliver']);
  });
  it('day node routes root → agents → operator → day', () => {
    expect(pathFromRoot(byId, 'day-4')).toEqual(['oliver', 'agents', 'operator', 'day-4']);
  });
  it('leaf-under-leaf routes through its project', () => {
    expect(pathFromRoot(byId, 'mcp-tools')).toEqual(['oliver', 'agents', 'mac-agent', 'mcp-tools']);
  });
  it('unknown id yields empty chain', () => {
    expect(pathFromRoot(byId, 'nope')).toEqual([]);
  });
});

describe('structure — clusterMembers (legend fly-to)', () => {
  it('agents cluster = group + projects + toolbelt + 7 days', () => {
    const ids = clusterMembers(allEntities, byId, 'agents').map((e) => e.id);
    expect(ids).toContain('agents');
    expect(ids).toContain('operator');
    expect(ids).toContain('mcp-tools');
    expect(ids).toContain('day-7');
    expect(ids).toHaveLength(13); // agents + 5 projects + 7 days
    expect(ids).not.toContain('oliver');
    expect(ids).not.toContain('techx');
  });
  it('contact cluster = group + 4 channels', () => {
    const ids = clusterMembers(allEntities, byId, 'contact').map((e) => e.id);
    expect(ids.sort()).toEqual(['contact', 'email', 'github', 'linkedin', 'resume']);
  });
});
