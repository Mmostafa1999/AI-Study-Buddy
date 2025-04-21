# Rate Limiting Setup for AI Study Buddy

This document explains how rate limiting has been implemented in the AI Study Buddy application and what you need to do to properly configure it when deploying to Vercel.

## Implementation Details

Rate limiting has been added to the `/api/ai/chat` endpoint with the following configuration:
- 5 requests per 30 seconds per IP address
- Uses Vercel KV (Redis) for storage
- Returns a 429 status code with details when limit is exceeded

## Required Environment Variables

To make rate limiting work correctly with Vercel KV, you need to add the following environment variables to your Vercel project:

```
KV_URL=your_kv_url_from_vercel
KV_REST_API_URL=your_kv_rest_api_url_from_vercel
KV_REST_API_TOKEN=your_kv_rest_api_token_from_vercel
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token_from_vercel
```

## How to Set Up Vercel KV

1. **Create a KV Database in Vercel/Upstash**:
   - Go to your Vercel dashboard
   - Navigate to the Storage tab
   - In the Marketplace Database Providers section, click "Create" next to the KV/Redis option
   - Follow the setup wizard to connect to your project

2. **Connect the KV Database to Your Project**:
   - Choose your AI Study Buddy project during the setup process
   - Click "Connect"
   - Vercel will automatically add the required environment variables to your project

3. **Local Development**:
   - After creating the KV database, you need to copy the environment variables to your `.env.local` file
   - From your Vercel dashboard, go to your project Settings > Environment Variables
   - Copy the KV_* variables (they'll be prefixed based on what you chose during setup)
   - Add them to your `.env.local` file

## Fallback Behavior

The application has been configured to gracefully handle missing KV environment variables:

1. If KV is not configured, rate limiting will be disabled but the application will continue to function.
2. If KV is configured but encounters errors, the application will log warnings and continue without rate limiting.

This ensures that development can continue even without a proper KV setup, while production environments will have rate limiting enabled.

## Testing Rate Limiting

To test if rate limiting is working properly:
1. Send 6 requests in quick succession to the `/api/ai/chat` endpoint
2. The first 5 should succeed
3. The 6th should fail with status code 429
4. Wait 30 seconds and try again - it should work

## Troubleshooting

If rate limiting isn't working properly:

1. **Check KV Connection**:
   - Make sure your Vercel KV database is properly connected
   - Verify the environment variables are correctly set
   - For local development, copy the actual values from Vercel to your `.env.local` file

2. **Logs**:
   - Check the Vercel logs or your local development logs for warnings about KV configuration
   - Look for messages like "Rate limiting is disabled: KV not configured"

3. **API Response**:
   - The API returns detailed error messages when rate limiting is applied
   - Check the response body for error details

## Note on IP Identification

The rate limiting uses `req.ip` to identify clients. In Vercel, this correctly identifies the client's IP. During local development, this might not be as accurate and may need adjustments for testing. 