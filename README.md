# Kol - Life Tracker for Magic: The Gathering

A simple and light-weight app to track life in 1v1 games for Magic: The Gathering. It is meant to be as simple as possible, with very few settings.

The app is built with Blazor WebAssembly (WASM) and .NET 9, configured as a Progressive Web App (PWA).

The whole purpose of this app is to replace the now unavailable app Carbon that was fantastic, but can't be downloaded in the official stores anymore.

**🌐 [Demo](https://rickardni.github.io/Kol/)**

To get started, simply visit the demo and tap **_Install_** when prompted (or add to home screen manually).

> ⚠️ **Development Status**: This project is currently under development. While the core life tracking functionality is working, some features and UI elements may not be fully implemented yet.

## Features

### 🎮 Core Functionality
- **Intuitive Controls**: Tap top half to increase life, bottom half to decrease
- **Long Press Support**: Hold for ±10 life changes
- **Haptic Feedback**: Vibration feedback on mobile devices
- **Sound Effects**: Audio feedback for life changes and reset actions
- **Wake Lock**: Prevents screen sleep during gameplay
- **Offline Support**: Works without internet connection

### 🎨 Modern UI/UX
- **Fullscreen Experience**: Optimized for mobile and tablet use
- **Smooth Animations**: Beautiful transitions and micro-interactions
- **Dark Theme**: Easy on the eyes during long gaming sessions
- **PWA Ready**: Install as a native app on mobile devices

## FAQ

### **Does the world need yet another life tracking app?**
No, it doesn't.

But after Carbon was unavailable, I missed an app that used the intuitive up/down to increase/decrease life. Most apps I've tried have used left/right instead, and I don't like that as much. Also, most of them are bloated, and I want a clean interface, much like Carbon had.

I have also added some features that I missed in Carbon like visible change indicator and sound effects.

### **Why Kol?**

Because I completely lack imagination. Kol is the Swedish word for Carbon, simple as that.

### **Dude, this you just vibe code this app?**
Yes, since my previous vibe coding project **[MagicDeckStats](https://rickardni.github.io/MagicDeckStats/)** went well, I continued to make another app that could be useful to me, even if the code is sub-optimal. The reality is that I would not have this app if not for vibe coding. And here I thought it all was a meme.

### **Can you add support for Commander?**
No, I play Commander extremely rarely and I want to keep the app as simple as possible. It already lacks the feature to track a lot of counters, so more players is extremely low on the priority, and I doubt it will ever happen.
