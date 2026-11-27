import React, { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Inbox,
  Users,
  Shield,
  Crosshair,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { EstadisticasAdmin } from '../types';

export type TabType = 'dashboard' | 'canchas' | 'tickets' | 'jugadores' | 'equipos';

const SIDEBAR_STORAGE_KEY = 'bajatepo_sidebar_colapsado';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  stats: EstadisticasAdmin | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, stats }) => {
  const [colapsado, setColapsado] = useState<boolean>(() => {
    try {
      const guardado = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (guardado !== null) return guardado === 'true';
    } catch {
      // Ignorar si localStorage no está disponible
    }
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });

  const toggleColapsado = () => {
    setColapsado((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Ignorar
      }
      return next;
    });
  };

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Panel Principal',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'canchas' as TabType,
      label: 'Canchas',
      icon: MapPin,
      badge: stats && stats.canchasPendientesRevision > 0 ? stats.canchasPendientesRevision : null,
      badgeColor: 'bg-tactical-orange text-white animate-pulse',
    },
    {
      id: 'tickets' as TabType,
      label: 'Buzón de Tickets',
      icon: Inbox,
      badge: stats && stats.ticketsPendientes > 0 ? stats.ticketsPendientes : null,
      badgeColor: 'bg-tactical-amber text-black font-black',
    },
    {
      id: 'jugadores' as TabType,
      label: 'Operadores',
      icon: Users,
      badge: null,
    },
    {
      id: 'equipos' as TabType,
      label: 'Equipos',
      icon: Shield,
      badge: null,
    },
  ];

  return (
    <aside
      className={`${
        colapsado ? 'w-20' : 'w-64'
      } bg-tactical-card border-r border-tactical-border flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 transition-[width] duration-200 ease-out`}
    >
      {/* Botón Toggle Modo Riel */}
      <button
        type="button"
        onClick={toggleColapsado}
        aria-label={colapsado ? 'Expandir barra lateral' : 'Colapsar barra lateral a modo riel'}
        aria-expanded={!colapsado}
        title={colapsado ? 'Expandir panel lateral' : 'Colapsar a modo riel'}
        className="absolute top-[76px] -right-3 z-50 w-6 h-6 rounded-full bg-tactical-card border border-tactical-border hover:border-tactical-orange text-slate-400 hover:text-white flex items-center justify-center shadow-md transition-colors"
      >
        {colapsado ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Brand Header */}
      <div>
        <div
          className={`h-[88px] border-b border-tactical-border flex items-center ${
            colapsado ? 'justify-center px-0' : 'px-6 space-x-3'
          }`}
          title={colapsado ? 'BÁJATE PO! • Comandancia Web' : undefined}
        >
          <div className="w-10 h-10 shrink-0 rounded-lg bg-tactical-orange flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Crosshair className="w-6 h-6" />
          </div>
          {!colapsado && (
            <div className="min-w-0">
              <h1 className="font-tactical text-xl font-extrabold text-white tracking-wider whitespace-nowrap">
                BÁJATE PO!
              </h1>
              <p className="text-[10px] text-tactical-orange font-bold uppercase tracking-widest whitespace-nowrap">
                Comandancia Web
              </p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className={colapsado ? 'p-3 space-y-2' : 'p-4 space-y-1.5'}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                onClick={() => onSelectTab(item.id)}
                className={`relative group w-full flex items-center rounded-lg text-sm font-semibold transition-all duration-200 ${
                  colapsado ? 'justify-center p-3' : 'justify-between px-3.5 py-3'
                } ${
                  isActive
                    ? 'bg-tactical-orange/15 text-tactical-orange border border-tactical-orange/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-input/60 border border-transparent'
                }`}
              >
                <div className={colapsado ? 'flex items-center justify-center' : 'flex items-center space-x-3 min-w-0'}>
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-tactical-orange' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  {!colapsado && <span className="whitespace-nowrap">{item.label}</span>}
                </div>

                {!colapsado && item.badge !== null && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      item.badgeColor || 'bg-slate-700 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {colapsado && item.badge !== null && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-black leading-none shadow-md ring-2 ring-tactical-card ${
                      item.badgeColor || 'bg-slate-700 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {colapsado && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 px-3 py-1.5 rounded-lg bg-tactical-dark border border-tactical-border shadow-xl text-xs font-bold text-white whitespace-nowrap opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 flex items-center space-x-2"
                  >
                    <span>{item.label}</span>
                    {item.badge !== null && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                          item.badgeColor || 'bg-slate-700 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-tactical-border text-xs text-slate-500 text-center">
        {colapsado ? (
          <p className="font-mono text-[10px] text-slate-500" title="v1.0.0-PROD • Airsoft Chile 🇨🇱">
            v1.0
          </p>
        ) : (
          <p className="font-mono text-[11px] whitespace-nowrap">v1.0.0-PROD • Airsoft Chile 🇨🇱</p>
        )}
      </div>
    </aside>
  );
};
