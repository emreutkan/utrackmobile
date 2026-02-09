import { renderHook, act } from '@testing-library/react-native';
import { useModal, useModals } from '../useModal';

describe('useModal', () => {
    it('should initialize with closed state by default', () => {
        const { result } = renderHook(() => useModal());

        expect(result.current.isOpen).toBe(false);
        expect(result.current.data).toBeNull();
    });

    it('should initialize with open state when specified', () => {
        const { result } = renderHook(() => useModal(true));

        expect(result.current.isOpen).toBe(true);
    });

    it('should open modal without data', () => {
        const { result } = renderHook(() => useModal());

        act(() => {
            result.current.open();
        });

        expect(result.current.isOpen).toBe(true);
        expect(result.current.data).toBeNull();
    });

    it('should open modal with data', () => {
        const { result } = renderHook(() => useModal<{ id: number }>());

        act(() => {
            result.current.open({ id: 123 });
        });

        expect(result.current.isOpen).toBe(true);
        expect(result.current.data).toEqual({ id: 123 });
    });

    it('should close modal', () => {
        const { result } = renderHook(() => useModal(true));

        act(() => {
            result.current.close();
        });

        expect(result.current.isOpen).toBe(false);
    });

    it('should toggle modal state', () => {
        const { result } = renderHook(() => useModal());

        act(() => {
            result.current.toggle();
        });
        expect(result.current.isOpen).toBe(true);

        act(() => {
            result.current.toggle();
        });
        expect(result.current.isOpen).toBe(false);
    });

    it('should work with complex data types', () => {
        interface User {
            id: number;
            name: string;
            email: string;
        }

        const { result } = renderHook(() => useModal<User>());

        const user: User = {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com'
        };

        act(() => {
            result.current.open(user);
        });

        expect(result.current.data).toEqual(user);
    });
});

describe('useModals', () => {
    const modalKeys = ['edit', 'delete', 'confirm'] as const;

    it('should initialize all modals as closed', () => {
        const { result } = renderHook(() => useModals(modalKeys));

        expect(result.current.isOpen('edit')).toBe(false);
        expect(result.current.isOpen('delete')).toBe(false);
        expect(result.current.isOpen('confirm')).toBe(false);
    });

    it('should open specific modal', () => {
        const { result } = renderHook(() => useModals(modalKeys));

        act(() => {
            result.current.open('edit');
        });

        expect(result.current.isOpen('edit')).toBe(true);
        expect(result.current.isOpen('delete')).toBe(false);
    });

    it('should open modal with data', () => {
        const { result } = renderHook(() => useModals<(typeof modalKeys)[number], { id: number }>(modalKeys));

        act(() => {
            result.current.open('edit', { id: 123 });
        });

        expect(result.current.getData('edit')).toEqual({ id: 123 });
    });

    it('should close specific modal', () => {
        const { result } = renderHook(() => useModals(modalKeys));

        act(() => {
            result.current.open('edit');
            result.current.open('delete');
        });

        act(() => {
            result.current.close('edit');
        });

        expect(result.current.isOpen('edit')).toBe(false);
        expect(result.current.isOpen('delete')).toBe(true);
    });

    it('should close all modals', () => {
        const { result } = renderHook(() => useModals(modalKeys));

        act(() => {
            result.current.open('edit');
            result.current.open('delete');
        });

        act(() => {
            result.current.closeAll();
        });

        expect(result.current.isOpen('edit')).toBe(false);
        expect(result.current.isOpen('delete')).toBe(false);
    });

    it('should toggle specific modal', () => {
        const { result } = renderHook(() => useModals(modalKeys));

        act(() => {
            result.current.toggle('edit');
        });
        expect(result.current.isOpen('edit')).toBe(true);

        act(() => {
            result.current.toggle('edit');
        });
        expect(result.current.isOpen('edit')).toBe(false);
    });
});
