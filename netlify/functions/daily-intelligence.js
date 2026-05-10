exports.handler = async function handler(event) {
  const cronToken = process.env.COMMERCE_INTELLIGENCE_CRON_TOKEN;

  if (!cronToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'COMMERCE_INTELLIGENCE_CRON_TOKEN is not configured',
      }),
    };
  }

  const baseUrl =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.DEPLOY_URL ||
    'http://localhost:3000';

  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/analytics/daily-ops`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'netlify-scheduled-function',
        schedule: event?.schedule || null,
      }),
    });

    const payload = await response.text();

    return {
      statusCode: response.status,
      body: payload,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to run daily intelligence job',
      }),
    };
  }
};