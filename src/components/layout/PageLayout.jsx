import { Outlet, useLocation, ScrollRestoration } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import AppBackground, { sectionFor } from './AppBackground';

export default function PageLayout() {
  const { pathname } = useLocation();
  return (
    <div data-section={sectionFor(pathname)} className="relative isolate flex min-h-screen flex-col print:block">
      <AppBackground />
      <div className="print:hidden"><Header /></div>
      <div className="flex flex-1">
        <div className="print:hidden"><Sidebar /></div>
        <div className="flex min-w-0 flex-1 flex-col">
          <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:px-6">
            <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}>
              <Outlet />
            </motion.div>
          </main>
          <div className="print:hidden"><Footer /></div>
        </div>
      </div>
      <ScrollRestoration />
    </div>
  );
}
