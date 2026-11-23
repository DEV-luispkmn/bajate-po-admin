import React, { useState } from 'react';
import { LogOut, ShieldCheck, RefreshCw } from 'lucide-react';
import { AdminUser } from '../types';
import { ModalConfirmacionTactico } from './ModalConfirmacionTactico';

interface HeaderProps {
  user: AdminUser | null;
  onLogout: () => void;
  onRefresh: () => void;
  cargando: boolean;
  titulo: string;
  lastSync?: Date | null;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onRefresh,
  cargando,
  titulo,
  lastSync,
}) => {
  const [modalLogoutOpen, setModalLogoutOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-tactical-card/90 backdrop-blur-md border-b border-tactical-border px-8 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h2 className="text-lg font-tactical font-black text-white tracking-wide uppercase">
            {titulo}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Botón Refrescar y Timestamp */}
          <div className="flex items-center space-x-2.5 bg-tactical-input/60 border border-tactical-border/70 rounded-lg px-2.5 py-1">
            {lastSync && (
              <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                Sincronizado: <strong className="text-slate-200">{lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
              </span>
            )}
            <button
              onClick={onRefresh}
              disabled={cargando}
              title="Refrescar datos en vivo de la base de datos"
              className="p-1 rounded text-slate-400 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-tactical-orange' : ''}`} />
            </button>
          </div>

          {/* Perfil Admin */}
          <div className="flex items-center space-x-3 pl-4 border-l border-tactical-border">
            <div className="w-8 h-8 rounded-full bg-tactical-orange/20 border border-tactical-orange flex items-center justify-center text-tactical-orange font-bold text-xs">
              {user?.alias ? user.alias.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-white leading-tight">{user?.alias || 'Comandante'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-tactical-orange" />
              </div>
              <span className="text-[10px] text-slate-400 block leading-tight">{user?.email || 'admin@bajatepo.cl'}</span>
            </div>
          </div>

          {/* Salir */}
          <button
            onClick={() => setModalLogoutOpen(true)}
            title="Cerrar sesión de Comandancia"
            className="p-2 rounded-lg bg-red-950/40 border border-red-800/40 hover:bg-red-900/60 text-red-300 transition flex items-center space-x-1.5 text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Modal Táctico de Cierre de Sesión */}
      <ModalConfirmacionTactico
        isOpen={modalLogoutOpen}
        titulo="¿ABANDONAR LA ESTACIÓN?"
        mensaje="¿Estás seguro de que deseas cerrar tu sesión en la Comandancia Web? Se requerirá autenticación táctica para volver a ingresar."
        textoConfirmar="Cerrar Sesión"
        textoCancelar="Permanecer en Base"
        tipo="peligro"
        onConfirmar={() => {
          setModalLogoutOpen(false);
          onLogout();
        }}
        onCancelar={() => setModalLogoutOpen(false)}
      />
    </>
  );
};
