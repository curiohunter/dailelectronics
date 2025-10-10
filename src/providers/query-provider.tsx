'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5분간 데이터를 신선하게 유지 (stale 상태로 전환 안 됨)
            staleTime: 5 * 60 * 1000,
            // 10분간 가비지 컬렉션 방지 (캐시 메모리에 보관)
            gcTime: 10 * 60 * 1000,
            // 윈도우 포커스 시 자동 refetch 비활성화 (사용자가 컨트롤)
            refetchOnWindowFocus: false,
            // 컴포넌트 마운트 시 stale 데이터면 refetch
            refetchOnMount: true,
            // 실패 시 1회 재시도
            retry: 1,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
