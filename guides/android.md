This guide contains needed info to run,build and debug Android version on your system.

## Prequistes

1. Android Studio LTS
2. JDK 17 installed and configured for the project in android studio.
3. make sure you have respective environment file needed for the configuration you need to build available on your device for local build

## Resources

- [Gradle JDK configuration in Android Studio](https://developer.android.com/build/jdks#jdk-config-in-studio)
- [Create and manage virtual devices ](https://developer.android.com/studio/run/managing-avds)

## build and run steps

1. `npm i`
2. `npm run build --configuration {environment config name}`
   - ex: `npm run build --configuration development`
3. `npx cap sync android`
4. `npx cap open android`
5. choose the device you want to run the build on
6. run app

## generate APK

1. follow the same steps above till step 4
2. build -> build app bundle/apk -> build apk
3. click on locate from the build apk toastr that appears after building is finished.

## how to debug the app network calls, logs, elements..

1. Go to chrome://inspect/#devices on your PC
2. you should see your phone or emulator under devices (make sure to accept allow debugging from this computer message from your phone or emulator)
3. click inspect under Hessa under Webview in dev.ncle.hessa section
4. a new developer tool window will open with all the tools we use for web debugging as well as giving you the ability to navigate the app directly from that window
