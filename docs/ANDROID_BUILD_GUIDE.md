# ANDROID BUILD GUIDE — RESONANCE

> How to build and install the Android APK from scratch. Written for Windows
> (PowerShell), which is where the app has actually been built. Notes for
> macOS/Linux are inline where the commands differ.

The `android/` folder is **gitignored** — it is generated locally and never
committed. So after a fresh `git clone` (or on a new machine) you must
regenerate it with `npx cap add android` before you can build. This guide
covers both the first-time setup and the everyday rebuild.

---

## 0. Prerequisites (install once)

| Tool | Notes |
|---|---|
| **Node.js 18+** | https://nodejs.org — provides `npm` / `npx`. |
| **Android Studio** | https://developer.android.com/studio — installs the Android SDK **and** ships a bundled **JDK 21** we reuse. During install, accept the Android SDK + Build-Tools. |
| **JDK 21** | Required by Capacitor 8 / Android Gradle Plugin. You do **not** need a separate install — Android Studio bundles one at `C:\Program Files\Android\Android Studio\jbr`. |

> ⚠️ **The #1 gotcha:** a system Java 8 or 17 will fail the build with
> `Dependency requires at least JVM runtime version 11` or
> `invalid source release: 21`. We fix this in Step 2 by pointing Gradle at
> Android Studio's bundled JDK 21 — no system Java change needed.

Verify Android Studio's JDK is 21:

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" -version
# should print: openjdk version "21.x.x"
```

---

## 1. First-time setup (fresh clone / new machine)

Run from the repo root (`dark-echo/`):

```powershell
npm install                 # install web + Capacitor dependencies
npm run build               # build the web app into dist/
npx cap add android         # generate the android/ project (gitignored)
npx cap sync android        # copy dist/ into the android project + sync plugins
```

Then apply the two required native patches **once** (they live inside the
gitignored `android/` folder, so a fresh `npx cap add android` recreates the
files without them — re-apply if you ever regenerate the project):

**a) `android\app\src\main\AndroidManifest.xml`** — add two attributes to the
`<application ...>` tag:

```xml
<application
    ...
    android:hardwareAccelerated="true"
    android:largeHeap="true">
```

**b) `android\app\src\main\java\com\resonance\soundgame\MainActivity.java`** —
replace the file contents with:

```java
package com.resonance.soundgame;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Web Audio API requires no user gesture on Android WebView
        getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
    }
}
```

> Without patch (b), all game audio is silently blocked on Android 8+ until the
> user taps the screen.

---

## 2. Point Gradle at JDK 21 (the fix for the Java-version error)

Add one line to **`android\gradle.properties`** (create the line if missing):

```properties
org.gradle.java.home=C:\\Program Files\\Android\\Android Studio\\jbr
```

> Note the **doubled backslashes** — `gradle.properties` treats a single `\`
> as an escape character.
>
> This file is inside the gitignored `android/` folder, so it is local-only and
> must be re-added if you regenerate the project.

macOS/Linux equivalent (bundled JDK path differs):
```properties
# macOS:  org.gradle.java.home=/Applications/Android Studio.app/Contents/jbr/Contents/Home
# Linux:  org.gradle.java.home=/opt/android-studio/jbr
```

---

## 3. Build the APK

### Option A — command line (no IDE)

```powershell
npm run build               # 1. rebuild the web app
npx cap sync android        # 2. copy the fresh build into android/
cd android
.\gradlew.bat assembleDebug # 3. build the debug APK  (note the .\ prefix!)
cd ..
```

> **PowerShell needs the `.\` prefix** — bare `gradlew.bat` errors with
> "not recognized as the name of a cmdlet". On macOS/Linux use `./gradlew assembleDebug`.

Output APK:

```
android\app\build\outputs\apk\debug\app-debug.apk
```

### Option B — Android Studio

```powershell
npx cap open android
```
Then: wait for Gradle sync → menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
Same output path as above.

---

## 4. Install on your phone

**Via USB (adb):** enable Developer Options → USB debugging on the phone, connect it, then:

```powershell
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```
The `-r` flag reinstalls over an existing copy (keeps you from having to uninstall first).

**Without a cable:** copy `app-debug.apk` to the phone (Drive, email, USB transfer)
and open it there. You'll need to allow "install from unknown sources" the first time.

---

## 5. Everyday rebuild (after code changes)

Once first-time setup is done, the whole loop is just:

```powershell
npm run build
npx cap sync android
cd android; .\gradlew.bat assembleDebug; cd ..
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

---

## What ends up in the app

- The app loads `dist/index.html` (the landing page), whose `<head>` detects the
  native shell (`window.Capacitor.isNativePlatform()`) and immediately redirects
  to `play/index.html` — so **the app opens straight into the game**. (See
  `docs/PRODUCTION_ROADMAP.md` Phase 22 for the routing rationale.)
- Capacitor plugins bundled: `@capacitor/haptics` (buzz on death + wall collapse)
  and `@capacitor/status-bar` (hidden during play).

---

## Release / Play Store build (not done yet — Phase 25)

The steps above produce a **debug** APK, which is fine for sideloading and
testing but **cannot be published**. A store build additionally needs:

- `cd android && .\gradlew.bat bundleRelease` to produce an **AAB** (Play prefers AAB over APK).
- Signing with a **release keystore** (generate once with `keytool`, store it
  securely, **never commit it**).

Full checklist is in `docs/PRODUCTION_ROADMAP.md` Phase 25.

---

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `Dependency requires at least JVM runtime version 11` | System Java is 8. Do Step 2 (point Gradle at JDK 21). |
| `invalid source release: 21` | Gradle is using Java < 21. Do Step 2. |
| `gradlew.bat : The term ... is not recognized` | PowerShell needs the `.\` prefix: `.\gradlew.bat assembleDebug`. |
| `android/` folder missing after clone | It's gitignored — run `npx cap add android` (Step 1), then re-apply the Step 1 patches + Step 2 JDK line. |
| Audio silent until you tap the screen | `MainActivity.java` patch (1b) missing — re-apply it. |
| No haptics / status bar still shows | Run `npx cap sync android` after `npm run build` so plugins + assets are current. |
| App shows the landing page instead of the game | The native redirect didn't fire — confirm the built `dist/index.html` contains the `isNativePlatform()` script, then `npx cap sync android` and rebuild. |
