

### 1. Start Development Server
```bash
# Start with QR code for easy sharing
npx expo start

# Start with specific platform
npx expo start --android
npx expo start --ios
npx expo start --web

# Clear cache if needed
npx expo start --clear
```

### 2. Share via Expo Go
## 📱 Publishing Updates (EAS Update)

For persistent hosting and easy updates:

### Initial Setup (One-time)
```bash
# Configure EAS Update for your project
eas update:configure

# Login to Expo account (if not already logged in)
npx expo login

# Check who you're logged in as
npx expo whoami
```

### Publishing Updates
```bash
# Publish to production branch
eas update --branch production --message "Latest experiments"

# Publish to development branch  
eas update --branch development --message "Testing new features"

# Publish with automatic message
eas update --branch production --auto

# Publish to specific runtime version
eas update --branch production --runtime-version 1.0.0
```

### Managing Updates
```bash
# List published updates
eas update:list --branch production
eas update:list --branch development

# View update details
eas update:view [UPDATE_ID]

# Delete an update
eas update:delete [UPDATE_ID]
```

---
