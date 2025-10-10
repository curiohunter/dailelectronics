'use client'

import { useState, useEffect } from 'react'

const LEFT_SIDEBAR_KEY = 'leftSidebarOpen'
const RIGHT_SIDEBAR_KEY = 'rightSidebarOpen'

export function useSidebar() {
  // 왼쪽 사이드바는 기본적으로 열림
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  // 오른쪽 사이드바는 기본적으로 닫힘
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)

  // localStorage에서 상태 복원
  useEffect(() => {
    const savedLeft = localStorage.getItem(LEFT_SIDEBAR_KEY)
    const savedRight = localStorage.getItem(RIGHT_SIDEBAR_KEY)

    if (savedLeft !== null) {
      setLeftSidebarOpen(savedLeft === 'true')
    }
    if (savedRight !== null) {
      setRightSidebarOpen(savedRight === 'true')
    }
  }, [])

  // 왼쪽 사이드바 토글
  const toggleLeftSidebar = () => {
    setLeftSidebarOpen(prev => {
      const newValue = !prev
      localStorage.setItem(LEFT_SIDEBAR_KEY, String(newValue))
      return newValue
    })
  }

  // 오른쪽 사이드바 토글
  const toggleRightSidebar = () => {
    setRightSidebarOpen(prev => {
      const newValue = !prev
      localStorage.setItem(RIGHT_SIDEBAR_KEY, String(newValue))
      return newValue
    })
  }

  return {
    leftSidebarOpen,
    rightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
  }
}
