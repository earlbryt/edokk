
import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";

type ChartType = "bar" | "area" | "pie";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  type?: ChartType;
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  data,
  type = "bar",
  className,
}) => {
  const renderChart = () => {
    switch (type) {
      case "bar":
        // Modify long skill names for better display
        const processedData = data.map(item => ({
          ...item,
          // Truncate long names and add ellipsis
          displayName: item.name.length > 10 ? `${item.name.substring(0, 9)}...` : item.name
        }));
        
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              data={processedData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              barSize={36} // Increase the width of the bars
              barGap={1} // Reduce the gap between bars
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="displayName" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                interval={0} // Force display all labels
                height={50} // Increase height for labels
                angle={-45} // Angle text to prevent overlap
                textAnchor="end" // Align text for angled labels
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: 'none'
                }}
                // Show original (non-truncated) name in tooltip
                formatter={(value, name, props) => [
                  value, props.payload.name
                ]}
              />
              <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: 'none'
                }}
              />
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8B5CF6" 
                fill="url(#colorValue)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "pie":
        const COLORS = ['#8B5CF6', '#60A5FA', '#34D399', '#F87171'];
        
        // Define the full set of categories we want to show in the legend
        const allCategories = [
          { name: 'Ideal Match', color: COLORS[0] },
          { name: 'Good Match', color: COLORS[1] },
          { name: 'Possible Match', color: COLORS[2] },
          { name: 'Not Suitable', color: COLORS[3] }
        ];
        
        // Filter out zero values for the chart (but keep them for the legend)
        const filteredData = data.filter(item => item.value > 0);
        
        // Create a lookup of values by name for the legend
        const valueByName: {[key: string]: number} = {};
        data.forEach(item => {
          valueByName[item.name] = item.value;
        });
        
        // Custom render for the label that handles positioning and formatting
        const renderCustomizedLabel = (props: any) => {
          const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name } = props;
          
          // Skip rendering labels for segments that are too small (less than 5%)
          if (percent < 0.05) return null;
          
          // Calculate the position of the label
          const RADIAN = Math.PI / 180;
          const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
          const x = cx + radius * Math.cos(-midAngle * RADIAN);
          const y = cy + radius * Math.sin(-midAngle * RADIAN);
          
          return (
            <text 
              x={x} 
              y={y} 
              fill={COLORS[index % COLORS.length]}
              textAnchor={x > cx ? 'start' : 'end'}
              dominantBaseline="central"
              fontSize={12}
              fontWeight="500"
            >
              {`${name}: ${(percent * 100).toFixed(0)}%`}
            </text>
          );
        };
        
        // If we have no data, show a message
        if (filteredData.length === 0) {
          return (
            <div className="flex flex-col h-[250px]">
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p className="text-center">No candidates rated yet</p>
              </div>
              
              {/* Legend showing all categories even with no data */}
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {allCategories.map((category, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 mr-2" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-xs text-gray-600">
                      {category.name}: 0
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        return (
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8B5CF6"
                  dataKey="value"
                  nameKey="name"
                  label={renderCustomizedLabel}
                >
                  {filteredData.map((entry, index) => {
                    // Find the color based on category name
                    const categoryIndex = allCategories.findIndex(c => c.name === entry.name);
                    const color = categoryIndex >= 0 ? COLORS[categoryIndex] : COLORS[index % COLORS.length];
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}`, 'Count']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: 'none'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend showing all categories */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {allCategories.map((category, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 mr-2 rounded-sm" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-xs text-gray-600">
                    {category.name}: {valueByName[category.name] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="p-4">
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartCard;
