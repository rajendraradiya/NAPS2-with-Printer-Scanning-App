

T00l
http://s.sudre.free.fr/Software/Packages/about.html

Tutorial

https://www.davidebarranca.com/2019/04/notarizing-installers-for-macos-catalina/

# Requirement

Xcode installed (or at least Command Line Tools)
An Apple Developer ID Installer certificate in your Keychain
==================================================================

## 1. Check your certificates:

security find-identity -v -p installer

**Output file**

Developer ID Installer: Your Name (TEAMID)

## 2. Sign an existing .pkg with productsign

productsign \
 --sign "Developer ID Installer: Your Name (TEAMID)" \
 mpn-core-installer.pkg \
 mpn-core-installer-signed.pkg

## 3. Verify the signature

pkgutil --check-signature mpn-core-combine.pkg

### ✅ REQUIRED BEFORE RUNNING THE COMMAND

#### 1️⃣ Apple Developer Account

You must have:

- An Apple ID
- Enrolled in the Apple Developer Program
  Without this, notarization will fail.

#### 2️⃣ Team ID You need your 10-character Team ID.

- Apple Developer Portal → Membership
- Xcode → Settings → Accounts → select your Apple ID

```
security find-identity -v -p codesigning
```

#### Example:

```
ABCDE12345
```

#### 3️⃣ App-Specific Password (REQUIRED)

❌ Do NOT use your Apple ID password

#### Create one:

- Go to https://appleid.apple.com

- Sign in

- Security → App-Specific Passwords

- Generate password

- Copy it (shown once)

Example format:

```
abcd-efgh-ijkl-mnop
```

#### 4️⃣ Signed .pkg File

##### Your package must already be signed with:

##### Developer ID Installer certificate

Check:

```
pkgutil --check-signature MyApp.pkg
```

If not signed:

```
productsign \
  --sign "Developer ID Installer: Your Name (ABCDE12345)" \
  MyApp-unsigned.pkg \
  MyApp.pkg
```

5️⃣ Xcode / Command Line Tools Installed

Verify:

```
xcode-select -p
```

If missing:

```
xcode-select --install
```

### ▶️ RUN THE COMMAND

Once all above are ready, run:

```
xcrun notarytool submit MyApp.pkg \
  --apple-id your@email.com \
  --team-id ABCDE12345 \
  --password abcd-efgh-ijkl-mnop \
  --wait
```

### 📎 AFTER SUCCESS (MANDATORY)

```
xcrun stapler staple MyApp.pkg

```

Verify:

```
spctl -a -vv -t install MyApp.pkg
```

========================================================================================================================================

### 1. Xcode installed

### 2. generate develoer id installer

1. xcode setting
2. Add Apple Id 
3. manage certificate
4. generate "Developer ID Installer"

### 3. Get certificate

```
security find-identity -v -p codesigning
```

### 4. Attach certificate

```
productsign \
 --sign "Developer ID Installer: Your Name (TEAMID)" \
 mpn-core-installer.pkg \
 mpn-core-installer-signed.pkg
```

verify

```
 pkgutil --check-signature mpn-core-installer-signed.pkg
```

### 5. Combine the .pkg

1. Install this app http://s.sudre.free.fr/Software/Packages/about.html
2. select row package option
4. Copy the name of organization name
3. project add developer installer id and go to project and set certificate add
5. add postinstall
6. add two files

- mpn-core-installer-signed.pkg
- naps2-8.2.1-mac-univ.pkg.pkg
- postinstall

Completed add codesingture

```
productsign \
 --sign "Developer ID Installer: Your Name (TEAMID)" \
 mpn-core-combine.pkg \
 mpn-core-combine-signed.pkg
```

### 6. add notarytool and run this command

=>  Apple Account
==> generate App-specific Passwords
Example
```
htth-ncpv-hngs-qweg
```
Now notarize Request

```
xcrun altool --notarize-app --primary-bundle-id "com.ccextensions.alce3" --username "YourAppleID@mail.com" --password "cvbs-epfg-sizx-olwd" --file "mpn-core-combine-signed.pkg"
```

```
 xcrun notarytool submit MyApp.pkg \
  --apple-id your@email.com \
  --team-id ABCDE12345 \
  --password abcd-efgh-ijkl-mnop \
  --wait

```


RequestUUID = 3e111b2f-6773-44d5-9bd5-feBaad697bb7.

Verify
```
xcrun altool --notarization-info 181638fb-a618-2298-bff0-47fa79f01326 --username "YourAppleID@mail.com" --password "cvbs-epfg-sizx-olwd"
```

The status would be " Status: in progress" or "Status Message: Package Approved"
 

 ### 7. Stapling the ticket to the file (validating)

```
 xcrun stapler staple "mpn-core-combine-signed.pkg"
 ```
```
 stapler validate --verbose "mpn-core-combine-signed.pkg"
 ```