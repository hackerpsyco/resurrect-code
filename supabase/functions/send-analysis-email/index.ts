import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, shortReport, fullReport, prUrl, shortFormat } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare email content
    const emailContent = shortFormat ? shortReport : fullReport;
    
    // Generate reply tokens for approve/reject actions
    const replyId = `reply_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const approveToken = btoa(`${replyId}:approve:${Date.now()}`);
    const rejectToken = btoa(`${replyId}:reject:${Date.now()}`);
    
    // Build action URLs
    const baseUrl = Deno.env.get('RESURRECTCI_URL') || 'https://www.innoalaxy.in/';
    const approveUrl = `${baseUrl}/api/email-reply?token=${approveToken}&action=approve`;
    const rejectUrl = `${baseUrl}/api/email-reply?token=${rejectToken}&action=reject`;
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #238636;">🤖 ${subject}</h2>
            
            <div style="background-color: #f6f8fa; padding: 15px; border-radius: 6px; margin: 20px 0; white-space: pre-wrap; font-family: monospace; font-size: 12px;">
${emailContent}
            </div>

            ${prUrl ? `
            <div style="margin: 20px 0;">
              <a href="${prUrl}" style="display: inline-block; background-color: #238636; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
                View Pull Request →
              </a>
            </div>
            ` : ''}

            <div style="margin: 30px 0; padding: 20px; background-color: #f6f8fa; border-radius: 6px; border-left: 4px solid #238636;">
              <p style="margin: 0 0 15px 0; font-weight: bold; color: #333;">
                ✅ Do you want to push these improvements to GitHub?
              </p>
              <div style="display: flex; gap: 10px;">
                <a href="${approveUrl}" style="display: inline-block; background-color: #238636; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  ✅ Yes, Push to GitHub
                </a>
                <a href="${rejectUrl}" style="display: inline-block; background-color: #666; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  ❌ No, Skip
                </a>
              </div>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">
                Click one of the buttons above to confirm your choice
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e1e4e8; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px;">
              This email was sent by ResurrectCI AI Analysis.<br>
              <a href="https://www.innoalaxy.in/" style="color: #238636; text-decoration: none;">Visit ResurrectCI</a>
            </p>
          </div>
        </body>
      </html>
    `;

    // Try to send email using available service
    let emailSent = false;
    let emailError: string | null = null;

    // Try Resend first
    const resendKey = Deno.env.get('RESEND_API_KEY');
    console.log(`🔍 Checking for RESEND_API_KEY: ${resendKey ? '✅ Found' : '❌ Not found'}`);
    
    if (resendKey) {
      try {
        console.log(`📧 Attempting to send via Resend to: ${to}`);
        console.log(`📧 Subject: ${subject}`);
        console.log(`📧 API Key present: ${resendKey.substring(0, 10)}...`);
        
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: to,
            subject: subject,
            html: htmlContent,
          }),
        });

        console.log(`📧 Resend response status: ${resendResponse.status}`);

        if (resendResponse.ok) {
          const resendData = await resendResponse.json();
          console.log('✅ Email sent via Resend:', resendData.id);
          emailSent = true;
        } else {
          const resendError = await resendResponse.json().catch(() => ({}));
          emailError = `Resend error (${resendResponse.status}): ${resendError.message || resendResponse.statusText}`;
          console.error('❌ Resend error:', emailError);
          console.error('❌ Full error response:', resendError);
        }
      } catch (err) {
        emailError = `Resend exception: ${err instanceof Error ? err.message : 'Unknown error'}`;
        console.error('❌ Resend exception:', emailError);
        console.error('❌ Full exception:', err);
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not configured in Supabase Secrets');
    }

    // Try SendGrid if Resend failed
    if (!emailSent) {
      const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
      console.log(`🔍 Checking for SENDGRID_API_KEY: ${sendgridKey ? '✅ Found' : '❌ Not found'}`);
      
      if (sendgridKey) {
        try {
          console.log(`📧 Attempting to send via SendGrid to: ${to}`);
          console.log(`📧 Subject: ${subject}`);
          console.log(`📧 API Key present: ${sendgridKey.substring(0, 10)}...`);
          
          const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sendgridKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: to }] }],
              from: { email: 'noreply@resurrectci.com' },
              subject: subject,
              content: [{ type: 'text/html', value: htmlContent }],
            }),
          });

          console.log(`📧 SendGrid response status: ${sendgridResponse.status}`);

          if (sendgridResponse.ok || sendgridResponse.status === 202) {
            console.log('✅ Email sent via SendGrid');
            emailSent = true;
          } else {
            const sendgridError = await sendgridResponse.json().catch(() => ({}));
            emailError = `SendGrid error (${sendgridResponse.status}): ${sendgridError.errors?.[0]?.message || sendgridResponse.statusText}`;
            console.error('❌ SendGrid error:', emailError);
            console.error('❌ Full error response:', sendgridError);
          }
        } catch (err) {
          emailError = `SendGrid exception: ${err instanceof Error ? err.message : 'Unknown error'}`;
          console.error('❌ SendGrid exception:', emailError);
          console.error('❌ Full exception:', err);
        }
      } else {
        console.log('⚠️ SENDGRID_API_KEY not configured in Supabase Secrets');
      }
    }

    // If no email service is configured, log and return success (for development)
    if (!emailSent && !resendKey && !sendgridKey) {
      console.log(`📧 ⚠️ NO EMAIL SERVICE CONFIGURED`);
      console.log(`📧 Email would be sent to: ${to}`);
      console.log(`📧 Subject: ${subject}`);
      console.log(`📧 Content length: ${emailContent.length}`);
      console.log('📧 ⚠️ To enable email sending:');
      console.log('📧 1. Go to Supabase Dashboard');
      console.log('📧 2. Click Edge Functions → Secrets');
      console.log('📧 3. Add RESEND_API_KEY or SENDGRID_API_KEY');
      console.log('📧 4. Wait 2-3 minutes for deployment');
    }

    // Always return 200 for successful requests, even if email service not configured
    // This allows development mode to work without email service
    const isSuccess = emailSent || (!resendKey && !sendgridKey);
    const statusCode = isSuccess ? 200 : 500;
    
    console.log(`📧 Final response: status=${statusCode}, sent=${emailSent}, success=${isSuccess}`);

    return new Response(
      JSON.stringify({
        success: isSuccess,
        message: emailSent 
          ? "Email sent successfully" 
          : (!resendKey && !sendgridKey)
            ? "Email service not configured (development mode)"
            : `Failed to send email: ${emailError}`,
        to: to,
        subject: subject,
        sent: emailSent,
        error: emailError
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
