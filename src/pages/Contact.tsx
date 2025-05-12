import React from 'react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { motion } from 'framer-motion';
import { MailIcon, PhoneCall, MapPin, MessageSquare, Clock, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  company: z.string().optional(),
  phone: z.string().optional(),
  subject: z.string().min(1, {
    message: "Please select a subject.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
});

const Contact: React.FC = () => {
  // Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real application, you would send the form data to your backend
    console.log(values);
    
    // Show success toast
    toast({
      title: "Message Sent",
      description: "We'll get back to you as soon as possible.",
    });
    
    // Reset form
    form.reset();
  }

  const contactInfo = [
    {
      icon: <MailIcon className="h-6 w-6 text-lens-purple" />,
      title: "Email Us",
      content: "support@lens-app.com",
      link: "mailto:support@lens-app.com"
    },
    {
      icon: <PhoneCall className="h-6 w-6 text-lens-blue" />,
      title: "Call Us",
      content: "+233 20 343 8668",
      link: "tel:+233203438668"
    },
    {
      icon: <MapPin className="h-6 w-6 text-lens-green" />,
      title: "Visit Us",
      content: "Accra, Ghana",
      link: "https://maps.google.com"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-lens-purple/90 to-blue-600/90 text-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1 
              className="font-display text-5xl md:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Get in Touch
            </motion.h1>
            <motion.p 
              className="text-xl mb-8 text-white/90"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Have questions about Lens? Our team is here to help you find the perfect recruitment solution.
            </motion.p>
          </div>
        </div>
      </section>
      
      {/* Contact Info Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {contactInfo.map((item, index) => (
              <motion.a 
                href={item.link}
                key={index}
                className="flex flex-col items-center p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.content}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
      
      {/* Contact Form Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Column - Form */}
            <motion.div 
              id="contact-form"
              className="bg-white p-8 rounded-xl shadow-md"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl font-bold mb-8 text-gray-900">Send Us a Message</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address*</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Your company" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+233 50 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="sales">Sales Question</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="demo">Request a Demo</SelectItem>
                            <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="How can we help you?" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full rounded-full bg-lens-purple hover:bg-lens-purple-light py-6">
                    Send Message
                  </Button>
                </form>
              </Form>
            </motion.div>
            
            {/* Right Column - Additional Info */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div>
                <h2 className="font-display text-3xl font-bold mb-6 text-gray-900">How We Can Help</h2>
                <p className="text-gray-600 mb-8">
                  Our team is ready to answer your questions about Lens and help you find the perfect recruitment solution for your needs.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-purple/10 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-lens-purple" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Product Support</h3>
                    <p className="text-gray-600">Get help with using Lens, troubleshooting issues, or understanding features.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-blue/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-lens-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Sales Inquiries</h3>
                    <p className="text-gray-600">Talk to our sales team about pricing, enterprise plans, or scheduling a demo.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-green/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-lens-green" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Fast Response</h3>
                    <p className="text-gray-600">We aim to respond to all inquiries within 24 hours during business days.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 p-8 bg-gray-100 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Office Hours</h3>
                <p className="text-gray-600 mb-4">Our support team is available 24/7:</p>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Sunday:</span>
                    <span>24 hours (GMT)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email & Phone Support:</span>
                    <span>Always available</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      

      
      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-lens-blue/90 to-lens-purple/90 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-8">Ready to Transform Your Recruitment Process?</h2>
          <p className="text-xl mb-10 text-white/90">
            Join forward-thinking recruiting agencies and HR departments who have already cut their screening time by 80%.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-white text-lens-purple hover:bg-gray-100">
              Get Started Free
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Contact;
