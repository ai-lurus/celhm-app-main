import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsProvider {
  async send(to: string, body: string) {
    // TODO(ENV): Implement Twilio integration
    // For now, mock the SMS sending
    if (process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true') {
      console.log(`📱 MOCK SMS SENT:`);
      console.log(`To: ${to}`);
      console.log(`Body: ${body}`);
      return { id: `mock-sms-${Date.now()}`, status: 'mocked' };
    }

    // TODO: Implement real Twilio integration
    // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // return await client.messages.create({
    //   body,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to,
    // });

    throw new Error('SMS provider not configured');
  }
}

