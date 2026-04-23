import mixpanel from "mixpanel-browser"
import { useEffect } from "react"
import type { LuvabaseMember } from "./types"

const MIXPANEL_TOKEN = "da2f532931ff8badc6e413c08ef81053"

let initialized = false

export function MixpanelInit() {
  useEffect(() => {
    if (location.hostname === "localhost") {
      console.log("Mixpanel not initialized: development")
      return
    }
    if (!MIXPANEL_TOKEN) {
      console.warn("Mixpanel token is missing")
      return
    }

    mixpanel.init(MIXPANEL_TOKEN, { autotrack: true, api_host: "https://api-eu.mixpanel.com" })
    initialized = true
  }, [])

  return null
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) {
    return
  }
  mixpanel.track(event, properties)
  console.log("trackEvent", event, properties)
}

export function identifyUser(user: LuvabaseMember) {
  if (!initialized) {
    return
  }
  mixpanel.identify(user.id)

  mixpanel.people.set({
    $name: user.name,
  })
}
