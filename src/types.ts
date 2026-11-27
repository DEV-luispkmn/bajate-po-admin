export interface AdminUser {
  id: number;
  alias: string;
  email: string;
  rango?: string;
  avatarUrl?: string;
  region?: string;
  esAdmin: boolean;
}

export interface EstadisticasAdmin {
  totalJugadores: number;
  totalCanchasActivas: number;
  canchasPendientesRevision: number;
  ticketsPendientes: number;
  totalTickets: number;
  totalEquipos: number;
  totalEventos: number;
}

export interface CanchaFoto {
  id?: number;
  url: string;
  descripcion?: string;
}

export interface CanchaAdmin {
  id: number;
  nombre: string;
  descripcion?: string | null;
  region?: string | null;
  ciudad?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  esAbierta: boolean;
  adminEquipoId?: number | null;
  activa: boolean;
  estado: 'EN_REVISION' | 'ACTIVA' | 'RECHAZADA';
  createdAt: string;
  fotos?: CanchaFoto[];
  creador?: {
    id: number;
    alias: string;
    email: string;
  } | null;
  equipoAdmin?: {
    id: number;
    nombre: string;
    activo?: boolean;
  } | null;
}

export interface TicketAdmin {
  id: number;
  jugadorId: number;
  tipo: 'IDEA' | 'SUGERENCIA' | 'PROBLEMA' | 'CANCHA' | 'OTRO';
  titulo: string;
  mensaje: string;
  estado: 'PENDIENTE' | 'EN_REVISION' | 'RESPONDIDO' | 'CERRADO';
  respuestaAdmin?: string | null;
  createdAt: string;
  jugador: {
    id: number;
    alias: string;
    email: string;
    rango?: string;
    avatarUrl?: string;
    region?: string;
  };
}

export interface JugadorAdmin {
  id: number;
  alias: string;
  email: string;
  rango?: string;
  region?: string;
  ciudad?: string;
  roles?: string;
  esAdmin: boolean;
  avatarUrl?: string;
  createdAt: string;
  equipo?: {
    id: number;
    nombre: string;
  } | null;
  _count: {
    bandos: number;
    eventosCreados: number;
    tickets: number;
  };
}

export interface EquipoAdmin {
  id: number;
  nombre: string;
  lema?: string | null;
  descripcion?: string | null;
  logoUrl?: string | null;
  region?: string | null;
  ciudad?: string | null;
  activo?: boolean;
  fechaFundacion?: string | null;
  createdAt: string;
  jugadores: {
    id: number;
    alias: string;
    email: string;
    rango?: string;
  }[];
  canchasAdmin: {
    id: number;
    nombre: string;
    estado: string;
  }[];
  _count: {
    jugadores: number;
  };
}

export const REGIONES_CHILE = [
  'Región Metropolitana',
  'Región de Valparaíso',
  'Región del Biobío',
  'Región de la Araucanía',
  'Región de Coquimbo',
  'Región de Antofagasta',
  'Región de Los Lagos',
  "Región de O'Higgins",
  'Región del Maule',
  'Región de Los Ríos',
  'Región de Tarapacá',
  'Región de Arica y Parinacota',
  'Región de Atacama',
  'Región de Aysén',
  'Región de Magallanes',
  'Región de Ñuble',
];
