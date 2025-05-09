
import React from 'react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      quote: "Lens has completely transformed how we track our company's KPIs. The interface is intuitive and the insights are actionable.",
      author: "Sarah Johnson",
      position: "Marketing Director",
      company: "TechCorp"
    },
    {
      quote: "The dashboard visualizations make it easy to understand complex data at a glance. Our team's productivity has increased by 30% since we started using Lens.",
      author: "Michael Chen",
      position: "Product Manager",
      company: "Innovate Inc."
    },
    {
      quote: "I've tried many project management tools, but Lens stands out with its powerful analytics and clean design. It's been a game-changer for our remote team.",
      author: "Emily Rodriguez",
      position: "Operations Lead",
      company: "Global Solutions"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-4xl font-bold mb-6 text-gray-900">What Our Customers Say</h2>
          <p className="text-xl text-gray-600">
            Join thousands of satisfied users who have transformed their workflow with Lens.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-xl shadow-md"
            >
              <div className="mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <blockquote className="mb-6 text-gray-700 italic">"{testimonial.quote}"</blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lens-purple to-lens-purple-light flex items-center justify-center text-white font-semibold">
                  {testimonial.author.charAt(0)}
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-gray-600 text-sm">{testimonial.position}, {testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
