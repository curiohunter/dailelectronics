"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DailLogo } from "@/components/DailLogo"
import { 
  Menu, 
  X,
  MessageCircle,
  Phone,
  Mail,
  MapPin
} from "lucide-react"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle mobile menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div className={`
        md:hidden fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 
        shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
            <DailLogo size="sm" />
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-6">
            <div className="space-y-1 px-4">
              <Link 
                href="#about" 
                onClick={() => setIsOpen(false)}
                className="block py-3 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                회사소개
              </Link>
              <Link 
                href="#features" 
                onClick={() => setIsOpen(false)}
                className="block py-3 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                핵심가치
              </Link>
              <Link 
                href="#contact" 
                onClick={() => setIsOpen(false)}
                className="block py-3 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                문의하기
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="mt-6 px-4 space-y-3">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                asChild
              >
                <a href="http://pf.kakao.com/_xkdpfs" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  카카오톡 상담
                </a>
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  로그인
                </Link>
              </Button>
            </div>
          </nav>

          {/* Contact Info */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4" />
              <span>031-123-4567</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4" />
              <span>contact@dailelectric.co.kr</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>경기도 김포시</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}