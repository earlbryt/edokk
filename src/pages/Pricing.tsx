
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
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Transparent pricing for every recruitment need
            </h1>
            <p className="mt-5 text-xl text-gray-600">
              Choose the plan that suits your recruitment volume and budget.
            </p>
          </div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-7xl mx-auto px-4">
            <PricingTier
              title="Free Starter"
              price="GH₵0"
              description="Perfect for small teams or individual recruiters"
              features={[
                "10 document uploads per day",
                "Basic CV parsing",
                "Simple candidate filtering",
                "Email support",
                "7-day data retention"
              ]}
              buttonText="Get Started"
              buttonLink="/signup"
            />
            
            <PricingTier
              title="Recruiter Pro"
              price="GH₵100"
              description="Ideal for growing recruitment teams"
              features={[
                "100 document uploads per day",
                "Advanced CV parsing & analytics",
                "Smart candidate matching",
                "Priority email & chat support",
                "30-day data retention",
                "Candidate bulk actions"
              ]}
              buttonText="Start 14-day Trial"
              buttonLink="/signup"
              highlighted
            />
            
            <PricingTier
              title="Enterprise"
              price={<span className="text-2xl font-bold text-gray-900">Contact Sales</span>}
              description="Full-featured solution for large organizations"
              features={[
                "Unlimited document uploads",
                "Custom CV parsing rules",
                "API access",
                "Dedicated account manager",
                "Custom data retention policies",
                "Advanced analytics & reporting",
                "White labeling options"
              ]}
              buttonText="Contact Sales"
              buttonLink="/contact"
            />
          </div>
          
          <div className="mt-20 max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <div className="mt-10 space-y-8 text-left px-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Can I change plans later?</h3>
                <p className="mt-2 text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">What payment methods do you accept?</h3>
                <p className="mt-2 text-gray-600">
                  We accept all major credit cards, mobile money payments (MTN, Vodafone, AirtelTigo), and bank transfers for enterprise clients.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">What happens when I reach my document limit?</h3>
                <p className="mt-2 text-gray-600">
                  When you reach your daily document limit, you'll need to wait until the next day to upload more documents or upgrade your plan for immediate access to a higher limit.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Do you offer discounts for annual subscriptions?</h3>
                <p className="mt-2 text-gray-600">
                  Yes, we offer a 15% discount for annual billing on all paid plans. Contact our sales team for more information.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Still have questions?
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Our team is here to help you find the right plan for your needs.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-lens-purple hover:bg-lens-purple-light">
                  Contact Us
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
