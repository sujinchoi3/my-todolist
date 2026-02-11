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

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateCreateTodo(
  title: unknown,
  due_date: unknown,
  description?: unknown
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: '제목은 필수 입력 항목입니다.' });
  } else if (title.length > 255) {
    errors.push({ field: 'title', message: '제목은 1자 이상 255자 이하이어야 합니다.' });
  }

  if (typeof due_date !== 'string' || !DATE_REGEX.test(due_date) || isNaN(new Date(due_date).getTime())) {
    errors.push({ field: 'due_date', message: '마감일은 YYYY-MM-DD 형식이어야 합니다.' });
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string' || description.length > 1000) {
      errors.push({ field: 'description', message: '설명은 최대 1000자까지 입력할 수 있습니다.' });
    }
  }

  return errors;
}
