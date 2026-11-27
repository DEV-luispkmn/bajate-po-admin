import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  MapPin,
  Loader2,
  Check,
  Trash2,
  AlertTriangle,
  X,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react';
import { getJugadoresApi, toggleAdminApi, eliminarJugadorApi, getCurrentUser } from '../api';
import { JugadorAdmin, REGIONES_CHILE } from '../types';
import { ModalConfirmacionTactico } from '../components/ModalConfirmacionTactico';

export const JugadoresView: React.FC = () => {
  const [jugadores, setJugadores] = useState<JugadorAdmin[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRegion, setFiltroRegion] = useState<string>('TODAS');
  const [filtroAfiliacion, setFiltroAfiliacion] = useState<'TODOS' | 'CON_EQUIPO' | 'LOBOS' | 'ADMINS'>('TODOS');
  const [orden, setOrden] = useState<'ID_ASC' | 'RECIENTES' | 'ALIAS_ASC' | 'REGION_ASC'>('ID_ASC');
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Modal para confirmación de cambio de rol admin
  const [modalAdmin, setModalAdmin] = useState<{
    isOpen: boolean;
    jugador: JugadorAdmin | null;
    nuevoEstado: boolean;
  }>({
    isOpen: false,
    jugador: null,
    nuevoEstado: false,
  });

  // Modal para confirmación de eliminación
  const [jugadorAEliminar, setJugadorAEliminar] = useState<JugadorAdmin | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const currentUser = getCurrentUser();

  const cargarJugadores = async () => {
    try {
      setCargando(true);
      setErrorGlobal(null);
      const data = await getJugadoresApi(busqueda, filtroRegion);
      setJugadores(data);
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al cargar operadores');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarJugadores();
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda, filtroRegion]);

  const solicitarToggleAdmin = (jugador: JugadorAdmin) => {
    setModalAdmin({
      isOpen: true,
      jugador,
      nuevoEstado: !jugador.esAdmin,
    });
  };

  const ejecutarToggleAdmin = async () => {
    if (!modalAdmin.jugador) return;
    const { jugador, nuevoEstado } = modalAdmin;
    setModalAdmin({ isOpen: false, jugador: null, nuevoEstado: false });

    try {
      setProcesandoId(jugador.id);
      setErrorGlobal(null);
      await toggleAdminApi(jugador.id, nuevoEstado);
      setJugadores((prev) =>
        prev.map((j) => (j.id === jugador.id ? { ...j, esAdmin: nuevoEstado } : j))
      );
      setMensaje(
        nuevoEstado
          ? `Permisos de Administrador concedidos a "${jugador.alias}".`
          : `Permisos de Administrador revocados a "${jugador.alias}".`
      );
      setTimeout(() => setMensaje(null), 3000);
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al actualizar permisos');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!jugadorAEliminar) return;

    try {
      setEliminando(true);
      setErrorGlobal(null);
      await eliminarJugadorApi(jugadorAEliminar.id);
      setJugadores((prev) => prev.filter((j) => j.id !== jugadorAEliminar.id));
      setMensaje(`Operador "${jugadorAEliminar.alias}" eliminado correctamente del sistema.`);
      setJugadorAEliminar(null);
      setTimeout(() => setMensaje(null), 4000);
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al eliminar operador');
    } finally {
      setEliminando(false);
    }
  };

  // Filtrado cliente por afiliación / rol admin
  const jugadoresFiltrados = jugadores.filter((j) => {
    if (filtroAfiliacion === 'CON_EQUIPO') return Boolean(j.equipo);
    if (filtroAfiliacion === 'LOBOS') return !j.equipo;
    if (filtroAfiliacion === 'ADMINS') return j.esAdmin;
    return true;
  });

  // Ordenamiento cliente
  const jugadoresOrdenados = [...jugadoresFiltrados].sort((a, b) => {
    if (orden === 'RECIENTES') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (orden === 'ALIAS_ASC') {
      return a.alias.localeCompare(b.alias, 'es');
    }
    if (orden === 'REGION_ASC') {
      const regA = a.region || '';
      const regB = b.region || '';
      const cmp = regA.localeCompare(regB, 'es');
      if (cmp !== 0) return cmp;
      return a.alias.localeCompare(b.alias, 'es');
    }
    return a.id - b.id;
  });

  return (
    <div className="space-y-6">
      {/* Alerta de Error Global */}
      {errorGlobal && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-600/60 text-red-200 text-sm font-semibold flex items-center space-x-2.5 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorGlobal}</span>
        </div>
      )}

      {/* Alerta de notificación */}
      {mensaje && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-600/60 text-emerald-200 text-sm font-semibold flex items-center space-x-2.5 shadow-lg">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* Cabecera Táctica y Buscador */}
      <div className="bg-tactical-card p-4 rounded-xl border border-tactical-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-tactical text-lg font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-tactical-orange" />
            <span>DIRECTORIO DE OPERADORES</span>
          </h3>
          <p className="text-xs text-slate-400">
            Base de datos general de combatientes registrados en el país.
          </p>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Callsign, correo o región..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-tactical-input border border-tactical-border rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-tactical-orange"
          />
        </div>
      </div>

      {/* Barra de Filtros de Afiliación, Región y Orden */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-tactical-card p-4 rounded-xl border border-tactical-border">
        {/* Chips de Afiliación / Rol */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'TODOS', label: '🌐 TODOS' },
              { id: 'CON_EQUIPO', label: '🛡️ CON EQUIPO' },
              { id: 'LOBOS', label: '🐺 LOBOS SOLITARIOS' },
              { id: 'ADMINS', label: '⭐ ADMINS' },
            ] as const
          ).map((tipo) => {
            const activo = filtroAfiliacion === tipo.id;
            return (
              <button
                key={tipo.id}
                onClick={() => setFiltroAfiliacion(tipo.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  activo
                    ? tipo.id === 'ADMINS'
                      ? 'bg-tactical-orange text-white'
                      : tipo.id === 'CON_EQUIPO'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-200 text-slate-900'
                    : 'bg-tactical-input text-slate-400 hover:text-white hover:bg-tactical-border'
                }`}
              >
                <span>{tipo.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filtros de Región y Orden */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Región */}
          <select
            value={filtroRegion}
            onChange={(e) => setFiltroRegion(e.target.value)}
            className="bg-tactical-input border border-tactical-border text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-tactical-orange cursor-pointer"
          >
            <option value="TODAS">🇨🇱 Todas las Regiones</option>
            {REGIONES_CHILE.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>

          {/* Selector de Orden */}
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as any)}
            className="bg-tactical-input border border-tactical-border text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-tactical-orange cursor-pointer"
          >
            <option value="ID_ASC">🔢 ID de Operador (1-9)</option>
            <option value="RECIENTES">⏱️ Más recientes primero</option>
            <option value="ALIAS_ASC">🔤 Callsign / Alias (A-Z)</option>
            <option value="REGION_ASC">📍 Región (A-Z)</option>
          </select>

          <span className="text-xs text-slate-400 font-mono px-2 py-1 bg-tactical-input/50 rounded border border-tactical-border/60">
            {jugadoresOrdenados.length} {jugadoresOrdenados.length === 1 ? 'operador' : 'operadores'}
          </span>
        </div>
      </div>

      {/* Tabla de Jugadores */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-tactical-orange mb-3" />
          <p className="text-sm">Rastreando registro de combatientes...</p>
        </div>
      ) : jugadoresOrdenados.length === 0 ? (
        <div className="text-center py-16 bg-tactical-card border border-tactical-border rounded-xl">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="font-tactical text-base font-bold text-white">Sin coincidencias</h4>
          <p className="text-xs text-slate-400 mt-1">No se encontraron operadores con ese criterio o filtro de región.</p>
        </div>
      ) : (
        <div className="bg-tactical-card border border-tactical-border rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tactical-input/80 text-slate-400 uppercase tracking-wider font-bold border-b border-tactical-border">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white transition select-none"
                    onClick={() => setOrden(orden === 'ALIAS_ASC' ? 'ID_ASC' : 'ALIAS_ASC')}
                    title="Ordenar por Callsign"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Operador</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white transition select-none"
                    onClick={() => setOrden(orden === 'REGION_ASC' ? 'ID_ASC' : 'REGION_ASC')}
                    title="Ordenar por Ubicación"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Ubicación</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Equipo</th>
                  <th className="py-3 px-4">Especialidades</th>
                  <th className="py-3 px-4">Rango / Rol</th>
                  <th className="py-3 px-4 text-center">Permisos Admin</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tactical-border/60">
                {jugadoresOrdenados.map((j) => {
                  const estaProcesando = procesandoId === j.id;
                  const esMiUsuario = currentUser?.id === j.id;

                  return (
                    <tr key={j.id} className="hover:bg-tactical-input/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-tactical-input border border-tactical-border overflow-hidden flex items-center justify-center text-xs font-bold text-tactical-orange shrink-0">
                            {j.avatarUrl ? (
                              <img src={j.avatarUrl} alt={j.alias} className="w-full h-full object-cover" />
                            ) : (
                              j.alias.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white block text-sm flex items-center space-x-1.5">
                              <span>{j.alias}</span>
                              {esMiUsuario && (
                                <span className="text-[10px] bg-tactical-orange/20 text-tactical-orange px-1.5 py-0.5 rounded font-black">
                                  TÚ
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-400">{j.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {j.region ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-tactical-orange shrink-0" />
                            <span>
                              {j.region}
                              {j.ciudad ? ` • ${j.ciudad}` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No especificada</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {j.equipo ? (
                          <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300 font-bold">
                            🛡️ {j.equipo.nombre}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Lobo solitario</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {j.roles ? (
                          <span className="font-mono text-[11px] text-tactical-orange font-bold">
                            [{j.roles}]
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-tactical-input border border-tactical-border text-slate-200 font-bold">
                          {j.rango || 'Pichón'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => solicitarToggleAdmin(j)}
                          disabled={estaProcesando || esMiUsuario}
                          title={esMiUsuario ? 'No puedes modificar tus propios permisos' : undefined}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 mx-auto ${
                            j.esAdmin
                              ? 'bg-tactical-orange/20 border border-tactical-orange text-tactical-orange hover:bg-red-950/80 hover:text-red-300 hover:border-red-700'
                              : 'bg-tactical-input hover:bg-tactical-border text-slate-400 hover:text-white'
                          } ${esMiUsuario ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {j.esAdmin ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>ADMINISTRADOR</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-3.5 h-3.5" />
                              <span>Hacer Admin</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setJugadorAEliminar(j)}
                          disabled={estaProcesando || esMiUsuario}
                          title={esMiUsuario ? 'No puedes eliminar tu propia cuenta en sesión' : `Eliminar operador ${j.alias}`}
                          className={`p-2 rounded-lg text-xs font-bold transition flex items-center justify-center mx-auto ${
                            esMiUsuario
                              ? 'opacity-30 cursor-not-allowed bg-tactical-input text-slate-600'
                              : 'bg-red-950/40 border border-red-800/60 text-red-400 hover:bg-red-900/80 hover:text-white hover:border-red-600 shadow-sm'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Táctico de Asignación / Revocación de Rol Admin */}
      <ModalConfirmacionTactico
        isOpen={modalAdmin.isOpen}
        titulo={modalAdmin.nuevoEstado ? '¿CONCEDER RANGO DE ADMIN?' : '¿REVOCAR RANGO DE ADMIN?'}
        mensaje={
          modalAdmin.nuevoEstado
            ? `¿Seguro que deseas otorgar permisos de Administrador a "${modalAdmin.jugador?.alias}" (${modalAdmin.jugador?.email})? Tendrá acceso total a la Comandancia Web para gestionar canchas, reportes y combatientes.`
            : `¿Seguro que deseas revocar los permisos de Administrador a "${modalAdmin.jugador?.alias}"? Perderá acceso inmediato a la Estación de Comandancia.`
        }
        textoConfirmar={modalAdmin.nuevoEstado ? 'Conceder Rango Admin' : 'Revocar Permisos'}
        tipo={modalAdmin.nuevoEstado ? 'advertencia' : 'peligro'}
        onConfirmar={ejecutarToggleAdmin}
        onCancelar={() => setModalAdmin({ isOpen: false, jugador: null, nuevoEstado: false })}
      />

      {/* Modal Táctico de Confirmación de Eliminación */}
      <ModalConfirmacionTactico
        isOpen={Boolean(jugadorAEliminar)}
        titulo="¿ELIMINAR OPERADOR DEL SISTEMA?"
        mensaje={`¿Estás seguro de que deseas eliminar permanentemente al operador "${jugadorAEliminar?.alias}" (${jugadorAEliminar?.email})?\n\nEsta acción es irreversible y purgará sus registros de combate, perfil e historial de partidas. Las canchas creadas por este operador se mantendrán registradas en el radar.`}
        textoConfirmar="Confirmar Eliminación"
        tipo="peligro"
        cargando={eliminando}
        onConfirmar={handleConfirmarEliminar}
        onCancelar={() => !eliminando && setJugadorAEliminar(null)}
      />
    </div>
  );
};
