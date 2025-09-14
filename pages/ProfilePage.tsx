
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MOCK_APPOINTMENTS, MOCK_VOUCHERS, MOCK_SERVICES, MOCK_PROFESSIONALS } from '../data/mockData';
import { Appointment, Voucher } from '../types';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

type Tab = 'appointments' | 'vouchers';

const ProfilePage: React.FC = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const navigate = useNavigate();
  const { setService } = useBooking();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const upcoming = MOCK_APPOINTMENTS.filter(a => a.status === 'upcoming').sort((a,b) => a.start.getTime() - b.start.getTime());
    const past = MOCK_APPOINTMENTS.filter(a => a.status !== 'upcoming').sort((a,b) => b.start.getTime() - a.start.getTime());
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, []);

  const handleBookFromVoucher = (voucher: Voucher) => {
    const serviceToBook = MOCK_SERVICES.find(s => s.id === voucher.serviceId);
    if (serviceToBook) {
        setService(serviceToBook);
        navigate('/reservar');
    }
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-secondary tracking-tight">Hola, {user.fullName.split(' ')[0]}</h1>
          <p className="mt-1 text-lg text-light-text">Gestiona tus citas y bonos aquí.</p>
        </div>
        <button onClick={logout} className="mt-4 md:mt-0 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
            Cerrar Sesión
        </button>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`${activeTab === 'appointments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
          >
            Mis Citas
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`${activeTab === 'vouchers' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
          >
            Mis Bonos
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'appointments' && (
          <div className="space-y-12">
            <AppointmentSection title="Próximas Citas" appointments={upcomingAppointments} />
            <AppointmentSection title="Historial de Citas" appointments={pastAppointments} isPast={true} />
          </div>
        )}
        {activeTab === 'vouchers' && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-secondary">Bonos Activos</h2>
                {MOCK_VOUCHERS.map(voucher => {
                    const service = MOCK_SERVICES.find(s => s.id === voucher.serviceId);
                    if (!service) return null;
                    return (
                        <div key={voucher.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div>
                                <h3 className="text-xl font-bold text-secondary">{service.name}</h3>
                                <p className="text-primary font-semibold mt-2 text-lg">
                                    Quedan {voucher.remainingSessions} de {voucher.totalSessions} sesiones
                                </p>
                            </div>
                            <button onClick={() => handleBookFromVoucher(voucher)} className="mt-4 md:mt-0 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-light transition-colors">
                                Reservar Cita
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};

interface AppointmentSectionProps {
  title: string;
  appointments: Appointment[];
  isPast?: boolean;
}

const AppointmentSection: React.FC<AppointmentSectionProps> = ({ title, appointments, isPast = false }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-secondary mb-4">{title}</h2>
            {appointments.length > 0 ? (
                 <div className="space-y-4">
                     {appointments.map(appt => {
                         const service = MOCK_SERVICES.find(s => s.id === appt.serviceId);
                         const professional = MOCK_PROFESSIONALS.find(p => p.id === appt.professionalId);
                         if (!service || !professional) return null;
                         return (
                             <div key={appt.id} className="bg-white p-5 rounded-lg shadow-md">
                                 <div className="flex flex-col md:flex-row justify-between">
                                     <div>
                                         <p className="font-bold text-lg text-secondary">{service.name}</p>
                                         <p className="text-light-text">con {professional.name}</p>
                                         <p className="text-light-text font-medium">{appt.start.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                     </div>
                                     {!isPast && (
                                         <div className="flex items-center space-x-2 mt-4 md:mt-0">
                                             <button className="text-sm text-gray-600 font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100">Editar</button>
                                             <button className="text-sm text-red-600 font-semibold py-2 px-4 rounded-lg border border-red-200 hover:bg-red-50">Anular</button>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         );
                     })}
                 </div>
            ) : (
                <div className="bg-white p-8 rounded-lg text-center">
                    <p className="text-light-text">No tienes {isPast ? 'citas pasadas' : 'próximas citas'}.</p>
                    {!isPast && <button onClick={() => window.location.hash = '/reservar'} className="mt-4 bg-primary text-white px-5 py-2 rounded-lg font-semibold hover:bg-primary-light">Reservar una nueva cita</button>}
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
