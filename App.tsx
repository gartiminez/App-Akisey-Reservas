import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BookingProvider>
        <HashRouter>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-20 md:pt-0">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/servicios" element={<ServicesPage />} />
                {/* FIX: The element prop must be a JSX element, not a string. */}
                <Route path="/reservar" element={<BookingPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </HashRouter>
      </BookingProvider>
    </AuthProvider>
  );
};

export default App;
