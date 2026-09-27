import { beforeEach, describe, expect, it } from 'vitest';
import {
  LOCALES, formatDate, formatLength, formatMass, formatNumber, getLocale,
  resolveLocale, setLocale, setTone, systemText, t, type Locale,
} from '../index';
import { ptBR } from '../locales/pt-BR';
import { enUS } from '../locales/en-US';

beforeEach(() => { setLocale('pt-BR'); setTone('cold'); });

/** Caminha a árvore e devolve todas as chaves folha. */
function leaves(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>)
    .flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

describe('paridade entre idiomas', () => {
  it('en-US tem exatamente as mesmas chaves de pt-BR', () => {
    expect(leaves(enUS).sort()).toEqual(leaves(ptBR).sort());
  });

  it('nenhuma tradução está vazia', () => {
    for (const [name, res] of [['pt-BR', ptBR], ['en-US', enUS]] as const) {
      for (const key of leaves(res)) {
        const value = key.split('.').reduce<unknown>(
          (a, p) => (a as Record<string, unknown>)[p], res);
        expect(String(value).trim().length, `${name}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  /** R14.6/R14.7 — as duas variantes de tom existem nos dois idiomas. */
  it('toda mensagem do Sistema tem tom frio e Modo Companheiro, nos dois idiomas', () => {
    for (const key of Object.keys(ptBR.system) as (keyof typeof ptBR.system)[]) {
      for (const [name, res] of [['pt-BR', ptBR], ['en-US', enUS]] as const) {
        expect(res.system[key].cold.length, `${name}:${key}.cold`).toBeGreaterThan(3);
        expect(res.system[key].companion.length, `${name}:${key}.companion`).toBeGreaterThan(3);
      }
    }
  });

  it('os dois tons são de fato diferentes — não copiados', () => {
    for (const key of Object.keys(ptBR.system) as (keyof typeof ptBR.system)[]) {
      expect(ptBR.system[key].cold, key).not.toBe(ptBR.system[key].companion);
      expect(enUS.system[key].cold, key).not.toBe(enUS.system[key].companion);
    }
  });

  it('o tom frio fala como interface e o companheiro não', () => {
    // O tom frio do Sistema usa colchetes; o Modo Companheiro, nunca.
    const bracketed = Object.values(ptBR.system).filter((m) => m.cold.startsWith('['));
    expect(bracketed.length).toBeGreaterThan(10);
    for (const m of Object.values(ptBR.system)) {
      expect(m.companion.startsWith('[')).toBe(false);
    }
  });
});

describe('tradução', () => {
  it('resolve chave aninhada', () => {
    expect(t('tabs.status')).toBe('Status');
    expect(t('common.continue')).toBe('Continuar');
  });

  it('troca de idioma', () => {
    setLocale('en-US');
    expect(t('common.continue')).toBe('Continue');
    expect(getLocale()).toBe('en-US');
  });

  it('interpola parâmetros', () => {
    expect(t('common.step', { current: 3, total: 7 })).toBe('Passo 3 de 7');
  });

  it('deixa o placeholder intacto quando falta o parâmetro', () => {
    expect(t('common.step', { current: 3 })).toContain('{{total}}');
  });

  it('aceita idioma explícito sem mexer no ativo', () => {
    expect(t('common.continue', undefined, 'en-US')).toBe('Continue');
    expect(getLocale()).toBe('pt-BR');
  });
});

describe('tom do Sistema', () => {
  it('o padrão é frio', () => {
    expect(systemText('questAvailable')).toBe('[Missão Diária disponível.]');
  });

  it('o Modo Companheiro muda a mensagem', () => {
    setTone('companion');
    expect(systemText('questAvailable')).not.toContain('[');
  });

  it('o tom acompanha o idioma', () => {
    setLocale('en-US');
    expect(systemText('questCompleted')).toContain('Quest complete');
    setTone('companion');
    expect(systemText('questCompleted')).toContain('good work');
  });

  /** A mensagem mais importante do app não pode soar punitiva em tom nenhum. */
  it('nenhuma mensagem de falha usa linguagem de vergonha', () => {
    const shameful = /vergonh|preguiç|fracass|desist|culpa|lazy|shame|failure|quitter/i;
    for (const res of [ptBR, enUS]) {
      for (const [key, m] of Object.entries(res.system)) {
        expect(m.cold, key).not.toMatch(shameful);
        expect(m.companion, key).not.toMatch(shameful);
      }
    }
  });
});

describe('detecção de idioma', () => {
  it.each([
    [['pt-BR'], 'pt-BR'], [['pt-PT'], 'pt-BR'], [['en-GB'], 'en-US'],
    [['es-ES', 'en-US'], 'en-US'], [['ja-JP'], 'pt-BR'], [[], 'pt-BR'],
  ] as [string[], Locale][])('%s resolve para %s', (tags, expected) => {
    expect(resolveLocale(tags)).toBe(expected);
  });
});

describe('unidades independentes do idioma (R14.3)', () => {
  it('converte massa sem depender do locale', () => {
    expect(formatMass(89.1, 'kg', 'pt-BR')).toBe('89,1 kg');
    expect(formatMass(89.1, 'kg', 'en-US')).toBe('89.1 kg');
    expect(formatMass(100, 'lb', 'pt-BR')).toBe('220,5 lb');
  });

  it('converte altura para pés e polegadas', () => {
    expect(formatLength(178, 'cm', 'pt-BR')).toBe('178 cm');
    expect(formatLength(178, 'ft')).toBe(`5'10"`);
    expect(formatLength(183, 'ft')).toBe(`6'0"`);
  });

  it('não produz 12 polegadas ao arredondar', () => {
    for (let cm = 120; cm <= 250; cm++) {
      expect(formatLength(cm, 'ft'), `${cm}cm`).not.toMatch(/'12"/);
    }
  });

  it('um brasileiro pode ler em inglês e pesar em kg', () => {
    expect(formatMass(80, 'kg', 'en-US')).toBe('80.0 kg');
    expect(formatMass(80, 'lb', 'pt-BR')).toBe('176,4 lb');
  });
});

describe('formatação por locale (R14.4)', () => {
  it('usa vírgula decimal em pt-BR e ponto em en-US', () => {
    expect(formatNumber(1240.5, 'pt-BR', 1)).toBe('1.240,5');
    expect(formatNumber(1240.5, 'en-US', 1)).toBe('1,240.5');
  });

  it('formata data pelo locale', () => {
    expect(formatDate('2026-09-21', 'pt-BR')).toMatch(/set/i);
    expect(formatDate('2026-09-21', 'en-US')).toMatch(/sep/i);
  });
});

describe('cobertura de idiomas', () => {
  it('os dois idiomas do MVP estão registrados', () => {
    expect(LOCALES).toEqual(['pt-BR', 'en-US']);
  });
});
