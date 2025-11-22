# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Muwanx is a browser-based MuJoCo playground that enables real-time physics simulations with trained policy control. Built on MuJoCo WASM, ONNX runtime, and Three.js - runs entirely client-side with no server required. The project is both a demo application (deployed to GitHub Pages) and an npm package for building custom simulation apps.

## Build & Development Commands

### Development
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3000)
```

### Building
```bash
npm run build            # Build demo application (for GitHub Pages)
npm run build:lib        # Build npm package library (sets BUILD_MODE=lib)
npm run preview          # Preview production build
```

The build system uses Vite with two modes controlled by `BUILD_MODE` environment variable:
- Default: Builds demo application with examples as publicDir
- `lib`: Builds npm package with proper externals and TypeScript declarations

## Architecture

### Core Package Structure

```
src/
├── core/              # Core simulation engine (framework-agnostic)
│   ├── engine/        # MujocoRuntime - main simulation runtime
│   ├── action/        # Action managers (Isaac, Passive)
│   ├── observation/   # Observation managers for policy inputs
│   ├── agent/         # ONNX inference helpers
│   └── scene/         # Three.js scene setup, lighting, materials
├── viewer/            # Vue-based viewer components & API
│   ├── components/    # Vuetify UI components
│   ├── composables/   # Vue composables for runtime control
│   └── MwxViewer.ts   # Main API class (imperative & declarative)
├── types/             # TypeScript type definitions
└── index.ts           # Package entry point
```

### Key Classes

**MujocoRuntime** (`src/core/engine/MujocoRuntime.ts`):
- Core simulation loop orchestrator
- Manages MuJoCo physics engine, Three.js rendering, and ONNX inference
- Handles simulation state, scene loading, policy execution
- Framework-agnostic, can be used independently of Vue components

**MwxViewer** (`src/viewer/MwxViewer.ts`):
- High-level API for building applications
- Supports two patterns:
  - Declarative: Load from JSON config via `loadConfig()`
  - Imperative: Build programmatically with `addProject()`, `addScene()`, `addPolicy()`
- Event system for state changes
- Wraps MujocoRuntime with project/scene/policy management

**Manager Classes**:
- **ActionManagers**: Convert policy outputs to actuator commands (IsaacActionManager, PassiveActionManager)
- **ObservationManagers**: Collect and process sensor data for policy inputs
- **CommandManager**: Handle velocity/impedance commands from UI or API
- **EnvManager**: Environment-specific logic (resets, rewards, termination)

### Build System Details

The Vite config (`vite.config.mjs`) handles two build targets:
- **Demo mode**: Bundles everything including examples for GitHub Pages deployment
- **Library mode**: Exports clean npm package with externalized dependencies (vue, three, mujoco-js, onnxruntime-web)

TypeScript declarations are generated via `vite-plugin-dts` in library mode only.

### Package Exports

The package provides multiple export paths (see `package.json`):
- `.` - Main API (MwxViewer class and types)
- `./viewer` - Vue component (MwxViewer.vue)
- `./api` - Direct API access (MwxViewer.ts)
- `./types` - Type definitions only

### Three.js Scene Management

MujocoRuntime creates and manages:
- Three.js Scene with meshes synced to MuJoCo bodies
- OrbitControls for camera manipulation
- VR support via WebXR
- Dynamic lighting from MuJoCo light definitions
- Tendon visualization with custom geometry

### Policy Execution Flow

1. ObservationManagers collect sensor data from MjData
2. Data formatted and passed to ONNX policy
3. Policy outputs processed by ActionManager
4. Actions applied to MuJoCo actuators
5. MuJoCo steps forward (with decimation)
6. Three.js meshes updated to match MuJoCo state

## Important Implementation Notes

- MuJoCo WASM uses Emscripten filesystem - mount MEMFS at `/working` for runtime files
- The simulation uses decimation: multiple physics steps per policy inference
- Action managers handle different actuator types (position, torque, impedance control)
- Asset metadata (`asset_meta.json`) defines actuator config, initial state, observation config
- Vue components are optional - core engine can be used standalone for custom UIs
