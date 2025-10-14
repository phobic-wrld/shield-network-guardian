
import zxcvbn from 'zxcvbn';

export interface PasswordStrength {
  score: number; // 0-4, where 0 is very weak, 4 is very strong
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTimeDisplay: string;
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const result = zxcvbn(password);
  
  return {
    score: result.score,
    feedback: result.feedback,
    crackTimeDisplay: result.crack_times_display.offline_slow_hashing_1e4_per_second
  };
};

export const generateStrongPassword = (
  length = 16, 
  includeNumbers = true, 
  includeSymbols = true, 
  includeUppercase = true
): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  let chars = lowercase;
  if (includeNumbers) chars += numbers;
  if (includeSymbols) chars += symbols;
  if (includeUppercase) chars += uppercase;
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
};
