import React from 'react';
import {
  MapPin,
  Inbox,
  Users,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { EstadisticasAdmin } from '../types';
import { TabType } from '../components/Sidebar';

interface DashboardViewProps {
  stats: EstadisticasAdmin | null;
  onNavigate: (tab: TabType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, onNavigate }) => {
  const canchasPendientes = stats?.canchasPendientesRevision || 0;
  const ticketsPendientes = stats?.ticketsPendientes || 0;

  return (
    <div className="space-y-8">
      {/* Alertas de Acción Inmediata si hay pendientes */}
      {(canchasPendientes > 0 || ticketsPendientes > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {canchasPendientes > 0 && (
            <div className="bg-tactical-card border border-tactical-border border-l-4 border-l-tactical-orange p-5 rounded-xl flex items-center justify-between shadow-lg hover:border-slate-600 transition">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-orange-950/70 border border-tactical-orange/60 flex items-center justify-center text-tactical-orange shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-tactical-orange bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/40">
                      ACCIÓN REQUERIDA
                    </span>
                  </div>
                  <h3 className="font-tactical font-black text-white text-base mt-1">
                    {canchasPendientes} {canchasPendientes === 1 ? 'CANCHA EN ESPERA' : 'CANCHAS EN ESPERA DE REVISIÓN'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Operadores han subido propuestas con fotos para validación técnica.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('canchas')}
                className="px-4 py-2 bg-tactical-orange hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shrink-0 shadow-md shadow-orange-600/20"
              >
                <span>Revisar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {ticketsPendientes > 0 && (
            <div className="bg-tactical-card border border-tactical-border border-l-4 border-l-tactical-amber p-5 rounded-xl flex items-center justify-between shadow-lg hover:border-slate-600 transition">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-amber-950/70 border border-tactical-amber/60 flex items-center justify-center text-tactical-amber shrink-0">
                  <Inbox className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-tactical-amber bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                      BUZÓN ACTIVO
                    </span>
                  </div>
                  <h3 className="font-tactical font-black text-white text-base mt-1">
                    {ticketsPendientes} {ticketsPendientes === 1 ? 'TICKET PENDIENTE' : 'TICKETS SIN RESPONDER'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sugerencias, dudas o reportes en el buzón de la comandancia.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('tickets')}
                className="px-4 py-2 bg-tactical-amber hover:bg-amber-500 text-black text-xs font-black rounded-lg transition flex items-center space-x-1.5 shrink-0 shadow-md shadow-amber-600/20"
              >
                <span>Responder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Canchas Activas */}
        <div className="bg-tactical-card border border-tactical-border p-5 rounded-xl hover:border-slate-600 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Canchas Activas</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-tactical font-black text-white tabular-nums">
              {stats?.totalCanchasActivas || 0}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">en radar</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Campos aprobados para partidas públicas</p>
        </div>

        {/* Canchas en Revisión */}
        <div className="bg-tactical-card border border-tactical-border p-5 rounded-xl hover:border-slate-600 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">En Revisión</span>
            <AlertTriangle className="w-4 h-4 text-tactical-orange" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-tactical font-black text-tactical-orange tabular-nums">
              {stats?.canchasPendientesRevision || 0}
            </span>
            <span className="text-xs text-slate-400">por validar</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Propuestas ingresadas por la comunidad</p>
        </div>

        {/* Operadores Totales */}
        <div className="bg-tactical-card border border-tactical-border p-5 rounded-xl hover:border-slate-600 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Operadores</span>
            <Users className="w-4 h-4 text-tactical-blue" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-tactical font-black text-white tabular-nums">
              {stats?.totalJugadores || 0}
            </span>
            <span className="text-xs text-tactical-blue font-semibold">fichas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Jugadores con perfil táctico registrado</p>
        </div>

        {/* Equipos */}
        <div className="bg-tactical-card border border-tactical-border p-5 rounded-xl hover:border-slate-600 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Equipos</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-tactical font-black text-white tabular-nums">
              {stats?.totalEquipos || 0}
            </span>
            <span className="text-xs text-purple-400 font-semibold">escuadrones</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Equipos y escuadrones formalmente formados</p>
        </div>
      </div>

      {/* Sección Inferior: Estado del Sistema y Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accesos Rápidos */}
        <div className="lg:col-span-2 bg-tactical-card border border-tactical-border rounded-xl p-6">
          <h3 className="font-tactical text-base font-bold text-white mb-4 flex items-center space-x-2">
            <Flame className="w-5 h-5 text-tactical-orange" />
            <span>ACCIONES DE COMANDANCIA</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('canchas')}
              className="p-4 bg-tactical-input hover:bg-tactical-border/70 border border-tactical-border rounded-lg text-left transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-tactical-orange uppercase tracking-wider">CAMPOS & CANCHAS</span>
                <MapPin className="w-4 h-4 text-slate-400 group-hover:text-tactical-orange transition" />
              </div>
              <p className="text-sm font-bold text-white">Aprobar o Rechazar Canchas</p>
              <p className="text-xs text-slate-400 mt-1">Revisa evidencias fotográficas y descripciones enviadas por los jugadores.</p>
            </button>

            <button
              onClick={() => onNavigate('tickets')}
              className="p-4 bg-tactical-input hover:bg-tactical-border/70 border border-tactical-border rounded-lg text-left transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-tactical-amber uppercase tracking-wider">BUZÓN DE STAFF</span>
                <Inbox className="w-4 h-4 text-slate-400 group-hover:text-tactical-amber transition" />
              </div>
              <p className="text-sm font-bold text-white">Responder Tickets y Sugerencias</p>
              <p className="text-xs text-slate-400 mt-1">Envía respuestas oficiales que llegarán de inmediato a la app móvil del operador.</p>
            </button>

            <button
              onClick={() => onNavigate('jugadores')}
              className="p-4 bg-tactical-input hover:bg-tactical-border/70 border border-tactical-border rounded-lg text-left transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-tactical-blue uppercase tracking-wider">COMUNIDAD</span>
                <Users className="w-4 h-4 text-slate-400 group-hover:text-tactical-blue transition" />
              </div>
              <p className="text-sm font-bold text-white">Directorio de Operadores</p>
              <p className="text-xs text-slate-400 mt-1">Busca por callsign, otorga permisos de administrador o modera fichas.</p>
            </button>

            <button
              onClick={() => onNavigate('equipos')}
              className="p-4 bg-tactical-input hover:bg-tactical-border/70 border border-tactical-border rounded-lg text-left transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">EQUIPOS</span>
                <Shield className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition" />
              </div>
              <p className="text-sm font-bold text-white">Gestión de Equipos & Escuadrones</p>
              <p className="text-xs text-slate-400 mt-1">Verifica nóminas de combatientes, campos asociados, estados y capitanes de equipo.</p>
            </button>
          </div>
        </div>

        {/* Estado Operacional */}
        <div className="bg-tactical-card border border-tactical-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-tactical text-base font-bold text-white mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>ESTADO DE PLATAFORMA</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 bg-tactical-input rounded-lg border border-tactical-border/50">
                <span className="text-slate-400">Canal API NestJS</span>
                <span className="flex items-center text-emerald-400 font-bold space-x-1.5 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{stats ? 'Conectado (:8080)' : 'Sincronizando...'}</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-tactical-input rounded-lg border border-tactical-border/50">
                <span className="text-slate-400">Persistencia Base de Datos</span>
                <span className="flex items-center text-emerald-400 font-bold space-x-1.5 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{stats ? 'MySQL Activa (Prisma)' : 'Sincronizando...'}</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-tactical-input rounded-lg border border-tactical-border/50">
                <span className="text-slate-400">Total Operaciones / Partidas</span>
                <span className="text-white font-bold tabular-nums font-mono">{stats?.totalEventos || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-tactical-input rounded-lg border border-tactical-border/50">
                <span className="text-slate-400">Total Tickets Registrados</span>
                <span className="text-white font-bold tabular-nums font-mono">{stats?.totalTickets || 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-tactical-border/60 text-[11px] text-slate-500 text-center">
            Seguridad reforzada con JWT y Guardias de Comandancia
          </div>
        </div>
      </div>
    </div>
  );
};
