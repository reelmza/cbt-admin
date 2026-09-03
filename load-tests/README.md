# Exam load test

This Artillery scenario represents 200 distinct students using `USER1` through
`USER200`. It spreads 120 logins over one minute, injects a peak of 40 virtual
students in one second, then adds 40 more users gradually.

It performs the following sequence for every virtual user:

1. Complete student login.
2. Capture the returned JWT.
3. Wait one second.
4. Start the configured assessment using that JWT.

## Run locally

Start the backend on port 4000, then run:

```powershell
npm run load:exam
```

To write an HTML report after a run:

```powershell
npm run load:exam:report
```

For another environment or assessment, update `target` or `assessmentId` in
`exam-flow.yml` before running the test.

The test fails when the aggregate p95 latency exceeds 5 seconds, p99 exceeds
40 seconds, or more than 1% of virtual users fail. It does not include answer
submissions yet; add that phase only with the exact save-answer endpoint and
JSON payload.
