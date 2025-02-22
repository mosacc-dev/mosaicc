'use client';
import { useState, useRef, useEffect } from 'react';
import { FaRobot } from 'react-icons/fa';

export default function SummaryButton({ content }) {
    const [isOpen, setIsOpen] = useState(false);
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClick = async () => {
        try {
            if (!isOpen) {
                setIsOpen(true);
                if (!summary) {
                    setIsLoading(true);
                    const response = await fetch('/api/summary', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: content }),
                    });

                    if (!response.ok) throw new Error('Failed to fetch');

                    const data = await response.json();
                    setSummary(data.summary);
                    setError('');
                }
            } else {
                setIsOpen(false);
            }
        } catch (err) {
            setError('Failed to generate summary. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleClick}
                className="flex items-center hover:text-blue-500 transition-colors"
            >
                <FaRobot className="mr-1" />
                AI Overview
            </button>

            {isOpen && (
                <div className="absolute z-50 bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-lg p-4 animate-slide-down">
                    {error ? (
                        <p className="text-red-500 text-sm">{error}</p>
                    ) : isLoading ? (
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                        </div>
                    ) : (
                        <p className="text-gray-700 text-sm">{summary}</p>
                    )}
                </div>
            )}
        </div>
    );
}