
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import ConsultationForm from '@/components/Consultations/ConsultationForm';
import ConsultationList from '@/components/Consultations/ConsultationList';

const Consultations: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('book');

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight">Consultations</h1>
        <p className="text-muted-foreground mt-1">Book a consultation with a healthcare professional</p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="book">Book a Consultation</TabsTrigger>
            <TabsTrigger value="upcoming">My Consultations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="book" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Book a Consultation</CardTitle>
                <CardDescription>
                  Fill out the form below to schedule a consultation with a healthcare professional.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConsultationForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Consultations</CardTitle>
                <CardDescription>
                  View your upcoming and past consultations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConsultationList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Consultations;
