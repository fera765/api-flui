# 🧪 Manual Test Guide - 5 MCPs

## 📋 Prerequisites

1. **Backend must be running:**
   ```bash
   cd /workspace
   npm run dev
   ```
   
2. **Check backend logs** - Keep terminal visible to see MCP connection logs

---

## 🚀 Quick Test (Automated)

```bash
cd /workspace
./test-5-mcps.sh
```

This will test 5 different MCPs automatically and show you the results.

---

## 🔧 Manual Test (Step by Step)

If you prefer to test manually or the script doesn't work, follow these steps:

### TEST 1: Memory MCP ✅
**No API keys required - Always works**

```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Memory Test",
    "source": "@modelcontextprotocol/server-memory",
    "description": "Knowledge graph memory"
  }'
```

**Expected Backend Logs:**
```
[MCP] Connecting to NPX package: @modelcontextprotocol/server-memory
[MCP] Executable: mcp-server-memory
[MCP] Using command: npx -y --package=@modelcontextprotocol/server-memory mcp-server-memory
[MCP] Successfully connected to @modelcontextprotocol/server-memory
```

**Expected Response:**
```json
{
  "id": "mcp-xxx",
  "name": "Memory Test",
  "source": "@modelcontextprotocol/server-memory",
  "toolsExtracted": 6,
  "message": "MCP imported successfully"
}
```

---

### TEST 2: Filesystem MCP ✅
**Requires ALLOWED_DIRECTORY env var**

```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Filesystem Test",
    "source": "@modelcontextprotocol/server-filesystem",
    "description": "File operations",
    "env": {
      "ALLOWED_DIRECTORY": "/tmp"
    }
  }'
```

**Expected Backend Logs:**
```
[MCP] Connecting to NPX package: @modelcontextprotocol/server-filesystem
[MCP] Executable: mcp-server-filesystem
[MCP] Using command: npx -y --package=@modelcontextprotocol/server-filesystem mcp-server-filesystem
[MCP] Successfully connected to @modelcontextprotocol/server-filesystem
```

**Expected Response:**
```json
{
  "id": "mcp-xxx",
  "name": "Filesystem Test",
  "source": "@modelcontextprotocol/server-filesystem",
  "toolsExtracted": 6-8,
  "message": "MCP imported successfully"
}
```

---

### TEST 3: Puppeteer MCP ✅
**No API keys required**

```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Puppeteer Test",
    "source": "@modelcontextprotocol/server-puppeteer",
    "description": "Browser automation"
  }'
```

**Expected Backend Logs:**
```
[MCP] Connecting to NPX package: @modelcontextprotocol/server-puppeteer
[MCP] Executable: mcp-server-puppeteer
[MCP] Using command: npx -y --package=@modelcontextprotocol/server-puppeteer mcp-server-puppeteer
[MCP] Successfully connected to @modelcontextprotocol/server-puppeteer
```

---

### TEST 4: Sqlite MCP ✅
**No API keys required**

```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sqlite Test",
    "source": "@modelcontextprotocol/server-sqlite",
    "description": "SQLite database operations"
  }'
```

**Expected Backend Logs:**
```
[MCP] Connecting to NPX package: @modelcontextprotocol/server-sqlite
[MCP] Executable: mcp-server-sqlite
[MCP] Using command: npx -y --package=@modelcontextprotocol/server-sqlite mcp-server-sqlite
[MCP] Successfully connected to @modelcontextprotocol/server-sqlite
```

---

### TEST 5: Fetch MCP ✅
**No API keys required**

```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fetch Test",
    "source": "@modelcontextprotocol/server-fetch",
    "description": "HTTP requests"
  }'
```

**Expected Backend Logs:**
```
[MCP] Connecting to NPX package: @modelcontextprotocol/server-fetch
[MCP] Executable: mcp-server-fetch
[MCP] Using command: npx -y --package=@modelcontextprotocol/server-fetch mcp-server-fetch
[MCP] Successfully connected to @modelcontextprotocol/server-fetch
```

---

## ✅ Verify All Tools

After importing, check all tools:

```bash
curl http://localhost:3000/api/all-tools
```

Should show tools from all 5 MCPs combined with system tools.

---

## 🧹 Cleanup

### List all MCPs:
```bash
curl http://localhost:3000/api/mcps
```

### Delete MCP:
```bash
curl -X DELETE http://localhost:3000/api/mcps/{MCP_ID}
```

---

## 🔍 What to Look For

### ✅ Success Indicators
1. **Backend logs show:**
   - `[MCP] Connecting to NPX package: @xxx/xxx`
   - `[MCP] Executable: mcp-server-xxx`
   - `[MCP] Successfully connected to @xxx/xxx`

2. **Response includes:**
   - `"id"`: MCP ID
   - `"toolsExtracted"`: Number > 0
   - `"message": "MCP imported successfully"`

3. **No errors in logs**

### ❌ Failure Indicators
1. **Backend logs show:**
   - `sh: 1: xxx: not found`
   - `Connection closed`
   - `Failed to connect to MCP package`

2. **Response shows error:**
   - `"message": "Failed to..."`

---

## 🎯 Expected Results

| Test | Package | Tools Expected | Time (First Run) |
|------|---------|----------------|------------------|
| 1 | server-memory | ~6 tools | 30-60s |
| 2 | server-filesystem | ~6-8 tools | 30-60s |
| 3 | server-puppeteer | ~10+ tools | 30-60s |
| 4 | server-sqlite | ~4-6 tools | 30-60s |
| 5 | server-fetch | ~2-4 tools | 30-60s |

**Note:** First run takes longer because NPX downloads packages. Subsequent imports are faster (5-10s).

---

## 🆘 Troubleshooting

### Issue: "Connection refused"
**Solution:** Backend is not running. Start it:
```bash
cd /workspace
npm run dev
```

### Issue: "not found" in logs
**Solution:** Check if package name is correct. Our fix should handle this automatically now.

### Issue: Takes too long
**Normal:** First time can take 60s+ per package (downloading)
**Solution:** Be patient, subsequent imports are faster

### Issue: "Connection closed"
**Possible causes:**
1. No internet connection
2. Package doesn't exist
3. Package is not a valid MCP server

---

## 📊 Performance Notes

### First Import
- **Download:** 20-40s (NPX downloads package)
- **Connection:** 5-10s (MCP server starts)
- **Tool Extract:** 2-5s (SDK calls)
- **Total:** 30-60s

### Subsequent Imports
- **Download:** 0s (cached)
- **Connection:** 3-5s
- **Tool Extract:** 2-3s
- **Total:** 5-10s

---

## 🎉 Success Criteria

Your system is working correctly if:

✅ All 5 MCPs import successfully  
✅ Tools are extracted (toolsExtracted > 0)  
✅ No "not found" errors in logs  
✅ Backend logs show correct executable names  
✅ `/api/all-tools` shows combined tools  

---

## 📝 What Was Fixed

### Problem
- NPX was trying to execute package name directly
- Example: `npx -y @modelcontextprotocol/server-memory`
- This failed because executable is `mcp-server-memory`, not the package name

### Solution
- Automatically detect executable name from package name
- Use `npx --package=@org/package executable-name`
- Pattern: `server-xxx` → `mcp-server-xxx`

### How It Works
```typescript
// Old (WRONG):
npx -y @modelcontextprotocol/server-memory

// New (CORRECT):
npx -y --package=@modelcontextprotocol/server-memory mcp-server-memory
```

---

**Ready to test!** 🚀

Run the automated script or follow manual steps above.
