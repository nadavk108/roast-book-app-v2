# 🚀 Claude Code Session Starter

Copy-paste this into every new Claude Code session:

---

Read CLAUDE_CONTEXT.md and claude_rules.md, check CHANGELOG.md for recent changes.

Then acknowledge what you understand about:
1. I'm non-technical (can't code)
2. You provide complete files (no diffs)
3. I test in production on mobile
4. You explain in plain English first

Ready? Here's what I need:
[PASTE YOUR REQUEST HERE]

---
```

### Usage:
1. Open `SESSION_START.md` 
2. Copy the text between the `---` lines
3. Paste into Claude Code
4. Replace `[PASTE YOUR REQUEST HERE]` with what you need
5. Send

**Pros:** 
- Easy to customize per session
- Can add context-specific notes
- Visual reminder of what to include

**Cons:** 
- Still need to copy-paste manually

---

## Option 3: Browser Extension (Most Automated)

### For Chrome/Arc:
1. Install **Text Blaze** (free Chrome extension)
2. Create a snippet:
   - **Shortcut:** `/ccstart`
   - **Content:**
```
   Read CLAUDE_CONTEXT.md and claude_rules.md, check CHANGELOG.md for recent changes.

   Then acknowledge what you understand about:
   1. I'm non-technical (can't code)
   2. You provide complete files (no diffs)
   3. I test in production on mobile
   4. You explain in plain English first

   Ready? Here's what I need: {cursor}
```

### Usage:
- Type `/ccstart` in Claude Code chat
- It auto-expands
- Cursor appears where you type your request

**Pros:** 
- Fastest (just type shortcut)
- Works only in browser (not system-wide)
- Can have multiple shortcuts

**Cons:** 
- Need to install extension

---

## Option 4: Add to Claude Project Instructions (BEST FOR PROJECTS)

Since you're using Claude Projects, you can add this to your **Project Custom Instructions**:

### How:
1. Go to your Claude Project settings
2. Find "Custom Instructions" or "Project Instructions"
3. Add this:
```
At the start of every conversation in this project:
1. Read CLAUDE_CONTEXT.md for full project context
2. Read claude_rules.md for operating rules
3. Check CHANGELOG.md for recent changes
4. Acknowledge you understand I'm non-technical
5. Wait for my specific request

Never ask me to re-explain the tech stack, architecture, or patterns - they're all documented in the context files.