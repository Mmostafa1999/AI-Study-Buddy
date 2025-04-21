# Rate Limiting Implementation Guide

This guide provides detailed instructions for implementing rate limiting in your AI Study Buddy application deployed on Vercel.

## Implementation Details

Rate limiting has been implemented with the following configuration:
- 5 requests per 30 seconds per IP address
- Uses Upstash Redis for storage via Vercel KV or direct connection
- Returns a 429 status code with details when limit is exceeded

## Environment Variables Setup

### Option 1: Using Vercel KV (Recommended)

1. **Set up Upstash Redis via Vercel Marketplace**:
   - In your Vercel dashboard, go to your project
   - Navigate to the "Storage" tab
   - Click "Create" next to "Redis" or "KV" in the Marketplace Database Providers section
   - Follow the setup wizard to connect it to your project

2. **Configure Environment Variables**:
   - Vercel will automatically add the required environment variables
   - They will be prefixed based on your selection during setup (e.g., `STORAGE_`, `KV_`, etc.)

### Option 2: Using Upstash Redis Directly

If the Vercel KV approach isn't working, you can use Upstash Redis directly:

1. **Create an Upstash Redis database**:
   - Go to [https://upstash.com/](https://upstash.com/)
   - Sign up or sign in
   - Create a new Redis database

2. **Add Environment Variables to Vercel**:
   - In your Vercel project settings, add these environment variables:
   ```
   UPSTASH_REDIS_REST_URL=your_upstash_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token
   ```

## Troubleshooting

### 1. Logs and Debugging

The application includes detailed logging for rate limiting:

- Check Vercel logs for messages like:
  - "Rate limiting initialized successfully" - Confirms setup is working
  - "Rate limiting disabled: Missing KV environment variables" - Environment issue
  - "Rate limit exceeded for IP: xxx..." - Shows when rate limiting is active

### 2. Common Issues

**Rate limiting not working:**
- Check if environment variables are correctly set in Vercel
- Verify logs to see if rate limiting is being initialized

**Production vs. Development:**
- Rate limiting uses `req.ip` which works properly in Vercel but might behave differently in local development

**Error handling:**
- The app is designed to fall back gracefully if rate limiting fails
- If KV/Redis isn't configured, the API will still work but without rate limiting

## Maintenance

If you need to adjust the rate limiting parameters:

1. Modify the `limiter` parameter in `app/api/ai/chat/route.ts`:
   ```typescript
   limiter: Ratelimit.fixedWindow(5, "30s"), // Change 5 to desired limit, "30s" to desired window
   ```

2. Deploy the changes to Vercel

## Additional Resources

- [Upstash Ratelimit Documentation](https://github.com/upstash/ratelimit)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)

---

For any additional questions or issues with rate limiting, please refer to the logs first to diagnose the problem. 