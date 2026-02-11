import { validateSignup, validateLogin } from '../../utils/validation';

describe('validateSignup', () => {
  const validArgs = {
    email: 'test@example.com',
    password: 'pass1234',
    name: '김지수',
  };

  it('should return empty array for valid input', () => {
    const errors = validateSignup(validArgs.email, validArgs.password, validArgs.name);
    expect(errors).toHaveLength(0);
  });

  it('should fail for invalid email format', () => {
    const errors = validateSignup('not-an-email', validArgs.password, validArgs.name);
    expect(errors.some((e) => e.field === 'email')).toBe(true);
  });

  it('should fail when email is missing', () => {
    const errors = validateSignup(undefined, validArgs.password, validArgs.name);
    expect(errors.some((e) => e.field === 'email')).toBe(true);
  });

  it('should fail when password is too short', () => {
    const errors = validateSignup(validArgs.email, 'abc123', validArgs.name);
    expect(errors.some((e) => e.field === 'password')).toBe(true);
  });

  it('should fail when password has no digits', () => {
    const errors = validateSignup(validArgs.email, 'abcdefgh', validArgs.name);
    expect(errors.some((e) => e.field === 'password')).toBe(true);
  });

  it('should fail when password has no letters', () => {
    const errors = validateSignup(validArgs.email, '12345678', validArgs.name);
    expect(errors.some((e) => e.field === 'password')).toBe(true);
  });

  it('should fail when name is empty string', () => {
    const errors = validateSignup(validArgs.email, validArgs.password, '   ');
    expect(errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('should fail when name is missing', () => {
    const errors = validateSignup(validArgs.email, validArgs.password, undefined);
    expect(errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('should return multiple errors for multiple invalid fields', () => {
    const errors = validateSignup('bad', 'bad', '');
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('validateLogin', () => {
  it('should return empty array for valid input', () => {
    const errors = validateLogin('test@example.com', 'pass1234');
    expect(errors).toHaveLength(0);
  });

  it('should fail for invalid email', () => {
    const errors = validateLogin('not-email', 'pass1234');
    expect(errors.some((e) => e.field === 'email')).toBe(true);
  });

  it('should fail for empty password', () => {
    const errors = validateLogin('test@example.com', '');
    expect(errors.some((e) => e.field === 'password')).toBe(true);
  });

  it('should fail when password is missing', () => {
    const errors = validateLogin('test@example.com', undefined);
    expect(errors.some((e) => e.field === 'password')).toBe(true);
  });
});

describe('validateCreateTodo', () => {
  const { validateCreateTodo } = require('../../utils/validation');

  it('should pass for valid input', () => {
    expect(validateCreateTodo('제목', '2026-02-20', '설명')).toHaveLength(0);
  });

  it('should pass when description is omitted', () => {
    expect(validateCreateTodo('제목', '2026-02-20')).toHaveLength(0);
  });

  it('should pass when description is null', () => {
    expect(validateCreateTodo('제목', '2026-02-20', null)).toHaveLength(0);
  });

  it('should fail when title is empty string', () => {
    const errors = validateCreateTodo('', '2026-02-20');
    expect(errors.some((e: any) => e.field === 'title')).toBe(true);
  });

  it('should fail when title exceeds 255 characters', () => {
    const errors = validateCreateTodo('a'.repeat(256), '2026-02-20');
    expect(errors.some((e: any) => e.field === 'title')).toBe(true);
  });

  it('should fail when due_date is invalid format', () => {
    const errors = validateCreateTodo('제목', '20260220');
    expect(errors.some((e: any) => e.field === 'due_date')).toBe(true);
  });

  it('should fail when due_date is not a real date', () => {
    const errors = validateCreateTodo('제목', '2026-13-01');
    expect(errors.some((e: any) => e.field === 'due_date')).toBe(true);
  });

  it('should fail when description exceeds 1000 characters', () => {
    const errors = validateCreateTodo('제목', '2026-02-20', 'a'.repeat(1001));
    expect(errors.some((e: any) => e.field === 'description')).toBe(true);
  });
});

describe('validateUpdateTodo', () => {
  const { validateUpdateTodo } = require('../../utils/validation');

  it('should pass for valid full input', () => {
    expect(validateUpdateTodo('제목', '2026-02-20', '설명', 'completed')).toHaveLength(0);
  });

  it('should pass when status is omitted', () => {
    expect(validateUpdateTodo('제목', '2026-02-20')).toHaveLength(0);
  });

  it('should fail when title is missing', () => {
    const errors = validateUpdateTodo(undefined, '2026-02-20');
    expect(errors.some((e: any) => e.field === 'title')).toBe(true);
  });

  it('should fail when due_date is invalid', () => {
    const errors = validateUpdateTodo('제목', 'invalid');
    expect(errors.some((e: any) => e.field === 'due_date')).toBe(true);
  });

  it('should fail when status is invalid value', () => {
    const errors = validateUpdateTodo('제목', '2026-02-20', undefined, 'invalid_status');
    expect(errors.some((e: any) => e.field === 'status')).toBe(true);
  });
});
