## fastlane documentation

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android buildDevApk

```sh
[bundle exec] fastlane android buildDevApk
```

Build the Android development apk

### android sendDevApkToSlack

```sh
[bundle exec] fastlane android sendDevApkToSlack
```

Send the Android development apk to Slack

### android buildStgApk

```sh
[bundle exec] fastlane android buildStgApk
```

Build the Android Staging apk

### android sendStgApkToSlack

```sh
[bundle exec] fastlane android sendStgApkToSlack
```

Send the Android Staging apk to Slack

### android buildProdApk

```sh
[bundle exec] fastlane android buildProdApk
```

Build the Android production apk

### android sendProdApkToSlack

```sh
[bundle exec] fastlane android sendProdApkToSlack
```

Send the Android production apk to Slack

### android buildProdAab

```sh
[bundle exec] fastlane android buildProdAab
```

Build the Android production appbundle

### android uploadToPlaystore

```sh
[bundle exec] fastlane android uploadToPlaystore
```

Upload the Android production appbundle to playstore

---

## iOS

### ios buildDevIpaForTestflight

```sh
[bundle exec] fastlane ios buildDevIpaForTestflight
```

Build the iOS development app and send it to Testflight for testing

### ios buildStgIpaForTestflight

```sh
[bundle exec] fastlane ios buildStgIpaForTestflight
```

Build the iOS staging app and send it to Testflight for testing

### ios buildProdIpaForTestflight

```sh
[bundle exec] fastlane ios buildProdIpaForTestflight
```

Build the iOS Production app and send it to Testflight for testing

### ios buildProdIpaForAppstore

```sh
[bundle exec] fastlane ios buildProdIpaForAppstore
```

Build the iOS Production app and upload it to Appstore for production release

---

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
