import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Phone } from "lucide-react";

const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "How accurate is the CV parsing technology?",
      answer:
        "Our CV parsing technology achieves over 95% accuracy for standard CV formats. We use a hybrid approach combining rule-based systems with advanced AI models trained on diverse resume formats to ensure high-quality data extraction even from non-standard documents.",
    },
    {
      question: "How many CVs can I process at once?",
      answer:
        "Our platform is designed to handle bulk uploads efficiently. Depending on your subscription tier, you can upload anywhere from 100 to unlimited CVs simultaneously. The processing speed scales with volume, and our queuing system ensures all documents are processed without overwhelming your system.",
    },
    {
      question: "Can I customize the candidate scoring criteria?",
      answer:
        "Absolutely! Our platform allows you to define custom scoring weights for each job position. You can adjust importance factors for experience, skills, education, certifications, and more. Additionally, you can create company-specific rules to prioritize candidates from particular institutions or with specific skill sets.",
    },
    {
      question: "Is my candidates' data secure?",
      answer:
        "We take data security extremely seriously. All CV data is encrypted using AES-256 both in transit and at rest. We comply with GDPR and local data protection regulations, with a default data retention policy of 30 days unless otherwise specified. We also offer an anonymization feature to support unbiased screening.",
    },
    {
      question: "Can I integrate this with my existing ATS or HRIS?",
      answer:
        "Yes, our platform offers comprehensive API access that allows for seamless integration with popular Applicant Tracking Systems and HR Information Systems. We provide detailed documentation and support for implementation. For enterprise clients, we also offer custom integration services.",
    },
    {
      question: "Do you offer any training or support?",
      answer:
        "Yes, all plans include access to our comprehensive knowledge base and video tutorials. Premium and Enterprise plans include personalized onboarding sessions, dedicated support, and regular check-ins to ensure you're getting the most out of the platform.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold mb-6 text-gray-900">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about our AI-powered recruitment platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          {/* Left column */}
          <div>
            {faqs.slice(0, 3).map((faq, index) => (
              <Accordion key={index} type="single" collapsible className="w-full mb-4">
                <AccordionItem value={`item-${index}`} className="border bg-white rounded-lg shadow-sm">
                  <AccordionTrigger className="text-left font-display text-lg font-medium text-gray-900 hover:text-lens-purple transition-colors px-6 py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 px-6 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
          
          {/* Right column */}
          <div>
            {faqs.slice(3, 6).map((faq, index) => (
              <Accordion key={index} type="single" collapsible className="w-full mb-4">
                <AccordionItem value={`item-${index + 3}`} className="border bg-white rounded-lg shadow-sm">
                  <AccordionTrigger className="text-left font-display text-lg font-medium text-gray-900 hover:text-lens-purple transition-colors px-6 py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 px-6 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        </div>
        
        {/* Contact section */}
        <div className="mt-16 bg-white border border-gray-100 rounded-xl shadow-sm p-8 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="font-display text-2xl font-bold mb-2 text-gray-900">Still have questions?</h3>
            <p className="text-gray-600">
              Our team is here to help. Contact us through any of these channels and we'll get back to you promptly.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-lens-purple/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-lens-purple" />
              </div>
              <h4 className="font-medium mb-1">Live Chat</h4>
              <p className="text-sm text-gray-500 mb-3">Get instant answers</p>
              <Button variant="outline" className="border-lens-purple text-lens-purple">Start Chat</Button>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-lens-blue/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-lens-blue" />
              </div>
              <h4 className="font-medium mb-1">Email Us</h4>
              <p className="text-sm text-gray-500 mb-3">support@lens.com</p>
              <Button variant="outline" className="border-lens-blue text-lens-blue">Send Email</Button>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-lens-green/10 rounded-full flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-lens-green" />
              </div>
              <h4 className="font-medium mb-1">Call Us</h4>
              <p className="text-sm text-gray-500 mb-3">Mon-Fri, 9am-5pm</p>
              <Button variant="outline" className="border-lens-green text-lens-green">+1 (555) 123-4567</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
