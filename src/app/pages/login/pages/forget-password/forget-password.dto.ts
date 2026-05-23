export interface IForgetPasswordPayload {
  nationalId: string;
  phoneNumber: string;
  channel: 'sms';
}

export interface IVerifyOtpPayload {
  phoneNumber: string;
  code: string;
  channel: 'sms';
}

export interface ILoginVerifyPayload {
  phoneNumber: string;
  nationalId: string;
  countryCode?: string;
  code: string;
  channel: 'sms';
}
