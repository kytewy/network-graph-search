# New Feature Development Workflow

## Description
This workflow guides you through developing new features within the current project phase, following the phase-based development approach.

## Phase Context
Before starting, identify which development phase you're in:
- **Phase 1-2**: Core infrastructure and document operations
- **Phase 3-4**: LLM integration and database features
- **Phase 5-6**: Visualization and production readiness

## Prerequisites
- [ ] Current project phase is identified
- [ ] Phase-specific workflow has been reviewed
- [ ] PRD is updated with the new feature requirements
- [ ] Implementation impact is assessed against the current phase

## Steps

### 1. Planning Phase
```markdown
1. Review the PRD section for this feature
2. Update `app_flow.md` with new screens/endpoints
3. Update database schema if needed in `db_schema.md`
4. Add implementation steps to `implementation_plan.md`
```

### 2. Implementation Phase
```typescript
// Example: Create a new React component
// 1. Create component file in appropriate directory
// 2. Implement basic structure following project conventions
// 3. Add TypeScript interfaces
// 4. Implement business logic
// 5. Add tests
```

### 3. Testing Phase
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Verify test coverage meets requirements (80%+)
npm run test:coverage
```

### 4. Documentation
- [ ] Update component documentation
- [ ] Add/update API documentation
- [ ] Update README if needed

### 5. Code Review
- [ ] Self-review changes
- [ ] Create pull request
- [ ] Address review comments

## Success Criteria
- [ ] All tests pass
- [ ] Code coverage meets requirements
- [ ] Documentation is updated
- [ ] PR is approved and merged
