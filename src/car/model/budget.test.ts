import { appendFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Mesh } from 'three';
import { prepareModel } from '../../core/model/prepareModel';
import { getCar, listCars } from '../../data/cars';
import { loadGlbScene, sharedTestMaterials } from './glbTestUtils';

/**
 * Gerçek modelli araçların üçgen / mesh / materyal bütçesi: gerileme koruması. Ölçülen (2026-11-02):
 * Mustang 67,6 bin üçgen / 141 mesh; BMW 190 bin üçgen / 40 mesh (en ağır; mobil için sadeleştirme adayı).
 */
const BUDGET = { triangles: 200_000, meshes: 400, materials: 40 };

describe('model bütçesi', () => {
  for (const car of listCars().filter((c) => c.manifest.model)) {
    it(`${car.manifest.id}: üçgen, mesh ve materyal sayısı bütçede`, async () => {
      const file = (car.manifest.model as string).split('/').pop() as string;
      const url = new URL(`../../../public/assets/cars/${file}`, import.meta.url);
      const { root } = await prepareModel(
        await loadGlbScene(url),
        car.manifest,
        sharedTestMaterials,
        car.modelMap,
      );
      let triangles = 0;
      let meshes = 0;
      const materials = new Set<string>();
      root.traverse((o) => {
        if (!('isMesh' in o) || !(o as Mesh).isMesh) return;
        const m = o as Mesh;
        meshes++;
        const g = m.geometry;
        triangles += (g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3;
        for (const mat of [m.material].flat()) materials.add(mat.name);
      });
      if (process.env.BUDGET_OUT)
        appendFileSync(
          process.env.BUDGET_OUT,
          `${car.manifest.id}: ${Math.round(triangles)} tri, ${meshes} mesh, ${materials.size} mat\n`,
        );
      expect(triangles).toBeLessThan(BUDGET.triangles);
      expect(meshes).toBeLessThan(BUDGET.meshes);
      expect(materials.size).toBeLessThan(BUDGET.materials);
    });
  }
});
