/** Tells a collection's watchers that the backend changed it, so they re-fetch (backend: /topic/vldc/{collection}). */
export type ChangeFeed = { watch(collection: string, onChange: () => void): () => void }

/** The part of @stomp/stompjs Client this feed uses; injected so tests need no socket. */
export type StompClientLike = {
  activate(): void
  deactivate(): unknown
  subscribe(destination: string, cb: (message: { body: string }) => void): { unsubscribe(): void }
  connected: boolean
  connectHeaders: Record<string, string>
}
export type StompClientConfig = { brokerURL: string; reconnectDelay: number; beforeConnect: () => void; onConnect: () => void }

const topicOf = (collection: string) => `/topic/vldc/${collection}`

/** ws(s)://<api host>/ws, or the page's own host when the API base is empty (nginx/Vite proxy /ws). */
export function socketUrl(apiBase: string, location: { protocol: string; host: string }): string {
  if (apiBase) return `${apiBase.replace(/\/+$/, "").replace(/^http/, "ws")}/ws`
  return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`
}

/**
 * One shared STOMP connection, opened on the first watch and closed after the last. The token is read on every
 * (re)connect so a refreshed token is used. Each connect re-subscribes and refreshes every watcher, which also
 * catches up on changes missed while disconnected.
 */
export function stompChangeFeed({ url, token, createClient, reconnectDelay = 5000 }: {
  url: () => string
  token: () => string | null
  createClient: (config: StompClientConfig) => StompClientLike
  reconnectDelay?: number
}): ChangeFeed {
  const watchers = new Map<string, Set<() => void>>()
  const subscriptions = new Map<string, { unsubscribe(): void }>()
  let client: StompClientLike | null = null

  const notify = (collection: string) => watchers.get(collection)?.forEach((fn) => fn())
  const subscribe = (collection: string) => {
    if (!client || subscriptions.has(collection)) return
    subscriptions.set(collection, client.subscribe(topicOf(collection), () => notify(collection)))
  }

  function start() {
    const created = createClient({
      brokerURL: url(),
      reconnectDelay,
      beforeConnect: () => {
        const current = token()
        created.connectHeaders = current ? { Authorization: `Bearer ${current}` } : {}
      },
      onConnect: () => {
        subscriptions.clear() // subscriptions die with the previous connection
        watchers.forEach((_, collection) => subscribe(collection))
        watchers.forEach((_, collection) => notify(collection))
      },
    })
    client = created
    created.activate()
  }

  return {
    watch(collection, onChange) {
      const set = watchers.get(collection) ?? new Set()
      set.add(onChange)
      watchers.set(collection, set)
      if (!client) start()
      else if (client.connected) subscribe(collection)
      return () => {
        set.delete(onChange)
        if (set.size > 0) return
        watchers.delete(collection)
        subscriptions.get(collection)?.unsubscribe()
        subscriptions.delete(collection)
        if (watchers.size === 0 && client) {
          void client.deactivate()
          client = null
        }
      }
    },
  }
}
