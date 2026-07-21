# Webhook Demo — ERP Integration Prototype

A Node.js prototype demonstrating a webhook-based integration pattern 
between an event source and an ERP system.

## What it does

- Receives webhook events via a POST endpoint
- Validates incoming payloads
- Detects and skips duplicate events using idempotency keys
- Processes events asynchronously so the sender never waits on the ERP
- Calls an external ERP API and handles success and failure responses

## Why these decisions

**Async processing:** The webhook sender receives a 200 response immediately.
The ERP call happens in the background. This ensures slow ERP response times 
never block the event source.

**Idempotency:** Each event carries a unique event_id. If the same event 
arrives twice (common in distributed systems due to retries), it is detected 
and skipped. The ERP is only called once per event.

**Payload validation:** Invalid payloads are rejected with a 400 before 
any processing occurs.

## How to run it

Install dependencies:
npm install

Start the server:
node server.js

Send a test event:
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "booking_created", "traveler_id": "T-001", "event_id": "EVT-123"}'

Send the same event again to test idempotency:
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "booking_created", "traveler_id": "T-001", "event_id": "EVT-123"}'

## Tech stack

- Node.js
- Express