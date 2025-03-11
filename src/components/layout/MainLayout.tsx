
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProfileButton from '@/components/auth/ProfileButton';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <button
          onClick={toggleSidebar}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle sidebar</span>
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-lg md:text-xl">Sistema de Gestión de Turnos</h1>
        </div>
        <div className="flex items-center gap-2">
          <ProfileButton />
        </div>
      </header>

      <div className="md:flex">
        <aside
          className={`fixed z-20 h-full w-72 shrink-0 border-r bg-background transition-transform md:translate-x-0 md:shadow-none ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
            <ul className="space-y-2 font-medium">
              <li>
                <Link
                  to="/"
                  className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                >
                  <svg
                    className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 22 21"
                  >
                    <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 3.995 7.778 1 1 0 0 0 1.066.998h.003Z" />
                    <path d="M12.5 0a1 1 0 0 0-1 1v2.188a8.5 8.5 0 1 1 6.714 12.21 1 1 0 0 0-1.414 1.414 10.5 10.5 0 1 0-5.3-15.804Z" />
                  </svg>
                  <span className="ml-3">Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/tickets"
                  className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                >
                  <svg
                    className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 0 0-1 1v5.086l-2.293 2.293a1 1 0 1 0 1.414 1.414L8 9.414V17a1 1 0 0 0 2 0V9.414l1.293 1.293a1 1 0 0 0 1.414-1.414L12 8.086V3a1 1 0 0 0-1-1H9Z" />
                  </svg>
                  <span className="ml-3">Tickets</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/llamada"
                  className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                >
                  <svg
                    className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="m17.414 2.586-2.586-2.586a2 2 0 0 0-2.828 0L2 14h15.414a2 2 0 0 0 2.586-3.414Z" />
                  </svg>
                  <span className="ml-3">Llamada</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/display"
                  className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                >
                  <svg
                    className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 18 20"
                  >
                    <path d="M17 5.923A1 1 0 0 0 16 5h-3V4a1 1 0 0 0-2 0v1H7V4a1 1 0 0 0-2 0v1H2a.938.938 0 0 0-.923.923l-.08 15A1 1 0 0 0 2 22h14a1 1 0 0 0 .923-.923l.08-15ZM2 6h14V21H2V6Z" />
                    <path d="M6 10a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0v-3a1 1 0 0 0-1-1Z" />
                    <path d="M12 10a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0v-3a1 1 0 0 0-1-1Z" />
                  </svg>
                  <span className="ml-3">Display</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/reports"
                  className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                >
                  <svg
                    className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 .5a9.5 9.5 0 0 0-9.5 9.5v8.5h2a1 1 0 0 0 1-1V11h3v8a1 1 0 0 0 1 1h2v-8h3a1 1 0 0 0 1 1v7.5h2V10A9.5 9.5 0 0 0 10 .5Z" />
                  </svg>
                  <span className="ml-3">Reportes</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/config"
                  className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                >
                  <svg
                    className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M19 4h-1a1 1 0 0 0-1-1v-2a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v2a1 1 0 0 0-1 1H1a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1ZM3 5h14v10H3V5Zm1-1h12V2H4v2Zm0 12h12v2H4v-2Zm1 1a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1H5v-1Zm8-1V5H7v10h6Z" />
                  </svg>
                  <span className="ml-3">Configuración</span>
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
