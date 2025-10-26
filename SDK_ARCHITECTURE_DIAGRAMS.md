# 📊 Diagramas de Arquitetura - SDK e Tool Registration

## 🏗️ Arquitetura Geral do SDK

```mermaid
graph TB
    subgraph "SDK Core"
        Types[types.ts<br/>Definições TypeScript]
        Schema[schema.ts<br/>Sistema de Validação]
        SDK[sdk.ts<br/>Classe Principal]
    end
    
    subgraph "Adapters"
        HTTP[http-adapter.ts<br/>Cliente HTTP]
        Cron[cron-adapter.ts<br/>Scheduler]
    end
    
    subgraph "Test Utils"
        Mocks[Mocks e Helpers<br/>Testing]
    end
    
    subgraph "Examples"
        Basic[basic-tool.ts]
        HTTPEx[http-adapter-usage.ts]
        Plugin[plugin-manifest.ts]
    end
    
    Types --> Schema
    Schema --> SDK
    SDK --> HTTP
    SDK --> Cron
    SDK --> Mocks
    SDK --> Examples
    
    style SDK fill:#4CAF50,color:#fff
    style Types fill:#2196F3,color:#fff
    style Schema fill:#2196F3,color:#fff
```

---

## 🔄 Fluxo de Registro de Tool (SDKToolAdapter)

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Adapter as SDKToolAdapter
    participant SDK as SDK Core
    participant Repo as SystemToolRepository
    participant Map as ID Mapping
    
    Dev->>Adapter: registerSDKTool(sdkTool)
    
    Adapter->>SDK: registerTool(sdkTool)
    SDK->>SDK: Validate name
    SDK->>SDK: Validate schemas
    SDK->>SDK: Generate UUID
    SDK->>SDK: Store in Map<UUID, Tool>
    SDK-->>Adapter: { success: true, id: sdkId }
    
    Adapter->>Repo: create(systemToolData)
    Repo->>Repo: Create SystemTool
    Repo-->>Adapter: systemTool
    
    Adapter->>Adapter: Override executor
    Note over Adapter: systemTool.executor = async (input) => {<br/>  return sdk.executeTool(sdkId, input)<br/>}
    
    Adapter->>Map: set(sdkId, systemId)
    
    Adapter-->>Dev: { sdkId, systemId, name }
    
    Note over Dev: Tool está pronta!<br/>Pode ser usada em automações
```

---

## ⚡ Fluxo de Execução de Tool

```mermaid
sequenceDiagram
    participant Auto as Automation
    participant Exec as AutomationExecutor
    participant SysTool as SystemTool
    participant Adapter as SDKToolAdapter
    participant SDK as SDK Core
    participant Handler as Tool Handler
    
    Auto->>Exec: execute(automationId, input)
    Exec->>Exec: Get node (type: TOOL)
    Exec->>SysTool: getExecutor()
    
    SysTool->>Adapter: executor(input)
    Note over SysTool,Adapter: Executor foi overridden<br/>para chamar SDK
    
    Adapter->>SDK: executeTool(sdkId, input)
    
    SDK->>SDK: Find tool by ID
    SDK->>SDK: Validate input schema
    SDK->>SDK: Build context<br/>(logger, capabilities)
    SDK->>SDK: Check capabilities
    
    SDK->>Handler: handler(context, input)
    Handler->>Handler: Execute business logic
    Handler-->>SDK: output
    
    SDK->>SDK: Validate output schema
    SDK-->>Adapter: { success: true, output }
    
    Adapter-->>SysTool: output
    SysTool-->>Exec: output
    Exec-->>Auto: result
```

---

## 📦 Fluxo TOR (Tool Onboarding Registry)

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant API as POST /api/tools/import
    participant ZipInsp as ZipInspector
    participant ManVal as ManifestValidator
    participant Repo as ToolRepository
    participant Sandbox as SandboxManager
    
    Dev->>API: Upload tool.zip
    
    API->>ZipInsp: inspect(zipFile)
    ZipInsp->>ZipInsp: Verify structure
    ZipInsp->>ZipInsp: Check for malicious files
    ZipInsp->>ZipInsp: Extract manifest.json
    ZipInsp-->>API: { manifest, files }
    
    API->>ManVal: validate(manifest)
    ManVal->>ManVal: Validate schema
    ManVal->>ManVal: Check outputSchema (required)
    ManVal->>ManVal: Validate capabilities
    ManVal-->>API: { valid: true }
    
    API->>Repo: create(toolData)
    Repo->>Repo: Generate ID
    Repo->>Repo: Store metadata
    Repo-->>API: tool
    
    API->>Sandbox: createSandbox(tool)
    Sandbox->>Sandbox: Extract to isolated dir
    Sandbox->>Sandbox: Set permissions
    Sandbox->>Sandbox: Run healthcheck
    Sandbox-->>API: { status: 'ready' }
    
    API-->>Dev: { id, name, version, status: 'active' }
    
    Note over Dev: Tool importada!<br/>Pronta para uso
```

---

## 🔐 Capability Check Flow

```mermaid
flowchart TD
    Start([Tool Execution Request]) --> GetTool[Get Tool by ID]
    GetTool --> CheckCap{Tool has<br/>capabilities?}
    
    CheckCap -->|No| Execute[Execute Handler]
    CheckCap -->|Yes| IterateCaps[Iterate Capabilities]
    
    IterateCaps --> CheckNetwork{Needs<br/>network?}
    CheckNetwork -->|Yes| HasNetwork{Context has<br/>network?}
    HasNetwork -->|No| Error1[Throw MISSING_CAPABILITY]
    HasNetwork -->|Yes| CheckFS
    
    CheckNetwork -->|No| CheckFS{Needs<br/>filesystem?}
    CheckFS -->|Yes| HasFS{Context has<br/>filesystem?}
    HasFS -->|No| Error2[Throw MISSING_CAPABILITY]
    HasFS -->|Yes| CheckSpawn
    
    CheckFS -->|No| CheckSpawn{Needs<br/>spawn?}
    CheckSpawn -->|Yes| HasSpawn{Context has<br/>spawn?}
    HasSpawn -->|No| Error3[Throw MISSING_CAPABILITY]
    HasSpawn -->|Yes| CheckEnv
    
    CheckSpawn -->|No| CheckEnv{Needs<br/>env?}
    CheckEnv -->|Yes| HasEnv{Context has<br/>env?}
    HasEnv -->|No| Error4[Throw MISSING_CAPABILITY]
    HasEnv -->|Yes| Execute
    
    CheckEnv -->|No| Execute
    Execute --> Success([✅ Execution Allowed])
    
    Error1 --> Fail([❌ Execution Denied])
    Error2 --> Fail
    Error3 --> Fail
    Error4 --> Fail
    
    style Start fill:#4CAF50,color:#fff
    style Success fill:#4CAF50,color:#fff
    style Fail fill:#f44336,color:#fff
    style Execute fill:#2196F3,color:#fff
```

---

## 🎯 Tool Registration: Two Paths

```mermaid
graph TD
    Dev[Developer Creates Tool]
    
    Dev --> Path1{Choose Method}
    
    Path1 -->|Development/Testing| SDK[SDKToolAdapter Path]
    Path1 -->|Production| TOR[TOR Path]
    
    subgraph "SDKToolAdapter Path"
        SDK --> S1[1. Define Tool with SDK]
        S1 --> S2[2. Create SDKToolAdapter]
        S2 --> S3[3. Call registerSDKTool]
        S3 --> S4[4. Get systemId]
        S4 --> S5[5. Use in Automation]
    end
    
    subgraph "TOR Path"
        TOR --> T1[1. Define Tool with SDK]
        T1 --> T2[2. Create manifest.json]
        T2 --> T3[3. Build + Pack to ZIP]
        T3 --> T4[4. POST /api/tools/import]
        T4 --> T5[5. Get tool ID]
        T5 --> T6[6. Use in Automation]
    end
    
    S5 --> Result[✅ Tool in Automation]
    T6 --> Result
    
    style Dev fill:#4CAF50,color:#fff
    style Result fill:#4CAF50,color:#fff
    style SDK fill:#2196F3,color:#fff
    style TOR fill:#FF9800,color:#fff
```

---

## 🔄 Schema Validation Flow

```mermaid
flowchart LR
    Input([Input Data]) --> Parse{schema.parse}
    
    Parse --> IsValid{Valid?}
    
    IsValid -->|Yes| TypeCheck[Type Check]
    IsValid -->|No| Error([❌ ValidationError])
    
    TypeCheck --> String{Type?}
    
    String -->|string| ValidStr{Is string?}
    String -->|number| ValidNum{Is number?}
    String -->|boolean| ValidBool{Is boolean?}
    String -->|object| ValidObj{Is object?}
    String -->|array| ValidArr{Is array?}
    
    ValidStr -->|Yes| Success
    ValidStr -->|No| Error
    
    ValidNum -->|Yes| Success
    ValidNum -->|No| Error
    
    ValidBool -->|Yes| Success
    ValidBool -->|No| Error
    
    ValidObj -->|Yes| ValidateKeys[Validate Keys]
    ValidObj -->|No| Error
    
    ValidArr -->|Yes| ValidateItems[Validate Items]
    ValidArr -->|No| Error
    
    ValidateKeys --> Recursive{Nested?}
    ValidateItems --> Recursive
    
    Recursive -->|Yes| Parse
    Recursive -->|No| Success
    
    Success([✅ Valid Data])
    
    style Input fill:#4CAF50,color:#fff
    style Success fill:#4CAF50,color:#fff
    style Error fill:#f44336,color:#fff
```

---

## 🏢 Integração Completa: SDK → Automation

```mermaid
graph TB
    subgraph "Development"
        Dev[Developer]
        Tool[SDK Tool Definition]
        Dev --> Tool
    end
    
    subgraph "SDK Layer"
        SDKCore[SDK Core]
        Validation[Schema Validation]
        Execution[Tool Execution]
        
        Tool --> SDKCore
        SDKCore --> Validation
        SDKCore --> Execution
    end
    
    subgraph "Adapter Layer"
        Adapter[SDKToolAdapter]
        Mapping[ID Mapping]
        
        SDKCore --> Adapter
        Adapter --> Mapping
    end
    
    subgraph "Domain Layer"
        SysTool[SystemTool]
        Auto[Automation]
        Node[Automation Node]
        
        Adapter --> SysTool
        SysTool --> Node
        Node --> Auto
    end
    
    subgraph "Execution Layer"
        AutoExec[AutomationExecutor]
        NodeExec[Node Executor]
        
        Auto --> AutoExec
        AutoExec --> NodeExec
        NodeExec --> SysTool
    end
    
    subgraph "Result"
        Output[Tool Output]
        NextNode[Next Node]
        
        SysTool --> Output
        Output --> NextNode
    end
    
    style Dev fill:#4CAF50,color:#fff
    style SDKCore fill:#2196F3,color:#fff
    style Adapter fill:#FF9800,color:#fff
    style Auto fill:#9C27B0,color:#fff
    style Output fill:#4CAF50,color:#fff
```

---

## 📊 Component Dependencies

```mermaid
graph LR
    subgraph "SDK Packages"
        Core[@automation-sdk/core]
        Adapters[@automation-sdk/adapters]
        TestUtils[@automation-sdk/test-utils]
        Examples[@automation-sdk/examples]
    end
    
    subgraph "Integration Layer"
        SDKAdapter[SDKToolAdapter]
    end
    
    subgraph "Domain Layer"
        SystemTool[SystemTool]
        Automation[Automation]
        Node[Node]
    end
    
    subgraph "Infrastructure"
        Repos[Repositories]
        Services[Services]
        Controllers[Controllers]
    end
    
    Core --> Adapters
    Core --> TestUtils
    Core --> Examples
    
    Core --> SDKAdapter
    
    SDKAdapter --> SystemTool
    SDKAdapter --> Repos
    
    SystemTool --> Node
    Node --> Automation
    
    Services --> SystemTool
    Controllers --> Services
    
    style Core fill:#2196F3,color:#fff
    style SDKAdapter fill:#FF9800,color:#fff
    style SystemTool fill:#4CAF50,color:#fff
    style Automation fill:#9C27B0,color:#fff
```

---

## 🔄 Tool Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: Define Tool
    
    Created --> Registered: registerTool()
    
    Registered --> Validated: Validate Schemas
    
    Validated --> Ready: Pass Validation
    Validated --> Failed: Fail Validation
    
    Ready --> Executing: executeTool()
    
    Executing --> InputValidation: Validate Input
    
    InputValidation --> CapabilityCheck: Pass
    InputValidation --> Failed: Fail
    
    CapabilityCheck --> HandlerExecution: Allowed
    CapabilityCheck --> Denied: Missing Capability
    
    HandlerExecution --> OutputValidation: Handler Returns
    
    OutputValidation --> Success: Valid Output
    OutputValidation --> Failed: Invalid Output
    
    Success --> Ready: Ready for Next
    
    Ready --> Unregistered: unregisterTool()
    
    Failed --> [*]
    Denied --> [*]
    Unregistered --> [*]
```

---

## 🏗️ Clean Architecture Layers

```mermaid
graph TB
    subgraph "Presentation Layer"
        API[REST API]
        Routes[Routes]
        Controllers[Controllers]
    end
    
    subgraph "Application Layer"
        Services[Services]
        UseCases[Use Cases]
        Adapters[Adapters]
    end
    
    subgraph "Domain Layer"
        Entities[Entities]
        ValueObjects[Value Objects]
        DomainServices[Domain Services]
    end
    
    subgraph "Infrastructure Layer"
        Repos[Repositories]
        External[External APIs]
        Database[Database]
    end
    
    API --> Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> UseCases
    UseCases --> Adapters
    Adapters --> Entities
    Entities --> ValueObjects
    Services --> DomainServices
    Services --> Repos
    Repos --> Database
    Adapters --> External
    
    style Entities fill:#4CAF50,color:#fff
    style Services fill:#2196F3,color:#fff
    style Controllers fill:#FF9800,color:#fff
    style Repos fill:#9C27B0,color:#fff
```

---

## 🎯 Decision Tree: Which Method to Use?

```mermaid
graph TD
    Start([Need to Add SDK Tool])
    
    Start --> Q1{In Production?}
    
    Q1 -->|Yes| Q2{Need Sandbox?}
    Q1 -->|No| Q3{Rapid Testing?}
    
    Q2 -->|Yes| TOR[Use TOR<br/>✅ Secure<br/>✅ Versioned<br/>✅ Audited]
    Q2 -->|No| Q4{Need Versioning?}
    
    Q4 -->|Yes| TOR
    Q4 -->|No| Maybe1[Consider SDKToolAdapter<br/>but TOR is safer]
    
    Q3 -->|Yes| Adapter[Use SDKToolAdapter<br/>✅ Fast<br/>✅ Type-safe<br/>✅ Easy debug]
    Q3 -->|No| Q5{Building Library?}
    
    Q5 -->|Yes| TOR
    Q5 -->|No| Adapter
    
    style Start fill:#4CAF50,color:#fff
    style TOR fill:#2196F3,color:#fff
    style Adapter fill:#FF9800,color:#fff
```

---

## 📈 Performance Considerations

```mermaid
graph LR
    subgraph "Fast Path - SDKToolAdapter"
        F1[Direct SDK Call] --> F2[No ZIP Extract]
        F2 --> F3[No Sandbox Overhead]
        F3 --> F4[⚡ Fast Execution]
    end
    
    subgraph "Secure Path - TOR"
        S1[ZIP Validation] --> S2[Manifest Check]
        S2 --> S3[Sandbox Creation]
        S3 --> S4[Isolated Execution]
        S4 --> S5[🔒 Secure but Slower]
    end
    
    Trade[Trade-off] --> Fast[Speed]
    Trade --> Secure[Security]
    
    Fast --> F4
    Secure --> S5
    
    style F4 fill:#4CAF50,color:#fff
    style S5 fill:#2196F3,color:#fff
    style Trade fill:#FF9800,color:#fff
```

---

## 🔍 Debugging Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant SDK as SDK
    participant Logger as Logger
    participant Tool as Tool Handler
    
    Dev->>SDK: executeTool(id, input)
    
    SDK->>Logger: info('Executing tool...')
    SDK->>SDK: Validate input
    
    alt Input Invalid
        SDK->>Logger: error('Input validation failed')
        SDK-->>Dev: ValidationError
    else Input Valid
        SDK->>Tool: handler(ctx, input)
        
        alt Handler Throws
            Tool->>Logger: error('Handler failed')
            Tool-->>SDK: Error
            SDK-->>Dev: ExecutionError
        else Handler Success
            Tool-->>SDK: output
            SDK->>SDK: Validate output
            
            alt Output Invalid
                SDK->>Logger: error('Output validation failed')
                SDK-->>Dev: ValidationError
            else Output Valid
                SDK->>Logger: info('Execution successful')
                SDK-->>Dev: Success Result
            end
        end
    end
```

---

## 🎊 Summary Diagram

```mermaid
mindmap
  root((SDK & Tool Registration))
    SDK Core
      Types
      Schemas
      Execution
      Validation
    Registration Methods
      SDKToolAdapter
        Fast
        Type-safe
        Development
      TOR
        Secure
        Versioned
        Production
    Features
      Capability Model
      Schema Validation
      Error Handling
      Plugin System
    Security
      Sandbox
      Capabilities
      Validation
      Isolation
    Integration
      SystemTool
      Automation
      Executor
      Adapters
```

---

**Todos os diagramas estão em formato Mermaid e podem ser visualizados em:**
- GitHub
- VSCode com extensão Mermaid
- Markdown viewers com suporte Mermaid
- https://mermaid.live/
