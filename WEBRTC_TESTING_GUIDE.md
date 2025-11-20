# WebRTC Connection Testing Guide

## How to Verify TURN Server Functionality

Since you cannot test from the same machine/network easily, here are the best ways to verify TURN server usage:

### 🔍 Method 1: Check Console Logs (Easiest)

1. Open the interview room in your browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Look for ICE candidate logs:

**What to look for:**
```
🔵 ICE Candidate [TURN (relay)]: candidate:... typ relay ...
🔵 ICE Candidate [STUN (server reflexive)]: candidate:... typ srflx ...
🔵 ICE Candidate [Host (local)]: candidate:... typ host ...
```

**TURN is working if you see:**
- ✅ Candidates with `[TURN (relay)]`
- ✅ When connected, logs showing: `Local candidate: 🔄 TURN (relay)`
- ✅ The connection diagnostics badge showing "TURN (Relay)"

### 📊 Method 2: Connection Diagnostics UI (Built-in)

Once connected, you'll see a diagnostics card in the top-right corner showing:
- **Connection Type:** Direct (P2P), STUN, or TURN (Relay)
- **RTT (Round Trip Time):** Latency in milliseconds
- **Packet Loss:** Number of lost packets
- **Local/Remote Candidate Types:** What type of connection each peer is using

### 🌐 Method 3: Test Across Different Networks (Best)

To properly test TURN functionality, you need to simulate a restrictive network:

#### Option A: Use Two Different Locations
1. **User 1:** On your home/office network (less restrictive)
2. **User 2:** On mobile data or a different network (more restrictive)
3. Join the same interview room
4. Check the diagnostics - if behind restrictive NAT, TURN will be used

#### Option B: Use a VPN
1. User 1: Connect normally
2. User 2: Connect through a VPN
3. The VPN often creates NAT restrictions that require TURN

#### Option C: Corporate/University Network
- These networks often block P2P connections
- TURN servers are essential in these environments
- Test from a corporate network to verify TURN usage

### 🔧 Method 4: Chrome WebRTC Internals (Advanced)

1. Open `chrome://webrtc-internals/` in Chrome
2. Start your video call
3. Look for the connection stats:
   - **Selected Candidate Pair:** Shows which candidates were chosen
   - **Local/Remote Candidate:** Look for `type: relay` (TURN) or `type: srflx` (STUN)
   - **Connection Type:** Direct, STUN, or TURN

### 📝 What Each Connection Type Means

| Type | Description | When Used |
|------|-------------|-----------|
| **Direct (P2P)** | Host-to-host connection | Both users on same/open network |
| **STUN (Server Reflexive)** | Using STUN to discover public IP | Simple NAT traversal |
| **TURN (Relay)** | Traffic relayed through TURN server | Restrictive NAT/firewall |

### ⚠️ Common Issues

**If TURN servers aren't working:**
1. Check the ICE server configuration in `useWebRTCSignaling.ts`
2. Verify the free TURN servers are still active (openrelay.metered.ca)
3. Consider setting up your own TURN server using Coturn

**If connection keeps failing:**
1. Check the retry counter in the error message
2. Look for "Connection timeout" errors
3. Verify both users have granted camera/microphone permissions

### 🎯 Expected Behavior

**Ideal scenario (both users on open networks):**
- Connection Type: Direct (P2P) or STUN
- Low latency (<100ms RTT)
- No packet loss

**Restrictive network scenario:**
- Connection Type: TURN (Relay)
- Slightly higher latency (150-300ms RTT)
- Should still work reliably

### 📞 Testing Checklist

- [ ] Both users can see each other's video
- [ ] Audio is clear and synchronized
- [ ] Connection diagnostics show the connection type
- [ ] Console logs show ICE candidates being exchanged
- [ ] Connection survives network changes (switching WiFi/mobile)
- [ ] TURN candidates appear in logs (if on restrictive network)
- [ ] Retry mechanism works if connection fails

### 🔐 For Production

The current implementation uses **free public TURN servers** which are:
- ✅ Good for testing and development
- ⚠️ May have bandwidth limits
- ⚠️ Shared with other applications
- ⚠️ No uptime guarantees

**For production, consider:**
1. Setting up your own Coturn TURN server
2. Using a commercial TURN service (Twilio, Xirsys, etc.)
3. Adding TURN credentials to Supabase secrets
4. Implementing credential rotation

### 🚀 Next Steps

1. Test the current implementation with the free TURN servers
2. Monitor the connection diagnostics and console logs
3. If needed, set up dedicated TURN infrastructure
4. Consider adding metrics/analytics for connection quality
