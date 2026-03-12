import { useEffect, useCallback, useState } from 'react';

interface UseFeedNavigationOptions {
    postIds: string[];
    onSelectPost?: (postId: string) => void;
    onOpenPost?: (postId: string) => void;
}

/**
 * Hook for keyboard navigation in the feed
 * - j: Move to next post
 * - k: Move to previous post
 * - Enter: Open selected post
 * - Escape: Clear selection
 */
export function useFeedNavigation({
    postIds,
    onSelectPost,
    onOpenPost
}: UseFeedNavigationOptions) {
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

    const navigateToNext = useCallback(() => {
        setSelectedIndex(prev => {
            const next = Math.min(prev + 1, postIds.length - 1);
            if (onSelectPost && postIds[next]) {
                onSelectPost(postIds[next]);
            }
            return next;
        });
    }, [postIds, onSelectPost]);

    const navigateToPrev = useCallback(() => {
        setSelectedIndex(prev => {
            const next = Math.max(prev - 1, 0);
            if (onSelectPost && postIds[next]) {
                onSelectPost(postIds[next]);
            }
            return next;
        });
    }, [postIds, onSelectPost]);

    const openSelected = useCallback(() => {
        if (selectedIndex >= 0 && selectedIndex < postIds.length && onOpenPost) {
            onOpenPost(postIds[selectedIndex]);
        }
    }, [selectedIndex, postIds, onOpenPost]);

    const clearSelection = useCallback(() => {
        setSelectedIndex(-1);
    }, []);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Don't handle if user is typing in an input
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            switch (e.key) {
                case 'j':
                    e.preventDefault();
                    navigateToNext();
                    break;
                case 'k':
                    e.preventDefault();
                    navigateToPrev();
                    break;
                case 'Enter':
                    if (selectedIndex >= 0) {
                        e.preventDefault();
                        openSelected();
                    }
                    break;
                case 'Escape':
                    clearSelection();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [navigateToNext, navigateToPrev, openSelected, clearSelection, selectedIndex]);

    return {
        selectedIndex,
        selectedPostId: selectedIndex >= 0 ? postIds[selectedIndex] : null,
        setSelectedIndex,
        navigateToNext,
        navigateToPrev,
        openSelected,
        clearSelection,
    };
}
