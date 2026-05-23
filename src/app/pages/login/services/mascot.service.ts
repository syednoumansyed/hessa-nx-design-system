import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserType } from '@shared/enums';

export enum MascotSituation {
  WELCOME = 'welcome',
  INSTRUCTION = 'instruction',
  WAITING = 'waiting',
  ERROR = 'error',
  SUCCESS = 'success',
  THINKING = 'thinking',
  CONFUSED = 'confused',
  WARNING = 'warning',
  DEFAULT = 'default',
}

export enum MascotContext {
  LANGUAGE_SELECTION = 'language_selection',
  ROLE_SELECTION = 'role_selection',
  METHOD_SELECTION = 'method_selection',
  OTP_ENTRY = 'otp_entry',
  OTP_ERROR = 'otp_error',
  PASSWORD_ENTRY = 'password_entry',
  PASSWORD_ERROR = 'password_error',
  ACCOUNT_SELECTION = 'account_selection',
  NAME_VERIFICATION = 'name_verification',
  MOBILE_ENTRY = 'mobile_entry',
  SETUP_PASSWORD = 'setup_password',
  LOGIN_SUCCESS = 'login_success',
  CONTACT_ADMIN = 'contact_admin',
  METHOD_SELECTION_OTP = 'method_selection_otp',
  METHOD_SELECTION_PASSWORD = 'method_selection_password',
  METHOD_SELECTION_SETUP = 'method_selection_setup',
}

export interface MascotConfig {
  userType: UserType;
  situation: MascotSituation;
  context?: MascotContext;
  message: string;
  subMessage?: string;
  messageParams?: Record<string, any>; // Parameters for translation
  subMessageParams?: Record<string, any>; // Parameters for sub-message translation
}

export type MascotMood = 'neutral' | 'info' | 'happy' | 'error';
export interface MascotState {
  message?: string;
  situation: MascotSituation; // your existing enum
  imagePath: string;
  animate?: boolean;
  context?: MascotContext; // <-- ensure this is present
}

const DEFAULT: MascotState = {
  situation: MascotSituation.DEFAULT,
  imagePath: 'assets/mascot/neutral.png',
  message: undefined,
  animate: false,
};

@Injectable({
  providedIn: 'root',
})
export class MascotService {
  private mascotConfigSubject = new BehaviorSubject<MascotConfig>({
    userType: UserType.STUDENT,
    situation: MascotSituation.WELCOME,
    message: "Welcome! Let's get started.",
  });

  public mascotConfig$ = this.mascotConfigSubject.asObservable();

  private readonly assetBasePath = 'assets/mascot';

  private _state = new BehaviorSubject<MascotState>(DEFAULT);
  readonly state$ = this._state.asObservable();

  set(partial: Partial<MascotState>) {
    this._state.next({ ...this._state.value, ...partial });
  }

  reset() {
    this._state.next(DEFAULT);
  }

  // Predefined mascot configurations for different scenarios
  private readonly mascotConfigurations: Record<string, Partial<MascotConfig>> =
    {
      // Language Selection
      language_selection: {
        situation: MascotSituation.INSTRUCTION,
        context: MascotContext.LANGUAGE_SELECTION,
        message: 'global.choose_language.txt',
      },

      // Role Selection
      role_selection: {
        situation: MascotSituation.INSTRUCTION,
        context: MascotContext.ROLE_SELECTION,
        message: 'login.choose_role.txt',
      },

      // Method Selection
      method_selection: {
        situation: MascotSituation.INSTRUCTION,
        context: MascotContext.METHOD_SELECTION,
        message: 'login.choose_login_type.title',
      },

      // OTP Flow
      otp_entry: {
        situation: MascotSituation.INSTRUCTION,
        context: MascotContext.OTP_ENTRY,
        message: 'login.enter_otp_sent.title',
      },

      otp_error: {
        situation: MascotSituation.ERROR,
        context: MascotContext.OTP_ERROR,
        message: 'login.enter_correct_otp.title',
      },

      // Password Flow
      password_entry: {
        situation: MascotSituation.INSTRUCTION,
        context: MascotContext.PASSWORD_ENTRY,
        message: 'login.enter_national_id.title',
      },

      password_error: {
        situation: MascotSituation.ERROR,
        context: MascotContext.PASSWORD_ERROR,
        message: 'login.enter_correct_password.txt',
      },

      mobile_entry_student: {
        situation: MascotSituation.INSTRUCTION,
        context: MascotContext.MOBILE_ENTRY,
        message: 'login.enter_mobile_number_title.title',
      },

      mobile_entry_guardian: {
        situation: MascotSituation.INSTRUCTION,
        context: MascotContext.MOBILE_ENTRY,
        message: 'login.enter_mobile_number_title.title',
      },

      setup_password: {
        situation: MascotSituation.INSTRUCTION,
        context: MascotContext.SETUP_PASSWORD,
        message: 'login.add_password.title',
      },

      // Account Selection
      account_selection: {
        situation: MascotSituation.INSTRUCTION,
        context: MascotContext.ACCOUNT_SELECTION,
        message: 'login.select_account_to_proceed.title',
      },

      // Name Verification
      name_verification: {
        situation: MascotSituation.INSTRUCTION,
        context: MascotContext.NAME_VERIFICATION,
        message: 'login.verify_first_name.title',
        subMessage: 'login.verify_first_name.txt',
      },

      // Success States
      login_success: {
        situation: MascotSituation.SUCCESS,
        context: MascotContext.LOGIN_SUCCESS,
        message: 'global.successful.title',
      },

      // Contact Admin
      contact_admin: {
        situation: MascotSituation.WARNING,
        context: MascotContext.CONTACT_ADMIN,
        message: 'Please contact school admin for help',
      },
    };

  constructor() {}

  /**
   * Update mascot configuration
   */
  updateMascot(config: Partial<MascotConfig>): void {
    const currentConfig = this.mascotConfigSubject.value;
    const newConfig: MascotConfig = {
      ...currentConfig,
      ...config,
    };
    this.mascotConfigSubject.next(newConfig);
  }

  /**
   * Update mascot using predefined configuration
   */
  updateMascotByScenario(
    scenario: string,
    userType?: UserType,
    messageParams?: Record<string, any>,
  ): void {
    const predefinedConfig = this.mascotConfigurations[scenario];
    if (!predefinedConfig) {
      // Silently ignore unknown scenarios to avoid breaking the user flow.
      return;
    }

    const message = predefinedConfig.message || '';
    const subMessage = predefinedConfig.subMessage || '';

    const currentConfig = this.mascotConfigSubject.value;
    const newConfig: MascotConfig = {
      ...currentConfig,
      ...predefinedConfig,
      message,
      subMessage,
      messageParams: messageParams || {},
      subMessageParams: messageParams || {}, // Use same params for both messages
      ...(userType && { userType }),
    };

    this.mascotConfigSubject.next(newConfig);
  }

  /**
   * Get mascot image path based on current configuration
   */
  getMascotImagePath(): string {
    const config = this.mascotConfigSubject.value;
    const contextSuffix = config.context ? `-${config.context}` : '';
    // Image assets follow the pattern <userType>/<situation>-<context>.svg.
    return `${this.assetBasePath}/${config.userType.toLowerCase()}/${config.situation.toLowerCase()}${contextSuffix}.svg`;
  }

  /**
   * Get current mascot message
   */
  getCurrentMessage(): string {
    return this.mascotConfigSubject.value.message;
  }

  /**
   * Get current user type
   */
  getCurrentUserType(): UserType {
    return this.mascotConfigSubject.value.userType;
  }

  /**
   * Set user type and update mascot accordingly
   */
  setUserType(userType: UserType): void {
    this.updateMascot({ userType });
  }
}
