const { getAuth } = require("firebase-admin/auth");

const { firebaseAdminApp } = require("../config/firebaseAdmin");

const adminAuth = getAuth(firebaseAdminApp);

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const idToken = authHeader.split("Bearer ")[1];

    const decodedToken = await adminAuth.verifyIdToken(idToken);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
    };

    next();
  } catch (error) {
    console.error("Authentication failed:", error.message);

    return res.status(401).json({
      error: "Invalid or expired authentication token",
    });
  }
}

module.exports = authenticate;