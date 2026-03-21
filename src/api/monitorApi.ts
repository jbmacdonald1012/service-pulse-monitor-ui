import axios from 'axios';
import type {
  PagedResult,
  ServiceDto,
  ServiceHealthSummaryDto,
  ServiceSummary,
  HealthCheckDto,
  DependencyEdge,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchServices(
  pageNumber = 1,
  pageSize = 20,
): Promise<PagedResult<ServiceDto>> {
  const { data } = await api.get<PagedResult<ServiceDto>>(
    `/api/services?pageNumber=${pageNumber}&pageSize=${pageSize}`,
  );
  return data;
}

export async function fetchServiceHealth(
  serviceId: number,
): Promise<ServiceHealthSummaryDto> {
  const { data } = await api.get<ServiceHealthSummaryDto>(
    `/api/services/${serviceId}/health`,
  );
  return data;
}

export async function fetchHealthChecks(
  serviceId: number,
  limit = 10,
): Promise<HealthCheckDto[]> {
  const { data } = await api.get<HealthCheckDto[]>(
    `/api/services/${serviceId}/healthchecks?limit=${limit}`,
  );
  return data;
}

export async function fetchDependencyGraph(): Promise<DependencyEdge[]> {
  const { data } = await api.get<DependencyEdge[]>('/api/dependencies');
  return data;
}

/**
 * Loads all services then fans out parallel health calls to populate status.
 * Uses Promise.allSettled so one failing health endpoint shows 'Unknown'
 * for that service without breaking the entire dashboard load.
 */
export async function fetchAllServicesWithHealth(): Promise<ServiceSummary[]> {
  const paged = await fetchServices(1, 20);

  const healthResults = await Promise.allSettled(
    paged.items.map((svc) => fetchServiceHealth(svc.serviceId)),
  );

  return paged.items.map((svc, i) => {
    const result = healthResults[i];
    if (result.status === 'fulfilled') {
      return {
        serviceId: svc.serviceId,
        serviceName: svc.serviceName,
        baseUrl: svc.baseUrl,
        description: svc.description,
        currentStatus: result.value.currentStatus,
        lastCheckAt: result.value.lastCheckAt,
        uptimePercentage: result.value.uptimePercentage,
        averageResponseTimeMs: result.value.averageResponseTimeMs,
      };
    }
    return {
      serviceId: svc.serviceId,
      serviceName: svc.serviceName,
      baseUrl: svc.baseUrl,
      description: svc.description,
      currentStatus: 'Unknown' as const,
      lastCheckAt: null,
      uptimePercentage: 0,
      averageResponseTimeMs: null,
    };
  });
}
