import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  MapPin,
  Calendar,
  Loader2,
  Check,
  PowerOff,
  AlertTriangle,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import { getEquiposApi, toggleActivoEquipoApi } from '../api';
import { EquipoAdmin, REGIONES_CHILE } from '../types';
import { ModalConfirmacionTactico } from '../components/ModalConfirmacionTactico';

export const EquiposView: React.FC = () => {
  const [equipos, setEquipos] = useState<EquipoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<'TODOS' | 'ACTIVOS' | 'DESHABILITADOS'>('TODOS');
  const [filtroRegion, setFiltroRegion] = useState<string>('TODAS');
  const [orden, setOrden] = useState<'RECIENTES' | 'REGION' | 'NOMBRE'>('RECIENTES');
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Modal táctico de confirmación
  const [modalConfirmacion, setModalConfirmacion] = useState<{
    isOpen: boolean;
    titulo: string;
    mensaje: string;
    textoConfirmar: string;
    tipo: 'peligro' | 'advertencia';
    onConfirmar: () => void;
  }>({
    isOpen: false,
    titulo: '',
    mensaje: '',
    textoConfirmar: '',
    tipo: 'advertencia',
    onConfirmar: () => {},
  });

  const cargarEquipos = async () => {
    try {
      setCargando(true);
      setErrorGlobal(null);
      const activoParam =
        filtroActivo === 'TODOS'
          ? undefined
          : filtroActivo === 'ACTIVOS'
          ? true
          : false;

      const data = await getEquiposApi(filtroRegion, activoParam);
      setEquipos(data);
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al cargar equipos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEquipos();
  }, [filtroActivo, filtroRegion]);

  const solicitarToggleActivo = (equipo: EquipoAdmin) => {
    const nuevoEstado = !(equipo.activo ?? true);
    const titulo = nuevoEstado ? '¿HABILITAR EQUIPO EN RADAR?' : '¿DESHABILITAR EQUIPO?';
    const mensaje = nuevoEstado
      ? `¿Deseas habilitar nuevamente al equipo "${equipo.nombre}" para que vuelva a figurar en el radar y reclutamiento de combatientes?`
      : `¿Estás seguro de que deseas deshabilitar al equipo "${equipo.nombre}"?\n\nSu historial de partidas versus, torneos y estadísticas permanecerán intactos, pero no aparecerá en el radar táctico ni en el explorador de la app móvil.`;

    setModalConfirmacion({
      isOpen: true,
      titulo,
      mensaje,
      textoConfirmar: nuevoEstado ? 'Habilitar Equipo' : 'Deshabilitar Equipo',
      tipo: nuevoEstado ? 'advertencia' : 'peligro',
      onConfirmar: () => ejecutarToggleActivo(equipo, nuevoEstado),
    });
  };

  const ejecutarToggleActivo = async (equipo: EquipoAdmin, nuevoEstado: boolean) => {
    setModalConfirmacion((prev) => ({ ...prev, isOpen: false }));
    const accion = nuevoEstado ? 'habilitar' : 'deshabilitar';

    try {
      setProcesandoId(equipo.id);
      setErrorGlobal(null);
      const actualizado = await toggleActivoEquipoApi(equipo.id, nuevoEstado);
      setEquipos((prev) =>
        prev.map((e) => (e.id === equipo.id ? { ...e, activo: actualizado.activo } : e))
      );
      setMensajeExito(
        nuevoEstado
          ? `¡Equipo "${equipo.nombre}" habilitado con éxito!`
          : `Equipo "${equipo.nombre}" deshabilitado. Su historial se mantiene preservado.`
      );
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      setErrorGlobal(err.message || `Error al ${accion} el equipo.`);
    } finally {
      setProcesandoId(null);
    }
  };

  // Filtrado y Ordenamiento cliente
  const equiposFiltrados = equipos.filter((e) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.trim().toLowerCase();
    const nombre = e.nombre?.toLowerCase() || '';
    const lema = e.lema?.toLowerCase() || '';
    const ciudad = e.ciudad?.toLowerCase() || '';
    const region = e.region?.toLowerCase() || '';
    const desc = e.descripcion?.toLowerCase() || '';
    const miembros = e.jugadores?.some((j) => j.alias.toLowerCase().includes(q)) || false;
    return (
      nombre.includes(q) ||
      lema.includes(q) ||
      ciudad.includes(q) ||
      region.includes(q) ||
      desc.includes(q) ||
      miembros
    );
  });

  const equiposOrdenados = [...equiposFiltrados].sort((a, b) => {
    if (orden === 'REGION') {
      const regA = a.region || '';
      const regB = b.region || '';
      const cmp = regA.localeCompare(regB, 'es');
      if (cmp !== 0) return cmp;
      return a.nombre.localeCompare(b.nombre, 'es');
    }
    if (orden === 'NOMBRE') {
      return a.nombre.localeCompare(b.nombre, 'es');
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Banner de Error Global */}
      {errorGlobal && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-600/60 text-red-200 text-sm font-semibold flex items-center space-x-2.5 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorGlobal}</span>
        </div>
      )}

      {/* Banner de Mensaje de Éxito */}
      {mensajeExito && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-600/60 text-emerald-200 text-sm font-semibold flex items-center space-x-2.5 shadow-lg">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Cabecera Principal y Buscador */}
      <div className="bg-tactical-card p-4 rounded-xl border border-tactical-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="font-tactical text-lg font-bold text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <span>EQUIPOS & ESCUADRONES</span>
          </h3>
          <p className="text-xs text-slate-400">
            Gestión táctica de clanes y escuadrones registrados. Puedes habilitar o deshabilitar conservando su historial.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, lema o miembro..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-tactical-input border border-tactical-border rounded-lg pl-10 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-tactical-orange transition"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-slate-400 font-mono px-3 py-2 bg-tactical-input rounded-lg border border-tactical-border shrink-0">
            {equiposOrdenados.length} {equiposOrdenados.length === 1 ? 'equipo' : 'equipos'}
          </span>
        </div>
      </div>

      {/* Barra de Filtros y Orden */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-tactical-card p-4 rounded-xl border border-tactical-border">
        {/* Filtros de Estado Activo/Deshabilitado */}
        <div className="flex flex-wrap items-center gap-2">
          {(['TODOS', 'ACTIVOS', 'DESHABILITADOS'] as const).map((estado) => {
            const activo = filtroActivo === estado;
            return (
              <button
                key={estado}
                onClick={() => setFiltroActivo(estado)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  activo
                    ? estado === 'ACTIVOS'
                      ? 'bg-emerald-600 text-white'
                      : estado === 'DESHABILITADOS'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-200 text-slate-900'
                    : 'bg-tactical-input text-slate-400 hover:text-white hover:bg-tactical-border'
                }`}
              >
                <span>
                  {estado === 'TODOS'
                    ? '🌐 TODOS'
                    : estado === 'ACTIVOS'
                    ? '✓ ACTIVOS'
                    : '✕ DESHABILITADOS'}
                </span>
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
            <option value="RECIENTES">⏱️ Más recientes primero</option>
            <option value="REGION">📍 Ordenar por Región (A-Z)</option>
            <option value="NOMBRE">🔤 Ordenar por Nombre (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Lista de Equipos */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-tactical-orange mb-3" />
          <p className="text-sm">Rastreando equipos y escuadrones...</p>
        </div>
      ) : equiposOrdenados.length === 0 ? (
        <div className="text-center py-16 bg-tactical-card border border-tactical-border rounded-xl">
          <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="font-tactical text-base font-bold text-white">
            {busqueda ? 'Sin escuadras coincidentes' : 'Sin equipos en esta categoría'}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {busqueda
              ? `No se encontraron equipos que coincidan con "${busqueda}".`
              : 'No se encontraron equipos con los filtros de estado o región seleccionados.'}
          </p>
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="mt-3 px-3 py-1.5 bg-tactical-input hover:bg-tactical-border text-xs font-bold text-tactical-orange rounded-lg transition"
            >
              Limpiar Búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {equiposOrdenados.map((equipo) => {
            const estaActivo = equipo.activo !== false;
            const estaProcesando = procesandoId === equipo.id;

            return (
              <div
                key={equipo.id}
                className={`bg-tactical-card border rounded-xl p-5 transition flex flex-col justify-between space-y-4 ${
                  estaActivo
                    ? 'border-tactical-border hover:border-slate-500'
                    : 'border-red-950/60 bg-tactical-card/70 opacity-90'
                }`}
              >
                <div>
                  {/* Fila superior: Estado e ID */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        estaActivo
                          ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-400'
                          : 'bg-red-950/60 border-red-600/50 text-red-400'
                      }`}
                    >
                      {estaActivo ? '✓ ACTIVO' : '✕ DESHABILITADO'}
                    </span>

                    <span className="text-[10px] text-slate-500 font-mono">
                      ID #{equipo.id}
                    </span>
                  </div>

                  {/* Logo + Nombre + Región */}
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400 font-black font-tactical text-lg shrink-0 overflow-hidden">
                      {equipo.logoUrl ? (
                        <img
                          src={equipo.logoUrl}
                          alt={equipo.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        equipo.nombre.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-tactical text-lg font-black text-white truncate">
                        {equipo.nombre}
                      </h4>
                      <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-tactical-orange shrink-0" />
                        <span className="truncate">
                          {equipo.region || 'Región no especificada'}
                          {equipo.ciudad ? ` • ${equipo.ciudad}` : ''}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Lema o Descripción */}
                  {equipo.lema && (
                    <p className="text-xs text-purple-300 italic mb-2">
                      "{equipo.lema}"
                    </p>
                  )}

                  {equipo.descripcion ? (
                    <p className="text-xs text-slate-300 bg-tactical-input/50 p-2.5 rounded border border-tactical-border/40 line-clamp-2">
                      {equipo.descripcion}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Sin descripción táctica registrada.</p>
                  )}

                  {/* Nómina de Miembros */}
                  <div className="mt-4 pt-3 border-t border-tactical-border/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span>ROSTER ({equipo._count?.jugadores || equipo.jugadores?.length || 0})</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {equipo.jugadores && equipo.jugadores.length > 0 ? (
                        equipo.jugadores.map((m) => (
                          <span
                            key={m.id}
                            className="px-2 py-0.5 rounded bg-tactical-input border border-tactical-border text-[11px] text-slate-200"
                          >
                            {m.alias}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Sin miembros activos</span>
                      )}
                    </div>
                  </div>

                  {/* Canchas Administradas */}
                  {equipo.canchasAdmin && equipo.canchasAdmin.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-tactical-border/60 text-xs">
                      <span className="text-[10px] font-bold text-tactical-orange uppercase tracking-wider block mb-1">
                        CAMPOS ADMINISTRADOS:
                      </span>
                      <div className="space-y-1">
                        {equipo.canchasAdmin.map((c) => (
                          <div key={c.id} className="flex items-center space-x-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-tactical-orange shrink-0" />
                            <span className="truncate">{c.nombre}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer de la Tarjeta con Botonera de Gestión */}
                <div className="pt-3 border-t border-tactical-border/60 space-y-2">
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Registrado el {new Date(equipo.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Botón de Habilitar / Deshabilitar Equipo */}
                  <button
                    onClick={() => solicitarToggleActivo(equipo)}
                    disabled={estaProcesando}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      estaActivo
                        ? 'bg-tactical-input hover:bg-red-950/70 hover:border-red-600/60 hover:text-red-300 text-slate-300 border border-tactical-border'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {estaProcesando ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : estaActivo ? (
                      <>
                        <PowerOff className="w-3.5 h-3.5 text-red-400" />
                        <span>Deshabilitar Equipo</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Habilitar Equipo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Táctico de Confirmación de Habilitar / Deshabilitar */}
      <ModalConfirmacionTactico
        isOpen={modalConfirmacion.isOpen}
        titulo={modalConfirmacion.titulo}
        mensaje={modalConfirmacion.mensaje}
        textoConfirmar={modalConfirmacion.textoConfirmar}
        tipo={modalConfirmacion.tipo}
        onConfirmar={modalConfirmacion.onConfirmar}
        onCancelar={() => setModalConfirmacion((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
