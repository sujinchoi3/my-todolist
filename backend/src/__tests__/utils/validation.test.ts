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
