# Telegram Setup – Quick Start

Sellers can receive the OTP and submission link via Telegram. Here’s how to set it up.

---

## 1. Create a Telegram Bot

1. In Telegram, search for **@BotFather**.
2. Send: `/newbot`
3. Follow the prompts:
   - **Name:** e.g. `HALE Oracle Bot`
   - **Username:** e.g. `hale_oracle_bot` (must end in `bot`)
4. Copy the **token** BotFather gives you (e.g. `123456789:ABCdefGHI...`).

---

## 2. Add the Token to Your Environment

Add to `.env` or `.env.local` in the project root:

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

Restart the backend:

```bash
./start_oracle.sh
```

---

## 3. Register Sellers (so the bot can message them)

The bot can only message users who have **started** a chat with it. You have two ways to register them.

### Option A: Sellers start the bot (recommended)

1. Share your bot link with the seller:  
   `https://t.me/YourBotUsername`  
   (e.g. `https://t.me/hale_oracle_bot`)
2. Seller opens the link and taps **Start** (or sends `/start`).
3. Backend stores their username → chat_id automatically **if you use the webhook** (see TELEGRAM_SETUP.md).  
   For **local testing**, use Option B instead.

### Option B: Manual registration (local / no webhook)

1. Seller gets their **Chat ID**:
   - In Telegram, search for **@userinfobot**.
   - Send it any message; it replies with your **Id** (e.g. `123456789`). That’s the Chat ID.
2. In the project root, run:

   ```bash
   python register_telegram_user.py
   ```

3. Choose **1** (Register new user).
4. Enter the seller’s **Telegram username** (without `@`), e.g. `john_doe`.
5. Enter the **Chat ID** from step 1 (e.g. `123456789`).
6. Done. That username is now registered.

---

## 4. What the Buyer Enters in the App

When the buyer sets requirements (Deploy → Configure & Fund Escrow), in **Seller Telegram (Optional)** they enter the seller’s Telegram identity:

- **Username:** `john_doe` or `@john_doe`
- **Or Chat ID:** `123456789` (if the seller has no username, use the numeric Chat ID from @userinfobot)

If this is left empty, the buyer gets the OTP/link on the success screen and must share it with the seller manually (copy link or Escrow + OTP).

---

## 5. Summary Checklist

| Step | Who | Action |
|------|-----|--------|
| 1 | You | Create bot with @BotFather, get token |
| 2 | You | Add `TELEGRAM_BOT_TOKEN` to `.env`, restart backend |
| 3 | Seller | Start your bot (or you register them with `register_telegram_user.py`) |
| 4 | Buyer | In “Seller Telegram”, enter seller’s `@username` or Chat ID |

---

## Troubleshooting

- **“No TELEGRAM_BOT_TOKEN configured”**  
  Set `TELEGRAM_BOT_TOKEN` in `.env` / `.env.local` and restart the backend.

- **“Username not found in database”**  
  Seller must either send `/start` to your bot (with webhook) or be added via `python register_telegram_user.py`.

- **Seller has no Telegram username**  
  Use their **Chat ID** (from @userinfobot) in “Seller Telegram” and register that Chat ID with `register_telegram_user.py` using a placeholder like `chat_123456789`.

- **Don’t want to use Telegram**  
  Leave `TELEGRAM_BOT_TOKEN` empty. The buyer will see the OTP and submission link on the success screen and can share it by copy/paste (e.g. Discord, email).

For webhook setup and more detail, see **TELEGRAM_SETUP.md**.
