import React, { useState, useEffect } from 'react';
import { getCurrentUser, clearSession, getEstadisticasApi } from './api';
import { AdminUser, EstadisticasAdmin } from './types';
import { Sidebar, TabType } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { CanchasView } from './views/CanchasView';
import { TicketsView } from './views/TicketsView';
import { JugadoresView } from './views/JugadoresView';
import { EquiposView } from './views/EquiposView';

export const App: React.FC = () => {
  const [user, setUser] = useState<AdminUser | null>(() => getCurrentUser());
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<EstadisticasAdmin | null>(null);
  const [cargandoStats, setCargandoStats] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const cargarEstadisticas = async () => {
    if (!user) return;
    try {
      setCargandoStats(true);
      const data = await getEstadisticasApi();
      setStats(data);
      setLastSync(new Date());
    } catch {
      // Ignorar si aún no hay sesión
    } finally {
      setCargandoStats(false);
    }
  };

  useEffect(() => {
    if (user) {
      cargarEstadisticas();
    }
  }, [user, currentTab]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
  };

  if (!user) {
    return <LoginView onLoginSuccess={(u) => setUser(u)} />;
  }

  const TITULOS_TAB: Record<TabType, string> = {
    dashboard: 'Puesto de Mando & Estadísticas',
    canchas: 'Gestión y Control de Canchas',
    tickets: 'Buzón de Sugerencias & Tickets de Operadores',
    jugadores: 'Registro de Combatientes & Operadores',
    equipos: 'Escuadras & Clanes de Airsoft',
  };

  return (
    <div className="flex min-h-screen bg-tactical-dark text-slate-100">
      {/* Barra Lateral */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        stats={stats}
      />

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          onLogout={handleLogout}
          onRefresh={cargarEstadisticas}
          cargando={cargandoStats}
          lastSync={lastSync}
          titulo={TITULOS_TAB[currentTab]}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView stats={stats} onNavigate={setCurrentTab} />
          )}
          {currentTab === 'canchas' && <CanchasView />}
          {currentTab === 'tickets' && <TicketsView />}
          {currentTab === 'jugadores' && <JugadoresView />}
          {currentTab === 'equipos' && <EquiposView />}
        </main>
      </div>
    </div>
  );
};
