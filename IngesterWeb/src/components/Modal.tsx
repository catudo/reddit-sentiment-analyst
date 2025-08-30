import { useEffect } from 'react';

type ModalProps = {
  message: string;
  type: 'error' | 'info';
  onClose: () => void;
};

export default function Modal({ message, type, onClose }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl animate-fade-in">
        <div className={`flex items-center mb-4 ${type === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
          <svg 
            className="w-6 h-6 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {type === 'error' ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            )}
          </svg>
          <h3 className="text-lg font-semibold">
            {type === 'error' ? 'Error' : 'Notice'}
          </h3>
        </div>
        
        <p className="text-gray-700 mb-4">{message}</p>
        
        <button
          onClick={onClose}
          className={`w-full px-4 py-2 rounded-md ${
            type === 'error' 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } transition-colors`}
        >
          Close
        </button>
      </div>
    </div>
  );
}
