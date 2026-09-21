import { describe, expect, it } from 'vitest';
import { mergeCollections, mergeDocument, type Versioned } from '../merge';

interface Doc extends Versioned { key: string; value: string }
const doc = (key: string, value: string, updatedAt: string, updatedByDevice: string): Doc =>
  ({ key, value, updatedAt, updatedByDevice });

describe('mergeDocument — LWW (B2.6)', () => {
  it('a escrita mais recente vence', () => {
    const older = doc('p', 'antigo', '2026-09-01T10:00:00Z', 'a');
    const newer = doc('p', 'novo', '2026-09-01T11:00:00Z', 'b');
    expect(mergeDocument(older, newer).value).toBe('novo');
    expect(mergeDocument(newer, older).value).toBe('novo');
  });

  /**
   * B2.7 — sem desempate determinístico, cada aparelho manteria a própria
   * escrita e os dois divergiriam para sempre, sem nunca detectar conflito.
   */
  it('empate no instante desempata pelo aparelho, e os dois lados escolhem o mesmo', () => {
    const at = '2026-09-01T10:00:00Z';
    const a = doc('p', 'do A', at, 'device-a');
    const b = doc('p', 'do B', at, 'device-b');
    expect(mergeDocument(a, b)).toEqual(mergeDocument(b, a));
    expect(mergeDocument(a, b).value).toBe('do B');
  });

  it('é comutativo para qualquer par', () => {
    const times = ['2026-09-01T10:00:00Z', '2026-09-01T11:00:00Z'];
    const devices = ['a', 'b'];
    for (const t1 of times) for (const t2 of times)
      for (const d1 of devices) for (const d2 of devices) {
        const x = doc('p', `${t1}/${d1}`, t1, d1);
        const y = doc('p', `${t2}/${d2}`, t2, d2);
        expect(mergeDocument(x, y)).toEqual(mergeDocument(y, x));
      }
  });

  it('é idempotente', () => {
    const d = doc('p', 'v', '2026-09-01T10:00:00Z', 'a');
    expect(mergeDocument(d, d)).toEqual(d);
  });
});

describe('mergeCollections', () => {
  const key = (d: Doc) => d.key;

  it('une chaves distintas dos dois lados', () => {
    const local = [doc('a', '1', '2026-09-01T10:00:00Z', 'x')];
    const remote = [doc('b', '2', '2026-09-01T10:00:00Z', 'y')];
    expect(mergeCollections(local, remote, key).map((d) => d.key)).toEqual(['a', 'b']);
  });

  it('resolve colisão por LWW', () => {
    const local = [doc('a', 'local', '2026-09-01T10:00:00Z', 'x')];
    const remote = [doc('a', 'remoto', '2026-09-02T10:00:00Z', 'y')];
    expect(mergeCollections(local, remote, key)[0].value).toBe('remoto');
  });

  it('converge independentemente de qual lado é local', () => {
    const a = [doc('a', 'A1', '2026-09-01T10:00:00Z', 'x'), doc('b', 'B1', '2026-09-03T10:00:00Z', 'x')];
    const b = [doc('a', 'A2', '2026-09-02T10:00:00Z', 'y'), doc('c', 'C1', '2026-09-01T10:00:00Z', 'y')];
    expect(mergeCollections(a, b, key)).toEqual(mergeCollections(b, a, key));
  });
});
