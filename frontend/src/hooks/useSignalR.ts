import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'

export function useSignalR(hubPath: string) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubPath)
      .withAutomaticReconnect()
      .build()

    connection.start().catch((err) => console.error('SignalR connect failed', err))
    connectionRef.current = connection

    return () => {
      connection.stop()
    }
  }, [hubPath])

  return connectionRef
}
