# 🛠️ TOR Tool Template

**SDK Template for Tool Onboarding Registry**

This template provides everything you need to create a tool compatible with TOR (Tool Onboarding Registry).

---

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Copy this template
cp -r sdk-template my-custom-tool
cd my-custom-tool

# Install dependencies
npm install
```

### 2. Customize Your Tool

Edit `src/index.ts`:

```typescript
export async function handler(ctx: ToolContext, input: ToolInput): Promise<ToolOutput> {
  // Your custom logic here
  return {
    result: "Your result",
    timestamp: Date.now(),
  };
}
```

### 3. Update Manifest

Edit `manifest.json`:

```json
{
  "name": "my-custom-tool",
  "version": "1.0.0",
  "description": "My awesome tool",
  "inputSchema": { /* your input schema */ },
  "outputSchema": { /* your output schema - REQUIRED */ }
}
```

### 4. Build and Pack

```bash
# Build TypeScript
npm run build

# Create ZIP for TOR
npm run pack

# Or do both at once
npm run sdk:build
```

This creates `build/my-custom-tool-1.0.0.zip`

### 5. Import to TOR

```bash
curl -X POST "http://localhost:3000/api/tools/import" \
  -F "file=@build/my-custom-tool-1.0.0.zip"
```

---

## 📋 Manifest.json Structure

```json
{
  "name": "string",              // Tool name (unique)
  "version": "string",           // Semver version
  "entry": "string",             // Entry point (dist/index.js)
  "type": "tool",                // Always "tool"
  "description": "string",       // Optional description
  "capabilities": ["array"],     // Optional capabilities
  "inputSchema": { /* JSON Schema */ },   // Optional input schema
  "outputSchema": { /* JSON Schema */ },  // REQUIRED output schema
  "compatibility": {             // Optional compatibility
    "coreMin": ">=1.0.0 <2.0.0"
  }
}
```

### Required Fields

- ✅ `name`
- ✅ `version`
- ✅ `entry`
- ✅ `type` (must be "tool")
- ✅ `outputSchema` (REQUIRED!)

### Optional Fields

- ⚠️ `inputSchema` (recommended)
- ⚠️ `description`
- ⚠️ `capabilities`
- ⚠️ `compatibility`

---

## 🔐 Capabilities

If your tool needs special permissions, declare them in `capabilities`:

```json
{
  "capabilities": ["network", "filesystem"]
}
```

Available capabilities:
- `network` - HTTP requests, external APIs
- `filesystem` - Read/write files (within sandbox)
- `spawn` - Execute child processes
- `env` - Access environment variables

---

## ✅ outputSchema (REQUIRED!)

**Every tool MUST have an outputSchema!**

```json
{
  "outputSchema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "result": {
        "type": "string",
        "description": "The result"
      }
    },
    "required": ["result"]
  }
}
```

Without `outputSchema`, TOR will reject your tool.

---

## 📦 ZIP Structure

After `npm run pack`, your ZIP will contain:

```
my-tool-1.0.0.zip
├── manifest.json      ✅ Required
├── dist/
│   └── index.js      ✅ Entry point
└── README-tool.md    ⚠️ Optional
```

**DO NOT include:**
- ❌ `node_modules/` (bundle your deps)
- ❌ `.env` files
- ❌ `.exe`, `.bat`, `.sh` files
- ❌ Large files (ZIP max: 50MB)

---

## 🧪 Testing Locally

Before importing to TOR, test your tool:

```typescript
// test.ts
import { handler } from './src/index';

const mockCtx = {
  logger: console,
  capabilities: { network: true }
};

const input = { message: 'test' };

handler(mockCtx, input).then(console.log);
```

```bash
npx tsx test.ts
```

---

## 🎯 Examples

### Example 1: Simple Echo Tool

```typescript
export async function handler(ctx, input) {
  return {
    result: input.message,
    timestamp: Date.now()
  };
}
```

### Example 2: HTTP Fetcher (with network capability)

```json
{
  "capabilities": ["network"]
}
```

```typescript
export async function handler(ctx, input) {
  const response = await fetch(input.url);
  const data = await response.json();
  
  return {
    result: data,
    status: response.status,
    timestamp: Date.now()
  };
}
```

### Example 3: Data Processor

```typescript
export async function handler(ctx, input) {
  const processed = input.data.map(item => ({
    ...item,
    processed: true,
    processedAt: Date.now()
  }));
  
  return {
    result: processed,
    count: processed.length,
    timestamp: Date.now()
  };
}
```

---

## 📚 Documentation

For complete TOR documentation, see `/workspace/sdk/TOR.md`

---

## ⚠️ Important Notes

1. **Always include outputSchema** - It's mandatory!
2. **Bundle dependencies** - Don't include node_modules
3. **Keep it small** - Max 50MB ZIP
4. **Use semver** - Version must be valid semver
5. **Test before import** - Verify your tool works locally

---

## 🚀 Advanced

### Custom Healthcheck

```typescript
export function healthcheck(): boolean {
  // Custom healthcheck logic
  return true;
}
```

### Multiple Export Functions

```typescript
export async function handler(ctx, input) { /* main */ }
export async function validate(ctx, input) { /* validation */ }
export async function cleanup(ctx) { /* cleanup */ }
```

### Error Handling

```typescript
export async function handler(ctx, input) {
  try {
    const result = await processData(input);
    return { result, timestamp: Date.now() };
  } catch (error) {
    ctx.logger.error('Processing failed:', error);
    return {
      result: null,
      error: error.message,
      timestamp: Date.now()
    };
  }
}
```

---

## 💡 Tips

- ✅ Use TypeScript for type safety
- ✅ Log important steps with `ctx.logger`
- ✅ Validate input thoroughly
- ✅ Return consistent output format
- ✅ Handle errors gracefully
- ✅ Keep functions pure when possible
- ✅ Document your schemas well

---

## 🎉 Ready to Deploy!

After building and packing:

```bash
npm run sdk:build
```

Your tool is ready to import:

```bash
curl -X POST "http://localhost:3000/api/tools/import" \
  -F "file=@build/my-tool-1.0.0.zip"
```

---

**Happy building! 🚀**
