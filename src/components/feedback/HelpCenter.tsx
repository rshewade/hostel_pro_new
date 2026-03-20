'use client';

import { useState } from 'react';
import { cn } from '../utils';
import type { BaseComponentProps, HelpItem } from '../types';
import { Button } from '../ui/Button';
import { Modal } from './Modal';

export interface HelpCenterProps extends BaseComponentProps {
  title?: string;
  items?: HelpItem[];
  searchPlaceholder?: string;
  onItemClick?: (item: HelpItem) => void;
  showSearch?: boolean;
  showCategories?: boolean;
}

export function HelpCenter({
  title = 'Help Center',
  items = [],
  searchPlaceholder = 'Search for help...',
  onItemClick,
  showSearch = true,
  showCategories = true,
  className,
  ...props
}: HelpCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const defaultItems: HelpItem[] = [
    {
      id: '1',
      question: 'How do I apply for admission?',
      answer: 'Navigate to the Apply page from the homepage, select your preferred hostel type (Boys, Girls, or Dharamshala), and fill out the multi-step application form. You will need to provide personal details, upload required documents, and pay the application fee.',
      category: 'Admissions',
    },
    {
      id: '2',
      question: 'How can I track my application status?',
      answer: 'After submitting your application, you will receive a tracking number. Use the "Track Application" link on the homepage to check your status at any time.',
      category: 'Admissions',
    },
    {
      id: '3',
      question: 'What is the fee structure?',
      answer: 'The fee structure includes Processing Fee (₹5,000), Hostel Fees (₹50,000/year), Security Deposit (₹10,000, refundable), and Key Deposit (₹2,000, refundable). Payment can be made via UPI, Card, Net Banking, or QR Code.',
      category: 'Fees',
    },
    {
      id: '4',
      question: 'How do I apply for leave?',
      answer: 'Go to Dashboard > Leave > Apply for Leave. Select the leave type, enter dates and reason, and submit for approval. Your parents will be notified based on the notification rules configured by the superintendent.',
      category: 'Leave',
    },
    {
      id: '5',
      question: 'What happens during the 6-month renewal process?',
      answer: 'Before your 6-month stay period ends, you will receive renewal notifications. You need to review and accept the updated DPDP consent, pay any outstanding dues, and confirm your continuation. Failure to renew may result in check-out.',
      category: 'Renewal',
    },
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  const categories = showCategories
    ? [...new Set(displayItems.map((item) => item.category || 'General'))]
    : [];

  const filteredItems = displayItems.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleItemClick = (item: HelpItem) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      setExpandedItem(expandedItem === item.id ? null : item.id);
    }
  };

  const handleOpenHelp = () => setIsOpen(true);
  const handleCloseHelp = () => {
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory(null);
    setExpandedItem(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenHelp}
        className={cn(
          'inline-flex items-center justify-center',
          'w-8 h-8 rounded-full',
          'bg-gray-100 text-gray-600',
          'hover:bg-gray-200 hover:text-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2',
          'transition-colors duration-200',
          'cursor-pointer',
          className
        )}
        aria-label="Open help center"
        {...props}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseHelp}
        title={title}
        size="lg"
      >
        <div className="space-y-4">
          {showSearch && (
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2',
                  'border border-gray-300 rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500',
                  'text-sm'
                )}
                aria-label={searchPlaceholder}
              />
            </div>
          )}

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Help categories">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  'transition-colors duration-200',
                  !selectedCategory
                    ? 'bg-gold-100 text-gold-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                role="tab"
                aria-selected={!selectedCategory}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    'transition-colors duration-200',
                    selectedCategory === category
                      ? 'bg-gold-100 text-gold-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                  role="tab"
                  aria-selected={selectedCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto space-y-2" role="region" aria-label="Help articles">
            {filteredItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No help articles found matching your search.
              </p>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'border rounded-lg',
                    'transition-colors duration-200',
                    expandedItem === item.id
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'w-full px-4 py-3',
                      'text-left flex items-center justify-between',
                      'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-inset'
                    )}
                    aria-expanded={expandedItem === item.id}
                  >
                    <span className="font-medium text-gray-900">
                      {item.question}
                    </span>
                    <svg
                      className={cn(
                        'w-5 h-5 text-gray-500 transition-transform duration-200',
                        expandedItem === item.id && 'transform rotate-180'
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {expandedItem === item.id && (
                    <div
                      className="px-4 pb-4 pt-0"
                      id={`help-answer-${item.id}`}
                    >
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t text-center">
            <p className="text-sm text-gray-500 mb-3">
              Still need help? Contact our support team.
            </p>
            <Button variant="secondary" size="sm">
              Contact Support
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export interface PageHelpProps extends BaseComponentProps {
  helpItems?: HelpItem[];
  title?: string;
}

export function PageHelp({ helpItems, title, className }: PageHelpProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <HelpCenter
        title={title || 'Help'}
        items={helpItems}
        showSearch={true}
        showCategories={true}
      />
      <span className="text-sm text-gray-500 hidden sm:inline">Help</span>
    </div>
  );
}

export default HelpCenter;
