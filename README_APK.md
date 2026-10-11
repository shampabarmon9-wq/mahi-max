# Android APK Build Instructions

This project has been converted into a complete Android application project using Capacitor. It wraps your existing Mahi AI Assistant web application into a native Android environment.

## 1. Important Note about the "Floating Chat Head" 
As requested, we added the `SYSTEM_ALERT_WINDOW` permission to allow drawing over other apps. However, it's important to understand that a standard WebView wrapper (like Capacitor) does not natively detach the web context into a floating Android Window. 

To achieve a true "Chat Head" that persists outside the app (like Messenger), you would need to write custom Kotlin/Java Android Services. However, the APK you generate here WILL install and run on your Android device as a standalone native app!

## 2. Prerequisites
To build the APK on your own machine, you need:
1. **Node.js** installed (v18+)
2. **Android Studio** installed
3. **Java SDK** (usually comes with Android Studio)

## 3. How to Build the APK locally

1. Download this project as a ZIP using the **Share/Export** menu in AI Studio.
2. Extract the ZIP file to your computer.
3. Open a terminal in the extracted folder and run:
   ```bash
   npm install
   npm run build
   npx cap sync android
   ```
4. Now, open the project in Android Studio:
   ```bash
   npx cap open android
   ```
5. Inside Android Studio:
   - Let Gradle sync completely.
   - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)** in the top menu.
   - Wait for the build to finish.
   - A popup will appear in the bottom right corner. Click **"locate"** to find your `.apk` file.

Alternatively, you can build it via command line if you have Gradle configured:
```bash
cd android
./gradlew assembleDebug
```
Your Debug APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

Enjoy your new Native Android App!
