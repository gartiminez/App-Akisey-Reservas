import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { Appointment, ClientBono, Service } from "../types"; // Asumiendo que ClientBono está en tus tipos

const ProfilePage = () => {
  // 1. ESTADO Y HOOKS
  const { user, clientProfile, logout, isLoading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]); // Usamos 'any' por simplicidad, se puede mejorar
  const [bonos, setBonos] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // 2. EFECTO PARA CARGAR LOS DATOS DEL USUARIO DESDE SUPABASE
  useEffect(() => {
    // Solo ejecutamos la carga si tenemos un usuario y su perfil
    if (user && clientProfile) {
      const fetchData = async () => {
        setLoadingData(true);

        // Petición para obtener las citas del cliente
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            *,
            services (*),
            professionals (*)
          `)
          .eq('client_id', user.id)
          .order('start_time', { ascending: false });

        if (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
        } else {
          setAppointments(appointmentsData);
        }

        // Petición para obtener los bonos del cliente
        const { data: bonosData, error: bonosError } = await supabase
          .from('client_bonos')
          .select(`
            *,
            bono_definitions ( *, services (*) )
          `)
          .eq('client_id', user.id);

        if (bonosError) {
          console.error("Error fetching client bonos:", bonosError);
        } else {
          setBonos(bonosData);
        }

        setLoadingData(false);
      };

      fetchData();
    } else if (!authLoading) {
      // Si la autenticación ha terminado y no hay usuario, dejamos de cargar
      setLoadingData(false);
    }
  }, [user, clientProfile, authLoading]); // Se ejecuta cada vez que el usuario o su perfil cambian

  // 3. RENDERIZADO CONDICIONAL
  if (authLoading || loadingData) {
    return <div className="text-center p-10">Cargando perfil...</div>;
  }

  if (!user) {
    return <div className="text-center p-10">Por favor, inicia sesión para ver tu perfil.</div>;
  }

  const upcomingAppointments = appointments.filter(a => new Date(a.start_time) >= new Date());
  const pastAppointments = appointments.filter(a => new Date(a.start_time) < new Date());

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hola, {clientProfile?.full_name || 'Cliente'}</h1>
          <p className="text-gray-600">Bienvenido/a a tu espacio personal.</p>
        </div>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600">
          Cerrar Sesión
        </button>
      </div>

      {/* SECCIÓN DE BONOS */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4">Mis Bonos</h2>
        {bonos.length > 0 ? (
          <div className="space-y-4">
            {bonos.map(bono => (
              <div key={bono.id} className="border p-4 rounded-md">
                <p className="font-bold">{bono.bono_definitions.services.name}</p>
                <p>Sesiones restantes: <span className="font-bold text-pink-500">{bono.remaining_sessions} / {bono.bono_definitions.total_sessions}</span></p>
              </div>
            ))}
          </div>
        ) : (
          <p>No tienes bonos activos en este momento.</p>
        )}
      </div>

      {/* SECCIÓN DE CITAS */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Mis Citas</h2>
        
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Próximas Citas</h3>
        {upcomingAppointments.length > 0 ? (
           upcomingAppointments.map(app => (
             <div key={app.id} className="border-b py-2">{app.services.name} con {app.professionals.full_name} el {new Date(app.start_time).toLocaleDateString()}</div>
           ))
        ) : <p>No tienes próximas citas.</p>}
        
        <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-2">Historial de Citas</h3>
        {pastAppointments.length > 0 ? (
           pastAppointments.map(app => (
             <div key={app.id} className="border-b py-2 opacity-70">{app.services.name} con {app.professionals.full_name} el {new Date(app.start_time).toLocaleDateString()}</div>
           ))
        ) : <p>No tienes citas en tu historial.</p>}
      </div>
    </div>
  );
};

export default ProfilePage;
