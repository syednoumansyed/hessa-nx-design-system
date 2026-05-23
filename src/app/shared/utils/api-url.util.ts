import { environment } from 'src/environments/environment';

export class ApiUrl {
  // Backend API URLs
  static v1BE = environment.BE_API_BASE_URL + '/v1';
  static v2BE = environment.BE_API_BASE_URL + '/v2';

  // Authentication API URLs (with /auth included)
  static v1Auth = environment.AUTH_API_BASE_URL + '/v1/auth';
  static v2AUTH = environment.AUTH_API_BASE_URL + '/v2/auth';
}
