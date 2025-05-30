import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import StatsCard from '@/components/Dashboard/StatsCard';
import ChartCard from '@/components/Dashboard/ChartCard';
import { Users, FileText, Calendar, Clock, Activity, UserCheck, Video, PersonStanding } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingAnimation from '@/components/ui/loading-animation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConsultations: 0,
    pendingConsultations: 0,
    completedConsultations: 0,
    todayConsultations: 0,
    todayDelta: 0
  });
  const [monthlyData, setMonthlyData] = useState<{ name: string; value: number }[]>([]);
  const [consultationTypeData, setConsultationTypeData] = useState<{ name: string; value: number }[]>([]);
  const [recentUsers, setRecentUsers] = useState<{ id: string; name: string; email: string; created_at: string }[]>([]);
  const [topSymptoms, setTopSymptoms] = useState<{ name: string; value: number; percentage: number }[]>([]);
  
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
        
        // Get consultations booked today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: todayCount, error: todayError } = await supabase
          .from('consultations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());
        
        if (todayError) throw todayError;
        
        // Get yesterday's count for comparison
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { count: yesterdayCount, error: yesterdayError } = await supabase
          .from('consultations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString());
        
        if (yesterdayError) throw yesterdayError;
        
        // Get recent users for the table display
        const { data: recentUsersData, error: recentUsersError } = await supabase
          .from('profiles')
          .select('id, name, email, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (recentUsersError) throw recentUsersError;
        
        // Get consultations by type
        const { data: consultationTypes, error: typesError } = await supabase
          .from('consultations')
          .select('consultation_type');
        
        if (typesError) throw typesError;
        
        // Calculate monthly data for the last 6 months - consultations by month
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const last6Months = [];
        
        for (let i = 5; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = monthNames[month.getMonth()];
          
          const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
          const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
          
          // Count consultations booked in this month
          const { count, error } = await supabase
            .from('consultations')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstDay.toISOString())
            .lte('created_at', lastDay.toISOString());
            
          if (error) throw error;
          
          last6Months.push({
            name: `${monthName} ${month.getFullYear().toString().substr(2)}`,
            value: count || 0
          });
        }
        
        // Create consultation type distribution data
        const typeCount = {
          virtual: 0,
          in_person: 0
        };
        
        consultationTypes?.forEach(consultation => {
          if (consultation.consultation_type === 'virtual') {
            typeCount.virtual++;
          } else if (consultation.consultation_type === 'in_person') {
            typeCount.in_person++;
          }
        });
        
        const typeData = [
          { name: 'Virtual', value: typeCount.virtual },
          { name: 'In-Person', value: typeCount.in_person }
        ];
        
        // Calculate top symptoms mentioned
        const { data: consultationsWithSymptoms, error: symptomsError } = await supabase
          .from('consultations')
          .select('symptoms');
        
        if (symptomsError) throw symptomsError;
        
        // Count occurrences of each symptom
        const symptomCounts: Record<string, number> = {};
        
        consultationsWithSymptoms?.forEach(consultation => {
          if (consultation.symptoms && Array.isArray(consultation.symptoms)) {
            consultation.symptoms.forEach((symptom: string) => {
              if (symptomCounts[symptom]) {
                symptomCounts[symptom]++;
              } else {
                symptomCounts[symptom] = 1;
              }
            });
          }
        });
        
        // Get top 10 symptoms
        const sortedSymptoms = Object.entries(symptomCounts)
          .map(([name, value]) => ({
            name,
            value,
            percentage: Math.round((value / (consultationsWithSymptoms?.length || 1)) * 100)
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
                  .replace(/^vue\.?js$/i, 'vue');
                
                // Only count each skill once per candidate
                if (!processedSkills.has(normalizedSkill)) {
                  processedSkills.add(normalizedSkill);
                  skillCounts[normalizedSkill] = (skillCounts[normalizedSkill] || 0) + 1;
                }
              });
            }
          });
        }
        
        // Get top 15 skills for a more comprehensive view
        const sortedSkills = Object.entries(skillCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([name, value]) => ({ 
            name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize skill names
            value, 
            percentage: Math.round((value / totalCandidates) * 100) // Calculate percentage of candidates with this skill
          }));
        
        // Update state with fetched data
        setStats({
          totalCandidates: cvCount || 0,
          processedToday: processedToday || 0,
          activeProjects: activeProjects || 0,
          pendingReview: pendingReview || 0,
          todayDelta: processedYesterday ? processedToday - processedYesterday : 0,
          projectDelta: recentProjects || 0
        });
        
        setMonthlyData(last6Months);
        setBucketData(buckets);
        setTopSkills(sortedSkills);
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
              {user?.name ? `Welcome, ${user.name.split(' ')[0]}` : 'Recruitment Dashboard'}
            </h1>
            <p className="text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {loading ? (
            <LoadingAnimation message="Preparing your recruitment insights..." />
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard 
                  title="Total Candidates"
                  value={stats.totalCandidates.toString()}
                  icon={<Users size={20} className="text-blue-500" />}
                />
                <StatsCard 
                  title="CVs Processed Today"
                  value={stats.processedToday.toString()}
                  icon={<FileText size={20} className="text-green-500" />}
                  trend={stats.todayDelta !== 0 ? { value: Math.abs(stats.todayDelta), positive: stats.todayDelta > 0 } : undefined}
                />
                <StatsCard 
                  title="Active Projects"
                  value={stats.activeProjects.toString()}
                  icon={<Briefcase size={20} className="text-purple-500" />}
                  suffix={stats.projectDelta > 0 ? `+${stats.projectDelta} new` : ''}
                />
                <StatsCard 
                  title="Pending Review"
                  value={stats.pendingReview.toString()}
                  icon={<Clock size={20} className="text-amber-500" />}
                />
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ChartCard 
                  title="CVs Processed per Month"
                  subtitle="6-month recruitment activity"
                  data={monthlyData}
                  type="bar"
                />
                <ChartCard 
                  title="Candidate Rating Distribution"
                  subtitle="By match category"
                  data={bucketData}
                  type="pie"
                />
              </div>
              
              {/* Skills Distribution */}
              <div className="mb-8">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4">
                    <h3 className="text-lg font-medium text-gray-900">Top Skills in Candidate Pool</h3>
                    <p className="text-sm text-gray-500">Most frequently mentioned skills across all candidate resumes</p>
                  </div>
                  
                  <div className="px-6 pb-6">
                    <ChartCard 
                      title=""
                      subtitle=""
                      data={topSkills}
                      type="bar"
                    />
                    

                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Skills Distribution */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">Top Skills in Candidate Pool</h3>
                  <p className="text-sm text-gray-500">Most frequently mentioned skills across all candidate resumes</p>
                </div>

                <div className="px-6 pb-6">
                  <ChartCard 
                    title=""
                    subtitle=""
                    data={topSkills}
                    type="bar"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  </div>
);
  );
};

export default Dashboard;
