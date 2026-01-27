---
name: spec-editor
description: Create and update specification files in the specs/ directory. Use when the user wants to write, edit, or review specs for features, or when discussing requirements that should be documented as specs.
---

# Spec Editor

Create and manage specification files that define features for implementation.

## Quick Start

Specs live in `specs/<name>.md`. To create a new spec:

```bash
# Check existing specs
ls specs/
```

Then create or edit the spec file following the template below.

## Spec Template

Every spec should follow this structure:

```markdown
# <Feature Name>

## Overview
Brief description of what this feature does and why it's needed.

## Requirements
- Requirement 1
- Requirement 2

## Implementation Details
Used libraries, algorithms, data structures, etc.

## Related specs
- Bidirectional mention of any related specs
```

## Rules

1. **Be Specific**: Each requirement should be testable and unambiguous
2. **Stay Focused**: One spec per feature; split large features into multiple specs
3. **Use Existing Patterns**: Reference existing code patterns in the codebase
4. **Define Boundaries**: Clearly state what is in and out of scope
5. **Include Examples**: Concrete examples clarify intent better than abstract descriptions

## Workflows

### Creating a New Spec

1. Gather requirements from the user
2. Identify the feature name (use kebab-case for filename)
3. Write the spec following the template
4. Save to `specs/<feature-name>.md`
5. Review with user for completeness

### Updating an Existing Spec

1. Read the current spec
2. Identify what needs to change
3. Make targeted updates
4. Preserve sections that don't need changes

### Reviewing a Spec

Check for:
- Clear, testable requirements
- Complete implementation details
- Realistic scope
- Concrete examples
- Defined testing approach