import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import StatsCard from '@/components/Dashboard/StatsCard';
import ChartCard from '@/components/Dashboard/ChartCard';
import { Users, FileText, Briefcase, Star, Clock, Calendar, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingAnimation from '@/components/ui/loading-animation';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    processedToday: 0,
    activeProjects: 0,
    pendingReview: 0,
    todayDelta: 0,
    projectDelta: 0
  });
  const [monthlyData, setMonthlyData] = useState<{ name: string; value: number }[]>([]);
  const [bucketData, setBucketData] = useState<{ name: string; value: number }[]>([]);
  const [topSkills, setTopSkills] = useState<{ name: string; value: number }[]>([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (!user) return;
        
        // Get total candidates count
        const { count: totalCandidates, error: candidatesError } = await supabase
          .from('cv_files')
          .select('*', { count: 'exact', head: true });
        
        if (candidatesError) throw candidatesError;
        
        // Get candidates processed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: processedToday, error: todayError } = await supabase
          .from('cv_files')
          .select('*', { count: 'exact', head: true })
          .gte('uploaded_at', today.toISOString());
        
        if (todayError) throw todayError;
        
        // Get yesterday's count for comparison
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { count: processedYesterday, error: yesterdayError } = await supabase
          .from('cv_files')
          .select('*', { count: 'exact', head: true })
          .gte('uploaded_at', yesterday.toISOString())
          .lt('uploaded_at', today.toISOString());
        
        if (yesterdayError) throw yesterdayError;
        
        // Get active projects count
        const { count: activeProjects, error: projectsError } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });
        
        if (projectsError) throw projectsError;
        
        // Get projects created in the last 7 days
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const { count: recentProjects, error: recentProjectsError } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', lastWeek.toISOString());
        
        if (recentProjectsError) throw recentProjectsError;
        
        // First, get all completed CVs
        const { data: completedCVs, error: completedError } = await supabase
          .from('cv_files')
          .select('id')
          .eq('status', 'completed');
        
        if (completedError) throw completedError;
        
        // Get all CVs that have ratings
        const { data: ratedCVs, error: ratedError } = await supabase
          .from('candidate_ratings')
          .select('cv_file_id');
        
        if (ratedError) throw ratedError;
        
        // Filter out rated CVs to get those pending review
        const ratedIds = ratedCVs?.map(item => item.cv_file_id) || [];
        const pendingReview = completedCVs?.filter(cv => !ratedIds.includes(cv.id)).length || 0;
        
        // Calculate monthly data for the last 6 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const last6Months: { name: string; value: number }[] = [];
        
        for (let i = 5; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const endMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          
          const { count, error } = await supabase
            .from('cv_files')
            .select('*', { count: 'exact', head: true })
            .gte('uploaded_at', month.toISOString())
            .lte('uploaded_at', endMonth.toISOString());
          
          if (error) throw error;
          
          last6Months.push({
            name: monthNames[month.getMonth()],
            value: count || 0
          });
        }
        
        // Get bucket distribution
        const buckets: { name: string; value: number }[] = [];
        
        const { data: bucketCounts, error: bucketError } = await supabase
          .from('candidate_ratings')
          .select('rating')
          .not('rating', 'is', null);
        
        if (bucketError) throw bucketError;
        
        if (bucketCounts) {
          const counts = {
            A: 0,
            B: 0,
            C: 0,
            D: 0
          };
          
          bucketCounts.forEach(rating => {
            if (rating.rating in counts) {
              counts[rating.rating as keyof typeof counts]++;
            }
          });
          
          buckets.push(
            { name: 'Ideal Match', value: counts.A },
            { name: 'Good Match', value: counts.B },
            { name: 'Possible Match', value: counts.C },
            { name: 'Not Suitable', value: counts.D }
          );
        }
        
        // Get top skills from summaries
        const { data: summaries, error: summariesError } = await supabase
          .from('summaries')
          .select('skills');
        
        if (summariesError) throw summariesError;
        
        const skillCounts: Record<string, number> = {};
        
        if (summaries) {
          summaries.forEach(summary => {
            if (summary.skills && Array.isArray(summary.skills)) {
              summary.skills.forEach((skill: string) => {
                if (skill) {
                  skillCounts[skill.toLowerCase()] = (skillCounts[skill.toLowerCase()] || 0) + 1;
                }
              });
            }
          });
        }
        
        const sortedSkills = Object.entries(skillCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, value]) => ({ name, value }));
        
        // Update state with fetched data
        setStats({
          totalCandidates: totalCandidates || 0,
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
                <ChartCard 
                  title="Top Skills in Candidate Pool"
                  subtitle="Most frequently mentioned skills in resumes"
                  data={topSkills}
                  type="bar"
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
