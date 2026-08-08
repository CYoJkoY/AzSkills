---
name: ahkv2-opt
description: AHK v2 代码优化与标准化规范，适用于重构、代码审查或新建模块时强制执行。
---

## Instructions

### Overview
This skill enforces high-standard code optimization and standardization for AutoHotkey v2 projects. Apply these rules when writing new code, refactoring existing code, or conducting code reviews.

### Trigger Conditions
- User requests code review or optimization
- User mentions "standardize", "optimize", "refactor" for AHK code
- User references performance issues or code quality concerns
- New module creation in CapsLock- project

---

## Mandatory Standards

### 1. File and Function Size Limits
- **Max lines per file**: 300 lines (excluding comments and blank lines)
- **Max lines per function**: 50 lines
- Break larger modules into separate files or helper functions

### 2. Control Flow Best Practices
- Use **guard clauses** (early returns) to flatten deep nesting
- Use **switch-case** for multiple conditional branches instead of chained if-else
- Avoid nested if-else deeper than 2 levels

### 3. Code Organization and Encapsulation
- Encapsulate code in functions or classes
- One class or a group of closely related functions per file
- Structure project by feature/module (e.g., `Lib/` for shared libraries, `UnitTests/` for tests)
- Do **not** rely on `#Include` order; each file should be self-contained
- Avoid polluting global namespace: use a unique global prefix (e.g., `CapsLock_`) for exposed symbols; otherwise keep state in function statics

### 4. Variable and State Management
- Use `static` variables inside functions for local persistent state
- **Avoid global variables** unless absolutely necessary (e.g., configuration singletons)
- For large strings passed as parameters, use `ByRef` to avoid copying
- Pre-allocate with `VarSetCapacity` when array size is known

### 5. Performance Optimizations

#### Timers and Loops
- `SetTimer` interval **must be ≥ 50ms**
- Loops must have timeout or exit conditions to prevent infinite loops
- Use `Sleep` in polling loops to reduce CPU usage

#### Hotkeys and Auto-Execution
- Prefer `#HotIf` with `WinActive()` for context-sensitive hotkeys
- Avoid `HotIfWinActive` when multiple windows share similar logic

#### Data Structures
- **Map objects are 20x slower** than plain variables in hot paths; use arrays or objects with integer keys when possible
- For large data files, read in chunks with `FileOpen` rather than `FileRead` whole
- Keep file handles open during batch operations

#### Math and Boolean Logic
- Avoid unnecessary intermediate variables if a result is used once; inline expressions
- Directly use Boolean variables in conditions: `if (flag)` not `if (flag == true)`
- Use ternary operator for simple if-else: `result := (condition ? val1 : val2)`

#### DllCall and System APIs
- Cache results of repeated `DllCall` calls (e.g., DPI, screen size)
- Avoid wrapper functions like `Float()` that add overhead

#### Loops
- `For k, v in array` is slower than indexed `loop array.Length`; use indexed loops for hot paths
- Avoid `Map` insertion in loops where performance matters

### 6. UI and Graphics Optimization
- Use **GDI+** with caching: cache immutable data (e.g., DPI, brushes, graphics objects)
- **Double buffering** to prevent flicker
- Use **clip regions** to redraw only changed parts
- Remove redundant conversions (e.g., `Float()`)
- Prefer `UpdateLayeredWindow` for content-only updates
- For heavy GUI updates, use `SetTimer` or `SyncCallback` to avoid blocking
- Use **Virtual ListView** for large datasets
- High-frequency `OnEvent` can block other threads; consider throttling

### 7. AI/Streaming Output Optimization
- Use `SetTimer` or separate threads for API callbacks to keep UI responsive
- Implement **asynchronous integration**
- Update UI incrementally: append new data to the end of text control, not full refresh
- Use **smart caching** for frequent requests
- Use `OnError` to catch network errors and implement **automatic retry**

### 8. File and Folder Operations
- Use **event-based monitoring** (e.g., WatchFolder library) instead of polling
- Batch operations using `loop files` is faster than repeated timers
- Keep files open during batch writes

### 9. Memory Management
- Release large objects when no longer needed: assign empty value or `None`
- For arrays of known size, `VarSetCapacity` improves performance
- In high-frequency code, minimize `DllCall` frequency by caching results

### 10. Code Style and Comments
- All comments **must be in pure English**
- UI text **must use `Lang()`** internationalization function; no hardcoded strings
- No reliance on include order; use explicit includes only for shared definitions

### 11. Testing and Debugging
- Consider unit tests for critical modules (e.g., `UnitTests/` folder)
- Use community tools like `Compare-Code-Speed-GUI-AHKv2` or `Optimize-AHKv2-for-Speed` for profiling

---

## Enforcement
- These rules are **mandatory** for all CapsLock- project code
- Code reviews must verify compliance
- Exceptions require explicit justification and approval

## Example Usage
When user asks: "Refactor the AI API module to meet standard", apply these rules to the involved files.

## Additional Notes
- This skill overrides any conflicting prior practices
- If uncertain, prefer readability and maintainability over micro-optimization, but always meet size limits and control flow rules

---

*Skill version 1.0*
