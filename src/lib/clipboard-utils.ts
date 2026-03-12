/**
 * Safe Clipboard Utilities
 * Provides fallback for clipboard operations when API is unavailable
 */

import { toast } from 'sonner';

/**
 * Safely copy text to clipboard with fallback
 * @param text - Text to copy
 * @param successMessage - Optional success toast message
 */
export async function copyToClipboard(text: string, successMessage?: string): Promise<boolean> {
    try {
        // Check if Clipboard API is available
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            if (successMessage) {
                toast.success(successMessage);
            }
            return true;
        }

        // Fallback for browsers without Clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful && successMessage) {
                toast.success(successMessage);
            }
            return successful;
        } catch (err) {
            document.body.removeChild(textArea);
            throw err;
        }
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        toast.error('Failed to copy to clipboard');
        return false;
    }
}

/**
 * Format number safely with toLocaleString
 * @param value - Number to format (may be undefined/null)
 * @param fallback - Fallback value if number is invalid
 */
export function safeToLocaleString(value: number | null | undefined, fallback: string = '0'): string {
    if (value === null || value === undefined || isNaN(value)) {
        return fallback;
    }
    return value.toLocaleString();
}
