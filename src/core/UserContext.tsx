"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { identifyUser } from "./analytics"
import { getSession, queryKeys } from "./api"

export function useSession() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async () => {
      const result = await getSession()
      return {
        user: result.user,
        environment: result.environment,
      }
    },
  })
}

export function CurrentUserTracker() {
  const sessionQuery = useSession()
  const reportedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!sessionQuery.data?.user || reportedUserIdRef.current === sessionQuery.data?.user.id) {
      return
    }

    identifyUser(sessionQuery.data.user)
    reportedUserIdRef.current = sessionQuery.data.user.id
  }, [sessionQuery.data?.user?.id])

  return null
}
