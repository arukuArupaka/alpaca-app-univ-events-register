/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [firebaseInitialized, setFirebaseInitialized] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  // Firebase初期化チェック
  useEffect(() => {
    if (!auth) {
      setFirebaseInitialized(false)
      setErrorMessage("Firebase認証が初期化されていません。環境変数を確認してください。")
    } else {
      setFirebaseInitialized(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage("")

    if (!firebaseInitialized) {
      setErrorMessage("Firebase認証が初期化されていません。環境変数を確認してください。")
      setLoading(false)
      return
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "ログイン成功",
        description: "ダッシュボードにリダイレクトします",
        variant: "default",
      })
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)

      // エラーメッセージをユーザーフレンドリーに変換
      let message = "ログインに失敗しました。"

      if (error.code === "auth/invalid-email") {
        message = "メールアドレスの形式が正しくありません。"
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        message = "メールアドレスまたはパスワードが正しくありません。"
      } else if (error.code === "auth/too-many-requests") {
        message = "ログイン試行回数が多すぎます。しばらく時間をおいてから再試行してください。"
      } else if (error.code === "auth/api-key-not-valid") {
        message = "Firebase APIキーが無効です。環境変数を確認してください。"
      }

      setErrorMessage(message)

      toast({
        title: "ログイン失敗",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
            <CardTitle className="text-2xl font-bold text-center text-blue-900">ログイン</CardTitle>
            <CardDescription className="text-center">アカウント情報を入力してログインしてください</CardDescription>
          </CardHeader>
          <CardContent>
            {!firebaseInitialized && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>初期化エラー</AlertTitle>
                <AlertDescription>
                  Firebase認証が初期化されていません。環境変数が正しく設定されているか確認してください。
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800 transition-all duration-300"
                  disabled={loading || !firebaseInitialized}
                >
                  {loading ? "ログイン中..." : "ログイン"}
                </Button>
              </motion.div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <motion.div whileHover={{ scale: 1.05 }} className="text-sm text-blue-600 hover:text-blue-800">
              <a href="https://www.instagram.com/aruku_arupaka/">アカウント登録をご希望の方はお問い合わせください</a>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
