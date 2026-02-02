#!/usr/bin/env python3
"""
Quick Telegram user registration
Usage: python add_telegram_user.py <username> <chat_id>
"""

import json
import sys
import os

TELEGRAM_USERS_FILE = 'telegram_users.json'

def add_user(username, chat_id):
    # Load existing users
    users = {}
    if os.path.exists(TELEGRAM_USERS_FILE):
        with open(TELEGRAM_USERS_FILE, 'r') as f:
            users = json.load(f)
    
    # Add new user
    username = username.strip().lower().lstrip('@')
    users[username] = str(chat_id)
    
    # Save
    with open(TELEGRAM_USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)
    
    print(f"✅ Registered: @{username} → {chat_id}")
    print(f"Total users: {len(users)}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python add_telegram_user.py <username> <chat_id>")
        print("Example: python add_telegram_user.py john_doe 123456789")
        sys.exit(1)
    
    add_user(sys.argv[1], sys.argv[2])
