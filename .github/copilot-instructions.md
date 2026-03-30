# ST-TRPG-Tool Development Guide

## Project Overview

**ST-TRPG-Tool** is a SillyTavern server plugin built with TypeScript and Webpack. It provides TRPG (Tabletop RPG) utilities for AI agents, including dice rolling, maps, rulebooks, and character card queries. The plugin integrates with SillyTavern's Express router to expose HTTP endpoints.

### Architecture

- **Plugin Pattern**: Implements the SillyTavern plugin interface with `init()`, `exit()`, and `info` exports
- **Build Target**: Node.js CommonJS module (bundled as `dist/plugin.js`)
- **Runtime**: Loaded into SillyTavern server; accessed via HTTP POST endpoints
- **Key File**: `src/index.ts` defines the plugin contract and registers routes

## Development Workflow

### Build Commands

```bash
npm run build:dev    # Development build (unminified, faster)
npm run build        # Production build (minified with Terser)
npm run lint         # Check TypeScript + ESLint rules
npm run lint:fix     # Auto-fix linting issues
```

After building, test by copying `dist/plugin.js` into SillyTavern's `/plugins` folder.

### TypeScript Configuration

- **Target**: ES6, CommonJS modules
- **Strict Mode**: Enabled (required)
- **Source Maps**: Enabled for debugging
- **Output**: `./out` for tsc (Webpack overrides to `./dist`)

## Plugin Development Patterns

### Route Registration Pattern

New routes must follow this structure in the `init()` function:

```typescript
// With middleware (e.g., JSON parsing)
router.post('/endpoint-name', jsonParser, async (req, res) => {
    try {
        const data = req.body;
        // Process request
        return res.json({ result: 'data' });
    } catch (error) {
        console.error(chalk.red(MODULE_NAME), 'Error message', error);
        return res.status(500).send('Internal Server Error');
    }
});

// Without middleware
router.post('/probe', (_req, res) => {
    return res.sendStatus(204);
});
```

### Logging Convention

Always use the `chalk` library with `MODULE_NAME` constant for colored console output:

```typescript
console.log(chalk.green(MODULE_NAME), 'Plugin loaded!');
console.error(chalk.red(MODULE_NAME), 'Error description', error);
```

### Plugin Interface Requirements

All plugins must export default a `Plugin` object containing:

```typescript
interface Plugin {
    init: (router: Router) => Promise<void>;      // Called on server startup
    exit: () => Promise<void>;                     // Called on server shutdown
    info: PluginInfo;                              // Metadata
}

interface PluginInfo {
    id: string;           // Unique identifier (e.g., 'st-trpg-tools')
    name: string;         // Display name
    description: string;  // User-facing description
}
```

## Dependencies & Conventions

- **body-parser**: Used to parse JSON request bodies (import locally, use in route middleware)
- **chalk**: Used for colored console output (use `new Chalk()` instance)
- **express**: Router interface provided by SillyTavern; only add routes, don't create new Router
- **ES Modules**: Project uses CommonJS (`"type": "commonjs"`); no `import()` syntax

## Linting & Code Quality

- **Parser**: @typescript-eslint/parser
- **Environment**: Node.js (no browser, no DOM)
- **Key Rules**:
  - Unused variables error (args allowed)
  - `no-control-regex` disabled (regex may contain control chars)
  - Loop conditions can be constant (`while(true)`)
- **Ignore Patterns**: `node_modules/`, `dist/`, `out/`, `bin/`

## Integration Points

- **Entry Point**: SillyTavern calls `init(router)` and stores routes
- **HTTP Endpoints**: Accessed by AI agents via POST to `http://server/plugin-endpoints`
- **Shutdown**: `exit()` called on server termination (cleanup if needed)

## When Adding Features

1. Add new route handlers to `init()` following the pattern above
2. Update `package.json` version and description if needed
3. Run `npm run lint:fix` before building
4. Build with `npm run build:dev` to test, then `npm run build` for production
5. Test by placing `dist/plugin.js` in SillyTavern's `/plugins` folder
