interface ValidationError {
  field: string;
  message: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(
  email: unknown,
  password: unknown,
  name: unknown
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    errors.push({ field: 'email', message: '이메일 형식이 올바르지 않습니다.' });
  }

  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    !/[a-zA-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    errors.push({
      field: 'password',
      message: '비밀번호는 최소 8자이며 영문과 숫자를 혼용해야 합니다.',
    });
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: '이름은 필수 입력 항목입니다.' });
  }

  return errors;
}

export function validateLogin(
  email: unknown,
  password: unknown
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    errors.push({ field: 'email', message: '이메일 형식이 올바르지 않습니다.' });
  }

  if (typeof password !== 'string' || password.length === 0) {
    errors.push({ field: 'password', message: '비밀번호는 필수 입력 항목입니다.' });
  }

  return errors;
}
