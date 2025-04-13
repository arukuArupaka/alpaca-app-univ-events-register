"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Calendar, MapPin, User, LinkIcon, ExternalLink } from "lucide-react"
import type { Event } from "@/types/event"

interface EventListProps {
  events: Event[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentUser: any
  onEdit: (event: Event) => void
}

export default function EventList({ events, currentUser, onEdit }: EventListProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  const toggleExpand = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId)
  }

  // 日付を安全にフォーマットする関数
  const formatEventDate = (dateString: string | undefined) => {
    if (!dateString) return "日付なし"

    try {
      // ISO文字列から日付オブジェクトを作成
      const date = new Date(dateString)

      // 無効な日付の場合
      if (isNaN(date.getTime())) return "無効な日付"

      // 日本語の日付フォーマット
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()

      return `${year}年${month}月${day}日`
    } catch (error) {
      console.error("Date formatting error:", error)
      return "日付エラー"
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">イベントがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            layout
          >
            <Card
              className={cn(
                "border-l-4 hover:shadow-md transition-all duration-300",
                event.userId === currentUser.uid ? "border-l-blue-500" : "border-l-gray-300",
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {event.type || "未分類"}
                      </Badge>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatEventDate(event.date)}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-medium">{event.title || "無題"}</CardTitle>
                  </div>
                  {event.userId === currentUser.uid && (
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(event)}
                        className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                    <span>{event.location || "場所未設定"}</span>
                  </div>

                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4 mt-0.5 text-gray-400" />
                    <span>{event.name || "名前未設定"}</span>
                  </div>

                  {event.url && (
                    <div className="flex items-start space-x-2 text-sm text-blue-600">
                      <LinkIcon className="h-4 w-4 mt-0.5 text-gray-400" />
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center"
                      >
                        詳細情報を見る
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}

                  {event.description && (
                    <AnimatePresence>
                      {expandedEvent === event.id ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 text-sm text-gray-600"
                        >
                          {event.description}
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(event.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                          >
                            詳細を表示
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}

                  {expandedEvent === event.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(event.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                      >
                        閉じる
                      </Button>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
