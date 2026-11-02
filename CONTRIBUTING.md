# Contributing to Muscle Garage

Thanks for helping! This is a browser game (React + three.js + Rapier). You do not need to know 3D to contribute: many tasks are data, translations, docs or tests.

## Where to start

- Browse issues labelled [`good first issue`](../../labels/good%20first%20issue) (small, self-contained) or [`help wanted`](../../labels/help%20wanted) (bigger, maintainers would love a hand).
- Comment on the issue before you start so two people do not do the same work.
- Not sure? Open an issue or a discussion first; small questions are welcome.

## Run it locally

Requires **Node.js 20+**.

```bash
npm install
npm run dev        # http://localhost:5173
```

Before opening a pull request, all of these must pass:

```bash
npm run lint
npm test
npm run build
```

## Project layout

| Path | What lives there |
|---|---|
| `src/core/` | Pure logic (physics helpers, stores, input, storage). Testable without a browser. |
| `src/data/cars/` | Data-driven cars: manifest, `driving.json`, `modelMap.json`, `lights.ts`. |
| `src/drive/` | Test-drive mode (vehicle, HUD, audio, touch controls). |
| `src/garage/` | Garage / tuning UI. |
| `src/i18n/` | `en.ts` and `tr.ts` translations (a test checks that keys match). |
| `docs/` | Plan, progress log, analysis, asset guide ([`docs/ASSET_GUIDE.md`](docs/ASSET_GUIDE.md)). |

## Guidelines

- Keep logic in `src/core/` as pure functions and add a Vitest test next to it.
- Match the surrounding code style; run `npm run format` on files you touch.
- UI text goes through `src/i18n/` (add the key to both `en.ts` and `tr.ts`).
- Keep pull requests small and focused; describe what you changed and how you checked it.
- Mobile matters: if you touch the HUD or menus, check a narrow landscape window (e.g. 844x390) and a touch device if you have one.

## Assets and licensing

Only add models, textures or sounds you have the right to use, and record them in [`public/assets/CREDITS.json`](public/assets/CREDITS.json) with author, source and license. Do not copy assets from games or paid packs. Note that the Mustang model is CC-BY-NC-SA 4.0 (see the README).

## Reporting bugs

Use the bug report form. Include browser and device, the car, quality setting, and a screenshot if you can. The build stamp is shown at the bottom of Settings.
