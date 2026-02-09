import { useCallback, useState } from 'react';

export interface UseModalResult<T = void> {
    /** Whether the modal is currently open */
    isOpen: boolean;
    /** Data passed when opening the modal */
    data: T | null;
    /** Open the modal, optionally with data */
    open: (data?: T) => void;
    /** Close the modal and clear data */
    close: () => void;
    /** Toggle the modal state */
    toggle: () => void;
}

/**
 * Custom hook for managing modal visibility and data state
 * Simplifies the common pattern of modal state management
 *
 * @param initialOpen - Whether the modal starts open
 * @returns Modal state and control functions
 *
 * @example
 * ```tsx
 * // Simple usage (no data)
 * const modal = useModal();
 * <Button onPress={modal.open} />
 * <Modal visible={modal.isOpen} onClose={modal.close} />
 *
 * // With data
 * const editModal = useModal<User>();
 * editModal.open(user);
 * // In modal: editModal.data contains the user
 *
 * // Multiple modals
 * const deleteModal = useModal<{ id: number }>();
 * const editModal = useModal<User>();
 * ```
 */
export function useModal<T = void>(initialOpen: boolean = false): UseModalResult<T> {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [data, setData] = useState<T | null>(null);

    const open = useCallback((modalData?: T) => {
        setData(modalData ?? null);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        // Clear data after closing to allow animations to complete
        // before data disappears
        setTimeout(() => {
            setData(null);
        }, 300);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    return {
        isOpen,
        data,
        open,
        close,
        toggle
    };
}

/**
 * Hook for managing multiple related modals
 * Useful when you have several modals on a screen
 *
 * @example
 * ```tsx
 * const modals = useModals(['edit', 'delete', 'confirm'] as const);
 *
 * modals.open('edit', userData);
 * modals.isOpen('edit'); // true
 * modals.getData('edit'); // userData
 * modals.close('edit');
 * modals.closeAll();
 * ```
 */
export function useModals<K extends string, T = any>(
    keys: readonly K[]
): {
    isOpen: (key: K) => boolean;
    getData: (key: K) => T | null;
    open: (key: K, data?: T) => void;
    close: (key: K) => void;
    closeAll: () => void;
    toggle: (key: K) => void;
} {
    type ModalState = { isOpen: boolean; data: T | null };
    const initialState = keys.reduce((acc, key) => {
        acc[key] = { isOpen: false, data: null };
        return acc;
    }, {} as Record<K, ModalState>);

    const [state, setState] = useState(initialState);

    const isOpen = useCallback((key: K) => state[key]?.isOpen ?? false, [state]);
    const getData = useCallback((key: K) => state[key]?.data ?? null, [state]);

    const open = useCallback((key: K, data?: T) => {
        setState(prev => ({
            ...prev,
            [key]: { isOpen: true, data: data ?? null }
        }));
    }, []);

    const close = useCallback((key: K) => {
        setState(prev => ({
            ...prev,
            [key]: { ...prev[key], isOpen: false }
        }));
        // Clear data after animation
        setTimeout(() => {
            setState(prev => ({
                ...prev,
                [key]: { isOpen: false, data: null }
            }));
        }, 300);
    }, []);

    const closeAll = useCallback(() => {
        setState(prev => {
            const newState = { ...prev };
            keys.forEach(key => {
                newState[key] = { isOpen: false, data: null };
            });
            return newState;
        });
    }, [keys]);

    const toggle = useCallback((key: K) => {
        setState(prev => ({
            ...prev,
            [key]: { ...prev[key], isOpen: !prev[key].isOpen }
        }));
    }, []);

    return {
        isOpen,
        getData,
        open,
        close,
        closeAll,
        toggle
    };
}

export default useModal;
