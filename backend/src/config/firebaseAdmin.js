const {
    initializeApp,
    cert,
    getApps,
    applicationDefault,
  } = require("firebase-admin/app");
  
  const { getFirestore } = require("firebase-admin/firestore");
  
  let firebaseAdminApp;
  
  if (process.env.NODE_ENV === "production") {
    firebaseAdminApp =
      getApps().length === 0
        ? initializeApp({
            credential: applicationDefault(),
          })
        : getApps()[0];
  } else {
    const serviceAccount = require("../../serviceAccountKey.json");
  
    firebaseAdminApp =
      getApps().length === 0
        ? initializeApp({
            credential: cert(serviceAccount),
          })
        : getApps()[0];
  }
  
  const adminDb = getFirestore(firebaseAdminApp, "default");
  
  module.exports = {
    firebaseAdminApp,
    adminDb,
  };