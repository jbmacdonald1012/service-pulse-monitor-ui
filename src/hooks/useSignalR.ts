import { useEffect, useState } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import type { AlertAcknowledgedEvent, AlertEvent, AlertsResolvedEvent, DependencyDiscoveredEvent, ServiceRegisteredEvent, StatusChangedEvent } from '../types';

export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface SignalRState {
  statusEvents: StatusChangedEvent[];
  alertEvents: AlertEvent[];
  alertsResolvedEvents: AlertsResolvedEvent[];
  alertAcknowledgedEvents: AlertAcknowledgedEvent[];
  registrationEvents: ServiceRegisteredEvent[];
  dependencyEvents: DependencyDiscoveredEvent[];
  connectionState: ConnectionState;
}

export function useSignalR(): SignalRState {
  const [statusEvents, setStatusEvents] = useState<StatusChangedEvent[]>([]);
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);
  const [alertsResolvedEvents, setAlertsResolvedEvents] = useState<AlertsResolvedEvent[]>([]);
  const [alertAcknowledgedEvents, setAlertAcknowledgedEvents] = useState<AlertAcknowledgedEvent[]>([]);
  const [registrationEvents, setRegistrationEvents] = useState<ServiceRegisteredEvent[]>([]);
  const [dependencyEvents, setDependencyEvents] = useState<DependencyDiscoveredEvent[]>([]);
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

    connection.on('AlertsResolved', (event: AlertsResolvedEvent) => {
      setAlertsResolvedEvents((prev) => [...prev, event]);
    });

    connection.on('AlertAcknowledged', (event: AlertAcknowledgedEvent) => {
      setAlertAcknowledgedEvents((prev) => [...prev, event]);
    });

    connection.on('ServiceRegistered', (event: ServiceRegisteredEvent) => {
      setRegistrationEvents((prev) => [...prev, event]);
    });

    connection.on('DependencyDiscovered', (event: DependencyDiscoveredEvent) => {
      setDependencyEvents((prev) => [...prev, event]);
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

  return { statusEvents, alertEvents, alertsResolvedEvents, alertAcknowledgedEvents, registrationEvents, dependencyEvents, connectionState };
}
