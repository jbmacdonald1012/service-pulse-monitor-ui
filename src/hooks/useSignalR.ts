import { useEffect, useState } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import type { AlertEvent, StatusChangedEvent } from '../types';

export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface SignalRState {
  statusEvents: StatusChangedEvent[];
  alertEvents: AlertEvent[];
  connectionState: ConnectionState;
}

export function useSignalR(): SignalRState {
  const [statusEvents, setStatusEvents] = useState<StatusChangedEvent[]>([]);
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('connecting');

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/health')
      .withAutomaticReconnect()
      .build();

    connection.on('ServiceStatusChanged', (event: StatusChangedEvent) => {
      setStatusEvents((prev) => [...prev, event]);
    });

    connection.on('AlertGenerated', (event: AlertEvent) => {
      // Cap at 100 entries — newest at the end
      setAlertEvents((prev) => [...prev.slice(-99), event]);
    });

    connection.onreconnecting(() => setConnectionState('connecting'));
    connection.onreconnected(() => setConnectionState('connected'));
    connection.onclose(() => setConnectionState('disconnected'));

    connection
      .start()
      .then(() => setConnectionState('connected'))
      .catch(() => setConnectionState('error'));

    return () => {
      void connection.stop();
    };
  }, []);

  return { statusEvents, alertEvents, connectionState };
}
