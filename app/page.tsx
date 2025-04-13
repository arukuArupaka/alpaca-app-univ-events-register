"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6">立命館大学カレンダー管理システム</h1>
        <p className="text-xl text-gray-600 mb-8">
          このシステムは招待制です。招待リンクをお持ちの方のみがアクセスできます。
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
          <Button asChild className="bg-blue-700 hover:bg-blue-800 text-lg px-8 py-6 rounded-lg">
            <Link href="/login">ログイン</Link>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-16 text-gray-500 text-sm"
      >
        © 2025 立命館大学
      </motion.div>
    </div>
  )
}
