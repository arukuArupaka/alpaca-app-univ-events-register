/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth, db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Loader2, Plus, Calendar, AlertCircle } from "lucide-react"
import EventForm from "@/components/event-form"
import EventList from "@/components/event-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Event } from "@/types/event"

export default function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Firebase初期化チェック
    if (!auth) {
      setError("Firebase認証が初期化されていません。環境変数を確認してください。")
      setLoading(false)
      return
    }

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          setUser(currentUser)
          setLoading(false)
        } else {
          router.push("/login")
        }
      },
      (error) => {
        console.error("Auth state change error:", error)
        setError("認証状態の確認中にエラーが発生しました。")
        setLoading(false)
      },
    )

    return () => unsubscribeAuth()
  }, [router])

  useEffect(() => {
    if (!user || !db) return

    try {
      const eventsRef = collection(db, "event")
      const q = query(eventsRef, orderBy("date", "desc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const eventsList: Event[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()

            // timestampをDate型に変換し、ISOStringに変換
            let dateValue = null
            if (data.date) {
              // Firestoreのtimestamp型をDate型に変換
              if (data.date.toDate && typeof data.date.toDate === "function") {
                dateValue = data.date.toDate().toISOString()
              } else if (typeof data.date === "string") {
                dateValue = data.date
              } else {
                // フォールバック
                dateValue = new Date().toISOString()
              }
            } else {
              dateValue = new Date().toISOString()
            }

            eventsList.push({
              id: doc.id,
              ...data,
              date: dateValue,
            } as Event)
          })
          setEvents(eventsList)
        },
        (error) => {
          console.error("Firestore snapshot error:", error)
          setError("イベントデータの取得中にエラーが発生しました。")
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Firestore query setup error:", error)
      setError("Firestoreクエリの設定中にエラーが発生しました。")
    }
  }, [user])

  // 日付が有効かどうかをチェックする関数
  const isValidDate = (dateString: string | undefined): boolean => {
    if (!dateString) return false
    try {
      const date = new Date(dateString)
      return !isNaN(date.getTime())
    } catch (error) {
      return false
    }
  }

  // 今後のイベントをフィルタリングする関数
  const getUpcomingEvents = () => {
    const now = new Date()
    return events.filter((event) => {
      if (!event.date || !isValidDate(event.date)) return false
      try {
        const eventDate = new Date(event.date)
        return eventDate >= now
      } catch (error) {
        return false
      }
    })
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setShowEventForm(true)
  }

  const handleCloseForm = () => {
    setShowEventForm(false)
    setEditingEvent(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => router.push("/")} className="bg-blue-700 hover:bg-blue-800">
              トップページへ戻る
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white shadow-md py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-blue-900 flex items-center"
          >
            <Calendar className="mr-2 h-6 w-6 text-blue-700" />
            立命館大学カレンダー管理
          </motion.h1>
          <div className="flex items-center space-x-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-gray-600"
            >
              {user?.displayName || user?.email}
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => auth.signOut().then(() => router.push("/login"))}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                ログアウト
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl text-blue-900">ダッシュボード</CardTitle>
                  <CardDescription>大学カレンダー情報の登録・管理を行います</CardDescription>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => setShowEventForm(true)} className="bg-blue-700 hover:bg-blue-800">
                    <Plus className="mr-2 h-4 w-4" /> 新規登録
                  </Button>
                </motion.div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="all">すべて</TabsTrigger>
                  <TabsTrigger value="my-events">自分の登録</TabsTrigger>
                  <TabsTrigger value="upcoming">今後の予定</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <EventList events={events} currentUser={user} onEdit={handleEditEvent} />
                </TabsContent>
                <TabsContent value="my-events">
                  <EventList
                    events={events.filter((event) => event.userId === user.uid)}
                    currentUser={user}
                    onEdit={handleEditEvent}
                  />
                </TabsContent>
                <TabsContent value="upcoming">
                  <EventList events={getUpcomingEvents()} currentUser={user} onEdit={handleEditEvent} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {showEventForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
            >
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="w-full max-w-2xl my-4"
                onClick={(e) => e.stopPropagation()}
              >
                <EventForm user={user} onClose={handleCloseForm} editEvent={editingEvent} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
