require('./tracing');

const pino = require('pino');
const logger = pino({ level: 'info' });

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const processedEvents = new Set();

const validEvents = ['order_created', 'order_updated', 'order_cancelled', 'payment_processed', 'payment_failed'];

app.post('/webhook', (req, res) => {
  const payload = req.body;

  if (!payload.event || !payload.traveler_id || !payload.event_id) {
    logger.warn({ payload }, 'Invalid payload: missing required fields');
    return res.status(400).json({ 
      error: 'Missing required fields: event, traveler_id, event_id' 
    });
  }

  if (!validEvents.includes(payload.event)) {
    logger.warn({ event: payload.event }, 'Invalid event type');
    return res.status(400).json({
      error: `Invalid event type. Must be one of: ${validEvents.join(', ')}`
    });
  }

  if (processedEvents.has(payload.event_id)) {
    logger.info({ event_id: payload.event_id }, 'Duplicate event detected, skipping');
    return res.status(200).json({ 
      status: 'already_processed', 
      event_id: payload.event_id 
    });
  }

  processedEvents.add(payload.event_id);
  logger.info({ event: payload.event, traveler_id: payload.traveler_id, event_id: payload.event_id }, 'Event received');

  processEvent(payload);

  res.status(200).json({ 
    status: 'received', 
    event: payload.event,
    event_id: payload.event_id 
  });
});

async function processEvent(payload) {
  logger.info({ event: payload.event, event_id: payload.event_id }, 'Processing event');

  try {
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'elastic-observability-demo',
        event: payload.event,
        traveler_id: payload.traveler_id,
        event_id: payload.event_id
      })
    });

    await response.json();
    logger.info({ event_id: payload.event_id }, 'ERP API call successful');

  } catch (error) {
    logger.error({ event_id: payload.event_id, error: error.message }, 'ERP API call failed');
  }
}

const PORT = 3000;
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Elastic Observability Demo running');
});