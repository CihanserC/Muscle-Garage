import { describe, expect, it } from 'vitest';
import { createDefaultBuild } from '../build/build';
import { getCar } from '../../data/cars';
import { exportBuildJson, importBuildJson } from './garageService';
import { decodeShareCode, encodeShareCode, looksLikeShareCode, SHARE_PREFIX } from './shareCode';

const car = getCar('vanta_stallion_70');

describe('paylaşım kodu', () => {
  it('JSON → kod → JSON gidiş dönüş aynı build', async () => {
    const build = createDefaultBuild(car.manifest);
    const json = exportBuildJson(build);
    const code = await encodeShareCode(json);
    expect(code.startsWith(SHARE_PREFIX)).toBe(true);
    expect(code).not.toMatch(/[^A-Za-z0-9_:-]/);
    const back = await decodeShareCode(code);
    expect(back).not.toBeNull();
    const imported = importBuildJson(back as string, car.manifest);
    expect(imported.carId).toBe(build.carId);
    expect(imported.parts).toEqual(build.parts);
  });

  it('kod, girintili JSON’dan belirgin kısa', async () => {
    const json = exportBuildJson(createDefaultBuild(car.manifest));
    const code = await encodeShareCode(json);
    expect(code.length).toBeLessThan(json.length * 0.7);
  });

  it('boşluk/satır sonu içeren yapıştırmayı kabul eder', async () => {
    const code = await encodeShareCode(exportBuildJson(createDefaultBuild(car.manifest)));
    const wrapped = `  ${code.slice(0, 20)}\n${code.slice(20)}  `;
    expect(await decodeShareCode(wrapped)).not.toBeNull();
  });

  it('kod olmayan ya da bozuk metin için null', async () => {
    expect(await decodeShareCode('{"a":1}')).toBeNull();
    expect(await decodeShareCode(`${SHARE_PREFIX}!!!bozuk!!!`)).toBeNull();
    expect(looksLikeShareCode('  MG1:abc')).toBe(true);
    expect(looksLikeShareCode('{}')).toBe(false);
  });
});
