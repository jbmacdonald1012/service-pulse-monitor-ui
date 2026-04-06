// ─── Status ──────────────────────────────────────────────────────────────────

export type ServiceStatus = 'Healthy' | 'Degraded' | 'Unhealthy' | 'Unknown';

// ─── Raw API shapes (match backend DTOs exactly) ─────────────────────────────

export interface ServiceDto {
  serviceId: number;
  serviceName: string;
  baseUrl: string | null;
  description: string | null;
  registeredAt: string;
  lastSeenAt: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface ServiceHealthSummaryDto {
  serviceId: number;
  serviceName: string;
  baseUrl: string | null;
  currentStatus: ServiceStatus;
  lastCheckAt: string | null;
  totalHealthChecks: number;
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
  averageResponseTimeMs: number | null;
  uptimePercentage: number;
}

export interface HealthCheckDto {
  healthCheckId: number;
  serviceId: number;
  serviceName: string;
  status: ServiceStatus;
  responseTimeMs: number | null;
  checkedAt: string;
  details: Record<string, unknown> | null;
}

// ─── Application shape (merged service + health) ──────────────────────────────

export interface ServiceSummary {
  serviceId: number;
  serviceName: string;
  baseUrl: string | null;
  description: string | null;
  currentStatus: ServiceStatus;
  lastCheckAt: string | null;
  uptimePercentage: number;
  averageResponseTimeMs: number | null;
}

// ─── SignalR event shapes ─────────────────────────────────────────────────────

export interface StatusChangedEvent {
  serviceId: number;
  serviceName: string;
  status: Exclude<ServiceStatus, 'Unknown'>;
  responseTimeMs: number | null;
  timestamp: string;
}

export interface AlertEvent {
  serviceId: number;
  serviceName: string;
  alertType: string;
  message: string;
  triggeredAt: string;
}

export interface AlertDto {
  alertId: number;
  serviceId: number;
  serviceName: string | null;
  alertType: string;
  triggeredAt: string;
  isAcknowledged: boolean;
  isResolved: boolean;
  resolvedAt: string | null;
  message: string | null;
}

export interface AlertsResolvedEvent {
  serviceId: number;
  serviceName: string;
}

export interface AlertAcknowledgedEvent {
  alertId: number;
}

export interface ServiceRegisteredEvent {
  serviceId: number;
  serviceName: string;
  baseUrl: string | null;
  registeredAt: string;
}

export interface DependencyDiscoveredEvent {
  sourceId: number;
  sourceName: string;
  targetId: number;
  targetName: string;
  discoveredAt: string;
}

// ─── Dependency graph shapes ──────────────────────────────────────────────────

export interface DependencyEdge {
  sourceId: number;
  sourceName: string;
  targetId: number;
  targetName: string;
  discoveredAt: string; // backend field is discoveredAt, NOT detectedAt
}
