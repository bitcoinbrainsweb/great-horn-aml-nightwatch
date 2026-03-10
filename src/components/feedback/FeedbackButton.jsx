import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function FeedbackButton({ currentPage, currentRoute }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all duration-200"
        title="Report a bug or request a feature"
      >
        <MessageCircle className="w-5 h-5 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">Feedback</span>
      </button>

      {isOpen && (
        <FeedbackModal
          onClose={() => setIsOpen(false)}
          currentPage={currentPage}
          currentRoute={currentRoute}
        />
      )}
    </>
  );
}