import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Check,
  X,
  ExternalLink,
  Camera,
  Eye,
  Loader2,
  User,
  Edit3,
  PowerOff,
  Save,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  Search,
  LayoutGrid,
  List,
  ImageOff,
} from 'lucide-react';
import { getCanchasApi, cambiarEstadoCanchaApi, modificarCanchaAdminApi, getEquiposApi } from '../api';
import { CanchaAdmin, EquipoAdmin, REGIONES_CHILE } from '../types';
import { ModalConfirmacionTactico } from '../components/ModalConfirmacionTactico';

export const CanchasView: React.FC = () => {
  const [canchas, setCanchas] = useState<CanchaAdmin[]>([]);
  const [equipos, setEquipos] = useState<EquipoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modoVista, setModoVista] = useState<'GRID' | 'TABLA'>('GRID');
  const [fotosError, setFotosError] = useState<Record<string, boolean>>({});
  const [filtroEstado, setFiltroEstado] = useState<'TODAS' | 'EN_REVISION' | 'ACTIVA' | 'RECHAZADA'>('TODAS');
  const [filtroRegion, setFiltroRegion] = useState<string>('TODAS');
  const [orden, setOrden] = useState<'RECIENTES' | 'REGION' | 'NOMBRE'>('RECIENTES');
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<CanchaAdmin | null>(null);
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

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

  // Estados para modo edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editCiudad, setEditCiudad] = useState('');
  const [editLatitud, setEditLatitud] = useState('');
  const [editLongitud, setEditLongitud] = useState('');
  const [editEsAbierta, setEditEsAbierta] = useState(true);
  const [editAdminEquipoId, setEditAdminEquipoId] = useState<number | null>(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const cargarCanchas = async () => {
    try {
      setCargando(true);
      setErrorGlobal(null);
      const data = await getCanchasApi(filtroEstado, filtroRegion);
      setCanchas(data);
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al cargar canchas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCanchas();
  }, [filtroEstado, filtroRegion]);

  useEffect(() => {
    getEquiposApi()
      .then((data) => setEquipos(data))
      .catch((err) => console.error('Error cargando equipos:', err));
  }, []);

  // Listener para cerrar modal o confirmación con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalConfirmacion.isOpen) {
          setModalConfirmacion((prev) => ({ ...prev, isOpen: false }));
        } else if (canchaSeleccionada) {
          setCanchaSeleccionada(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalConfirmacion.isOpen, canchaSeleccionada]);

  const canchasFiltradas = canchas.filter((c) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.trim().toLowerCase();
    const nombre = c.nombre?.toLowerCase() || '';
    const ciudad = c.ciudad?.toLowerCase() || '';
    const region = c.region?.toLowerCase() || '';
    const equipo = c.equipoAdmin?.nombre?.toLowerCase() || '';
    const creador = c.creador?.alias?.toLowerCase() || '';
    const desc = c.descripcion?.toLowerCase() || '';
    return (
      nombre.includes(q) ||
      ciudad.includes(q) ||
      region.includes(q) ||
      equipo.includes(q) ||
      creador.includes(q) ||
      desc.includes(q)
    );
  });

  const canchasOrdenadas = [...canchasFiltradas].sort((a, b) => {
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

  const abrirModalCancha = (cancha: CanchaAdmin) => {
    setCanchaSeleccionada(cancha);
    setModoEdicion(false);
    setEditNombre(cancha.nombre);
    setEditDescripcion(cancha.descripcion || '');
    setEditRegion(cancha.region || '');
    setEditCiudad(cancha.ciudad || '');
    setEditLatitud(cancha.latitud ? String(cancha.latitud) : '');
    setEditLongitud(cancha.longitud ? String(cancha.longitud) : '');
    setEditEsAbierta(cancha.esAbierta !== false && !cancha.equipoAdmin);
    setEditAdminEquipoId(cancha.adminEquipoId ?? (cancha.equipoAdmin?.id ?? null));
    setMotivo('');
    setErrorEdicion(null);
  };

  const handleCambiarEstado = async (canchaId: number, nuevoEstado: 'ACTIVA' | 'RECHAZADA' | 'EN_REVISION') => {
    try {
      setProcesando(true);
      setErrorGlobal(null);
      const actualizada = await cambiarEstadoCanchaApi(canchaId, nuevoEstado, motivo.trim() || undefined);
      
      // Actualizar listado local
      setCanchas((prev) => prev.map((c) => (c.id === canchaId ? actualizada : c)));
      
      if (canchaSeleccionada?.id === canchaId) {
        setCanchaSeleccionada(actualizada);
      }

      setMensajeExito(
        nuevoEstado === 'ACTIVA'
          ? `¡Cancha "${actualizada.nombre}" aprobada y activada con éxito!`
          : nuevoEstado === 'RECHAZADA'
          ? `Cancha "${actualizada.nombre}" desactivada / rechazada.`
          : `Cancha puesta en revisión.`
      );
      setMotivo('');
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al actualizar estado de la cancha');
    } finally {
      setProcesando(false);
    }
  };

  const solicitarAprobarCancha = (cancha: CanchaAdmin) => {
    setModalConfirmacion({
      isOpen: true,
      titulo: '¿APROBAR Y ACTIVAR CANCHA?',
      mensaje: `¿Confirmas la activación táctica de "${cancha.nombre}"? Pasará a estar visible en el radar para toda la comunidad de operadores.`,
      textoConfirmar: 'Aprobar Cancha',
      tipo: 'advertencia',
      onConfirmar: () => {
        setModalConfirmacion((prev) => ({ ...prev, isOpen: false }));
        handleCambiarEstado(cancha.id, 'ACTIVA');
      },
    });
  };

  const solicitarRechazarCancha = (cancha: CanchaAdmin) => {
    setModalConfirmacion({
      isOpen: true,
      titulo: '¿DESACTIVAR / RECHAZAR CANCHA?',
      mensaje: `¿Confirmas que deseas rechazar o desactivar la cancha "${cancha.nombre}"? Dejará de estar disponible en el despliegue táctico.`,
      textoConfirmar: 'Rechazar Cancha',
      tipo: 'peligro',
      onConfirmar: () => {
        setModalConfirmacion((prev) => ({ ...prev, isOpen: false }));
        handleCambiarEstado(cancha.id, 'RECHAZADA');
      },
    });
  };

  const solicitarReactivarCancha = (cancha: CanchaAdmin) => {
    setModalConfirmacion({
      isOpen: true,
      titulo: '¿REACTIVAR CANCHA EN RADAR?',
      mensaje: `¿Confirmas la reactivación táctica de "${cancha.nombre}"? Volverá a estar activa y visible para agendar partidas.`,
      textoConfirmar: 'Reactivar Cancha',
      tipo: 'advertencia',
      onConfirmar: () => {
        setModalConfirmacion((prev) => ({ ...prev, isOpen: false }));
        handleCambiarEstado(cancha.id, 'ACTIVA');
      },
    });
  };

  const solicitarConvertirEnAbierta = (canchaId: number) => {
    const nombre = canchaSeleccionada?.nombre || 'esta cancha';
    setModalConfirmacion({
      isOpen: true,
      titulo: '¿CONVERTIR EN CANCHA ABIERTA?',
      mensaje: `¿Deseas desvincular la cancha "${nombre}" de su equipo y convertirla en una cancha abierta/comunitaria accesible para todos los operadores de la plataforma?`,
      textoConfirmar: 'Pasar a Cancha Abierta',
      tipo: 'advertencia',
      onConfirmar: () => ejecutarConvertirEnAbierta(canchaId),
    });
  };

  const ejecutarConvertirEnAbierta = async (canchaId: number) => {
    setModalConfirmacion((prev) => ({ ...prev, isOpen: false }));
    try {
      setGuardandoEdicion(true);
      setErrorGlobal(null);
      const actualizada = await modificarCanchaAdminApi(canchaId, {
        esAbierta: true,
        adminEquipoId: null,
      });
      setCanchas((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)));
      if (canchaSeleccionada?.id === canchaId) {
        setCanchaSeleccionada(actualizada);
        setEditEsAbierta(true);
        setEditAdminEquipoId(null);
      }
      setMensajeExito(`¡Cancha "${actualizada.nombre}" convertida en Cancha Abierta Comunitaria!`);
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al convertir cancha');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canchaSeleccionada) return;
    if (!editNombre.trim()) {
      setErrorEdicion('El nombre de la cancha es obligatorio.');
      return;
    }

    try {
      setGuardandoEdicion(true);
      setErrorEdicion(null);
      const dataAEnviar: any = {
        nombre: editNombre.trim(),
        descripcion: editDescripcion.trim() || undefined,
        region: editRegion.trim() || undefined,
        ciudad: editCiudad.trim() || undefined,
        esAbierta: editEsAbierta,
        adminEquipoId: editEsAbierta ? null : (editAdminEquipoId ? Number(editAdminEquipoId) : null),
      };

      if (editLatitud.trim()) {
        const parsedLat = parseFloat(editLatitud);
        if (!isNaN(parsedLat)) dataAEnviar.latitud = parsedLat;
      }
      if (editLongitud.trim()) {
        const parsedLng = parseFloat(editLongitud);
        if (!isNaN(parsedLng)) dataAEnviar.longitud = parsedLng;
      }

      const actualizada = await modificarCanchaAdminApi(canchaSeleccionada.id, dataAEnviar);
      setCanchas((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)));
      setCanchaSeleccionada(actualizada);
      setModoEdicion(false);
      setMensajeExito(`¡Cancha "${actualizada.nombre}" modificada con éxito por la Comandancia!`);
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      setErrorEdicion(err.message || 'Error al modificar cancha');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Error Global */}
      {errorGlobal && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-600/60 text-red-200 text-sm font-semibold flex items-center space-x-2.5 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorGlobal}</span>
        </div>
      )}

      {/* Notificación de éxito */}
      {mensajeExito && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-600/60 text-emerald-200 text-sm font-semibold flex items-center space-x-2.5 shadow-lg">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Cabecera y Buscador en Tiempo Real */}
      <div className="bg-tactical-card p-4 rounded-xl border border-tactical-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="font-tactical text-lg font-bold text-white flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-tactical-orange" />
            <span>CAMPOS & CANCHAS DE JUEGO</span>
          </h3>
          <p className="text-xs text-slate-400">
            Control técnico, coordenadas y aprobación de terrenos de combate en Chile.
          </p>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de cancha, comuna o escuadra..."
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
      </div>

      {/* Barra de Filtros de Estado, Región y Orden */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-tactical-card p-4 rounded-xl border border-tactical-border">
        {/* Chips de Estado */}
        <div className="flex flex-wrap items-center gap-2">
          {(['TODAS', 'EN_REVISION', 'ACTIVA', 'RECHAZADA'] as const).map((est) => {
            const activo = filtroEstado === est;
            return (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  activo
                    ? est === 'EN_REVISION'
                      ? 'bg-tactical-orange text-white'
                      : est === 'ACTIVA'
                      ? 'bg-emerald-600 text-white'
                      : est === 'RECHAZADA'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-200 text-slate-900'
                    : 'bg-tactical-input text-slate-400 hover:text-white hover:bg-tactical-border'
                }`}
              >
                <span>
                  {est === 'TODAS'
                    ? '🌐 TODAS'
                    : est === 'EN_REVISION'
                    ? '⏳ EN REVISIÓN'
                    : est === 'ACTIVA'
                    ? '✅ ACTIVAS'
                    : '❌ DESACTIVADAS'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filtro Región y Orden */}
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

          <span className="text-xs text-slate-400 font-mono px-2 py-1 bg-tactical-input/50 rounded border border-tactical-border/60">
            {canchasOrdenadas.length} {canchasOrdenadas.length === 1 ? 'cancha' : 'canchas'}
          </span>

          {/* Selector de Modo de Vista (Grid vs Tabla) */}
          <div className="flex items-center bg-tactical-input rounded-lg border border-tactical-border p-0.5">
            <button
              type="button"
              onClick={() => setModoVista('GRID')}
              title="Vista Cuadrícula / Fichas"
              className={`p-1.5 rounded-md transition ${
                modoVista === 'GRID'
                  ? 'bg-tactical-orange text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setModoVista('TABLA')}
              title="Vista Tabla Compacta"
              className={`p-1.5 rounded-md transition ${
                modoVista === 'TABLA'
                  ? 'bg-tactical-orange text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Canchas */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-tactical-orange mb-3" />
          <p className="text-sm">Rastreando campos y canchas...</p>
        </div>
      ) : canchasOrdenadas.length === 0 ? (
        <div className="text-center py-16 bg-tactical-card border border-tactical-border rounded-xl">
          <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="font-tactical text-base font-bold text-white">
            {busqueda ? 'Sin campos coincidentes' : 'Sin canchas en esta categoría'}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {busqueda
              ? `No se encontraron campos que coincidan con "${busqueda}".`
              : 'No hay campos con el filtro de estado o región seleccionado.'}
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
      ) : modoVista === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {canchasOrdenadas.map((cancha) => {
            const tieneFotos = cancha.fotos && cancha.fotos.length > 0;
            const esAbierta = cancha.esAbierta !== false && !cancha.equipoAdmin;

            return (
              <div
                key={cancha.id}
                className="bg-tactical-card border border-tactical-border rounded-xl p-5 hover:border-slate-500 transition flex flex-col justify-between space-y-4"
              >
                {/* Cabecera de la tarjeta */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        cancha.estado === 'EN_REVISION'
                          ? 'bg-amber-950/60 border-amber-600/50 text-tactical-amber'
                          : cancha.estado === 'ACTIVA'
                          ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-400'
                          : 'bg-red-950/60 border-red-600/50 text-red-400'
                      }`}
                    >
                      {cancha.estado === 'EN_REVISION'
                        ? '⏳ EN REVISIÓN'
                        : cancha.estado === 'ACTIVA'
                        ? '✓ ACTIVA'
                        : '✕ DESACTIVADA'}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        esAbierta
                          ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                          : cancha.equipoAdmin?.activo === false
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-600/70'
                          : 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                      }`}
                    >
                      {esAbierta
                        ? '🌐 ABIERTA'
                        : cancha.equipoAdmin?.activo === false
                        ? `⚠️ DISUELTO: ${cancha.equipoAdmin?.nombre}`
                        : `🛡️ ${cancha.equipoAdmin?.nombre || 'EQUIPO'}`}
                    </span>
                  </div>

                  <h3 className="font-tactical font-black text-lg text-white leading-tight">
                    {cancha.nombre}
                  </h3>

                  <p className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-tactical-orange shrink-0" />
                    <span>
                      {cancha.region || 'Región no especificada'}
                      {cancha.ciudad ? ` • ${cancha.ciudad}` : ''}
                    </span>
                  </p>

                  {/* Descripción preview */}
                  {cancha.descripcion ? (
                    <p className="text-xs text-slate-300 mt-2 line-clamp-2 bg-tactical-input/50 p-2 rounded border border-tactical-border/40">
                      {cancha.descripcion}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic mt-2">Sin descripción agregada.</p>
                  )}
                </div>

                {/* Metadatos: Creador y Fotos */}
                <div className="pt-3 border-t border-tactical-border/60 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{cancha.creador ? cancha.creador.alias : 'Operador anónimo'}</span>
                    </span>
                    {tieneFotos && (
                      <span className="flex items-center space-x-1 text-tactical-orange font-bold">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{cancha.fotos?.length} fotos</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Botonera de Acción */}
                <div className="pt-2 flex items-center space-x-2">
                  <button
                    onClick={() => abrirModalCancha(cancha)}
                    className="flex-1 py-2 px-3 bg-tactical-input hover:bg-tactical-border text-white text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-tactical-orange" />
                    <span>Ver Ficha & Fotos</span>
                  </button>

                  {cancha.estado === 'EN_REVISION' && (
                    <>
                      <button
                        onClick={() => solicitarAprobarCancha(cancha)}
                        title="Aprobar Cancha de Inmediato"
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => solicitarRechazarCancha(cancha)}
                        title="Rechazar Cancha"
                        className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-tactical-card border border-tactical-border rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tactical-input/80 text-slate-400 uppercase tracking-wider font-bold border-b border-tactical-border">
                <tr>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Cancha</th>
                  <th className="py-3 px-4">Ubicación</th>
                  <th className="py-3 px-4">Tipo / Escuadra</th>
                  <th className="py-3 px-4 text-center">Fotos</th>
                  <th className="py-3 px-4">Operador Proponente</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tactical-border/60">
                {canchasOrdenadas.map((cancha) => {
                  const tieneFotos = cancha.fotos && cancha.fotos.length > 0;
                  const esAbierta = cancha.esAbierta !== false && !cancha.equipoAdmin;

                  return (
                    <tr key={cancha.id} className="hover:bg-tactical-input/40 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                            cancha.estado === 'EN_REVISION'
                              ? 'bg-amber-950/60 border-amber-600/50 text-tactical-amber'
                              : cancha.estado === 'ACTIVA'
                              ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-400'
                              : 'bg-red-950/60 border-red-600/50 text-red-400'
                          }`}
                        >
                          {cancha.estado === 'EN_REVISION'
                            ? '⏳ REVISIÓN'
                            : cancha.estado === 'ACTIVA'
                            ? '✓ ACTIVA'
                            : '✕ INACTIVA'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block text-sm">{cancha.nombre}</span>
                        {cancha.descripcion ? (
                          <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs block">
                            {cancha.descripcion}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic block">Sin descripción</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-tactical-orange shrink-0" />
                          <span>
                            {cancha.region || 'Sin región'}
                            {cancha.ciudad ? ` • ${cancha.ciudad}` : ''}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block ${
                            esAbierta
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                              : cancha.equipoAdmin?.activo === false
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-600/70'
                              : 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                          }`}
                        >
                          {esAbierta
                            ? '🌐 ABIERTA'
                            : cancha.equipoAdmin?.activo === false
                            ? `⚠️ DISUELTO: ${cancha.equipoAdmin?.nombre}`
                            : `🛡️ ${cancha.equipoAdmin?.nombre || 'EQUIPO'}`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {tieneFotos ? (
                          <span className="text-xs font-mono font-bold text-tactical-orange inline-flex items-center space-x-1 bg-tactical-input/60 px-2 py-0.5 rounded border border-tactical-border/40">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{cancha.fotos?.length}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <span className="font-semibold block">{cancha.creador?.alias || 'Anónimo'}</span>
                        <span className="text-[10px] text-slate-500 block">{cancha.creador?.email || ''}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => abrirModalCancha(cancha)}
                            title="Ver ficha técnica & fotos"
                            className="p-1.5 rounded-lg bg-tactical-input hover:bg-tactical-border text-slate-300 hover:text-white transition"
                          >
                            <Eye className="w-4 h-4 text-tactical-orange" />
                          </button>

                          {cancha.estado === 'EN_REVISION' && (
                            <>
                              <button
                                onClick={() => solicitarAprobarCancha(cancha)}
                                title="Aprobar Cancha de Inmediato"
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => solicitarRechazarCancha(cancha)}
                                title="Rechazar Cancha"
                                className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE INSPECCIÓN TÉCNICA, EDICIÓN Y ESTADOS */}
      {canchaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-tactical-card border border-tactical-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-tactical-border flex items-start justify-between bg-tactical-input/50">
              <div>
                <span className="text-[10px] font-bold text-tactical-orange uppercase tracking-widest block">
                  EXPEDIENTE DE GESTIÓN TÁCTICA
                </span>
                <h2 className="font-tactical text-2xl font-black text-white mt-1">
                  {canchaSeleccionada.nombre}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                      canchaSeleccionada.estado === 'EN_REVISION'
                        ? 'bg-amber-950/60 border-amber-600/50 text-tactical-amber'
                        : canchaSeleccionada.estado === 'ACTIVA'
                        ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-400'
                        : 'bg-red-950/60 border-red-600/50 text-red-400'
                    }`}
                  >
                    {canchaSeleccionada.estado === 'EN_REVISION'
                      ? '⏳ EN REVISIÓN'
                      : canchaSeleccionada.estado === 'ACTIVA'
                      ? '✓ ACTIVA'
                      : '✕ DESACTIVADA / RECHAZADA'}
                  </span>
                  <p className="text-xs text-slate-300 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-tactical-orange" />
                    <span>
                      {canchaSeleccionada.region}
                      {canchaSeleccionada.ciudad ? ` • ${canchaSeleccionada.ciudad}` : ''}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCanchaSeleccionada(null)}
                className="p-2 rounded-lg bg-tactical-input hover:bg-tactical-border text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Alerta de Escuadra Disuelta si aplica */}
              {canchaSeleccionada.equipoAdmin && canchaSeleccionada.equipoAdmin.activo === false && (
                <div className="p-4 bg-amber-950/40 border border-amber-500/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start space-x-2.5 text-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">
                        Escuadra Propietaria Disuelta / Inactiva: {canchaSeleccionada.equipoAdmin.nombre}
                      </span>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">
                        Al disolverse la escuadra, esta cancha fue desactivada automáticamente del radar. Puedes reasignarla a otro equipo o convertirla en cancha comunitaria abierta para reactivarla.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={guardandoEdicion}
                    onClick={() => solicitarConvertirEnAbierta(canchaSeleccionada.id)}
                    className="px-3 py-1.5 bg-tactical-orange hover:bg-orange-600 text-white font-bold rounded-lg shrink-0 transition text-xs flex items-center space-x-1.5 shadow"
                  >
                    <span>🌐 Pasar a Cancha Abierta</span>
                  </button>
                </div>
              )}

              {/* Formulario de Edición (Si modoEdicion está activo) */}
              {modoEdicion ? (
                <form onSubmit={handleGuardarEdicion} className="space-y-4 bg-tactical-input/40 p-4 rounded-xl border border-tactical-orange/40">
                  <div className="flex items-center justify-between pb-2 border-b border-tactical-border">
                    <span className="text-xs font-tactical font-black text-tactical-orange uppercase tracking-wider flex items-center space-x-1.5">
                      <Edit3 className="w-4 h-4" />
                      <span>Modificar Ficha Oficial de Cancha</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setModoEdicion(false)}
                      className="text-xs text-slate-400 hover:text-white font-semibold"
                    >
                      Cancelar Edición
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Nombre de la Cancha (*)</label>
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      required
                      className="w-full bg-tactical-input border border-tactical-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-tactical-orange"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Región</label>
                      <input
                        type="text"
                        value={editRegion}
                        onChange={(e) => setEditRegion(e.target.value)}
                        className="w-full bg-tactical-input border border-tactical-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-tactical-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Ciudad / Comuna</label>
                      <input
                        type="text"
                        value={editCiudad}
                        onChange={(e) => setEditCiudad(e.target.value)}
                        className="w-full bg-tactical-input border border-tactical-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-tactical-orange"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Latitud GPS</label>
                      <input
                        type="text"
                        value={editLatitud}
                        onChange={(e) => setEditLatitud(e.target.value)}
                        placeholder="-33.4489"
                        className="w-full bg-tactical-input border border-tactical-border rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-tactical-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Longitud GPS</label>
                      <input
                        type="text"
                        value={editLongitud}
                        onChange={(e) => setEditLongitud(e.target.value)}
                        placeholder="-70.6693"
                        className="w-full bg-tactical-input border border-tactical-border rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-tactical-orange"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Descripción de Accesos y Zona de Juego</label>
                    <textarea
                      rows={3}
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                      className="w-full bg-tactical-input border border-tactical-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-tactical-orange"
                    />
                  </div>

                  {/* Asignación de Cancha / Abierta o Equipo */}
                  <div className="p-3 bg-tactical-card/70 border border-tactical-border rounded-lg space-y-3">
                    <label className="block text-xs font-bold text-slate-300">
                      Tipo de Cancha y Asignación de Escuadra
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditEsAbierta(true);
                          setEditAdminEquipoId(null);
                        }}
                        className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                          editEsAbierta
                            ? 'bg-blue-950/70 border-blue-500 text-blue-200'
                            : 'bg-tactical-input border-tactical-border text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>🌐 Cancha Abierta (Comunitaria)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditEsAbierta(false);
                        }}
                        className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                          !editEsAbierta
                            ? 'bg-purple-950/70 border-purple-500 text-purple-200'
                            : 'bg-tactical-input border-tactical-border text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>🛡️ Asignada a Escuadra</span>
                      </button>
                    </div>

                    {!editEsAbierta && (
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Escuadra Propietaria / Administradora:
                        </label>
                        <select
                          value={editAdminEquipoId || ''}
                          onChange={(e) => setEditAdminEquipoId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full bg-tactical-input border border-tactical-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-tactical-orange"
                        >
                          <option value="">-- Seleccionar Escuadra --</option>
                          {equipos.map((eq) => (
                            <option key={eq.id} value={eq.id}>
                              {eq.nombre} ({eq.region || 'Sin región'}) {eq.activo === false ? '⚠️ [DISUELTO / INACTIVO]' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Puedes transferir la administración de este campo a cualquier escuadra de la plataforma.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Error en formulario de edición */}
                  {errorEdicion && (
                    <div className="p-3 bg-red-950/70 border border-red-600/70 rounded-lg text-red-200 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{errorEdicion}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={guardandoEdicion}
                      className="px-4 py-2 bg-tactical-orange hover:bg-orange-600 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
                    >
                      {guardandoEdicion ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Guardar Modificaciones</span>
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Información General */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-tactical-input p-3.5 rounded-lg border border-tactical-border">
                  <span className="text-slate-500 font-bold block mb-1">OPERADOR PROPONENTE</span>
                  <p className="text-white font-semibold">
                    {canchaSeleccionada.creador ? `${canchaSeleccionada.creador.alias} (${canchaSeleccionada.creador.email})` : 'No identificado'}
                  </p>
                </div>

                <div className="bg-tactical-input p-3.5 rounded-lg border border-tactical-border">
                  <span className="text-slate-500 font-bold block mb-1">TIPO DE CAMPO</span>
                  <p className="text-white font-semibold">
                    {canchaSeleccionada.esAbierta
                      ? '🌐 Abierta a la comunidad'
                      : `🛡️ Equipo: ${canchaSeleccionada.equipoAdmin?.nombre || 'Privado'}${
                          canchaSeleccionada.equipoAdmin?.activo === false ? ' (⚠️ Disuelto / Inactivo)' : ''
                        }`}
                  </p>
                </div>
              </div>

              {/* Coordenadas GPS */}
              <div className="bg-tactical-input p-3.5 rounded-lg border border-tactical-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block mb-0.5">COORDENADAS GEOGRÁFICAS</span>
                  <p className="text-xs font-mono text-white">
                    {canchaSeleccionada.latitud && canchaSeleccionada.longitud
                      ? `${canchaSeleccionada.latitud}, ${canchaSeleccionada.longitud}`
                      : 'Referencial (búsqueda por nombre en comuna)'}
                  </p>
                </div>

                {canchaSeleccionada.latitud && canchaSeleccionada.longitud && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${canchaSeleccionada.latitud},${canchaSeleccionada.longitud}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-tactical-orange hover:bg-orange-600 text-white rounded text-xs font-bold flex items-center space-x-1 transition"
                  >
                    <span>Ver en Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Descripción */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Descripción del Campo
                </span>
                <div className="p-4 bg-tactical-input rounded-lg border border-tactical-border text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {canchaSeleccionada.descripcion || 'Sin descripción detallada por el creador.'}
                </div>
              </div>

              {/* Galería de Fotos enviadas con descripción */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 flex items-center space-x-1.5">
                  <Camera className="w-4 h-4 text-tactical-orange" />
                  <span>Evidencias Fotográficas ({canchaSeleccionada.fotos?.length || 0})</span>
                </span>

                {!canchaSeleccionada.fotos || canchaSeleccionada.fotos.length === 0 ? (
                  <div className="p-6 text-center bg-tactical-input rounded-lg border border-tactical-border text-slate-500 text-xs italic">
                    El operador no adjuntó fotografías al proponer este campo.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {canchaSeleccionada.fotos.map((foto, idx) => (
                      <div
                        key={idx}
                        className="bg-tactical-input border border-tactical-border rounded-xl overflow-hidden"
                      >
                        <div className="h-44 bg-black/60 relative">
                          {fotosError[`${canchaSeleccionada.id}-${idx}`] ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-tactical-input/90 text-slate-500 space-y-1.5 p-4 text-center">
                              <ImageOff className="w-7 h-7 text-slate-600" />
                              <span className="text-[11px] font-bold text-slate-300">Evidencia no disponible</span>
                              <span className="text-[10px] text-slate-500 font-mono">Enlace roto o inaccesible</span>
                            </div>
                          ) : (
                            <img
                              src={foto.url}
                              alt={`Foto ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={() => {
                                setFotosError((prev) => ({
                                  ...prev,
                                  [`${canchaSeleccionada.id}-${idx}`]: true,
                                }));
                              }}
                            />
                          )}
                        </div>
                        <div className="p-3 text-xs text-slate-300">
                          <span className="font-bold text-tactical-orange text-[10px] uppercase block mb-0.5">
                            FOTO #{idx + 1}
                          </span>
                          <p>{foto.descripcion || 'Sin descripción para esta toma.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Campo para motivo de cambio de estado si aplica */}
              {canchaSeleccionada.estado !== 'ACTIVA' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Nota o Motivo del Staff (Opcional si rechazas o solicitas cambios):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ej: Falta precisar el punto de acceso o las fotos no corresponden al campo..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full bg-tactical-input border border-tactical-border rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-tactical-orange"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-tactical-border bg-tactical-input/60 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCanchaSeleccionada(null)}
                className="px-4 py-2.5 rounded-lg bg-tactical-input hover:bg-tactical-border text-slate-300 text-xs font-bold transition"
              >
                Cerrar Expediente
              </button>

              <div className="flex flex-wrap items-center space-x-2.5">
                {/* Botón común para Modificar Cancha */}
                <button
                  type="button"
                  onClick={() => setModoEdicion((prev) => !prev)}
                  className="px-3.5 py-2.5 rounded-lg bg-tactical-input hover:bg-tactical-border border border-tactical-border text-white text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Edit3 className="w-4 h-4 text-tactical-orange" />
                  <span>{modoEdicion ? 'Cerrar Edición' : 'Modificar Cancha'}</span>
                </button>

                {/* Si la cancha está ACTIVA: Solo Desactivar Cancha (NO aprobar ni rechazar) */}
                {canchaSeleccionada.estado === 'ACTIVA' && (
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => {
                      setModalConfirmacion({
                        isOpen: true,
                        titulo: '¿DESACTIVAR CANCHA EN RADAR?',
                        mensaje: `¿Estás seguro de desactivar la cancha "${canchaSeleccionada.nombre}"? Ya no aparecerá activa en el radar táctico ni podrá seleccionarse para agendar partidas.`,
                        textoConfirmar: 'Desactivar Cancha',
                        tipo: 'peligro',
                        onConfirmar: () => {
                          setModalConfirmacion((prev) => ({ ...prev, isOpen: false }));
                          handleCambiarEstado(canchaSeleccionada.id, 'RECHAZADA');
                        },
                      });
                    }}
                    className="px-4 py-2.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <PowerOff className="w-4 h-4 text-red-400" />
                    <span>Desactivar Cancha</span>
                  </button>
                )}

                {/* Si la cancha está EN_REVISION: Aprobar o Rechazar */}
                {canchaSeleccionada.estado === 'EN_REVISION' && (
                  <>
                    <button
                      type="button"
                      disabled={procesando}
                      onClick={() => solicitarRechazarCancha(canchaSeleccionada)}
                      className="px-4 py-2.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-red-400" />
                      <span>Rechazar Cancha</span>
                    </button>

                    <button
                      type="button"
                      disabled={procesando}
                      onClick={() => solicitarAprobarCancha(canchaSeleccionada)}
                      className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aprobar y Activar en Radar</span>
                    </button>
                  </>
                )}

                {/* Si la cancha está RECHAZADA / DESACTIVADA: Opción para Reactivar */}
                {canchaSeleccionada.estado === 'RECHAZADA' && (
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => solicitarReactivarCancha(canchaSeleccionada)}
                    className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reactivar Cancha en Radar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Táctico de Confirmación de Operaciones */}
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
