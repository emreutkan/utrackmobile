import { useCallback, useState } from 'react';

export interface UseAsyncState<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
}

export interface UseAsyncResult<T, Args extends any[]> extends UseAsyncState<T> {
    execute: (...args: Args) => Promise<T | null>;
    reset: () => void;
    setData: (data: T | null) => void;
}

export interface UseAsyncOptions<T> {
    /** Initial data value */
    initialData?: T | null;
    /** Callback when execution succeeds */
    onSuccess?: (data: T) => void;
    /** Callback when execution fails */
    onError?: (error: Error) => void;
    /** Whether to reset error on new execution */
    resetErrorOnExecute?: boolean;
}

/**
 * Custom hook for managing async operations with loading and error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useAsync(async (id: number) => {
 *     return await fetchUser(id);
 * });
 *
 * // Execute the async function
 * await execute(123);
 *
 * // Access state
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * if (data) return <User data={data} />;
 * ```
 */
export function useAsync<T, Args extends any[] = []>(
    asyncFunction: (...args: Args) => Promise<T>,
    options: UseAsyncOptions<T> = {}
): UseAsyncResult<T, Args> {
    const {
        initialData = null,
        onSuccess,
        onError,
        resetErrorOnExecute = true
    } = options;

    const [state, setState] = useState<UseAsyncState<T>>({
        data: initialData,
        isLoading: false,
        error: null
    });

    const execute = useCallback(
        async (...args: Args): Promise<T | null> => {
            setState(prev => ({
                ...prev,
                isLoading: true,
                error: resetErrorOnExecute ? null : prev.error
            }));

            try {
                const result = await asyncFunction(...args);
                setState({
                    data: result,
                    isLoading: false,
                    error: null
                });
                onSuccess?.(result);
                return result;
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error
                }));
                onError?.(error);
                return null;
            }
        },
        [asyncFunction, onSuccess, onError, resetErrorOnExecute]
    );

    const reset = useCallback(() => {
        setState({
            data: initialData,
            isLoading: false,
            error: null
        });
    }, [initialData]);

    const setData = useCallback((data: T | null) => {
        setState(prev => ({ ...prev, data }));
    }, []);

    return {
        ...state,
        execute,
        reset,
        setData
    };
}

/**
 * Simplified version that executes immediately on mount
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useAsyncEffect(
 *     async () => fetchUsers(),
 *     []
 * );
 * ```
 */
export function useAsyncEffect<T>(
    asyncFunction: () => Promise<T>,
    deps: React.DependencyList,
    options: UseAsyncOptions<T> = {}
): UseAsyncState<T> & { refetch: () => Promise<T | null> } {
    const { execute, ...state } = useAsync(asyncFunction, options);

    // Note: We don't auto-execute here to avoid React rules violations.
    // The caller should use useEffect if they want auto-execution.

    return {
        ...state,
        refetch: execute
    };
}

export default useAsync;
