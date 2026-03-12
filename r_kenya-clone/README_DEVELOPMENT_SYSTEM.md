# WanaIQ Development System - Complete Guide

This repository contains the complete development system for WanaIQ, including custom AI instructions, progress tracking, and technical debt management.

## 📁 Files Overview

### 1. `wanaiq_custom_instructions.md`
**Purpose:** Comprehensive AI assistant instructions for development

**What it contains:**
- Platform identity and mission
- Technical architecture rules
- AI/ML implementation guidelines
- Development workflow standards
- Code quality requirements
- Security and privacy rules
- Performance budgets
- Kenyan context integration

**How to use:**
- Use as reference when asking AI for help
- Copy relevant sections into Claude or other AI assistants
- Follow rules strictly during development
- Update as project evolves

### 2. `progress_tracker.js`
**Purpose:** Automated tracking of development progress

**Features:**
- Milestone progress calculation
- Code metrics (lines, coverage, TypeScript %)
- Technical debt scanning
- Daily report generation
- Checklist generation

**Commands:**
```bash
# Generate daily progress report
node progress_tracker.js report

# Show checklist for specific milestone
node progress_tracker.js checklist M2.1

# Show technical debt summary
node progress_tracker.js debt
```

### 3. `progress_status.json`
**Purpose:** Track individual task completion status

**How to update:**
```json
{
  "M1.1_tasks": {
    "T1.1.1": "done",        // Task completed
    "T1.1.2": "in_progress", // Currently working on
    "T1.1.3": "not_started", // Not started yet
    "T1.1.4": "blocked"      // Blocked by dependency
  }
}
```

**Update this file daily** as you complete tasks.

### 4. `github_workflow_progress.yml`
**Purpose:** Automated CI/CD and progress tracking via GitHub Actions

**Features:**
- Runs automatically on push/PR
- Daily scheduled progress reports
- Security scanning
- Performance checks
- Slack notifications for critical issues

**Setup:**
1. Copy to `.github/workflows/progress.yml`
2. Add secrets: `GIST_SECRET`, `SLACK_WEBHOOK_URL`
3. Commits will trigger automatic tracking

## 🚀 Quick Start Guide

### Day 1: Setup

1. **Copy custom instructions to your AI assistant:**
   ```bash
   cat wanaiq_custom_instructions.md
   # Copy and paste into Claude's custom instructions
   ```

2. **Initialize progress tracking:**
   ```bash
   npm install
   node progress_tracker.js report
   ```

3. **Set up GitHub Actions:**
   ```bash
   mkdir -p .github/workflows
   cp github_workflow_progress.yml .github/workflows/progress.yml
   git add .
   git commit -m "chore: Add progress tracking system"
   git push
   ```

4. **Create your first milestone checklist:**
   ```bash
   node progress_tracker.js checklist M1.1 > M1.1_CHECKLIST.md
   ```

### Daily Development Workflow

#### Morning (Start of coding session):

1. **Generate daily standup:**
   ```bash
   node progress_tracker.js report
   ```

2. **Review current tasks:**
   - Open `progress_status.json`
   - Check tasks marked `in_progress`
   - Review any `blocked` tasks

3. **Set daily goals:**
   - Pick 2-3 tasks to complete today
   - Estimate hours needed
   - Note in your personal log

#### During Development:

4. **Ask AI for help:**
   When asking Claude or other AI:
   ```
   Context: I'm working on WanaIQ, a civic engagement platform.
   
   [Paste relevant section from wanaiq_custom_instructions.md]
   
   Task: [Your specific task]
   
   Requirements:
   - Follow TypeScript standards
   - Include error handling
   - Add tests (80% coverage)
   - Document with JSDoc
   ```

5. **Track technical debt:**
   When you write quick fixes or shortcuts:
   ```typescript
   // TODO: [DEBT-PERF] Optimize this query with indexing (Est: 2h)
   // Current: 500ms, Target: <50ms
   const results = await db.query('SELECT * FROM...');
   ```

6. **Commit frequently:**
   ```bash
   git add .
   git commit -m "feat(civic-agent): Implement routing logic
   
   - Added LLM classification
   - Integrated department routing
   - Added confidence threshold
   
   Relates to: M2.1"
   git push
   ```

#### Evening (End of coding session):

7. **Update task status:**
   ```json
   // progress_status.json
   {
     "M1.1_tasks": {
       "T1.1.1": "done",        // ✅ Completed today
       "T1.1.2": "in_progress", // 🔄 Still working
       "T1.1.3": "not_started"  // 📋 For tomorrow
     }
   }
   ```

8. **Generate end-of-day report:**
   ```bash
   node progress_tracker.js report
   ```

9. **Document blockers:**
   If blocked, note in commit or issue:
   ```bash
   git commit -m "wip: Civic agent routing (BLOCKED)
   
   Issue: Need Groq API credentials
   Action: Requested from team
   ETA: Tomorrow"
   ```

### Weekly Review (Every Friday):

10. **Generate weekly summary:**
    ```bash
    # Review all reports from the week
    ls -la reports/daily_report_*.json
    
    # Check milestone progress
    node progress_tracker.js checklist M2.1
    ```

11. **Record demo video:**
    - Show completed features working end-to-end
    - Demonstrate mobile and desktop
    - Show both English and Swahili
    - Highlight performance metrics

12. **Pay down technical debt:**
    - Spend 20% of Friday on debt reduction
    - Focus on high/critical items first
    - Update debt tracking:
    ```bash
    node progress_tracker.js debt
    ```

13. **Update mentor:**
    - Share demo video
    - Report progress percentage
    - Highlight blockers or risks
    - Request specific feedback

## 🎯 Milestone Completion Checklist

Before marking any milestone as complete:

- [ ] All tasks marked `done` in `progress_status.json`
- [ ] All success criteria met
- [ ] Tests passing (80%+ coverage)
- [ ] No critical technical debt
- [ ] Demo video recorded
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Swahili translations complete

## 🔧 Technical Debt Management

### Adding Technical Debt

When you write code that needs future improvement:

```typescript
// TODO: [DEBT-CATEGORY] Description (Est: Xh)
// Current state, desired state, or impact
```

**Categories:**
- `DEBT-SECURITY`: Security vulnerability
- `DEBT-PERF`: Performance optimization needed
- `DEBT-UX`: User experience improvement
- `DEBT-A11Y`: Accessibility issue
- `DEBT-i18n`: Translation missing
- `DEBT-TEST`: Test coverage gap
- `DEBT-REFACTOR`: Code quality issue

### Managing Debt Thresholds

**Maximum allowed:**
- Critical (SECURITY): 0 items
- High (PERF, UX, i18n): 5 items total
- Medium (A11Y, TEST): 10 items
- Low (REFACTOR): 20 items

**Weekly paydown:**
- Every Friday: 20% of sprint time
- Before each milestone: All critical resolved
- Before launch (M3.3): All high resolved

### Tracking Debt

```bash
# See all technical debt
node progress_tracker.js debt

# Output example:
# TECHNICAL DEBT SUMMARY:
# {
#   "critical": 0,
#   "high": 3,
#   "medium": 7,
#   "low": 12,
#   "byCategory": {
#     "SECURITY": [],
#     "PERF": ["Optimize vector search", ...],
#     ...
#   }
# }
```

## 📊 Metrics Dashboard

### Code Metrics (Target)

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Test Coverage | ≥80% | <60% blocks merge |
| TypeScript % | ≥90% | <70% blocks merge |
| Bundle Size | <200KB | >250KB blocks merge |
| Lighthouse Score | ≥90 | <80 blocks deploy |

### Performance Metrics (Target)

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Response (p95) | <200ms | >500ms blocks deploy |
| Page Load (LCP) | <2.5s | >3.5s blocks deploy |
| Database Query | <50ms | >200ms needs fix |
| AI Inference | <2s | >5s needs optimization |

### Tracking Metrics

```bash
# Automated via GitHub Actions
# Manual check:
npm run test:coverage
npm run build
npm run lighthouse
```

## 🚨 Crisis Protocols

### When AI Gives Wrong Information

1. Flag conversation for review
2. Log query, response, sources
3. If critical (voting info), disable feature
4. Post correction in UI
5. Update RAG knowledge base
6. Notify affected users

### When System is Down

1. Check monitoring dashboard
2. Review error logs (Sentry)
3. Implement fallback:
   - Show cached content
   - Display static FAQ
   - Enable offline PWA mode
4. Estimate restoration time
5. Update users via status page

### When Security Issue Found

1. Immediately create private issue
2. Assess severity (P0-P3)
3. If P0 (data breach):
   - Notify users within 24h
   - Engage legal team
   - Document incident
4. Fix and deploy patch
5. Conduct post-mortem

## 📝 Code Quality Checklist

Every PR must include:

- [ ] TypeScript types (no `any`)
- [ ] Error handling (`try/catch`)
- [ ] JSDoc documentation
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] Loading states in UI
- [ ] Mobile responsive
- [ ] ARIA labels for accessibility
- [ ] Swahili translations
- [ ] No hardcoded credentials
- [ ] Performance tested

## 🎓 AI Assistant Prompting Tips

### For Feature Development:

```
Context: WanaIQ civic engagement platform
Milestone: M2.1 - Civic Agent Router
Task: Implement LLM classification logic

Requirements from custom instructions:
- Use Llama 3 via Groq API
- Temperature: 0.3 for factual accuracy
- Confidence threshold: 0.8
- 6 issue categories
- TypeScript with strict types
- Include error handling
- Add tests (80% coverage)

Please generate the classification function.
```

### For Debugging:

```
Context: WanaIQ - working on [feature]
Error: [paste error message]

From custom instructions:
- Use structured error handling
- Log with Sentry
- Never silent failures
- Provide user-friendly messages

How should I fix this following our standards?
```

### For Code Review:

```
Context: WanaIQ PR review
Code: [paste code]

Check against custom instructions:
- TypeScript compliance
- Error handling
- Performance (is this <200ms?)
- Security (any vulnerabilities?)
- Accessibility (ARIA labels?)
- i18n (hardcoded strings?)

What issues do you see?
```

## 🔄 Git Workflow

### Branch Naming

```bash
feature/m2.1-civic-agent-router
bugfix/rag-citation-formatting
hotfix/authentication-token-expiry
```

### Commit Messages

```bash
git commit -m "feat(civic-agent): Implement routing logic

- Added LLM classification with 6 categories
- Integrated department routing
- Added confidence threshold (0.8)

Tests: 90% coverage
Performance: <2s response time
Relates to: M2.1"
```

### PR Template

```markdown
## Description
[What does this PR do?]

## Milestone
Relates to: M2.1 - Civic Agent Router

## Checklist
- [ ] Tests passing (80%+ coverage)
- [ ] TypeScript (no `any`)
- [ ] Error handling
- [ ] Documentation
- [ ] Mobile responsive
- [ ] Swahili translations
- [ ] Performance tested
- [ ] Security reviewed

## Demo
[Link to demo video or screenshots]

## Technical Debt
[Any debt items added? List them]
```

## 📚 Additional Resources

### Documentation
- Technical Roadmap: `WanaIQ_Technical_Roadmap_FINAL_SUBMISSION__1_.pdf`
- Project Proposal: `WanaIQ_Proposal.pdf`
- Custom Instructions: `wanaiq_custom_instructions.md`

### Tools
- Progress Tracker: `progress_tracker.js`
- GitHub Actions: `.github/workflows/progress.yml`
- Status Tracking: `progress_status.json`

### Contacts
- Mentor Check-ins: Weekly (see milestone schedule)
- Technical Support: [via hackathon portal]
- Emergency: [define escalation path]

## 🎯 Success Criteria (Final Launch)

By March 28, 2026, WanaIQ must achieve:

✅ **Technical Excellence:**
- 99.9% uptime
- <2.5s page load
- 80%+ test coverage
- Zero critical security issues
- Zero critical technical debt

✅ **Feature Completeness:**
- Civic Agent routing (90%+ accuracy)
- RAG Pipeline (85%+ accuracy)
- CivicClips processing (<2min)
- Gamification system
- Mobile PWA (Lighthouse >90)

✅ **User Experience:**
- English + Swahili fully supported
- Mobile-optimized
- Offline capability
- <200ms API response
- Accessible (WCAG 2.1 AA)

✅ **Deliverables:**
- Production platform live
- Demo video (<5 min)
- Complete documentation
- 500+ active users
- User satisfaction NPS >40

---

**Last Updated:** February 6, 2026
**Version:** 1.0
**Maintained by:** WanaIQ Development Team

For questions or support, refer to the custom instructions or contact via hackathon portal.
