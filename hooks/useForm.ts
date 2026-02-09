import { useCallback, useMemo, useState } from 'react';

export type ValidationRule<T> = (value: any, values: T) => string | null;

export type ValidationSchema<T> = {
    [K in keyof T]?: ValidationRule<T> | ValidationRule<T>[];
};

export interface UseFormOptions<T> {
    /** Validation schema */
    validationSchema?: ValidationSchema<T>;
    /** Whether to validate on change */
    validateOnChange?: boolean;
    /** Whether to validate on blur */
    validateOnBlur?: boolean;
    /** Callback when form is submitted successfully */
    onSubmit?: (values: T) => Promise<void> | void;
}

export interface UseFormResult<T> {
    /** Current form values */
    values: T;
    /** Validation errors by field */
    errors: Partial<Record<keyof T, string>>;
    /** Which fields have been touched */
    touched: Partial<Record<keyof T, boolean>>;
    /** Whether all fields are valid */
    isValid: boolean;
    /** Whether form is currently submitting */
    isSubmitting: boolean;
    /** Whether form has been modified */
    isDirty: boolean;
    /** Set a single field value */
    setValue: (field: keyof T, value: any) => void;
    /** Set multiple field values */
    setValues: (values: Partial<T>) => void;
    /** Set error for a field */
    setError: (field: keyof T, error: string | null) => void;
    /** Set multiple errors */
    setErrors: (errors: Partial<Record<keyof T, string>>) => void;
    /** Mark a field as touched */
    setTouched: (field: keyof T, touched?: boolean) => void;
    /** Validate all fields */
    validate: () => boolean;
    /** Validate a single field */
    validateField: (field: keyof T) => string | null;
    /** Handle form submission */
    handleSubmit: (onSubmit?: (values: T) => Promise<void> | void) => Promise<void>;
    /** Reset form to initial values */
    reset: (newInitialValues?: T) => void;
    /** Clear all errors */
    clearErrors: () => void;
    /** Get props for an input field */
    getFieldProps: (field: keyof T) => {
        value: any;
        onChangeText: (text: string) => void;
        onBlur: () => void;
    };
}

/**
 * Custom hook for form state management with validation
 *
 * @param initialValues - Initial form values
 * @param options - Form options including validation schema
 * @returns Form state and control functions
 *
 * @example
 * ```tsx
 * const form = useForm(
 *     { email: '', password: '' },
 *     {
 *         validationSchema: {
 *             email: (value) => !value ? 'Required' : null,
 *             password: (value) => value.length < 8 ? 'Too short' : null
 *         }
 *     }
 * );
 *
 * <TextInput
 *     value={form.values.email}
 *     onChangeText={(text) => form.setValue('email', text)}
 *     onBlur={() => form.setTouched('email')}
 * />
 * {form.touched.email && form.errors.email && (
 *     <Text style={styles.error}>{form.errors.email}</Text>
 * )}
 *
 * <Button
 *     onPress={() => form.handleSubmit(async (values) => {
 *         await login(values);
 *     })}
 *     disabled={!form.isValid || form.isSubmitting}
 * />
 * ```
 */
export function useForm<T extends Record<string, any>>(
    initialValues: T,
    options: UseFormOptions<T> = {}
): UseFormResult<T> {
    const {
        validationSchema,
        validateOnChange = true,
        validateOnBlur = true,
        onSubmit
    } = options;

    const [values, setValuesState] = useState<T>(initialValues);
    const [errors, setErrorsState] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialValuesRef] = useState(initialValues);

    const isDirty = useMemo(() => {
        return Object.keys(values).some(
            key => values[key as keyof T] !== initialValuesRef[key as keyof T]
        );
    }, [values, initialValuesRef]);

    const validateField = useCallback(
        (field: keyof T): string | null => {
            if (!validationSchema || !validationSchema[field]) {
                return null;
            }

            const rules = validationSchema[field];
            const rulesArray = Array.isArray(rules) ? rules : [rules];

            for (const rule of rulesArray) {
                if (rule) {
                    const error = rule(values[field], values);
                    if (error) {
                        return error;
                    }
                }
            }

            return null;
        },
        [validationSchema, values]
    );

    const validate = useCallback((): boolean => {
        if (!validationSchema) return true;

        const newErrors: Partial<Record<keyof T, string>> = {};
        let isValid = true;

        Object.keys(validationSchema).forEach(field => {
            const error = validateField(field as keyof T);
            if (error) {
                newErrors[field as keyof T] = error;
                isValid = false;
            }
        });

        setErrorsState(newErrors);
        return isValid;
    }, [validationSchema, validateField]);

    const isValid = useMemo(() => {
        if (!validationSchema) return true;

        return Object.keys(validationSchema).every(field => {
            const error = validateField(field as keyof T);
            return !error;
        });
    }, [validationSchema, validateField]);

    const setValue = useCallback(
        (field: keyof T, value: any) => {
            setValuesState(prev => ({ ...prev, [field]: value }));

            if (validateOnChange) {
                // Validate after state update
                setTimeout(() => {
                    const error = validateField(field);
                    setErrorsState(prev => ({
                        ...prev,
                        [field]: error || undefined
                    }));
                }, 0);
            }
        },
        [validateOnChange, validateField]
    );

    const setValues = useCallback((newValues: Partial<T>) => {
        setValuesState(prev => ({ ...prev, ...newValues }));
    }, []);

    const setError = useCallback((field: keyof T, error: string | null) => {
        setErrorsState(prev => ({
            ...prev,
            [field]: error || undefined
        }));
    }, []);

    const setErrors = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
        setErrorsState(newErrors);
    }, []);

    const setTouched = useCallback(
        (field: keyof T, isTouched: boolean = true) => {
            setTouchedState(prev => ({ ...prev, [field]: isTouched }));

            if (validateOnBlur && isTouched) {
                const error = validateField(field);
                setErrorsState(prev => ({
                    ...prev,
                    [field]: error || undefined
                }));
            }
        },
        [validateOnBlur, validateField]
    );

    const handleSubmit = useCallback(
        async (submitHandler?: (values: T) => Promise<void> | void) => {
            // Mark all fields as touched
            const allTouched = Object.keys(values).reduce(
                (acc, key) => ({ ...acc, [key]: true }),
                {} as Record<keyof T, boolean>
            );
            setTouchedState(allTouched);

            // Validate all fields
            const isFormValid = validate();

            if (!isFormValid) {
                return;
            }

            setIsSubmitting(true);

            try {
                const handler = submitHandler || onSubmit;
                if (handler) {
                    await handler(values);
                }
            } finally {
                setIsSubmitting(false);
            }
        },
        [values, validate, onSubmit]
    );

    const reset = useCallback(
        (newInitialValues?: T) => {
            const resetValues = newInitialValues || initialValuesRef;
            setValuesState(resetValues);
            setErrorsState({});
            setTouchedState({});
            setIsSubmitting(false);
        },
        [initialValuesRef]
    );

    const clearErrors = useCallback(() => {
        setErrorsState({});
    }, []);

    const getFieldProps = useCallback(
        (field: keyof T) => ({
            value: values[field]?.toString() ?? '',
            onChangeText: (text: string) => setValue(field, text),
            onBlur: () => setTouched(field, true)
        }),
        [values, setValue, setTouched]
    );

    return {
        values,
        errors,
        touched,
        isValid,
        isSubmitting,
        isDirty,
        setValue,
        setValues,
        setError,
        setErrors,
        setTouched,
        validate,
        validateField,
        handleSubmit,
        reset,
        clearErrors,
        getFieldProps
    };
}

// Common validation rules
export const FormValidators = {
    required: (message = 'This field is required') =>
        (value: any) => (!value || (typeof value === 'string' && !value.trim()) ? message : null),

    minLength: (length: number, message?: string) =>
        (value: string) =>
            value && value.length < length
                ? message || `Must be at least ${length} characters`
                : null,

    maxLength: (length: number, message?: string) =>
        (value: string) =>
            value && value.length > length
                ? message || `Must be at most ${length} characters`
                : null,

    email: (message = 'Invalid email address') =>
        (value: string) => {
            if (!value) return null;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value) ? null : message;
        },

    min: (minValue: number, message?: string) =>
        (value: number | string) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(num)) return null;
            return num < minValue ? message || `Must be at least ${minValue}` : null;
        },

    max: (maxValue: number, message?: string) =>
        (value: number | string) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(num)) return null;
            return num > maxValue ? message || `Must be at most ${maxValue}` : null;
        },

    pattern: (regex: RegExp, message = 'Invalid format') =>
        (value: string) => (value && !regex.test(value) ? message : null),

    numeric: (message = 'Must be a number') =>
        (value: string) => {
            if (!value) return null;
            return isNaN(parseFloat(value)) ? message : null;
        },

    integer: (message = 'Must be a whole number') =>
        (value: string) => {
            if (!value) return null;
            const num = parseFloat(value);
            return isNaN(num) || num !== Math.floor(num) ? message : null;
        }
};

export default useForm;
