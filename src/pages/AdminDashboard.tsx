
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import StatsCard from '@/components/Dashboard/StatsCard';
import { Users, Calendar, Clock, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingAnimation from '@/components/ui/loading-animation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConsultations: 0,
    pendingConsultations: 0,
    completedConsultations: 0
  });
  const [recentUsers, setRecentUsers] = useState<{ id: string; name: string; email: string; updated_at: string }[]>([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (!user) return;
        
        // Get total users count
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (usersError) throw usersError;
        
        // Get total consultations count
        const { count: consultationsCount, error: consultationsError } = await supabase
          .from('consultations')
          .select('*', { count: 'exact', head: true });
        
        if (consultationsError) throw consultationsError;
        
        // Get pending consultations count
        const { count: pendingCount, error: pendingError } = await supabase
          .from('consultations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        if (pendingError) throw pendingError;
        
        // Get completed consultations count
        const { count: completedCount, error: completedError } = await supabase
          .from('consultations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
        
        if (completedError) throw completedError;
        
        // Get recent users for the table display
        const { data: recentUsersData, error: recentUsersError } = await supabase
          .from('profiles')
          .select('id, name, email, updated_at')
          .order('updated_at', { ascending: false })
          .limit(10);
        
        if (recentUsersError) throw recentUsersError;
        
        // Update state with fetched data
        setStats({
          totalUsers: usersCount || 0,
          totalConsultations: consultationsCount || 0,
          pendingConsultations: pendingCount || 0,
          completedConsultations: completedCount || 0
        });
        
        setRecentUsers(recentUsersData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Healthcare platform administration overview
            </p>
          </div>
          
          {loading ? (
            <LoadingAnimation message="Loading admin dashboard..." />
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard 
                  title="Total Users"
                  value={stats.totalUsers.toString()}
                  icon={<Users size={20} className="text-blue-500" />}
                />
                <StatsCard 
                  title="Total Consultations"
                  value={stats.totalConsultations.toString()}
                  icon={<Calendar size={20} className="text-green-500" />}
                />
                <StatsCard 
                  title="Pending Consultations"
                  value={stats.pendingConsultations.toString()}
                  icon={<Clock size={20} className="text-amber-500" />}
                />
                <StatsCard 
                  title="Completed Consultations"
                  value={stats.completedConsultations.toString()}
                  icon={<Activity size={20} className="text-purple-500" />}
                />
              </div>
              
              {/* Recent Users Table */}
              <div className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent User Registrations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Registration Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.updated_at ? (
                                format(new Date(user.updated_at), 'PPP')
                              ) : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
