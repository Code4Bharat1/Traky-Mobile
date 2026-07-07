# Task Tracker Mobile App

React Native mobile application for the Task Tracker system.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   cp app.json.example app.json
   ```

3. **Update `.env` with your local IP:**
   - Windows: Run `ipconfig` to find your IPv4 address
   - Mac/Linux: Run `ifconfig` to find your IP
   - Update `EXPO_PUBLIC_API_URL` in `.env`:
     ```
     EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api/v1
     ```

4. **Ensure backend is running and firewall allows connections:**
   - Start the backend server on port 5000
   - Windows: Add firewall rule for port 5000:
     ```powershell
     netsh advfirewall firewall add rule name="Node.js Port 5000" dir=in action=allow protocol=TCP localport=5000
     ```

5. **Make sure your device and PC are on the same Wi-Fi network**

## Run

```bash
npm start
```

Then scan the QR code with Expo Go app on your physical device.

## Project Structure

- `src/api/` - API client and service functions
- `src/components/` - Reusable UI components
- `src/navigation/` - Navigation configuration for each role
- `src/screens/` - Screen components organized by role
- `src/store/` - Zustand state management stores

## Roles

The app supports multiple user roles with different screens:
- Admin
- Department Head
- Lead
- Employee
