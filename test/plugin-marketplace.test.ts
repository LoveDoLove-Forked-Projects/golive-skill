import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '..');
const readJson = (path: string): Record<string, unknown> => JSON.parse(readFileSync(join(root, path), 'utf8'));

type Marketplace = {
  name: string;
  metadata?: { version?: string };
  plugins: Array<{ name: string; source: string; skills: string[] }>;
};

describe('Claude Code plugin marketplace', () => {
  const marketplace = readJson('.claude-plugin/marketplace.json') as unknown as Marketplace;
  const pkg = readJson('package.json') as { name: string; version: string };

  it('keeps one version, taken from package.json', () => {
    expect(marketplace.metadata?.version).toBe(pkg.version);
  });

  it('avoids a reserved marketplace name', () => {
    expect(marketplace.name).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    expect(marketplace.name).not.toMatch(/official/);
  });

  it('lists this repository as exactly one plugin carrying the one skill', () => {
    expect(marketplace.plugins).toHaveLength(1);
    const plugin = marketplace.plugins[0];
    if (!plugin) throw new Error('marketplace lists no plugin');
    expect(plugin.name).toBe(pkg.name);
    expect(plugin.source).toBe('./');
    expect(plugin.skills).toEqual([`./skills/${pkg.name}`]);
  });

  it('points every listed skill at a SKILL.md of the same name', () => {
    for (const plugin of marketplace.plugins) {
      for (const dir of plugin.skills) {
        const skillFile = join(root, dir, 'SKILL.md');
        expect(existsSync(skillFile), skillFile).toBe(true);
        const frontmatter = readFileSync(skillFile, 'utf8').split('---')[1] ?? '';
        expect(frontmatter).toMatch(new RegExp(`^name:\\s*${plugin.name}$`, 'm'));
      }
    }
  });
});
