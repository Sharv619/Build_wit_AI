# Free Firebase Setup

Use this setup while the project is on Firebase Spark/free plan.

## Select Only Free-Friendly Products
Use:
- Firebase Authentication
- Cloud Firestore

Avoid for now:
- Firebase Storage
- Data Connect / SQL Connect
- Cloud Functions deploy, unless you upgrade to Blaze

The backend function code can still run locally in the emulator. Deploying Cloud Functions may require Blaze.

## Correct CLI Commands
From the repo root:

```bash
cd /home/lade/Hackathons/Build_wit_Ai
firebase login
firebase use --add
```

Choose your Firebase project and use this alias:

```text
default
```

Initialize only Firestore if needed:

```bash
firebase init firestore
```

When prompted:

```text
Firestore Rules: firestore.rules
Firestore indexes: firestore.indexes.json
```

Do not select Storage or Data Connect for the free demo.

## Deploy Free-Friendly Backend Config
Deploy only Firestore rules:

```bash
firebase deploy --only firestore:rules
```

## Enable Auth In Console
In Firebase Console:

```text
Authentication -> Get started -> Sign-in method -> Email/Password -> Enable
```

## Local Function Testing
The Cloud Functions code is available for local emulator testing:

```bash
cd /home/lade/Hackathons/Build_wit_Ai/functions
npm run build
```

To run emulators, use:

```bash
cd /home/lade/Hackathons/Build_wit_Ai
npx --prefix functions firebase emulators:start --only auth,firestore,functions
```

## Why Storage Is Skipped
For the free demo, script upload should use pasted text stored in Firestore. Real file uploads can be added later when the project is ready for Firebase Storage or another file provider.

