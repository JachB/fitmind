const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Nieprawidłowy email lub hasło',
  'Email not confirmed': 'Potwierdź email klikając link w wiadomości, którą wysłaliśmy',
  'User already registered': 'Ten email jest już zarejestrowany. Zaloguj się',
  'Password should be at least 6 characters':
    'Hasło musi mieć minimum 6 znaków',
  'Signup requires a valid password': 'Podaj prawidłowe hasło',
  'Unable to validate email address: invalid format':
    'Nieprawidłowy adres email',
  'Email rate limit exceeded':
    'Za dużo prób. Spróbuj ponownie za kilka minut',
  'For security purposes, you can only request this after':
    'Za dużo prób. Spróbuj ponownie za chwilę',
  'Email address is invalid': 'Nieprawidłowy adres email',
  'is invalid': 'Nieprawidłowy adres email',
  'email_address_invalid': 'Nieprawidłowy adres email',
  'over_email_send_rate_limit':
    'Przekroczono limit maili. Spróbuj ponownie za chwilę',
  'weak_password': 'Hasło jest zbyt słabe. Użyj min. 6 znaków',
  'email_exists': 'Ten email jest już zarejestrowany. Zaloguj się',
  'user_already_exists': 'Ten email jest już zarejestrowany. Zaloguj się',
}

export function translateAuthError(message: string | undefined): string {
  if (!message) return 'Coś poszło nie tak. Spróbuj ponownie'
  for (const [en, pl] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(en.toLowerCase())) return pl
  }
  return message
}
