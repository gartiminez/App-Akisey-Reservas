import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MOCK_APPOINTMENTS, MOCK_VOUCHERS, MOCK_SERVICES, MOCK_PROFESSIONALS } from '../data/mockData';
import { Appointment, Voucher } from '../types';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import CancelConfirmationModal from '../components/profile/CancelConfirmationModal';

type Tab = 'appointments' | 'vouchers';

const ProfilePage: React.FC = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const navigate = useNavigate();
  const { setService, setAppointmentToEdit } = useBooking();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [cancelModalState, setCancelModalState] = useState<{ isOpen: boolean; appointment: Appointment | null }>({
    isOpen: false,
    appointment: null,
  });


  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
    }
  }, []);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const upcoming = appointments.filter(a => a.status === 'upcoming').sort((a,b) => a.start.getTime() - b.start.getTime());
    const past = appointments.filter(a => a.status !== 'upcoming').sort((a,b) => b.start.getTime() - a.start.getTime());
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  // Effect to schedule notifications
  useEffect(() => {
    if (notificationPermission === 'granted' && upcomingAppointments.length > 0) {
        upcomingAppointments.forEach(appt => {
            const service = MOCK_SERVICES.find(s => s.id === appt.serviceId);
            if (!service) return;

            const reminderTime = new Date(appt.start.getTime() - 24 * 60 * 60 * 1000);
            const now = new Date();
            const scheduledKey = `notification_scheduled_${appt.id}`;

            if (reminderTime > now && !localStorage.getItem(scheduledKey)) {
                const delay = reminderTime.getTime() - now.getTime();

                setTimeout(() => {
                    new Notification('Recordatorio de Cita - BellezaSana', {
                        body: `No te olvides de tu cita para "${service.name}" mañana a las ${appt.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`,
                        icon: '/favicon.svg',
                        tag: appt.id 
                    });
                    localStorage.removeItem(scheduledKey);
                }, delay);

                localStorage.setItem(scheduledKey, 'true');
            }
        });
    }
  }, [upcomingAppointments, notificationPermission]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    }
  };
  
  const handleEdit = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    navigate('/reservar');
  };

  const handleOpenCancelModal = (appointment: Appointment) => {
    setCancelModalState({ isOpen: true, appointment });
  };

  const handleConfirmCancel = () => {
    if (cancelModalState.appointment) {
        setAppointments(prevAppointments =>
            prevAppointments.map(appt =>
                appt.id === cancelModalState.appointment?.id
                    ? { ...appt, status: 'cancelled' }
                    : appt
            )
        );
        setCancelModalState({ isOpen: false, appointment: null });
    }
  };

  const handleBookFromVoucher = (voucher: Voucher) => {
    const serviceToBook = MOCK_SERVICES.find(s => s.id === voucher.serviceId);
    if (serviceToBook) {
        setService(serviceToBook);
        navigate('/reservar');
    }
  };

  if (!user) {
    return null; 
  }

  const NotificationSettings = (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold text-secondary mb-4">Recordatorios de Citas</h2>
      {notificationPermission === 'granted' && (
        <p className="text-green-600">Los recordatorios por notificación están activados.</p>
      )}
      {notificationPermission === 'denied' && (
        <div>
          <p className="text-red-600">Has bloqueado las notificaciones.</p>
          <p className="text-sm text-light-text">Para activarlas, debes cambiar los permisos en la configuración de tu navegador.</p>
        </div>
      )}
      {notificationPermission === 'default' && (
        <div>
            <p className="text-light-text mb-4">¿Quieres recibir un recordatorio 24 horas antes de tu cita?</p>
            <button
                onClick={requestNotificationPermission}
                className="bg-secondary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
            >
                Activar Recordatorios
            </button>
        </div>
      )}
    </div>
  );

  return (
    <>
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
      
      {NotificationSettings}
      
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

      <div>
        {activeTab === 'appointments' && (
          <div className="space-y-12">
            <AppointmentSection 
              title="Próximas Citas" 
              appointments={upcomingAppointments}
              onEdit={handleEdit}
              onCancel={handleOpenCancelModal}
            />
            <AppointmentSection 
              title="Historial de Citas" 
              appointments={pastAppointments} 
              isPast={true} 
            />
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
    <CancelConfirmationModal
        isOpen={cancelModalState.isOpen}
        onClose={() => setCancelModalState({ isOpen: false, appointment: null })}
        onConfirm={handleConfirmCancel}
        appointment={cancelModalState.appointment}
    />
    </>
  );
};

interface AppointmentSectionProps {
  title: string;
  appointments: Appointment[];
  isPast?: boolean;
  onEdit?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
}

const AppointmentSection: React.FC<AppointmentSectionProps> = ({ title, appointments, isPast = false, onEdit, onCancel }) => {
    const navigate = useNavigate();
    return (
        <div>
            <h2 className="text-2xl font-bold text-secondary mb-4">{title}</h2>
            {appointments.length > 0 ? (
                 <div className="space-y-4">
                     {appointments.map(appt => {
                         const service = MOCK_SERVICES.find(s => s.id === appt.serviceId);
                         const professional = MOCK_PROFESSIONALS.find(p => p.id === appt.professionalId);
                         if (!service || !professional) return null;
                         const statusStyles = {
                             upcoming: 'border-l-blue-400',
                             completed: 'border-l-green-400',
                             cancelled: 'border-l-red-400'
                         };
                         return (
                             <div key={appt.id} className={`bg-white p-5 rounded-lg shadow-md border-l-4 ${statusStyles[appt.status] || 'border-l-gray-300'}`}>
                                 <div className="flex flex-col md:flex-row justify-between">
                                     <div>
                                         <p className="font-bold text-lg text-secondary">{service.name}</p>
                                         <p className="text-light-text">con {professional.name}</p>
                                         <p className="text-light-text font-medium">{appt.start.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                         {isPast && <p className="text-sm font-semibold capitalize mt-1 text-gray-600">{appt.status === 'completed' ? 'Completada' : 'Cancelada'}</p>}
                                     </div>
                                     {!isPast && onEdit && onCancel && (
                                         <div className="flex items-center space-x-2 mt-4 md:mt-0">
                                             <button onClick={() => onEdit(appt)} className="text-sm text-gray-600 font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors">Editar</button>
                                             <button onClick={() => onCancel(appt)} className="text-sm text-red-600 font-semibold py-2 px-4 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">Anular</button>
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
                    {!isPast && <button onClick={() => navigate('/reservar')} className="mt-4 bg-primary text-white px-5 py-2 rounded-lg font-semibold hover:bg-primary-light transition-colors">Reservar una nueva cita</button>}
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
