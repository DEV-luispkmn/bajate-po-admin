import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, Loader2, ShieldAlert } from 'lucide-react';

export type TipoModalTactico = 'peligro' | 'advertencia' | 'exito' | 'info';

interface ModalConfirmacionTacticoProps {
  isOpen: boolean;
  titulo: string;
  mensaje: string | React.ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  tipo?: TipoModalTactico;
  soloAceptar?: boolean;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar?: () => void;
}

export const ModalConfirmacionTactico: React.FC<ModalConfirmacionTacticoProps> = ({
  isOpen,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  tipo = 'advertencia',
  soloAceptar = false,
  cargando = false,
  onConfirmar,
  onCancelar,
}) => {
  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !cargando && onCancelar) {
        onCancelar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cargando, onCancelar]);

  if (!isOpen) return null;

  const estilosTipo = {
    peligro: {
      borderCard: 'border-red-800/80',
      bgIcon: 'bg-red-950/80 border-red-800/80 text-red-400',
      btnConfirm: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30',
      badgeColor: 'text-red-400',
      tag: 'ACCIÓN CRÍTICA',
      Icon: AlertTriangle,
    },
    advertencia: {
      borderCard: 'border-amber-600/80',
      bgIcon: 'bg-amber-950/80 border-amber-600/80 text-tactical-amber',
      btnConfirm: 'bg-tactical-orange hover:bg-orange-600 text-white shadow-orange-600/30',
      badgeColor: 'text-tactical-amber',
      tag: 'ADVERTENCIA TÁCTICA',
      Icon: ShieldAlert,
    },
    exito: {
      borderCard: 'border-emerald-600/80',
      bgIcon: 'bg-emerald-950/80 border-emerald-600/80 text-emerald-400',
      btnConfirm: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
      badgeColor: 'text-emerald-400',
      tag: 'TRANSMISIÓN EXITOSA',
      Icon: CheckCircle2,
    },
    info: {
      borderCard: 'border-tactical-border',
      bgIcon: 'bg-tactical-input border-tactical-border text-tactical-blue',
      btnConfirm: 'bg-tactical-orange hover:bg-orange-600 text-white shadow-orange-600/30',
      badgeColor: 'text-slate-400',
      tag: 'REPORTE DE ESTADO',
      Icon: Info,
    },
  }[tipo];

  const Icono = estilosTipo.Icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-tactical-card border ${estilosTipo.borderCard} w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${estilosTipo.bgIcon}`}>
              <Icono className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider block ${estilosTipo.badgeColor}`}>
                {estilosTipo.tag}
              </span>
              <h3 className="font-tactical text-lg font-black text-white leading-tight mt-0.5">
                {titulo}
              </h3>
            </div>
          </div>

          {!cargando && onCancelar && (
            <button
              onClick={onCancelar}
              className="p-1.5 rounded-lg bg-tactical-input hover:bg-tactical-border text-slate-400 hover:text-white transition"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mensaje / Cuerpo */}
        <div className="p-4 bg-tactical-input/60 rounded-xl border border-tactical-border text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
          {mensaje}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          {!soloAceptar && onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              disabled={cargando}
              className="px-4 py-2.5 rounded-lg bg-tactical-input hover:bg-tactical-border text-slate-300 text-xs font-bold transition disabled:opacity-50"
            >
              {textoCancelar}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 shadow-lg disabled:opacity-50 ${estilosTipo.btnConfirm}`}
          >
            {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{cargando ? 'Procesando...' : textoConfirmar}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
