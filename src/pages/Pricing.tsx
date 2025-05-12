import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const PricingTier: React.FC<{
  title: string;
  price: string | React.ReactNode;
  description: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  highlighted?: boolean;
}> = ({ title, price, description, features, buttonText, buttonLink, highlighted = false }) => (
  <div className={`relative rounded-2xl border ${highlighted ? 'border-lens-purple shadow-lg' : 'border-gray-200'} p-6 sm:p-8 md:p-10 flex flex-col h-full`}>
    {highlighted && (
      <div className="absolute -top-4 inset-x-0 flex justify-center">
        <div className="bg-lens-purple text-white px-4 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      </div>
    )}
    
    <div className="flex-1">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <div className="mt-4 flex items-baseline">
        {typeof price === 'string' ? (
          <>
            <span className="text-4xl font-bold text-gray-900">{price}</span>
            {!price.includes('Contact') && <span className="text-lg text-gray-500 ml-1">/month</span>}
          </>
        ) : (
          price
        )}
      </div>
      <p className="mt-4 text-gray-600">{description}</p>
      
      <ul className="mt-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <div className={`flex-shrink-0 ${highlighted ? 'text-lens-purple' : 'text-lens-blue'}`}>
              <Check className="h-5 w-5" />
            </div>
            <span className="ml-3 text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
    
    <div className="mt-8">
      <Link to={buttonLink}>
        <Button 
          className={`w-full ${highlighted ? 'bg-lens-purple hover:bg-lens-purple-light' : 'bg-white text-lens-purple border border-lens-purple hover:bg-gray-50'}`}
        >
          {buttonText}
        </Button>
      </Link>
    </div>
  </div>
);

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-20">
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block bg-lens-purple/10 text-lens-purple px-4 py-2 rounded-full text-sm font-medium mb-4">AI-Powered Recruitment</span>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Intelligent hiring solutions for every team
            </h1>
            <p className="mt-5 text-xl text-gray-600">
              Match your perfect candidates with AI-powered CV parsing and intelligent categorization.
            </p>
          </div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-7xl mx-auto px-4">
            <PricingTier
              title="Free Starter"
              price="GH₵0"
              description="Perfect for small teams or individual recruiters"
              features={[
                "10 CV uploads per month",
                "Basic AI resume parsing",
                "Simple requirements matching",
                "A/B/C/D candidate categorization",
                "Email support",
                "7-day data retention"
              ]}
              buttonText="Get Started"
              buttonLink="/signup"
            />
            
            <PricingTier
              title="Recruiter Pro"
              price="GH₵100"
              description="Intelligent recruiting for growing teams"
              features={[
                "100 CV uploads per month",
                "Advanced AI parsing with higher accuracy",
                "Custom requirements configuration",
                "Precision candidate categorization",
                "Candidate comparison tools",
                "Priority email & chat support",
                "30-day data retention",
                "Bulk processing and actions"
              ]}
              buttonText="Get Started"
              buttonLink="/signup"
              highlighted
            />
            
            <PricingTier
              title="Enterprise"
              price={<span className="text-2xl font-bold text-gray-900">Contact Sales</span>}
              description="Full AI recruitment suite for organizations"
              features={[
                "Unlimited CV processing",
                "Custom AI parsing rules & templates",
                "Advanced requirement weighting",
                "Custom categorization algorithms",
                "Full API access & integrations",
                "Dedicated account manager",
                "Custom data retention policies",
                "Advanced analytics & reporting",
                "White labeling options"
              ]}
              buttonText="Contact Sales"
              buttonLink="/contact"
            />
          </div>
          
          <div className="mt-20 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <div className="mt-10 space-y-8 text-left px-4 grid md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">How accurate is the AI CV parsing?</h3>
                <p className="mt-2 text-gray-600">
                  Our AI achieves 95%+ accuracy in extracting key information from resumes across various formats. The Enterprise plan allows for custom training to reach even higher accuracy rates.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">What file formats do you support?</h3>
                <p className="mt-2 text-gray-600">
                  Lens supports all standard resume formats including PDF, Word (.doc, .docx), and plain text files. Our AI can handle varied layouts, designs, and multi-column formats.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">How does candidate categorization work?</h3>
                <p className="mt-2 text-gray-600">
                  Our AI matches candidate qualifications against your requirements, categorizing them into A (perfect match), B (strong match), C (partial match), or D (minimal match) to streamline your selection process.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">Can I modify my subscription?</h3>
                <p className="mt-2 text-gray-600">
                  Yes, you can upgrade, downgrade, or cancel your plan at any time. Changes take effect on your next billing cycle, and we offer a 15% discount for annual billing on all paid plans.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">What happens when I reach my CV limit?</h3>
                <p className="mt-2 text-gray-600">
                  When you reach your monthly CV upload limit, you'll need to wait until the next billing cycle or upgrade your plan for immediate access to a higher limit.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">What payment methods are accepted?</h3>
                <p className="mt-2 text-gray-600">
                  We accept all major credit cards, mobile money payments (MTN, Vodafone, AirtelTigo), and bank transfers for enterprise clients. Payments are securely processed.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gradient-to-br from-lens-purple/5 to-lens-blue/5 border-t border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block mb-6 p-1 bg-white rounded-2xl shadow-sm">
              <div className="flex space-x-2 px-3 py-1 items-center bg-lens-purple/10 rounded-xl">
                <span className="flex h-3 w-3 bg-green-400 rounded-full"></span>
                <span className="text-sm font-medium text-lens-purple">Free CV parsing demo available</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Transform your recruitment process today
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Join hundreds of recruiters using Lens AI to find perfect candidates faster and with less effort. 
              Our team is ready to help you get started.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Link to="/signup">
                <Button size="lg" className="bg-lens-purple hover:bg-lens-purple/90 px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-lens-purple text-lens-purple hover:bg-lens-purple/5 px-8">
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;
