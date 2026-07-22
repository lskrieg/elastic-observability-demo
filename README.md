# Elastic Observability Demo

A Node.js webhook service instrumented with OpenTelemetry, sending traces 
and metrics to Elastic Observability (APM).

## What it does

- Receives webhook events via a POST endpoint
- Validates incoming payloads
- Detects and skips duplicate events using idempotency keys
- Processes events asynchronously so the sender never waits on downstream services
- Calls an external API and handles success and failure responses
- Emits distributed traces, metrics, and logs to Elastic via OTLP

## Architecture