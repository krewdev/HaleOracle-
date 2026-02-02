# Telegram Bot Integration Guide

## ✅ **Now Supports Usernames!**

You can now enter just the Telegram username (e.g., `john_doe`) instead of numeric chat IDs!

## Quick Setup (5 minutes)

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts:
   - Choose a name (e.g., "HALE Oracle Bot")
   - Choose a username (e.g., "hale_oracle_bot")
4. **Copy the bot token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Add Token to Environment

Add to your `.env.local`:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

Restart the backend:
```bash
./start_oracle.sh
```

### 3. Register Users (Choose One Method)

#### **Method A: Automatic (Webhook)**
1. Set up webhook (requires public URL):
   ```bash
   curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook"
   ```
2. Users send `/start` to your bot
3. Bot automatically registers their username → chat_id

#### **Method B: Manual (For Local Testing)**
1. Run the registration script:
   ```bash
   python register_telegram_user.py
   ```
2. Choose option 1 (Register new user)
3. Enter username (e.g., `john_doe`)
4. Get chat ID from `@userinfobot` and enter it
5. Done! Username is now registered

### 4. Use in Frontend

When setting contract requirements, just enter the username:
```
Seller Contact: john_doe
```

Or with @ symbol:
```
Seller Contact: @john_doe
```

The backend will automatically resolve it to the chat ID and send the OTP!

## How It Works

### For Hackathon/Demo:
- **Seller contact** = Telegram `chat_id` (numeric)
- Backend sends OTP directly via Telegram Bot API
- Seller receives message instantly

### For Production:
You'd need to:
1. **User Registration**: Sellers start a chat with the bot
2. **Store Mapping**: Database of `wallet_address -> chat_id`
3. **Lookup**: When OTP is generated, lookup chat_id by wallet address
4. **Send**: Use chat_id to send message

## Message Format

The bot sends:
```
🔐 HALE Oracle Delivery Request

Escrow: 0x1234...
Your OTP: 12345

Submit at: http://localhost:3000/submit?escrow=0x...&seller=0x...&otp=12345
```

## Troubleshooting

### "No TELEGRAM_BOT_TOKEN configured"
- Add `TELEGRAM_BOT_TOKEN` to `.env.local`
- Restart the backend

### "Cannot send to username @username directly"
- Use numeric `chat_id` instead of `@username`
- User must start a chat with the bot first

### "Chat not found"
- User hasn't started a chat with the bot
- Send `/start` to your bot first

## Alternative: Without Telegram

If you don't want to set up Telegram:
1. Leave `TELEGRAM_BOT_TOKEN` empty
2. Backend will print OTP to console
3. Use the shareable link instead:
   ```
   GET /api/get-submission-link/<seller_address>
   ```
4. Copy the link and share manually via Discord/Email

## Example Flow

1. **Buyer deploys escrow**
2. **Buyer sets requirements**:
   - Requirements: "Create ERC20 token"
   - Seller Contact: `987654321` (their chat_id)
3. **Backend detects event** → Sends Telegram message
4. **Seller receives**:
   ```
   🔐 HALE Oracle Delivery Request
   
   Escrow: 0xabc...
   Your OTP: 54321
   
   Submit at: http://localhost:3000/submit?...
   ```
5. **Seller clicks link** → Auto-filled form → Submits code
6. **Oracle verifies** → Auto-releases funds

---

**Status**: ✅ Telegram integration is now **fully functional**!
