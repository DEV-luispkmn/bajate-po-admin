import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Send,
  MessageSquare,
  User,
  CheckCircle,
  Clock,
  Check,
  Loader2,
  Calendar,
  X,
  AlertCircle,
  Search,
  Camera,
} from 'lucide-react';
import { getTicketsApi, responderTicketApi } from '../api';
import { TicketAdmin } from '../types';

interface FotoTicket {
  descripcion: string;
  url: string;
}

function parsearMensajeTicket(mensaje: string): { textoLimpio: string; fotos: FotoTicket[] } {
  if (!mensaje) return { textoLimpio: '', fotos: [] };
  const lineas = mensaje.split('\n');
  const lineasLimpias: string[] = [];
  const fotos: FotoTicket[] = [];
  let descripcionPendiente = '';

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const trimmed = linea.trim();

    if (/^Fotos y Evidencias adjuntas\s*\(\d+\):$/i.test(trimmed)) {
      continue;
    }

    const matchFotoHeader = trimmed.match(/^Foto\s+\d+:\s*(.*)$/i);
    if (matchFotoHeader && i + 1 < lineas.length && /^URL\/Data:\s*/i.test(lineas[i + 1].trim())) {
      descripcionPendiente = matchFotoHeader[1]?.trim() || 'Sin descripción';
      continue;
    }

    const matchUrl = trimmed.match(/^URL\/Data:\s*(.+)$/i);
    if (matchUrl) {
      const url = matchUrl[1].trim();
      if (url) {
        fotos.push({
          descripcion: descripcionPendiente || 'Evidencia adjunta',
          url,
        });
      }
      descripcionPendiente = '';
      continue;
    }

    descripcionPendiente = '';
    lineasLimpias.push(linea);
  }

  return {
    textoLimpio: lineasLimpias.join('\n').trim(),
    fotos,
  };
}

export const TicketsView: React.FC = () => {
  const [tickets, setTickets] = useState<TicketAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  // Modal para Responder
  const [ticketSeleccionado, setTicketSeleccionado] = useState<TicketAdmin | null>(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState<'PENDIENTE' | 'EN_REVISION' | 'RESPONDIDO' | 'CERRADO'>('RESPONDIDO');
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  const cargarTickets = async () => {
    try {
      setCargando(true);
      setErrorGlobal(null);
      const data = await getTicketsApi(filtroTipo, filtroEstado);
      setTickets(data);
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al cargar tickets');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTickets();
  }, [filtroTipo, filtroEstado]);

  // Listener para cerrar lightbox o modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fotoPreviewUrl) {
          setFotoPreviewUrl(null);
        } else if (ticketSeleccionado) {
          setTicketSeleccionado(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fotoPreviewUrl, ticketSeleccionado]);

  const ticketsFiltrados = tickets.filter((t) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.trim().toLowerCase();
    const titulo = t.titulo?.toLowerCase() || '';
    const mensaje = parsearMensajeTicket(t.mensaje || '').textoLimpio.toLowerCase();
    const alias = t.jugador?.alias?.toLowerCase() || '';
    const email = t.jugador?.email?.toLowerCase() || '';
    const id = String(t.id);
    const tipo = t.tipo?.toLowerCase() || '';
    return (
      titulo.includes(q) ||
      mensaje.includes(q) ||
      alias.includes(q) ||
      email.includes(q) ||
      id.includes(q) ||
      tipo.includes(q)
    );
  });

  const abrirModalResponder = (ticket: TicketAdmin) => {
    setTicketSeleccionado(ticket);
    setRespuestaTexto(ticket.respuestaAdmin || '');
    setNuevoEstado(ticket.estado === 'PENDIENTE' ? 'RESPONDIDO' : ticket.estado);
    setErrorModal(null);
  };

  const handleEnviarRespuesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSeleccionado) return;
    if (!respuestaTexto.trim()) {
      setErrorModal('Por favor redacta la respuesta para el operador.');
      return;
    }

    try {
      setEnviando(true);
      setErrorModal(null);
      const actualizado = await responderTicketApi(ticketSeleccionado.id, nuevoEstado, respuestaTexto.trim());
      setTickets((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)));
      setTicketSeleccionado(null);
      setMensajeExito(`Respuesta enviada con éxito al operador "${actualizado.jugador.alias}".`);
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      setErrorModal(err.message || 'Error al responder el ticket');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta Error Global */}
      {errorGlobal && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-600/60 text-red-200 text-sm font-semibold flex items-center space-x-2.5 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorGlobal}</span>
        </div>
      )}

      {/* Alerta Éxito */}
      {mensajeExito && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-600/60 text-emerald-200 text-sm font-semibold flex items-center space-x-2.5 shadow-lg">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Cabecera Principal y Buscador de Tickets */}
      <div className="bg-tactical-card p-4 rounded-xl border border-tactical-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="font-tactical text-lg font-bold text-white flex items-center space-x-2">
            <Inbox className="w-5 h-5 text-tactical-orange" />
            <span>BUZÓN DE COMANDANCIA</span>
          </h3>
          <p className="text-xs text-slate-400">
            Revisión y respuesta táctica a sugerencias, problemas y solicitudes de reactivación de los operadores.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por operador, email, asunto o contenido..."
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
            {ticketsFiltrados.length} {ticketsFiltrados.length === 1 ? 'ticket' : 'tickets'}
          </span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-tactical-card p-4 rounded-xl border border-tactical-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filtro Tipo */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'TODOS', label: 'TODOS' },
              { id: 'CANCHA', label: 'CANCHA' },
              { id: 'SUGERENCIA', label: 'SUGERENCIA' },
              { id: 'PROBLEMA', label: 'PROBLEMA' },
              { id: 'IDEA', label: 'IDEA' },
              { id: 'OTRO', label: 'OTRO / REACTIVACIÓN' },
            ] as const
          ).map((tipo) => (
            <button
              key={tipo.id}
              onClick={() => setFiltroTipo(tipo.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filtroTipo === tipo.id
                  ? 'bg-tactical-orange text-white'
                  : 'bg-tactical-input text-slate-400 hover:text-white'
              }`}
            >
              {tipo.label}
            </button>
          ))}
        </div>

        {/* Filtro Estado */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Estado:</span>
          {(['TODOS', 'PENDIENTE', 'EN_REVISION', 'RESPONDIDO', 'CERRADO'] as const).map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                filtroEstado === estado
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-tactical-input text-slate-400 hover:text-white'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Tickets */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-tactical-orange mb-3" />
          <p className="text-sm">Abriendo buzón de la comandancia...</p>
        </div>
      ) : ticketsFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-tactical-card border border-tactical-border rounded-xl">
          <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="font-tactical text-base font-bold text-white">Buzón al día</h4>
          <p className="text-xs text-slate-400 mt-1">
            {busqueda.trim()
              ? `No se encontraron tickets que coincidan con "${busqueda}".`
              : 'No hay tickets que coincidan con estos filtros.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ticketsFiltrados.map((t) => {
            const esPendiente = t.estado === 'PENDIENTE';
            const { textoLimpio, fotos } = parsearMensajeTicket(t.mensaje);
            return (
              <div
                key={t.id}
                className={`bg-tactical-card border rounded-xl p-5 transition space-y-3 ${
                  esPendiente
                    ? 'border-tactical-amber/60 shadow-lg shadow-amber-950/20'
                    : 'border-tactical-border hover:border-slate-600'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-500 font-bold">#{t.id}</span>
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-tactical-input border border-tactical-border text-tactical-orange">
                      [{t.tipo}]
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        t.estado === 'PENDIENTE'
                          ? 'bg-amber-950/70 border border-amber-600 text-tactical-amber animate-pulse'
                          : t.estado === 'EN_REVISION'
                          ? 'bg-blue-950/70 border border-blue-500 text-blue-400'
                          : t.estado === 'RESPONDIDO'
                          ? 'bg-emerald-950/70 border border-emerald-600 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.estado}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-200 font-bold">{t.jugador.alias}</span>
                      <span>({t.jugador.email})</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white mb-1">{t.titulo}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-tactical-input/50 p-3 rounded-lg border border-tactical-border/40">
                    {textoLimpio}
                  </p>

                  {fotos.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <span className="text-[10px] font-bold text-tactical-orange uppercase tracking-wider flex items-center space-x-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Evidencias adjuntas ({fotos.length})</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {fotos.map((foto, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFotoPreviewUrl(foto.url)}
                            className="text-left bg-tactical-input border border-tactical-border hover:border-tactical-orange rounded-lg overflow-hidden transition group"
                          >
                            <div className="h-28 w-full bg-black/40 overflow-hidden">
                              <img
                                src={foto.url}
                                alt={foto.descripcion}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              />
                            </div>
                            <p className="p-2 text-[11px] text-slate-300 truncate">
                              {foto.descripcion}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Respuesta del Staff si existe */}
                {t.respuestaAdmin && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider block">
                      RESPUESTA DE COMANDANCIA:
                    </span>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{t.respuestaAdmin}</p>
                  </div>
                )}

                {/* Botón para Responder / Editar respuesta */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => abrirModalResponder(t)}
                    className="px-4 py-2 bg-tactical-orange hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.respuestaAdmin ? 'Actualizar Respuesta' : 'Responder Ticket'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL REDACTAR RESPUESTA OFICIAL */}
      {ticketSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-tactical-card border border-tactical-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-tactical-border flex items-center justify-between bg-tactical-input/50">
              <div>
                <span className="text-[10px] font-bold text-tactical-orange uppercase tracking-wider block">
                  BUZÓN DE COMANDANCIA • TICKET #{ticketSeleccionado.id}
                </span>
                <h3 className="font-tactical text-lg font-black text-white mt-0.5">
                  {ticketSeleccionado.titulo}
                </h3>
              </div>
              <button
                onClick={() => setTicketSeleccionado(null)}
                className="p-2 rounded-lg bg-tactical-input hover:bg-tactical-border text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnviarRespuesta} className="p-6 space-y-5">
              {/* Mensaje original del usuario */}
              {(() => {
                const { textoLimpio, fotos } = parsearMensajeTicket(ticketSeleccionado.mensaje);
                return (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Mensaje del Operador ({ticketSeleccionado.jugador.alias}):
                      </label>
                      <div className="p-3 bg-tactical-input border border-tactical-border rounded-lg text-xs text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                        {textoLimpio}
                      </div>
                    </div>

                    {fotos.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-tactical-orange uppercase tracking-wider flex items-center space-x-1.5 mb-1.5">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Evidencias adjuntas ({fotos.length})</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {fotos.map((foto, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFotoPreviewUrl(foto.url)}
                              className="w-24 bg-tactical-input border border-tactical-border hover:border-tactical-orange rounded-lg overflow-hidden transition"
                              title={foto.descripcion}
                            >
                              <img
                                src={foto.url}
                                alt={foto.descripcion}
                                className="w-full h-16 object-cover"
                              />
                              <p className="px-1.5 py-1 text-[10px] text-slate-300 truncate">
                                {foto.descripcion}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Nuevo Estado */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Estado a Asignar:
                </label>
                <div className="flex items-center space-x-2">
                  {(['RESPONDIDO', 'EN_REVISION', 'CERRADO'] as const).map((est) => (
                    <button
                      key={est}
                      type="button"
                      onClick={() => setNuevoEstado(est)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        nuevoEstado === est
                          ? 'bg-tactical-orange text-white'
                          : 'bg-tactical-input text-slate-400 hover:text-white'
                      }`}
                    >
                      {est}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea Respuesta */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Respuesta Oficial del Staff:
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Escribe aquí la respuesta que se mostrará en la app del operador..."
                  value={respuestaTexto}
                  onChange={(e) => setRespuestaTexto(e.target.value)}
                  className="w-full bg-tactical-input border border-tactical-border rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-tactical-orange leading-relaxed"
                />
              </div>

              {/* Alerta de error en modal */}
              {errorModal && (
                <div className="p-3 bg-red-950/70 border border-red-600/70 rounded-lg text-red-200 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorModal}</span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTicketSeleccionado(null)}
                  className="px-4 py-2 bg-tactical-input hover:bg-tactical-border text-slate-300 text-xs font-bold rounded-lg transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={enviando}
                  className="px-5 py-2 bg-tactical-orange hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition flex items-center space-x-2 shadow-lg shadow-orange-500/25 disabled:opacity-50"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitiendo...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Respuesta Oficial</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* LIGHTBOX DE EVIDENCIA ADJUNTA */}
      {fotoPreviewUrl && (
        <div
          onClick={() => setFotoPreviewUrl(null)}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setFotoPreviewUrl(null)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-tactical-card border border-tactical-border text-white hover:border-tactical-orange transition"
            title="Cerrar vista previa (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={fotoPreviewUrl}
            alt="Evidencia adjunta"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[88vh] rounded-xl border border-tactical-border shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
};
