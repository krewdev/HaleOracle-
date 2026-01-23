# Circle API Authentication Troubleshooting

## Current Status

✅ **API Key Format**: Correct (3 parts detected)
✅ **Entity Secret**: Found
❌ **Authentication**: Failing with "Invalid credentials"

## Common Causes & Solutions

### 1. API Key Not Activated
**Problem**: API key exists but hasn't been activated
**Solution**: 
- Go to https://console.circle.com/
- Navigate to API Keys
- Ensure the key shows as "Active" (not "Pending" or "Revoked")
- If pending, click "Activate" or regenerate

### 2. Wrong Environment
**Problem**: Using production key with sandbox API or vice versa
**Solution**:
- Verify your API key prefix matches the environment
- `TEST_API_KEY:` → Use `https://api-sandbox.circle.com`
- `LIVE_API_KEY:` → Use `https://api.circle.com`
- Check in Circle Console which environment the key is for

### 3. Missing Permissions
**Problem**: API key doesn't have wallet permissions
**Solution**:
- In Circle Console, check API key permissions
- Ensure "Wallets" or "Programmable Wallets" permission is enabled
- Regenerate key with correct permissions if needed

### 4. API Key Revoked/Expired
**Problem**: Key was revoked or expired
**Solution**:
- Check key status in Circle Console
- Create a new API key if revoked
- Copy the new key in full format: `TEST_API_KEY:key_id:key_secret`

### 5. Incorrect Key Copy
**Problem**: Key was copied incorrectly (missing characters, extra spaces)
**Solution**:
- Re-copy the API key from Circle Console
- Ensure no leading/trailing spaces in `.env` file
- Verify all three parts are present

## Verification Steps

### Step 1: Check API Key in Console
1. Go to https://console.circle.com/
2. Navigate to **API Keys** or **Developer Settings**
3. Find your API key
4. Verify:
   - Status is "Active"
   - Environment matches (Sandbox/Production)
   - Permissions include "Wallets"

### Step 2: Verify .env File
```bash
# Check your .env file
cat .env | grep CIRCLE_API_KEY

# Should show:
# CIRCLE_API_KEY=TEST_API_KEY:key_id:key_secret
# (with no spaces around the =)
```

### Step 3: Test Authentication
```bash
source venv/bin/activate
python3 verify_circle_credentials.py
```

### Step 4: Try Regenerating Key
If all else fails:
1. In Circle Console, revoke the current key
2. Create a new API key
3. Copy the **complete** key (all 3 parts)
4. Update `.env` file
5. Test again

## Alternative: Use Traditional Wallets

If Circle API continues to have issues, you can use traditional wallets instead:

1. **Generate a wallet** using a tool like MetaMask or `eth-account`
2. **Get the private key** and address
3. **Update `.env`**:
   ```env
   HALE_ORACLE_ADDRESS=0xYourWalletAddress
   ORACLE_PRIVATE_KEY=0xYourPrivateKey
   ```
4. **Use the traditional backend**:
   ```bash
   ./run.sh hale_oracle_backend.py
   ```

## Getting Help

- **Circle Support**: https://support.circle.com/
- **Circle Developer Docs**: https://developers.circle.com/
- **Circle Discord/Community**: Check Circle's developer community

## Quick Test

Run this to test your credentials:

```bash
source venv/bin/activate
python3 verify_circle_credentials.py
```

This will show exactly what's wrong with your authentication.
