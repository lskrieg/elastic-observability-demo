const express = require('express');
const app = express();

app.use(express.json());

// Simple in-memory store for processed event IDs
// In production this would be a database or Redis
const processedEvents = new Set();

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const payload = req.body;

  // Step 1: Validate the payload
  if (!payload.event || !payload.traveler_id || !payload.event_id) {
    console.log('Invalid payload:', payload);
    return res.status(400).json({ 
      error: 'Missing required fields: event, traveler_id, event_id' 
    });
  }

  // Step 2: Check for duplicate
  if (processedEvents.has(payload.event_id)) {
    console.log(`Duplicate event detected: ${payload.event_id} — skipping`);
    return res.status(200).json({ 
      status: 'already_processed', 
      event_id: payload.event_id 
    });
  }

  // Step 3: Record the event ID before processing
  processedEvents.add(payload.event_id);
  console.log(`Event received: ${payload.event} for traveler ${payload.traveler_id}`);

  // Step 4: Process asynchronously
  processEvent(payload);

  // Step 5: Respond immediately
  res.status(200).json({ 
    status: 'received', 
    event: payload.event,
    event_id: payload.event_id 
  });
});

// Simulate calling an ERP API after receiving the event
async function processEvent(payload) {
  console.log(`Processing event: ${payload.event}...`);

  try {
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'BizAway',
        event: payload.event,
        traveler_id: payload.traveler_id,
        event_id: payload.event_id
      })
    });

    const data = await response.json();
    console.log(`ERP API call successful for event: ${payload.event_id}`);

  } catch (error) {
    console.log('ERP API call failed:', error.message);
    // In production: send to dead-letter queue for retry
  }
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`BizAway webhook server running on port 3000`);
});