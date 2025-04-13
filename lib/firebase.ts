import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// 環境変数が設定されているかチェック
// const checkEnvVariables = () => {
//   const requiredVars = [
//     "NEXT_PUBLIC_FIREBASE_API_KEY",
//     "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
//     "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
//     "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
//     "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
//     "NEXT_PUBLIC_FIREBASE_APP_ID",
//   ]

//   const missingVars = requiredVars.filter((varName) => !process.env[varName] || process.env[varName] === "NEXT_PUBLIC_FIREBASE_API_KEY")

//   if (missingVars.length > 0) {
//     console.warn(`Missing or invalid Firebase environment variables: ${missingVars.join(", ")}`)
//     return false
//   }

//   return true
// }

// Firebase設定オブジェクト
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase初期化
let app
let auth
let db

if (typeof window !== "undefined") {
  try {
    // 環境変数チェック
    const isEnvValid = true

    if (isEnvValid) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
      auth = getAuth(app)
      db = getFirestore(app)
    } else {
      console.error("Firebase initialization skipped due to missing environment variables")
    }
  } catch (error) {
    console.error("Firebase initialization error:", error)
  }
}

export { app, auth, db }
