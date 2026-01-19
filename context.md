# Project Context

> Central source of truth for task tracking and agent handoffs.
> Updated: 2024-12-24

## Current Sprint

### Active Tasks
| Task | Status | Agent | Notes |
|------|--------|-------|-------|
| - | - | - | No active tasks |

### Completed Tasks
| Task | Completed | Agent |
|------|-----------|-------|
| Skills & Agents Setup | 2024-12-24 | Main |

## Architecture Decisions

### Frontend
- **Framework**: React 19.2 with TypeScript
- **State Management**: React hooks only (no Redux)
- **Animations**: Framer Motion with `useReducedMotion` accessibility
- **Charts**: Recharts for session timeline visualization

### Backend
- **Runtime**: Node.js 18 with Express
- **Database**: PostgreSQL (Cloud SQL)
- **API Pattern**: RESTful with `{ success, data }` response format

### Deployment
- **Full-Stack**: Google Cloud Run
- **Frontend-Only**: GitHub Pages
- **CI/CD**: GitHub Actions

## Agent Handoff Log

### Template
```markdown
### [Date] - [Agent Name]
**Task**: What was requested
**Findings**:
- Finding 1
- Finding 2
**Actions Taken**:
- Action 1
- Action 2
**Recommendations**:
- Next step 1
- Next step 2
```

### Handoff History

#### 2024-12-24 - Initial Setup
**Task**: Set up Skills and Sub-agents system
**Findings**:
- Project uses React 19.2 + TypeScript frontend
- Express.js backend with PostgreSQL
- Framer Motion animations throughout
- Dual deployment (Cloud Run + GitHub Pages)
**Actions Taken**:
- Created 3 Skills: react-component, api-endpoint, database-query
- Created 3 Agents: frontend-reviewer, api-developer, deployment-manager
- Skills and agents stored in project `.claude/` folder
**Recommendations**:
- Use frontend-reviewer for component code reviews
- Use api-developer for new endpoints
- Use deployment-manager for Cloud Run operations

---

## Quick Reference

### Invoke Skills
Skills are triggered automatically based on keywords in your prompt.

### Invoke Agents
```
> Use the frontend-reviewer agent to [task]
> Use the api-developer agent to [task]
> Use the deployment-manager agent to [task]
```

### Update This File
After completing a task, update:
1. Move task from "Active" to "Completed"
2. Add entry to "Agent Handoff Log"
3. Update any architecture decisions if changed
