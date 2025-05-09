
import React from 'react';
import { 
  BarChart3,
  ArrowUp, 
  User, 
  Search 
} from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <BarChart3 className="h-10 w-10 text-lens-purple" />,
      title: "Advanced Analytics",
      description: "Gain deep insights into your team's performance with our powerful analytics tools and customizable dashboards."
    },
    {
      icon: <ArrowUp className="h-10 w-10 text-lens-blue" />,
      title: "Progress Tracking",
      description: "Monitor project milestones, track KPIs, and visualize your team's progress towards organizational goals."
    },
    {
      icon: <User className="h-10 w-10 text-lens-green" />,
      title: "Team Management",
      description: "Manage your team efficiently with performance metrics, task assignments, and collaborative workspaces."
    },
    {
      icon: <Search className="h-10 w-10 text-lens-orange" />,
      title: "Insightful Reports",
      description: "Generate comprehensive reports with actionable insights to make data-driven decisions for your business."
    }
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-4xl font-bold mb-6 text-gray-900">Powerful Features to Boost Your Productivity</h2>
          <p className="text-xl text-gray-600">
            Our platform is designed to help you achieve more with less effort, providing the tools you need to succeed.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 hover-scale"
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="font-display text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
