---
trigger: always_on
---

KISS Principle - Keep It Simple, Stupid

Core Simplicity Rules
• Start with the absolute minimum - build only what's needed for POC/baseline functionality
• One function = one job - every function should do exactly one thing
• If it takes more than 5 minutes to explain, it's too complex
• No premature optimization - make it work first, optimize later
• No clever code - prefer obvious solutions over "smart" ones
• Maximum 20 lines per function - if longer, break it down

POC/Baseline Development Workflow

1. Define the single core feature you're building
2. Write the simplest version that works
3. Test it immediately
4. If it works, move to next feature
5. If it doesn't work, simplify further
6. Only refactor after everything works

Simplicity Checklist
Before writing any code, ask:
• Is this the simplest way to solve this problem?
• Can I Google for an existing solution?
• Would a junior developer understand this in 30 seconds?
• Am I solving the actual problem or building unnecessary features?
• Can I delete any part of this and still achieve the goal?

Code Simplicity Guidelines
• Use built-in functions instead of writing custom logic
• Hardcode values initially - make them configurable later
• Use basic data types - avoid complex nested structures for POC
• Write direct, linear code - avoid callbacks, promises, complex async for baseline
• Use simple variable names - user, doc, result not userRepositoryInstance
• Minimal error handling - basic try/catch, don't over-engineer

What NOT to Do in POC Phase
• ❌ Don't build authentication until you need it
• ❌ Don't add caching until you have performance issues
• ❌ Don't create abstract classes or complex inheritance
• ❌ Don't add logging frameworks - use simple print/console.log
• ❌ Don't build configuration systems - use environment variables
• ❌ Don't add database migrations - start with simple schema
• ❌ Don't build admin interfaces - use direct database access
• ❌ Don't add real-time features until basic CRUD works

API Simplicity Rules
• Use basic HTTP methods - GET, POST, PUT, DELETE
• Simple JSON responses - no complex nested objects
• Basic status codes - 200, 400, 404, 500
• No authentication initially - add it after core functionality works
• Hardcode test data - don't build data seeders yet
• Use simple endpoint names - /users, /documents, not /api/v1/resources/users

Database Simplicity Rules
• Start with simple tables - avoid complex relationships initially
• Use basic data types - string, integer, boolean, datetime
• No foreign keys initially - store simple IDs
• No indexes until you have performance issues
• No stored procedures - keep logic in application code
• Use simple ORMs - avoid complex query builders

When to Add Complexity
Only add complexity when:
• The simple version is working perfectly
• You have a specific problem that needs solving
• You can clearly explain why the complexity is necessary
• You've tested the simple version thoroughly
• You have actual users asking for the feature

Emergency Simplification
If you're stuck or code is getting complex:

1. Stop immediately
2. Delete the complex code
3. Write the simplest version that could possibly work
4. Test it
5. Only add complexity if absolutely necessary

KISS Mantras
• "Make it work, then make it good"
• "The best code is no code"
• "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away"
• "If you can't explain it simply, you don't understand it well enough"
• "Good enough is perfect for POC"

Remember: Complex code can always be simplified, but simple code that works is immediately valuable.
