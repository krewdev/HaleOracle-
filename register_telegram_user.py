#!/usr/bin/env python3
"""
Manual Telegram User Registration
Use this to register users without setting up webhooks
"""

import json
import os

TELEGRAM_USERS_FILE = 'telegram_users.json'

def load_users():
    """Load existing users"""
    if os.path.exists(TELEGRAM_USERS_FILE):
        with open(TELEGRAM_USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    """Save users to file"""
    with open(TELEGRAM_USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)
    print(f"✅ Saved {len(users)} users to {TELEGRAM_USERS_FILE}")

def register_user():
    """Register a new user"""
    users = load_users()
    
    print("=" * 60)
    print("TELEGRAM USER REGISTRATION")
    print("=" * 60)
    print()
    
    username = input("Enter Telegram username (without @): ").strip().lower()
    if not username:
        print("❌ Username cannot be empty")
        return
    
    print()
    print("To get your Chat ID:")
    print("1. Search for @userinfobot on Telegram")
    print("2. Send it any message")
    print("3. It will reply with your chat ID")
    print()
    
    chat_id = input("Enter Chat ID (numeric): ").strip()
    if not chat_id.isdigit():
        print("❌ Chat ID must be numeric")
        return
    
    users[username] = chat_id
    save_users(users)
    
    print()
    print("✅ User registered successfully!")
    print(f"   Username: @{username}")
    print(f"   Chat ID: {chat_id}")
    print()
    print("You can now use this username in the frontend!")

def list_users():
    """List all registered users"""
    users = load_users()
    
    print("=" * 60)
    print("REGISTERED TELEGRAM USERS")
    print("=" * 60)
    print()
    
    if not users:
        print("No users registered yet.")
    else:
        for username, chat_id in users.items():
            print(f"  @{username} → {chat_id}")
    
    print()
    print(f"Total: {len(users)} users")

def main():
    while True:
        print()
        print("=" * 60)
        print("TELEGRAM USER MANAGER")
        print("=" * 60)
        print()
        print("1. Register new user")
        print("2. List registered users")
        print("3. Exit")
        print()
        
        choice = input("Choose an option: ").strip()
        
        if choice == '1':
            register_user()
        elif choice == '2':
            list_users()
        elif choice == '3':
            print("Goodbye!")
            break
        else:
            print("Invalid choice")

if __name__ == '__main__':
    main()
