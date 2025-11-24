import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailProvider {
  async send(to: string, subject: string, body: string) {
    // TODO(ENV): Implement Resend integration
    // For now, mock the email sending
    if (process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true') {
      console.log(`📧 MOCK EMAIL SENT:`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      return { id: `mock-email-${Date.now()}`, status: 'mocked' };
    }

    // TODO: Implement real Resend integration
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // return await resend.emails.send({
    //   from: 'noreply@celhm.com',
    //   to,
    //   subject,
    //   html: body,
    // });

    throw new Error('Email provider not configured');
  }
}

