export interface IForgetPasswordPayload {
  email: string;
}

export interface ILoginVerifyPayload {
  otp: string;
  email: string;
}
