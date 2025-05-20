import { supabase } from '@/integrations/supabase/client';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Sends an email using the Supabase Edge Function
 */
export const sendEmail = async ({ 
  to, 
  subject, 
  html, 
  from = 'onboarding@resend.dev' 
}: SendEmailParams) => {
  try {
    console.log('--------- EMAIL SENDING PROCESS STARTED ---------');
    console.log('Email params:', { to, subject, from });
    
    // Get auth credentials to make the Edge Function call more secure
    const { data: authData } = await supabase.auth.getSession();
    const accessToken = authData.session?.access_token;
    console.log('Auth token available:', !!accessToken);
    
    // Prepare request payload
    const payload = {
      from,
      to,
      subject,
      html,
    };
    console.log('Request payload prepared:', payload);
    
    // Prepare headers with or without auth token
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token is available
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      // Use the anon key if no token available (public access)
      headers['apikey'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVveGdwZHRyc3pzd25waWxrem1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MzMzNjIsImV4cCI6MjA2MzMwOTM2Mn0.C_si0YkeXKs9WguqOwCa291Lbg_1Fp4VKIHq8aRJ1nE';
    }
    
    const edgeFunctionUrl = 'https://eoxgpdtrszswnpilkzma.supabase.co/functions/v1/swift-action';
    console.log('Sending request to Edge Function:', edgeFunctionUrl);
    console.log('With headers:', headers);
    
    // Call the Supabase Edge Function for sending emails
    console.log('Attempting to fetch Edge Function...');
    const response = await fetch(
      edgeFunctionUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }
    );
    
    console.log('Edge Function response status:', response.status);
    console.log('Edge Function response received, parsing JSON...');
    
    const data = await response.json();
    console.log('Edge Function response data:', data);
    
    if (!response.ok) {
      console.error('Edge Function returned error status:', response.status);
      throw new Error(data.error || 'Failed to send email');
    }
    
    console.log('Email sent successfully via Edge Function:', data);
    console.log('--------- EMAIL SENDING PROCESS COMPLETED ---------');
    return { success: true, data };
  } catch (error) {
    console.error('--------- EMAIL SENDING PROCESS FAILED ---------');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    return { success: false, error };
  }
};

/**
 * Sends a consultation confirmation email to a patient
 */
export const sendConsultationConfirmationEmail = async (
  patientEmail: string,
  patientName: string,
  consultationDate: string,
  consultationTime: string,
  consultationType: string
) => {
  const subject = 'Your Consultation Request has been Confirmed';
  const from = 'onboarding@resend.dev'; // Use Resend's verified sender address
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #7e5fea; margin-bottom: 10px;">eDok Health</h1>
        <p style="color: #666; font-size: 16px;">Your healthcare partner</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333;">Your Consultation is Confirmed!</h2>
        <p style="color: #666; line-height: 1.5;">
          Hello ${patientName},
        </p>
        <p style="color: #666; line-height: 1.5;">
          We're pleased to inform you that your consultation request has been confirmed. Below are the details of your upcoming appointment:
        </p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
        <div style="margin-bottom: 15px;">
          <p style="margin: 0; color: #666; font-size: 14px;">Date</p>
          <p style="margin: 5px 0 0; color: #333; font-size: 16px; font-weight: bold;">${consultationDate}</p>
        </div>
        <div style="margin-bottom: 15px;">
          <p style="margin: 0; color: #666; font-size: 14px;">Time</p>
          <p style="margin: 5px 0 0; color: #333; font-size: 16px; font-weight: bold;">${consultationTime}</p>
        </div>
        <div style="margin-bottom: 15px;">
          <p style="margin: 0; color: #666; font-size: 14px;">Type</p>
          <p style="margin: 5px 0 0; color: #333; font-size: 16px; font-weight: bold;">${consultationType.replace('_', ' ')}</p>
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <p style="color: #666; line-height: 1.5;">
          If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.
        </p>
        <p style="color: #666; line-height: 1.5;">
          For any questions or concerns, please don't hesitate to reach out to our support team at support@edok.health.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #999; font-size: 14px;">
          © ${new Date().getFullYear()} eDok Health. All rights reserved.
        </p>
        <p style="color: #999; font-size: 12px;">
          This is an automated email, please do not reply directly to this message.
        </p>
      </div>
    </div>
  `;
  
  return await sendEmail({
    to: patientEmail,
    from,
    subject,
    html
  });
};
