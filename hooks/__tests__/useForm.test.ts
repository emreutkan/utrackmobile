import { renderHook, act } from '@testing-library/react-native';
import { useForm, FormValidators } from '../useForm';

describe('useForm', () => {
    interface FormValues {
        email: string;
        password: string;
    }

    const initialValues: FormValues = {
        email: '',
        password: ''
    };

    it('should initialize with provided values', () => {
        const { result } = renderHook(() => useForm(initialValues));

        expect(result.current.values).toEqual(initialValues);
        expect(result.current.errors).toEqual({});
        expect(result.current.touched).toEqual({});
        expect(result.current.isSubmitting).toBe(false);
    });

    it('should update field value', () => {
        const { result } = renderHook(() => useForm(initialValues));

        act(() => {
            result.current.setValue('email', 'test@example.com');
        });

        expect(result.current.values.email).toBe('test@example.com');
    });

    it('should update multiple values', () => {
        const { result } = renderHook(() => useForm(initialValues));

        act(() => {
            result.current.setValues({
                email: 'test@example.com',
                password: 'password123'
            });
        });

        expect(result.current.values).toEqual({
            email: 'test@example.com',
            password: 'password123'
        });
    });

    it('should mark field as touched', () => {
        const { result } = renderHook(() => useForm(initialValues));

        act(() => {
            result.current.setTouched('email');
        });

        expect(result.current.touched.email).toBe(true);
    });

    it('should validate on change when enabled', async () => {
        const validationSchema = {
            email: (value: string) => (!value ? 'Required' : null)
        };

        const { result } = renderHook(() =>
            useForm(initialValues, {
                validationSchema,
                validateOnChange: true
            })
        );

        await act(async () => {
            result.current.setValue('email', '');
            // Wait for validation timeout
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        expect(result.current.errors.email).toBe('Required');
    });

    it('should validate on blur when enabled', () => {
        const validationSchema = {
            email: (value: string) => (!value ? 'Required' : null)
        };

        const { result } = renderHook(() =>
            useForm(initialValues, {
                validationSchema,
                validateOnBlur: true
            })
        );

        act(() => {
            result.current.setTouched('email', true);
        });

        expect(result.current.errors.email).toBe('Required');
    });

    it('should validate all fields', () => {
        const validationSchema = {
            email: (value: string) => (!value ? 'Email required' : null),
            password: (value: string) => (!value ? 'Password required' : null)
        };

        const { result } = renderHook(() =>
            useForm(initialValues, { validationSchema })
        );

        let isValid: boolean;
        act(() => {
            isValid = result.current.validate();
        });

        expect(isValid!).toBe(false);
        expect(result.current.errors.email).toBe('Email required');
        expect(result.current.errors.password).toBe('Password required');
    });

    it('should return true when valid', () => {
        const validationSchema = {
            email: (value: string) => (!value ? 'Required' : null)
        };

        const { result } = renderHook(() =>
            useForm({ email: 'test@example.com' }, { validationSchema })
        );

        expect(result.current.isValid).toBe(true);
    });

    it('should handle form submission', async () => {
        const onSubmit = jest.fn();
        const { result } = renderHook(() =>
            useForm({ email: 'test@example.com' }, { onSubmit })
        );

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should not submit when invalid', async () => {
        const onSubmit = jest.fn();
        const validationSchema = {
            email: (value: string) => (!value ? 'Required' : null)
        };

        const { result } = renderHook(() =>
            useForm(initialValues, { validationSchema, onSubmit })
        );

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should set isSubmitting during submission', async () => {
        let resolveSubmit: () => void;
        const onSubmit = jest.fn().mockImplementation(
            () => new Promise<void>(resolve => { resolveSubmit = resolve; })
        );

        const { result } = renderHook(() =>
            useForm({ email: 'test@example.com' }, { onSubmit })
        );

        const submitPromise = act(async () => {
            result.current.handleSubmit();
        });

        // Check isSubmitting is true during submission
        expect(result.current.isSubmitting).toBe(true);

        await act(async () => {
            resolveSubmit!();
        });

        await submitPromise;

        expect(result.current.isSubmitting).toBe(false);
    });

    it('should reset form', () => {
        const { result } = renderHook(() => useForm(initialValues));

        act(() => {
            result.current.setValue('email', 'test@example.com');
            result.current.setTouched('email');
            result.current.setError('email', 'Some error');
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.values).toEqual(initialValues);
        expect(result.current.errors).toEqual({});
        expect(result.current.touched).toEqual({});
    });

    it('should reset to new initial values', () => {
        const { result } = renderHook(() => useForm(initialValues));

        act(() => {
            result.current.reset({ email: 'new@example.com', password: '' });
        });

        expect(result.current.values.email).toBe('new@example.com');
    });

    it('should track dirty state', () => {
        const { result } = renderHook(() => useForm(initialValues));

        expect(result.current.isDirty).toBe(false);

        act(() => {
            result.current.setValue('email', 'changed');
        });

        expect(result.current.isDirty).toBe(true);
    });

    it('should provide field props helper', () => {
        const { result } = renderHook(() => useForm(initialValues));

        const fieldProps = result.current.getFieldProps('email');

        expect(fieldProps).toHaveProperty('value');
        expect(fieldProps).toHaveProperty('onChangeText');
        expect(fieldProps).toHaveProperty('onBlur');
        expect(typeof fieldProps.onChangeText).toBe('function');
        expect(typeof fieldProps.onBlur).toBe('function');
    });

    it('should allow setting manual errors', () => {
        const { result } = renderHook(() => useForm(initialValues));

        act(() => {
            result.current.setError('email', 'Server error');
        });

        expect(result.current.errors.email).toBe('Server error');
    });

    it('should clear all errors', () => {
        const { result } = renderHook(() => useForm(initialValues));

        act(() => {
            result.current.setErrors({
                email: 'Error 1',
                password: 'Error 2'
            });
        });

        act(() => {
            result.current.clearErrors();
        });

        expect(result.current.errors).toEqual({});
    });
});

describe('FormValidators', () => {
    describe('required', () => {
        it('should return error for empty value', () => {
            const validator = FormValidators.required();
            expect(validator('')).toBe('This field is required');
        });

        it('should return null for non-empty value', () => {
            const validator = FormValidators.required();
            expect(validator('value')).toBeNull();
        });

        it('should use custom message', () => {
            const validator = FormValidators.required('Custom message');
            expect(validator('')).toBe('Custom message');
        });
    });

    describe('minLength', () => {
        it('should return error for short value', () => {
            const validator = FormValidators.minLength(5);
            expect(validator('abc')).toBe('Must be at least 5 characters');
        });

        it('should return null for valid length', () => {
            const validator = FormValidators.minLength(5);
            expect(validator('abcdef')).toBeNull();
        });
    });

    describe('maxLength', () => {
        it('should return error for long value', () => {
            const validator = FormValidators.maxLength(5);
            expect(validator('abcdefgh')).toBe('Must be at most 5 characters');
        });

        it('should return null for valid length', () => {
            const validator = FormValidators.maxLength(5);
            expect(validator('abc')).toBeNull();
        });
    });

    describe('email', () => {
        it('should return error for invalid email', () => {
            const validator = FormValidators.email();
            expect(validator('invalid')).toBe('Invalid email address');
        });

        it('should return null for valid email', () => {
            const validator = FormValidators.email();
            expect(validator('test@example.com')).toBeNull();
        });
    });

    describe('min', () => {
        it('should return error for value below minimum', () => {
            const validator = FormValidators.min(10);
            expect(validator(5)).toBe('Must be at least 10');
        });

        it('should return null for valid value', () => {
            const validator = FormValidators.min(10);
            expect(validator(15)).toBeNull();
        });

        it('should handle string values', () => {
            const validator = FormValidators.min(10);
            expect(validator('5')).toBe('Must be at least 10');
        });
    });

    describe('max', () => {
        it('should return error for value above maximum', () => {
            const validator = FormValidators.max(10);
            expect(validator(15)).toBe('Must be at most 10');
        });

        it('should return null for valid value', () => {
            const validator = FormValidators.max(10);
            expect(validator(5)).toBeNull();
        });
    });

    describe('numeric', () => {
        it('should return error for non-numeric value', () => {
            const validator = FormValidators.numeric();
            expect(validator('abc')).toBe('Must be a number');
        });

        it('should return null for numeric value', () => {
            const validator = FormValidators.numeric();
            expect(validator('123')).toBeNull();
        });
    });

    describe('integer', () => {
        it('should return error for decimal value', () => {
            const validator = FormValidators.integer();
            expect(validator('123.45')).toBe('Must be a whole number');
        });

        it('should return null for integer value', () => {
            const validator = FormValidators.integer();
            expect(validator('123')).toBeNull();
        });
    });

    describe('pattern', () => {
        it('should return error for non-matching value', () => {
            const validator = FormValidators.pattern(/^\d+$/);
            expect(validator('abc')).toBe('Invalid format');
        });

        it('should return null for matching value', () => {
            const validator = FormValidators.pattern(/^\d+$/);
            expect(validator('123')).toBeNull();
        });
    });
});
