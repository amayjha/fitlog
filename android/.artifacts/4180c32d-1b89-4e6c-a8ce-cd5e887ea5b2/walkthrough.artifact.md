# Deployment Preparation Walkthrough

I have updated your project to support signed release builds. This configuration follows best practices by keeping sensitive signing information out of version control while making the build process reproducible.

## Changes Made

### 1. Security Configuration
- **[.gitignore](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/.gitignore)**: Updated to ensure that `*.jks`, `*.keystore`, and `keystore.properties` are never committed to Git.
- **[keystore.properties](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/keystore.properties)**: Created a template file to store your signing passwords and alias.

### 2. Build Logic
- **[app/build.gradle](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/app/build.gradle)**:
    - Added logic to load signing configuration from `keystore.properties`.
    - Defined a `release` signing configuration.
    - Updated the `release` build type to use this signing configuration.

## Next Steps

To complete the release process, follow these instructions:

### Step 1: Generate your Keystore
If you don't have a keystore yet, you can generate one using the following command in your terminal (run this from the `android/` directory):

```powershell
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias release-key
```

### Step 2: Configure Passwords
Open **[keystore.properties](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/keystore.properties)** and replace the placeholders with the passwords you chose in Step 1.

### Step 3: Build the App Bundle
Once the keystore is ready and properties are filled, run this command to generate the `.aab` file:

```powershell
./gradlew :app:bundleRelease
```

The final bundle will be located at:
`app/build/outputs/bundle/release/app-release.aab`
