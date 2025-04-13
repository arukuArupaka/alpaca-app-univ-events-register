"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [invitationValid, setInvitationValid] = useState(false)
  const [error, setError] = useState("")
  const [firebaseInitialized, setFirebaseInitialized] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()
  const uid = searchParams.get("uid")
  const { toast } = useToast()

  // Firebase初期化チェック
  useEffect(() => {
    if (!auth || !db) {
      setFirebaseInitialized(false)
      setError("Firebase認証が初期化されていません。環境変数を確認してください。")
      setValidating(false)
      return
    }

    validateInvitation()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validateInvitation = async () => {
    if (!uid) {
      setInvitationValid(false)
      setValidating(false)
      return
    }

    if (!firebaseInitialized) {
      setValidating(false)
      return
    }

    try {
      // Check if the invitation exists and is unused
      const invitationRef = doc(db, "invitations", uid)
      const invitationDoc = await getDoc(invitationRef)

      if (invitationDoc.exists() && !invitationDoc.data().used) {
        setInvitationValid(true)
      } else {
        setInvitationValid(false)
      }
    } catch (error) {
      console.error("Error validating invitation:", error)
      setInvitationValid(false)
      setError("招待の検証中にエラーが発生しました。")
    } finally {
      setValidating(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firebaseInitialized) {
      setError("Firebase認証が初期化されていません。環境変数を確認してください。")
      return
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません")
      return
    }

    if (!invitationValid || !uid) {
      setError("無効な招待リンクです")
      return
    }

    setLoading(true)

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with display name
      await updateProfile(user, { displayName })

      // Mark invitation as used
      await setDoc(
        doc(db, "invitations", uid),
        {
          used: true,
          usedBy: user.uid,
          usedAt: new Date(),
        },
        { merge: true },
      )

      toast({
        title: "登録成功",
        description: "アカウントが作成されました。ダッシュボードにリダイレクトします。",
        variant: "default",
      })

      router.push("/dashboard")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Registration error:", error)

      // エラーメッセージをユーザーフレンドリーに変換
      let message = "アカウント作成中にエラーが発生しました。"

      if (error.code === "auth/email-already-in-use") {
        message = "このメールアドレスは既に使用されています。"
      } else if (error.code === "auth/invalid-email") {
        message = "メールアドレスの形式が正しくありません。"
      } else if (error.code === "auth/weak-password") {
        message = "パスワードが弱すぎます。より強力なパスワードを設定してください。"
      } else if (error.code === "auth/api-key-not-valid") {
        message = "Firebase APIキーが無効です。環境変数を確認してください。"
      }

      setError(message)

      toast({
        title: "登録失敗",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">招待リンクを確認中...</p>
        </div>
      </div>
    )
  }

  if (!firebaseInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-red-100 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-red-700">初期化エラー</CardTitle>
              <CardDescription className="text-center">
                Firebase認証が初期化されていません。環境変数が正しく設定されているか確認してください。
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-4">
              <Button onClick={() => router.push("/")} className="bg-blue-700 hover:bg-blue-800">
                トップページへ戻る
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (!invitationValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-red-100 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-red-700">無効な招待リンク</CardTitle>
              <CardDescription className="text-center">
                このリンクは無効であるか、既に使用されています。
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-4">
              <Button onClick={() => router.push("/login")} className="bg-blue-700 hover:bg-blue-800">
                ログインページへ戻る
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-blue-100 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-blue-900">アカウント登録</CardTitle>
            <CardDescription className="text-center">招待リンクから新しいアカウントを作成します</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">名前</Label>
                <motion.div whileFocus={{ scale: 1.01 }}>
                  <Input
                    id="displayName"
                    placeholder="山田 太郎"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-500 transition-all duration-300"
                  />
                </motion.div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <motion.div whileFocus={{ scale: 1.01 }}>
                  <Input
                    id="email"
                    type="email"
                    placeholder="university@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-500 transition-all duration-300"
                  />
                </motion.div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <motion.div whileFocus={{ scale: 1.01 }}>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-500 transition-all duration-300"
                  />
                </motion.div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                <motion.div whileFocus={{ scale: 1.01 }}>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-500 transition-all duration-300"
                  />
                </motion.div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800 transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? "登録中..." : "アカウント作成"}
                </Button>
              </motion.div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <motion.div whileHover={{ scale: 1.05 }} className="text-sm text-blue-600 hover:text-blue-800">
              <a href="/login">既にアカウントをお持ちの方はこちら</a>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
