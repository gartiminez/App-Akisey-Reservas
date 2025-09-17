
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Appointment, ClientVoucher, Service } from '../types';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import CancelConfirmationModal from '../components/profile/CancelConfirmationModal';
import EditProfileForm from '../components/profile/EditProfileForm';
import { PencilIcon, EnvelopeIcon, PhoneIcon, UserCircleIcon } from '../components/icons';
import SuccessToast from '../components/common/SuccessToast';
import { supabase } from '../lib/supabaseClient';


type Tab = 'appointments' | 'vouchers';

const ProfilePage: React.FC = () => {
  const { user, isLoggedIn, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const navigate = useNavigate();
  const { setService, setAppointmentToEdit } = useBooking();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vouchers, setVouchers] = useState<ClientVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  const [cancelModalState, setCancelModalState] = useState<{ isOpen: boolean; appointment: Appointment | null }>({
    isOpen: false,
    appointment: null,
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);


  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (user) {
        setLoading(true);
        const fetchProfileData = async () => {
            try {
                const { data: apptData, error: apptError } = await supabase
                    .from('appointments')
                    .select('*, services(*), professionals(*)')
                    .eq('client_id', user.id)
                    .order('start_time', { ascending: false });
                if (apptError) throw apptError;
                setAppointments(apptData || []);

                const { data: voucherData, error: voucherError } = await supabase
                    .from('client_bonos')
                    .select('*, bono_definitions(*, services(*))')
                    .eq('client_id', user.id);
                if (voucherError) throw voucherError;
                setVouchers(voucherData || []);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileData();
    }
  }, [user]);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const now = new Date();
    const upcoming = appointments.filter(a => new Date(a.start_time) >= now && a.status === 'confirmada').sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const past = appointments.filter(a => new Date(a.start_time) < now || a.status !== 'confirmada').sort((a,b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  const handleEdit = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    navigate('/reservar');
  };

  const handleOpenCancelModal = (appointment: Appointment) => {
    setCancelModalState({ isOpen: true, appointment });
  };

  const handleConfirmCancel = async () => {
    if (cancelModalState.appointment) {
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'cancelada' })
            .eq('id', cancelModalState.appointment.id);
        
        if (error) {
            alert(`Error al cancelar la cita: ${error.message}`);
        } else {
            setAppointments(prev =>
                prev.map(appt =>
                    appt.id === cancelModalState.appointment?.id
                        ? { ...appt, status: 'cancelada' }
                        : appt
                )
            );
        }
        setCancelModalState({ isOpen: false, appointment: null });
    }
  };
  
  const handleSaveProfile = async (updatedDetails: { fullName: string; phone: string; email: string }) => {
    try {
        await updateUser(updatedDetails);
        setIsEditingProfile(false);
        setShowSuccessToast(true);
    } catch(error: any) {
        alert(`Error al actualizar el perfil: ${error.message}`);
    }
  };


  const handleBookFromVoucher = (voucher: ClientVoucher) => {
    const serviceToBook = voucher.bono_definitions?.services;
    if (serviceToBook) {
        setService(serviceToBook);
        navigate('/reservar');
    }
  };

  if (!user) {
    return null; 
  }

  const ProfileDetails = (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-secondary">Mis Datos</h2>
            {!isEditingProfile && (
                <button onClick={() => setIsEditingProfile(true)} className="flex items-center space-x-2 text-sm text-gray-600 font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors">
                    <PencilIcon className="w-4 h-4" />
                    <span>Editar</span>
                </button>
            )}
        </div>
        {isEditingProfile ? (
            <EditProfileForm user={user} onSave={handleSaveProfile} onCancel={() => setIsEditingProfile(false)} />
        ) : (
            <div className="space-y-4 text-secondary">
                 <div className="flex items-center space-x-3"> <UserCircleIcon className="w-6 h-6 text-light-text" /> <span>{user.full_name}</span> </div>
                <div className="flex items-center space-x-3"> <PhoneIcon className="w-6 h-6 text-light-text" /> <span>{user.phone}</span> </div>
                <div className="flex items-center space-x-3"> <EnvelopeIcon className="w-6 h-6 text-light-text" /> <span>{user.email}</span> </div>
            </div>
        )}
    </div>
  );

  return (
    <>
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-secondary tracking-tight">Hola, {user.full_name.split(' ')[0]}</h1>
          <p className="mt-1 text-lg text-light-text">Gestiona tus citas y bonos aquí.</p>
        </div>
        <button onClick={logout} className="mt-4 md:mt-0 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
            Cerrar Sesión
        </button>
      </div>
      
      {ProfileDetails}
      
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('appointments')} className={`${activeTab === 'appointments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}>Mis Citas</button>
          <button onClick={() => setActiveTab('vouchers')} className={`${activeTab === 'vouchers' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}>Mis Bonos</button>
        </nav>
      </div>

      <div>
        {loading ? <p>Cargando tus datos...</p> : (
            <>
                {activeTab === 'appointments' && (
                <div className="space-y-12">
                    <AppointmentSection title="Próximas Citas" appointments={upcomingAppointments} onEdit={handleEdit} onCancel={handleOpenCancelModal} />
                    <AppointmentSection title="Historial de Citas" appointments={pastAppointments} isPast={true} />
                </div>
                )}
                {activeTab === 'vouchers' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-secondary">Bonos Activos</h2>
                        {vouchers.map(voucher => {
                            const service = voucher.bono_definitions?.services;
                            if (!service) return null;
                            return (
                                <div key={voucher.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-secondary">{service.name}</h3>
                                        <p className="text-primary font-semibold mt-2 text-lg">
                                            Quedan {voucher.remaining_sessions} de {voucher.bono_definitions?.total_sessions} sesiones
                                        </p>
                                    </div>
                                    <button onClick={() => handleBookFromVoucher(voucher)} className="mt-4 md:mt-0 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-light transition-colors">
                                        Reservar Cita
                                    </button>
                                </div>
                            );
                        })}
                        {vouchers.length === 0 && <p className="text-light-text">No tienes bonos activos.</p>}
                    </div>
                )}
            </>
        )}
      </div>
    </div>
    <CancelConfirmationModal isOpen={cancelModalState.isOpen} onClose={() => setCancelModalState({ isOpen: false, appointment: null })} onConfirm={handleConfirmCancel} appointment={cancelModalState.appointment} />
    <SuccessToast isOpen={showSuccessToast} onClose={() => setShowSuccessToast(false)} message="¡Tus datos han sido actualizados con éxito!" />
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
                         const service = appt.services;
                         const professional = appt.professionals;
                         if (!service || !professional) return null;
                         
                         const statusStyles = {
                             confirmada: 'border-l-blue-400',
                             completada: 'border-l-green-400',
                             cancelada: 'border-l-red-400'
                         };

                         const startDate = new Date(appt.start_time);

                         return (
                             <div key={appt.id} className={`bg-white p-5 rounded-lg shadow-md border-l-4 ${statusStyles[appt.status] || 'border-l-gray-300'}`}>
                                 <div className="flex flex-col md:flex-row justify-between">
                                     <div>
                                         <p className="font-bold text-lg text-secondary">{service.name}</p>
                                         <p className="text-light-text">con {professional.full_name}</p>
                                         <p className="text-light-text font-medium">{startDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                                         {isPast && <p className="text-sm font-semibold capitalize mt-1 text-gray-600">{appt.status}</p>}
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
