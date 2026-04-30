const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Firebase Admin with service account credentials
let initialized = false;

try {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Option 1: Full JSON key as env var (useful for deployment)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else if (fs.existsSync(path.join(__dirname, '..', 'serviceAccountKey.json'))) {
    // Option 2: JSON key file in backend root
    serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    // Option 3: Individual env vars
    serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };
  }

  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
    initialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else if (!serviceAccount) {
    console.warn('⚠️  Firebase credentials not found. Server will start but API calls will fail.');
    console.warn('   → Place serviceAccountKey.json in backend/ OR set FIREBASE_SERVICE_ACCOUNT_KEY env var');
    console.warn('   → See .env.example for details');
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'skillbridge-attendance-system' });
    }
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  console.warn('   → The server will start but Firebase operations will fail');
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'skillbridge-attendance-system' });
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth, initialized };
