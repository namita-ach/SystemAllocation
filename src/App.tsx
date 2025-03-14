import React, { useEffect, useState } from 'react';
import { format, addHours, startOfDay } from 'date-fns';
import { toast, Toaster } from 'react-hot-toast';
import { Monitor, Calendar, Clock, LogIn, LogOut, Loader2, Mail, Lock, UserPlus } from 'lucide-react';
import { supabase } from './lib/supabase';

type System = {
  id: string;
  name: string;
  description: string;
};

type Reservation = {
  id: string;
  system_id: string;
  user_id: string;
  date: string;
  time_slot: number;
};

function App() {
  const [session, setSession] = useState(null);
  const [systems, setSystems] = useState<System[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchSystems();
      fetchReservations();
    }
  }, [session, selectedDate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setIsLoggingIn(false);
      setPassword(''); // Clear password for security
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Registration successful! You can now sign in.');
        setShowRegister(false);
      }
    } catch (error) {
      toast.error('An error occurred during registration');
    } finally {
      setIsRegistering(false);
      setPassword(''); // Clear password for security
    }
  };

  const fetchSystems = async () => {
    const { data, error } = await supabase.from('systems').select('*');
    if (error) {
      toast.error('Failed to fetch systems');
    } else {
      setSystems(data);
    }
  };

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('date', format(selectedDate, 'yyyy-MM-dd'));
    
    if (error) {
      toast.error('Failed to fetch reservations');
    } else {
      setReservations(data);
    }
  };

  const handleReservation = async (systemId: string, timeSlot: number) => {
    const existingReservation = reservations.find(
      r => r.system_id === systemId && r.time_slot === timeSlot && r.user_id === session?.user?.id
    );

    if (existingReservation) {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', existingReservation.id);

      if (error) {
        toast.error('Failed to cancel reservation');
      } else {
        toast.success('Reservation cancelled');
        fetchReservations();
      }
    } else {
      const { error } = await supabase
        .from('reservations')
        .insert({
          system_id: systemId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time_slot: timeSlot,
          user_id: session?.user?.id
        });

      if (error) {
        toast.error('Failed to make reservation');
      } else {
        toast.success('Reservation confirmed');
        fetchReservations();
      }
    }
  };

  const getTimeSlotLabel = (slot: number) => {
    const start = addHours(startOfDay(new Date()), slot * 2);
    const end = addHours(start, 2);
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center mb-8">
            <Monitor className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-6">GPU Lab Reservation System</h1>
          
          <form onSubmit={showRegister ? handleRegister : handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || isRegistering}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn || isRegistering ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : showRegister ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {isLoggingIn ? 'Signing In...' : 
               isRegistering ? 'Registering...' :
               showRegister ? 'Register' : 'Sign In'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowRegister(!showRegister);
                  setPassword('');
                }}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                {showRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Monitor className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold">GPU Lab Reservation System</h1>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Calendar className="w-6 h-6 text-gray-500" />
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border rounded-lg px-3 py-2"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-gray-50">System</th>
                  {Array.from({ length: 12 }).map((_, slot) => (
                    <th key={slot} className="px-4 py-2 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {getTimeSlotLabel(slot)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {systems.map((system) => (
                  <tr key={system.id}>
                    <td className="border px-4 py-2">
                      <div>
                        <div className="font-medium">{system.name}</div>
                        <div className="text-sm text-gray-500">{system.description}</div>
                      </div>
                    </td>
                    {Array.from({ length: 12 }).map((_, slot) => {
                      const reservation = reservations.find(
                        r => r.system_id === system.id && r.time_slot === slot
                      );
                      const isMyReservation = reservation?.user_id === session?.user?.id;

                      return (
                        <td key={slot} className="border px-4 py-2">
                          <button
                            onClick={() => handleReservation(system.id, slot)}
                            disabled={reservation && !isMyReservation}
                            className={`w-full py-1 px-2 rounded ${
                              isMyReservation
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : reservation
                                ? 'bg-red-100 text-red-700 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            {isMyReservation ? 'Reserved' : reservation ? 'Taken' : 'Available'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;