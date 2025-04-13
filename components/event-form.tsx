/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon, X, Plus, AlertCircle, LinkIcon } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { Event } from "@/types/event"
import { eventTypes } from "@/lib/event-types"

interface EventFormProps {
  user: any
  onClose: () => void
  editEvent: Event | null
}

export default function EventForm({ user, onClose, editEvent }: EventFormProps) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState("")
  const [customType, setCustomType] = useState("")
  const [showCustomType, setShowCustomType] = useState(false)
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [url, setUrl] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [availableTypes, setAvailableTypes] = useState<string[]>(eventTypes)
  const { toast } = useToast()

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title || "")
      setType(editEvent.type || "")
      setDescription(editEvent.description || "")
      setLocation(editEvent.location || "")
      setUrl(editEvent.url || "")

      // 日付の安全な設定
      try {
        if (editEvent.date) {
          const eventDate = new Date(editEvent.date)
          if (!isNaN(eventDate.getTime())) {
            setDate(eventDate)
          } else {
            setDate(new Date())
          }
        } else {
          setDate(new Date())
        }
      } catch (error) {
        console.error("Error parsing date:", error)
        setDate(new Date())
      }
    }
  }, [editEvent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!db) {
      setError("Firestoreが初期化されていません。環境変数を確認してください。")
      setLoading(false)
      return
    }

    try {
      const finalType = showCustomType ? customType : type

      // Add the custom type to available types if it's new
      if (showCustomType && customType && !availableTypes.includes(customType)) {
        setAvailableTypes([...availableTypes, customType])
      }

      // 日付が有効かチェック
      if (!date || isNaN(date.getTime())) {
        setError("有効な日付を選択してください。")
        setLoading(false)
        return
      }

      // URLの形式チェック（入力されている場合のみ）
      if (url && !isValidUrl(url)) {
        setError("有効なURLを入力してください。例: https://www.example.com")
        setLoading(false)
        return
      }

      const eventData = {
        title,
        type: finalType,
        description,
        location,
        url,
        // Firestoreのtimestamp型として保存
        date: date,
        name: user.displayName || "user",
        userId: user.uid,
        updatedAt: new Date(),
      }

      if (editEvent) {
        // Update existing event
        await updateDoc(doc(db, "event", editEvent.id), eventData)
        toast({
          title: "更新完了",
          description: "イベント情報が更新されました",
          variant: "default",
        })
      } else {
        // Add new event
        await addDoc(collection(db, "event"), {
          ...eventData,
          createdAt: new Date(),
        })
        toast({
          title: "登録完了",
          description: "新しいイベントが登録されました",
          variant: "default",
        })
      }

      onClose()
    } catch (error: any) {
      console.error("Error saving event:", error)

      let message = "イベントの保存中にエラーが発生しました。"
      if (error.code === "permission-denied") {
        message = "権限がありません。ログイン状態を確認してください。"
      }

      setError(message)

      toast({
        title: "エラー",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // URLの形式をチェックする関数
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch (error) {
      return false
    }
  }

  const handleDelete = async () => {
    if (!editEvent) return
    if (!db) {
      setError("Firestoreが初期化されていません。環境変数を確認してください。")
      return
    }

    if (!confirm("このイベントを削除してもよろしいですか？")) {
      return
    }

    setLoading(true)
    setError("")

    try {
      await deleteDoc(doc(db, "event", editEvent.id))
      toast({
        title: "削除完了",
        description: "イベントが削除されました",
        variant: "default",
      })
      onClose()
    } catch (error: any) {
      console.error("Error deleting event:", error)

      let message = "イベントの削除中にエラーが発生しました。"
      if (error.code === "permission-denied") {
        message = "削除権限がありません。ログイン状態を確認してください。"
      }

      setError(message)

      toast({
        title: "エラー",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 日付を安全にフォーマットする関数
  const formatDate = (date: Date | undefined) => {
    if (!date || isNaN(date.getTime())) return "日付を選択"

    try {
      return format(date, "PPP", { locale: ja })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "日付を選択"
    }
  }

  return (
    <Card className="border-blue-100 shadow-xl bg-white max-h-[90vh] flex flex-col">
      <CardHeader className="relative">
        <CardTitle className="text-xl text-blue-900">{editEvent ? "イベント編集" : "新規イベント登録"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4 hover:bg-blue-50">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="overflow-y-auto flex-grow scrollbar-thin">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <motion.div whileFocus={{ scale: 1.01 }}>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="border-blue-200 focus:border-blue-500 transition-all duration-300"
              />
            </motion.div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">日付</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-blue-200 hover:bg-blue-50",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDate(date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">種別</Label>
            {!showCustomType ? (
              <div className="flex space-x-2">
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500 transition-all duration-300">
                    <SelectValue placeholder="種別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCustomType(true)}
                  className="border-blue-200 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Input
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="新しい種別を入力"
                  className="border-blue-200 focus:border-blue-500 transition-all duration-300"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCustomType(false)}
                  className="border-blue-200 hover:bg-blue-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">場所</Label>
            <motion.div whileFocus={{ scale: 1.01 }}>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="border-blue-200 focus:border-blue-500 transition-all duration-300"
              />
            </motion.div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">詳細URL</Label>
            <motion.div whileFocus={{ scale: 1.01 }}>
              <div className="flex">
                <div className="relative flex-grow">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.example.com"
                    className="pl-10 border-blue-200 focus:border-blue-500 transition-all duration-300"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                イベントの詳細情報が掲載されているWebページのURLを入力してください（任意）
              </p>
            </motion.div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <motion.div whileFocus={{ scale: 1.01 }}>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] border-blue-200 focus:border-blue-500 transition-all duration-300"
              />
            </motion.div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-gray-100 pt-4">
        <div>
          {editEvent && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                削除
              </Button>
            </motion.div>
          )}
        </div>
        <div className="flex space-x-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="border-blue-200">
              キャンセル
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button type="button" onClick={handleSubmit} disabled={loading} className="bg-blue-700 hover:bg-blue-800">
              {loading ? "保存中..." : editEvent ? "更新" : "登録"}
            </Button>
          </motion.div>
        </div>
      </CardFooter>
    </Card>
  )
}
