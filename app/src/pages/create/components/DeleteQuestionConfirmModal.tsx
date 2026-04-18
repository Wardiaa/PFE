// src/pages/create/components/DeleteQuestionConfirmModal.tsx
import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteQuestionConfirmModalProps {
  isOpen: boolean;
  questionTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteQuestionConfirmModal: React.FC<DeleteQuestionConfirmModalProps> = ({
  isOpen,
  questionTitle,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="delete-dialog-title"
              className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug"
            >
              Delete question?
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              &ldquo;{questionTitle || "Untitled question"}&rdquo;
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This will permanently remove the question and{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              all participant responses
            </span>{" "}
            associated with it. This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteQuestionConfirmModal;