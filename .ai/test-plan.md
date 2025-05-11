# Test Plan for 10xFlashCards

## 1. Introduction and Test Objectives

This test plan outlines the testing strategy for the 10xFlashCards application, a web application designed to streamline the creation of educational flashcards using Language Models (LLMs). The primary objectives of testing are to:

- Ensure all core functionalities work as expected
- Verify the application's reliability and performance
- Validate user authentication and security mechanisms
- Ensure proper integration with external services (Supabase, OpenRouter.ai)
- Verify responsive design and accessibility compliance

## 2. Scope of Testing

### In Scope

- Frontend components (Astro pages, React components)
- Backend API endpoints
- Database operations (Supabase)
- AI integration (Deepseek r1/v3 via OpenRouter.ai)
- Authentication flows
- User session management
- Form validation
- Error handling

### Out of Scope

- Infrastructure security testing
- Penetration testing
- Load/stress testing beyond specified benchmarks
- Third-party service performance
- LLM API downtime and reliability
- Mobile-only browser quirks
- Multi-language/locale support (deferred to future releases)

## 3. Types of Tests

### 3.1 Unit Tests

- Test individual React components
- Test utility functions and hooks
- Test API endpoint handlers
- Test database client functions

### 3.2 Integration Tests

- Test interactions between frontend components
- Test communication between frontend and backend services
- Test database operations
- Test authentication flows

### 3.3 End-to-End Tests

- Test complete user journeys
- Test application flows from start to finish

### 3.4 Accessibility Tests

- Test ARIA compliance
- Test keyboard navigation
- Test screen reader compatibility
- Test color contrast ratios
- Test dynamic ARIA announcements for content updates (e.g., flashcard loads)
- Simulate color-blindness and high-contrast mode

### 3.5 Performance Tests

- Test application load times
- Test API response times
- Test LLM integration response times

### 3.6 Security Tests

- Test authentication mechanisms
- Test authorization checks
- Test input validation and sanitization

## 4. Test Scenarios

### 4.1 Authentication

1. User registration
2. User login
3. Password reset
4. Session persistence
5. Session expiration
6. Logout functionality
7. Multi-factor authentication (MFA) flows
8. Email-link authentication flows
9. Social-login provider edge cases
10. Token refresh and expiration error handling

### 4.2 Flashcard Generation

1. Text input validation
2. API request to LLM
3. Error handling during generation
4. Displaying generated flashcards
5. Editing generated flashcards
6. Approving/rejecting flashcards
7. Saving selected flashcards
8. Malformed input handling (HTML, scripts, SQL injection)
9. LLM API rate-limit and throttling errors
10. Network timeouts and retry logic

### 4.3 Flashcard Management

1. Viewing saved flashcards
2. Editing existing flashcards
3. Deleting flashcards
4. Filtering and sorting flashcards
5. Concurrent edits by multiple users
6. Pagination and large list performance
7. Keyboard-only CRUD operations

### 4.4 User Experience

1. Responsive design across devices
2. Form validation feedback
3. Loading states and indicators
4. Error message clarity
5. Accessibility compliance
6. Breadcrumb and back/forward navigation flows
7. Portrait/landscape behavior on mobile devices
8. Field focus and keyboard-only form interaction

## 5. Test Environment

### 5.1 Development Environment

- Local development setup with:
  - Node.js (v18.x)
  - Astro (v5.x) development server
  - Supabase CLI (v2.x) and local Postgres via Docker Compose
  - Mock LLM API responses
  - Environment variables managed via .env

### 5.2 Staging Environment

- Deployed staging instance with:
  - Digital Ocean hosting
  - Supabase staging instance
  - Test LLM API integration

### 5.3 Production Environment

- Production deployed instance with:
  - Digital Ocean hosting
  - Supabase production instance
  - Live LLM API integration

### 5.4 Test Data Management

- Use Jest fixtures and seeding scripts to populate the test database
- Ensure data teardown between tests for isolation
- Use Supabase migrations for consistent schema state
- Manage feature flags and environment configs per test run

## 6. Test Tools

- Jest and React Testing Library for unit/component testing
- Cypress for end-to-end testing
- Playwright for accessibility testing
- Lighthouse for performance testing
- Postman/Thunder Client for API testing
- Axe for accessibility compliance

## 7. Test Schedule

| Phase                 | Duration | Activities                                            |
| --------------------- | -------- | ----------------------------------------------------- |
| Planning              | 1 week   | Finalize test plan, prepare test cases                |
| Unit Testing          | 2 weeks  | Implement unit tests for components and functions     |
| Integration Testing   | 2 weeks  | Implement integration tests between system components |
| End-to-End Testing    | 1 week   | Implement and run E2E test scenarios                  |
| Accessibility Testing | 1 week   | Verify accessibility compliance                       |
| Performance Testing   | 1 week   | Measure and optimize performance                      |
| Security Testing      | 1 week   | Verify authentication and authorization               |
| Regression Testing    | Ongoing  | Run tests after each major change                     |

## 8. Acceptance Criteria

### 8.1 Functional Criteria

- All core features work as specified in requirements
- User authentication functions correctly
- Flashcard generation produces expected results
- Error handling works correctly
- All CRUD operations for flashcards function properly

### 8.2 Non-Functional Criteria

- First Contentful Paint (FCP) <1.5s measured by Lighthouse under Fast 3G emulation
- 90th percentile GET /api/flashcards response time <250ms under staging load of 50 concurrent users
- 95th percentile POST /api/generate-flashcards response time <2s
- LLM API calls complete within 5 seconds
- WCAG 2.1 AA compliance for all pages (Lighthouse audit score ≥90)
- Browser support: latest two versions of Chrome, Firefox, Safari, and Edge

## 9. Roles and Responsibilities

| Role                     | Responsibilities                                         |
| ------------------------ | -------------------------------------------------------- |
| Test Lead                | Oversee test plan execution, report test progress        |
| Frontend Tester          | Test React components, Astro pages, and UI functionality |
| Backend Tester           | Test API endpoints, Supabase integration                 |
| Automation Engineer      | Develop and maintain automated test scripts              |
| Security Tester          | Verify authentication and authorization mechanisms       |
| Accessibility Specialist | Ensure WCAG compliance                                   |

## 10. Bug Reporting Process

1. Bug identification and documentation
2. Severity and priority assignment
3. Developer assignment
4. Fix implementation
5. Verification and closure

### 10.1 Bug Severity Levels

- **Critical**: Application crashes, data loss, security breach
- **High**: Major feature not working, severe usability issues
- **Medium**: Feature working incorrectly but workaround exists
- **Low**: Minor UI issues, non-critical functionality problems

## 11. Test Deliverables

- Test plan document
- Test cases and scripts
- Test execution reports
- Bug reports
- Test summary report

## 12. Risk Assessment and Mitigation

| Risk                                         | Impact | Probability | Mitigation                                            |
| -------------------------------------------- | ------ | ----------- | ----------------------------------------------------- |
| Third-party dependencies (Supabase, LLM API) | High   | Medium      | Version pinning, fallback mechanisms, canary releases |
| Browser compatibility issues                 | Medium | Low         | Cross-browser testing, progressive enhancement        |
| Performance degradation                      | Medium | Medium      | Regular performance testing, optimization sprints     |
| Security vulnerabilities                     | High   | Low         | Regular security audits, keep dependencies updated    |
| CI agent disk space exhaustion               | Medium | Low         | Monitor disk usage, cleanup artifacts between runs    |
| Token revocation or credential leaks         | High   | Low         | Rotate secrets regularly, use least-privilege tokens  |

## 13. Appendix

### 13.1 Test Case Template

Test ID: TC-XXX
Test Name: [Test Name]
Feature: [Feature Name]
Objective: [Test Objective]
Preconditions: [Requirements before test execution]
Test Steps:
[Step 1]
[Step 2]
...
Expected Results: [Expected outcome]
Actual Results: [To be filled during execution]
Status: [Pass/Fail]
Comments: [Additional notes]

### 13.2 Bug Report Template

Bug ID: BUG-XXX
Title: [Brief description]
Severity: [Critical/High/Medium/Low]
Priority: [High/Medium/Low]
Environment: [OS, Browser, Resolution]
Steps to Reproduce:
[Step 1]
[Step 2]
...
Expected Behavior: [What should happen]
Actual Behavior: [What actually happens]
Screenshots/Videos: [Attachments if available]
Assigned To: [Developer name]
Status: [New/In Progress/Fixed/Verified]

## 14. CI/CD Integration

### 14.1 Pipeline Configuration

- GitHub Actions runs on push and pull_request to main
- Jobs:
  - lint: ESLint, style checks
  - test: unit, integration, accessibility tests with coverage
  - e2e: Cypress end-to-end suite
  - performance: Lighthouse audits and reports

### 14.2 Test Gating

- Fail build if code coverage <80% (unit + integration)
- Upload test artifacts (coverage reports, test videos)

### 14.3 Environment & Secrets

- Manage SUPABASE_URL, SUPABASE_KEY, PUBLIC_OPENROUTER_API_KEY via GitHub Secrets
- Rotate secrets monthly with least-privilege policies
- Use ephemeral test DB via Docker Compose in CI
