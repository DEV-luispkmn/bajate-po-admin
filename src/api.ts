import { AdminUser, EstadisticasAdmin, CanchaAdmin, TicketAdmin, JugadorAdmin, EquipoAdmin } from './types';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const TOKEN_KEY = 'bajate_po_admin_token';
const USER_KEY = 'bajate_po_admin_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: AdminUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCurrentUser(): AdminUser | null {
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    if (endpoint !== '/auth/login') {
      clearSession();
      window.location.reload();
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error en la solicitud HTTP ${response.status}`);
  }

  return response.json();
}

// 🔐 Autenticación Staff
export async function loginApi(identificador: string, password: string): Promise<{ accessToken: string; jugador: AdminUser }> {
  const data = await apiFetch<{ accessToken: string; jugador: AdminUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identificador, password }),
  });

  if (!data.jugador.esAdmin) {
    throw new Error('Acceso Denegado: Esta cuenta no posee rango de Comandancia / Administrador.');
  }

  setSession(data.accessToken, data.jugador);
  return data;
}

// 📊 Métricas Generales
export async function getEstadisticasApi(): Promise<EstadisticasAdmin> {
  return apiFetch<EstadisticasAdmin>('/admin/estadisticas');
}

// 🗺️ Gestión de Canchas
export async function getCanchasApi(estado?: string, region?: string): Promise<CanchaAdmin[]> {
  const params = new URLSearchParams();
  if (estado && estado !== 'TODAS') params.append('estado', estado);
  if (region && region !== 'TODAS') params.append('region', region);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<CanchaAdmin[]>(`/admin/canchas${qs}`);
}

export async function cambiarEstadoCanchaApi(id: number, estado: 'ACTIVA' | 'RECHAZADA' | 'EN_REVISION', motivo?: string): Promise<CanchaAdmin> {
  return apiFetch<CanchaAdmin>(`/admin/canchas/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado, motivo }),
  });
}

export async function modificarCanchaAdminApi(
  id: number,
  data: {
    nombre?: string;
    descripcion?: string;
    region?: string;
    ciudad?: string;
    latitud?: number;
    longitud?: number;
    esAbierta?: boolean;
    adminEquipoId?: number | null;
  }
): Promise<CanchaAdmin> {
  return apiFetch<CanchaAdmin>(`/admin/canchas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// 📬 Buzón de Tickets & Sugerencias
export async function getTicketsApi(tipo?: string, estado?: string): Promise<TicketAdmin[]> {
  const params = new URLSearchParams();
  if (tipo && tipo !== 'TODOS') params.append('tipo', tipo);
  if (estado && estado !== 'TODOS') params.append('estado', estado);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<TicketAdmin[]>(`/admin/tickets${qs}`);
}

export async function responderTicketApi(id: number, estado: 'PENDIENTE' | 'EN_REVISION' | 'RESPONDIDO' | 'CERRADO', respuestaAdmin: string): Promise<TicketAdmin> {
  return apiFetch<TicketAdmin>(`/admin/tickets/${id}/responder`, {
    method: 'PATCH',
    body: JSON.stringify({ estado, respuestaAdmin }),
  });
}

// 👥 Operadores
export async function getJugadoresApi(busqueda?: string, region?: string): Promise<JugadorAdmin[]> {
  const params = new URLSearchParams();
  if (busqueda && busqueda.trim()) params.append('busqueda', busqueda.trim());
  if (region && region !== 'TODAS') params.append('region', region);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<JugadorAdmin[]>(`/admin/jugadores${qs}`);
}

export async function toggleAdminApi(id: number, esAdmin: boolean): Promise<{ id: number; alias: string; esAdmin: boolean }> {
  return apiFetch<{ id: number; alias: string; esAdmin: boolean }>(`/admin/jugadores/${id}/admin`, {
    method: 'PATCH',
    body: JSON.stringify({ esAdmin }),
  });
}

export async function eliminarJugadorApi(id: number): Promise<{ mensaje: string; id: number }> {
  return apiFetch<{ mensaje: string; id: number }>(`/admin/jugadores/${id}`, {
    method: 'DELETE',
  });
}

// ⚔️ Equipos
export async function getEquiposApi(region?: string, activo?: boolean): Promise<EquipoAdmin[]> {
  const params = new URLSearchParams();
  if (region && region !== 'TODAS') params.append('region', region);
  if (activo !== undefined) params.append('activo', String(activo));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<EquipoAdmin[]>(`/admin/equipos${qs}`);
}

export async function toggleActivoEquipoApi(id: number, activo: boolean): Promise<EquipoAdmin> {
  return apiFetch<EquipoAdmin>(`/admin/equipos/${id}/activo`, {
    method: 'PATCH',
    body: JSON.stringify({ activo }),
  });
}
