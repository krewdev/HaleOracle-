# Circle API Key Format

## Important: API Key Format

Circle API keys have a **specific three-part format** separated by colons:

```
TEST_API_KEY:key_id:key_secret
```

or

```
LIVE_API_KEY:key_id:key_secret
```

## Format Breakdown

1. **Environment prefix**: `TEST_API_KEY` (sandbox) or `LIVE_API_KEY` (production)
2. **Key ID**: Your API key identifier
3. **Key Secret**: Your API key secret

## Example

```env
CIRCLE_API_KEY=TEST_API_KEY:abc123def456:xyz789secret
```

## Where to Find These Values

1. Go to https://console.circle.com/
2. Navigate to **API Keys** section
3. Create or view your API key
4. You'll see:
   - **API Key**: This is the full key in format `TEST_API_KEY:key_id:key_secret`
   - **Entity Secret**: This is a separate value (used for wallet operations)

## Common Mistakes

❌ **Wrong**: `TEST_API_KEY:secret_only` (missing key_id)
❌ **Wrong**: `your-api-key-here` (missing format)
✅ **Correct**: `TEST_API_KEY:key_id:key_secret`

## Entity Secret

The **Entity Secret** (also called User Token) is a **separate value** from the API key:

```env
CIRCLE_API_KEY=TEST_API_KEY:key_id:key_secret
CIRCLE_ENTITY_SECRET=your-entity-secret-here
```

The Entity Secret is used for:
- Creating wallets
- Creating addresses
- Signing transactions

## Verification

To verify your API key format is correct, run:

```bash
source venv/bin/activate
python3 test_circle_api.py
```

This will test the API connection and show any format issues.

## Troubleshooting

### "malformed API key" error
- Check that your API key has exactly 3 parts separated by colons
- Format: `TEST_API_KEY:part1:part2`

### "401 Unauthorized" error
- Verify API key is correct
- Check you're using the right environment (sandbox vs production)
- Ensure Entity Secret is set for wallet operations

### "404 Not Found" error
- API endpoint might be wrong (should be `/v1/w3s/wallets`)
- Check Circle API documentation for latest endpoints
