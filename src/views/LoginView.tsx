import React, { useState } from 'react';
import { Crosshair, Lock, Mail, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { loginApi } from '../api';
import { AdminUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim() || !password) {
      setError('Por favor ingresa tu identificador táctico y contraseña.');
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const res = await loginApi(identificador.trim(), password);
      onLoginSuccess(res.jugador);
    } catch (err: any) {
      setError(err.message || 'Fallo de autenticación en la Comandancia.');
    } finally {
      setCargando(false);
    }
  };

  const handleIdentificadorChange = (val: string) => {
    setIdentificador(val);
    if (error) setError(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen bg-tactical-dark flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Retícula Táctica de Fondo */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#f97316 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Halo táctico sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-tactical-orange/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-tactical-card border border-tactical-border rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Cabecera y Distintivo Táctico */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-tactical-input border border-tactical-orange/40 mx-auto flex items-center justify-center text-tactical-orange shadow-lg shadow-orange-950/40 mb-4 transition hover:border-tactical-orange">
            <Crosshair className="w-9 h-9" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-tactical-orange uppercase px-2.5 py-0.5 rounded bg-tactical-orange/10 border border-tactical-orange/30 inline-block mb-1.5">
            ESTACIÓN DE COMANDANCIA
          </span>
          <h1 className="font-tactical text-2xl font-black text-white tracking-wider">BÁJATE PO!</h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Puesto de mando central. Acceso restringido exclusivamente a oficiales de administración.
          </p>
        </div>

        {/* Mensaje de Error Táctico En-Línea */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/80 border-l-4 border-l-red-500 border border-red-800/60 text-red-200 text-xs flex items-start justify-between gap-2 shadow-lg animate-fadeIn">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-white transition shrink-0 p-0.5"
              title="Descartar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Formulario de Acceso */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Callsign o Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                autoComplete="username"
                disabled={cargando}
                placeholder="ej: Jedi o admin@bajatepo.cl"
                value={identificador}
                onChange={(e) => handleIdentificadorChange(e.target.value)}
                required
                className="w-full bg-tactical-input border border-tactical-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-tactical-orange disabled:opacity-60 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={cargando}
                placeholder="••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                className="w-full bg-tactical-input border border-tactical-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-tactical-orange disabled:opacity-60 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                tabIndex={-1}
              >
                {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full mt-6 py-3 px-4 bg-tactical-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-orange-500/25 transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando Oficial...</span>
              </>
            ) : (
              <span>Ingresar a la Comandancia</span>
            )}
          </button>
        </form>

        {/* Footer Táctico */}
        <div className="mt-8 pt-5 border-t border-tactical-border/60 flex items-center justify-center space-x-2 text-[10px] font-mono text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-tactical-orange/70" />
          <span>CANAL ENCRIPTADO • ACCESO RESTRINGIDO AUDITADO</span>
        </div>
      </div>
    </div>
  );
};
