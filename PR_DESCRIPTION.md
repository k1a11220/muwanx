# Restructure Muwanx as NPM Package with Customizable API

## Summary

This PR transforms Muwanx into a fully-featured npm package with a flexible, customizable API. The package now supports both **imperative** (programmatic) and **declarative** (config-based) approaches for building interactive MuJoCo simulation applications, making it suitable for a wide range of use cases from simple demos to complex custom applications.

**Key improvements:**
- 📦 Complete npm package restructure with proper TypeScript types and multiple entry points
- 🎯 Dual API support: imperative (builder pattern) and declarative (config loading)
- 🏗️ Better package modularity separating viewer (application layer) from core (engine)
- 📚 Comprehensive documentation including usage guide and examples
- 🧹 Simplified demo application using imperative API with inline configurations
- ⚡ Optimized build configuration for both library and demo modes

## Changes

### 1. NPM Package Structure

**Enhanced package exports:**
```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/muwanx.es.js",
    "require": "./dist/muwanx.umd.js"
  },
  "./viewer": "./src/viewer/components/MwxViewer.vue",
  "./api": "./src/viewer/MwxViewer.ts",
  "./types": "./src/types/api.ts"
}
```

**Usage patterns:**
```typescript
// Main API classes (builder pattern)
import { MwxViewer, Project, Scene, Policy } from 'muwanx';

// Vue component for full UI
import MwxViewerComponent from 'muwanx/viewer';

// Direct API access
import { MwxViewer } from 'muwanx/api';

// Type definitions
import type { ViewerConfig, SceneConfig } from 'muwanx/types';
```

### 2. Dual API Approach

**Imperative API (Builder Pattern):**
```typescript
import { MwxViewer } from 'muwanx';

const viewer = new MwxViewer('#container');

// Build programmatically with fluent API
const project = viewer.addProject({
  project_name: "My Project",
  project_link: "https://github.com/user/project"
});

const scene = project.addScene({
  id: "scene1",
  name: "My Scene",
  model_xml: "./assets/scene.xml",
  camera: {
    pos: [2.0, 1.7, 1.7],
    target: [0, 0.2, 0]
  }
});

const policy = scene.addPolicy({
  id: "policy1",
  name: "My Policy",
  path: "./assets/policy.onnx"
});

await viewer.initialize();
viewer.play();
```

**Declarative API (Config-based):**
```typescript
import { MwxViewer } from 'muwanx';

const viewer = new MwxViewer('#container');
await viewer.loadConfig('./config.json');
await viewer.initialize();
```

### 3. Package Reorganization

**Improved modularity:**
- Moved `src/core/MwxViewer.ts` → `src/viewer/MwxViewer.ts` (high-level API)
- Moved `src/viewer/MwxViewer.vue` → `src/viewer/components/MwxViewer.vue` (Vue component)
- Separated high-level API (viewer) from low-level implementation (core engine)
- Updated all imports and exports to reflect new structure

**Directory structure:**
```
src/
├── core/               # Low-level engine implementation
│   ├── engine/        # MuJoCo runtime, managers
│   ├── scene/         # Scene rendering, textures
│   └── policy/        # Policy execution
├── viewer/            # High-level application layer
│   ├── components/    # Vue components
│   ├── composables/   # Vue composables
│   ├── utils/         # Utilities
│   ├── MwxViewer.ts   # Main API class (builder pattern)
│   └── index.ts       # Viewer module exports
├── types/             # TypeScript type definitions
└── index.ts           # Main package entry point
```

### 4. Demo Application Simplification

**Updated `examples/main.ts`:**
- Uses imperative API instead of declarative approach
- Inline camera configurations for all scenes (removed external JSON files)
- Single-file implementation (~315 lines) for clarity
- Demonstrates builder pattern usage

**Removed files:**
- `examples/assets/config_myosuite.json` (replaced with programmatic config)
- `examples/assets/policy/myosuite/asset_meta_*.json` (10 files, camera configs now inline)
- `examples/App.vue` (simplified to single TS file)
- `examples/router.ts` (routing handled in main.ts)

**Example from new main.ts:**
```typescript
function buildMyoSuiteConfig() {
  return {
    project_name: "MyoSuite",
    project_link: "https://github.com/MyoHub/myosuite",
    tasks: [
      {
        id: "1",
        name: "Hand",
        model_xml: "./assets/scene/myosuite/myosuite/simhive/myo_sim/hand/myohand.xml",
        camera: {
          pos: [0.4, 1.6, 1.4],
          target: [-0.1, 1.4, 0.4]
        },
        default_policy: null,
        policies: []
      },
      // ... more scenes
    ]
  }
}
```

### 5. Configuration Cleanup

**Removed unnecessary files:**
- `jsconfig.json` - Redundant with `tsconfig.json`
- `.browserslistrc` - Not used (Vite handles browser targeting)

**Kept essential files:**
- `tsconfig.json` - Complete TypeScript configuration
- `.editorconfig` - Code style consistency
- `.gitignore`, `.gitmodules` - Git configuration

### 6. Documentation

**New comprehensive documentation:**
- `docs/usage.md` (1021 lines) - Complete usage guide covering:
  - Installation and setup
  - Both API approaches with examples
  - Advanced features (VR, URL parameters, events)
  - Asset preparation guidelines
  - TypeScript usage
  - Deployment instructions

- `examples/README.md` (319 lines) - Demo documentation covering:
  - Directory structure
  - Running the demo
  - API usage examples
  - Integration guide

### 7. Build Configuration

**Enhanced `vite.config.mjs`:**
- Dual build modes: library (`BUILD_MODE=lib`) and demo
- TypeScript declaration generation with `vite-plugin-dts`
- Proper externals for library mode (Vue, Three.js, etc.)
- Development alias for local package testing
- Optimized chunk splitting

**Package scripts:**
```json
{
  "build:lib": "BUILD_MODE=lib vite build",
  "build:demo": "vite build"
}
```

### 8. Type Safety Improvements

**New type definitions in `src/types/api.ts`:**
- Complete TypeScript interfaces for all API objects
- Proper type exports for external usage
- Enhanced IDE autocomplete support

### 9. File Naming Consistency

**Standardized to snake_case:**
- `muwanx-banner.png` → `muwanx_banner.png`
- `muwanx-demo.gif` → `muwanx_demo.gif`
- `url-params.md` → `url_params.md`
- `test-asset-collector.mjs` → `test_asset_collector.mjs`

## Breaking Changes

⚠️ **For existing users:**

1. **Package structure changed** - Update import paths:
   ```typescript
   // Old (if using internal imports)
   import { MwxViewer } from 'muwanx/src/core/MwxViewer';

   // New
   import { MwxViewer } from 'muwanx';
   ```

2. **Vue component path changed**:
   ```typescript
   // Old
   import MwxViewer from 'muwanx/src/viewer/MwxViewer.vue';

   // New
   import MwxViewerComponent from 'muwanx/viewer';
   ```

3. **Demo structure simplified** - Custom demo implementations may need updates to follow new single-file pattern

## Migration Guide

**From previous version:**

```typescript
// Before: Direct component usage
import MwxViewer from 'muwanx/src/viewer/MwxViewer.vue';

// After: Use package exports
import MwxViewerComponent from 'muwanx/viewer';
// or use the API
import { MwxViewer } from 'muwanx';
```

## Testing

- ✅ Library build succeeds (`npm run build:lib`)
- ✅ Demo build succeeds (`npm run build:demo`)
- ✅ Development server works (`npm run dev`)
- ✅ All package exports verified
- ✅ TypeScript declarations generated correctly
- ✅ Imperative API tested with MyoSuite and MuJoCo Menagerie projects

## Files Changed

**Modified:** 45 files
- Core package files: `package.json`, `tsconfig.json`, `vite.config.mjs`
- Source restructure: `src/index.ts`, `src/viewer/`, `src/types/`
- Demo simplification: `examples/main.ts`, `examples/README.md`
- Documentation: `README.md`, `docs/usage.md`
- Build configuration and type definitions

**Added:**
- `docs/usage.md` - Comprehensive usage guide
- `examples/README.md` - Demo documentation
- `src/types/api.ts` - TypeScript type definitions
- `src/viewer/MwxViewer.ts` - Main API class (relocated)

**Removed:**
- Configuration files: `jsconfig.json`, `.browserslistrc`
- MyoSuite configs: `config_myosuite.json`, 10 `asset_meta_*.json` files
- Simplified demo files: `examples/App.vue`, `examples/router.ts`

## Performance Impact

- 📦 **Bundle size:** Optimized with proper tree-shaking support
- ⚡ **Build time:** Improved with parallel builds for lib and demo
- 🎯 **Type checking:** Skip diagnostics during build (types still generated)
- 📝 **Developer experience:** Better autocomplete and type inference

## Next Steps

After this PR is merged:

1. Publish to npm as v0.1.0 (breaking changes warrant minor version bump)
2. Update GitHub Pages demo with new build
3. Create migration guide for existing users
4. Add more examples to `examples/` directory
5. Consider adding unit tests for API classes

## Related Issues

N/A - This is a foundational restructure to enable better package distribution and usage patterns.

---

**Review Checklist:**
- [ ] All builds pass (lib and demo)
- [ ] TypeScript types generated correctly
- [ ] Documentation is accurate and complete
- [ ] Breaking changes are clearly documented
- [ ] Examples demonstrate both API approaches
- [ ] GitHub Pages deployment will work with new structure
