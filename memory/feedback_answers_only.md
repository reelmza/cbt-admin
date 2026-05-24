---
name: feedback-answers-only
description: For diagnostic or explanatory questions, return text answers only — do not edit files or write code unless explicitly asked to make a change
metadata:
  type: feedback
---

When the user asks "why does X happen", "what is wrong with Y", or any diagnostic/explanatory question, return a text explanation only. Do not edit files.

**Why:** User explicitly said "Just return answers not update the code."

**How to apply:** Only touch files when the user explicitly asks for a fix or says "update", "add", "change", etc. Questions are answers-only.
