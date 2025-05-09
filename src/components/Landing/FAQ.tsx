
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "How can Lens help my team improve productivity?",
      answer:
        "Lens provides comprehensive analytics and visualization tools that help you identify bottlenecks, track performance metrics, and streamline workflows. By gaining insights into your team's productivity patterns, you can make data-driven decisions to optimize processes and improve overall efficiency.",
    },
    {
      question: "Is Lens suitable for small businesses?",
      answer:
        "Absolutely! Lens is designed to scale with your business. Our platform offers flexible plans tailored to the needs of small businesses, startups, and large enterprises alike. Many of our small business customers have reported significant improvements in project management and team coordination.",
    },
    {
      question: "Can I integrate Lens with my existing tools?",
      answer:
        "Yes, Lens offers seamless integration with popular productivity tools, project management software, and communication platforms. Our API allows for custom integrations, ensuring that Lens works harmoniously with your existing tech stack.",
    },
    {
      question: "How secure is my data with Lens?",
      answer:
        "We take data security extremely seriously. Lens employs industry-standard encryption protocols, regular security audits, and strict access controls to ensure your data remains protected. We are compliant with major data protection regulations including GDPR and maintain a transparent privacy policy.",
    },
    {
      question: "What kind of support does Lens provide?",
      answer:
        "Lens offers comprehensive support including detailed documentation, video tutorials, a knowledge base, and responsive customer service. Our dedicated support team is available via chat and email to assist with any questions or issues you might encounter.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold mb-6 text-gray-900">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">
            Find answers to common questions about Lens and how it can help your business.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-display text-lg font-medium text-gray-900 hover:text-lens-purple transition-colors py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
