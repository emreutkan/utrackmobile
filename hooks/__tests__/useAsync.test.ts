import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAsync } from '../useAsync';

describe('useAsync', () => {
    it('should initialize with default state', () => {
        const asyncFn = jest.fn().mockResolvedValue('data');
        const { result } = renderHook(() => useAsync(asyncFn));

        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should initialize with initial data', () => {
        const asyncFn = jest.fn().mockResolvedValue('new data');
        const { result } = renderHook(() =>
            useAsync(asyncFn, { initialData: 'initial' })
        );

        expect(result.current.data).toBe('initial');
    });

    it('should set loading state during execution', async () => {
        let resolvePromise: (value: string) => void;
        const asyncFn = jest.fn().mockImplementation(
            () => new Promise<string>(resolve => { resolvePromise = resolve; })
        );

        const { result } = renderHook(() => useAsync(asyncFn));

        act(() => {
            result.current.execute();
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolvePromise!('data');
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('should update data on success', async () => {
        const asyncFn = jest.fn().mockResolvedValue('success data');
        const { result } = renderHook(() => useAsync(asyncFn));

        await act(async () => {
            await result.current.execute();
        });

        expect(result.current.data).toBe('success data');
        expect(result.current.error).toBeNull();
    });

    it('should update error on failure', async () => {
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);
        const { result } = renderHook(() => useAsync(asyncFn));

        await act(async () => {
            await result.current.execute();
        });

        expect(result.current.error).toEqual(error);
        expect(result.current.data).toBeNull();
    });

    it('should call onSuccess callback', async () => {
        const onSuccess = jest.fn();
        const asyncFn = jest.fn().mockResolvedValue('data');
        const { result } = renderHook(() => useAsync(asyncFn, { onSuccess }));

        await act(async () => {
            await result.current.execute();
        });

        expect(onSuccess).toHaveBeenCalledWith('data');
    });

    it('should call onError callback', async () => {
        const error = new Error('Test error');
        const onError = jest.fn();
        const asyncFn = jest.fn().mockRejectedValue(error);
        const { result } = renderHook(() => useAsync(asyncFn, { onError }));

        await act(async () => {
            await result.current.execute();
        });

        expect(onError).toHaveBeenCalledWith(error);
    });

    it('should pass arguments to async function', async () => {
        const asyncFn = jest.fn().mockImplementation(
            (id: number, name: string) => Promise.resolve({ id, name })
        );
        const { result } = renderHook(() => useAsync(asyncFn));

        await act(async () => {
            await result.current.execute(123, 'test');
        });

        expect(asyncFn).toHaveBeenCalledWith(123, 'test');
        expect(result.current.data).toEqual({ id: 123, name: 'test' });
    });

    it('should reset state', async () => {
        const asyncFn = jest.fn().mockResolvedValue('data');
        const { result } = renderHook(() =>
            useAsync(asyncFn, { initialData: 'initial' })
        );

        await act(async () => {
            await result.current.execute();
        });

        expect(result.current.data).toBe('data');

        act(() => {
            result.current.reset();
        });

        expect(result.current.data).toBe('initial');
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should allow manual data setting', () => {
        const asyncFn = jest.fn().mockResolvedValue('data');
        const { result } = renderHook(() => useAsync(asyncFn));

        act(() => {
            result.current.setData('manual data');
        });

        expect(result.current.data).toBe('manual data');
    });

    it('should reset error on new execute by default', async () => {
        const asyncFn = jest.fn()
            .mockRejectedValueOnce(new Error('First error'))
            .mockResolvedValueOnce('success');

        const { result } = renderHook(() => useAsync(asyncFn));

        await act(async () => {
            await result.current.execute();
        });
        expect(result.current.error).not.toBeNull();

        await act(async () => {
            await result.current.execute();
        });
        expect(result.current.error).toBeNull();
        expect(result.current.data).toBe('success');
    });

    it('should convert non-Error exceptions to Error', async () => {
        const asyncFn = jest.fn().mockRejectedValue('string error');
        const { result } = renderHook(() => useAsync(asyncFn));

        await act(async () => {
            await result.current.execute();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('string error');
    });
});
