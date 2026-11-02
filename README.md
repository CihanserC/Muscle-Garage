<div align="center">

# 🏁 Muscle Garage

**A browser-based 3D car customization garage and test-drive game.**
Pick a car, tune every part, then take it out on the track, on desktop or phone.

**[▶ Play online](https://cihanserc.github.io/Muscle-Garage/)**

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r186-000000?logo=threedotjs&logoColor=white)
![R3F](https://img.shields.io/badge/React%20Three%20Fiber-9-f7df1e)
![Rapier](https://img.shields.io/badge/Physics-Rapier-e8590c)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-494%20passing-2ea44f)
![License](https://img.shields.io/badge/license-MIT-blue)
![Mobile](https://img.shields.io/badge/mobile-touch%20%2B%20tilt-orange)

[Features](#-features) · [Getting started](#-getting-started) · [Controls](#-controls) · [Architecture](#-architecture) · [Roadmap](#-roadmap) · [Contributing](#-contributing) · [Credits](#-license--credits)

</div>

---

## ✨ Features

### 🚗 Garage flow

```
 Car select  ──▶  Garage (customize)  ──▶  Test drive
   showcase         parts · paint ·           physics · track ·
   camera           wheels · vinyl            HUD · sound
```

| | |
|---|---|
| **Three cars** | **Vanta Stallion '70** (original procedural muscle car with a detailed cabin), a **2013 Ford Mustang GT** and a **2001 BMW M3 GTR**, both from ready-made GLB models |
| **Body parts** | Hood, bumpers, spoiler, side skirts and more, with live previews |
| **Paint** | Per-zone colors with metallic, matte and pearl finishes |
| **Wheels & brakes** | Rim, tire and brake options with a fitment checker (clearance, offset, arch) |
| **Vinyl editor** | Place, scale and rotate decals on the body |
| **Stance** | Ride height, camber and track width |
| **Lighting & glass** | Headlight and taillight styles, window tint |
| **Performance** | Engine, suspension and drivetrain parts that change how the car drives |
| **Garage saves** | Save slots, per-car autosave, undo / redo (IndexedDB) |
| **Sharing** | Export / import builds as JSON, a short `MG1:` share code, or a PNG photo with the build embedded |
| **Photo mode** | Free camera, adjustable FOV, effects and image export |

### 🏎️ Test drive

- Rapier-based vehicle physics with a derived spec from your build (mass, grip, power, gearing)
- Drift on handbrake, plus optional steering assist, traction control and ABS
- Lap timer, split deltas against your best lap, a ghost car of your best lap (toggleable), minimap and engine / tire audio
- Day / night with working headlights and taillights; chase, hood and cockpit cameras
- Keyboard, gamepad (with rumble) and **touch** controls; optional tilt steering on phones
- Adaptive graphics quality (Low / Medium / High) that steps down automatically when FPS drops
- Settings for language (EN / TR), HUD size, control scheme, assists and more

### 📱 Mobile

The UI scales to phone screens, the garage panel collapses, and the drive screen shows on-screen steering, gas, brake / drift, handbrake and nitro buttons. Auto quality starts lower on touch devices. Settings → Controls can force the touch layout if it is not detected.

---

## 🚀 Getting started

Requires **Node.js 20+**.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm test` | Run unit and physics tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## 🎮 Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Throttle / Brake | `W` / `S` | `RT` / `LT` |
| Steer | `A` / `D` | Left stick |
| Handbrake / drift | `Space` | `A` or `X` |
| Nitro | `Shift` | `RB` |
| Change camera (chase / hood / cockpit) | `C` | `Y` |
| Reset onto track | `R` | `B` |
| Pause | `Esc` | `Start` |
| Mute / volume | `M` | |

In the garage, drag to orbit, scroll to zoom, and use the arrow keys and `Enter` (or the D-pad and `A`) to navigate menus.

---

## 🧱 Architecture

```mermaid
flowchart LR
    subgraph Data["data/cars"]
        M[manifest.json]
        P[parts catalog]
        MM[modelMap.json]
    end
    subgraph Core["core (framework-free logic)"]
        B[Build state + migrations]
        F[Fitment]
        S[Vehicle spec]
        G[Garage storage]
    end
    subgraph View["React + R3F"]
        C[car: procedural / GLB]
        GA[garage: camera + UI]
        D[drive: Rapier + HUD]
    end
    Data --> Core
    Core --> View
    B --> S --> D
    MM -. adapts .-> C
```

```
src/
  app/            App shell, modes (select / garage / drive), quality
  core/           Build model, stores, fitment, drive core, model mapping
  data/cars/      Per-car data: manifest, body profile, parts, modelMap
  car/            Car scene: procedural and GLB models
  garage/         Garage scene, camera, UI
  drive/          Drive mode: Rapier physics, track, HUD, audio
  i18n/           UI strings
docs/             Plan, analysis, progress log, asset guide
```

Cars are **data-driven**: a manifest describes slots, wheel positions, paint zones, camera presets and fitment. Ready-made models that do not follow the naming rules are adapted at load time with a `modelMap.json` (scale, hidden nodes, paint zones, shared materials), so new cars need no Blender work. See [`docs/ASSET_GUIDE.md`](docs/ASSET_GUIDE.md).

---

## 🗺️ Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 – 11 | Garage, parts, paint, wheels, vinyl, stance, photo mode, drive mode, polish | ✅ Done |
| V2-1 | Multi-car architecture, car select screen, settings dialog | ✅ Done |
| V2-2 | 2013 Ford Mustang GT as the second car | ✅ Done |
| V2-3 | HUD and driving mechanics (drift, ABS / TC, assists, split deltas) | ✅ Done |
| V2-4 | Mobile support (touch controls, scaled UI, tilt steering) | ✅ Done, needs more real-device testing |
| V2-5 | Detailed Vanta interior and cockpit camera | ✅ Done (Mustang / BMW interiors open) |
| V2-6 | Polish, performance pass, final report | 🚧 Ongoing |
| Next | Career / economy, more tracks and weather, rivals, damage model, PWA | 💡 Ideas, see [open issues](https://github.com/CihanserC/Muscle-Garage/issues) |

Details: [`docs/PLAN_V2.md`](docs/PLAN_V2.md) · [`docs/ANALYSIS.md`](docs/ANALYSIS.md) · [`docs/PROGRESS.md`](docs/PROGRESS.md)

---

## 🤝 Contributing

Contributions are welcome! Start with issues labelled [`good first issue`](https://github.com/CihanserC/Muscle-Garage/labels/good%20first%20issue) or [`help wanted`](https://github.com/CihanserC/Muscle-Garage/labels/help%20wanted), and read [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## 📄 License & credits

The source code and procedural assets are released under the [MIT License](LICENSE). Third-party assets keep their own licenses, listed below.

The **2013 Ford Mustang GT** model (by Ddiaz Design) is licensed under **CC-BY-NC-SA 4.0**: non-commercial use only, share-alike. The full list of third-party assets is in [`public/assets/CREDITS.json`](public/assets/CREDITS.json) and in the in-game Credits screen. Ford and Mustang are trademarks of their respective owners; this project is not affiliated with them.
