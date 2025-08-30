import React, { useState } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { config } from './config';

type SuggestionFormProps = {
  onBack: () => void;
};

export function SuggestionForm({ onBack }: SuggestionFormProps) {
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [suggestion, setSuggestion] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/suggestions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          text: suggestion
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit suggestion');
      }

      // Clear form on success
      setName('');
      setEmail('');
      setSuggestion('');
      setErrorMessage('Thank you for your suggestion!');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DAE0E6]">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="mr-4 text-[#FF4500] hover:text-[#FF5722]"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Help Us Improve</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suggestion</label>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Your suggestion for improving the website"
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center px-4 py-2 bg-[#FF4500] text-white rounded-md hover:bg-[#FF5722] ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Suggestion
                </>
              )}
            </button>
            {errorMessage && (
              <div className={`mt-4 p-3 rounded-md ${
                errorMessage.includes('Thank you') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {errorMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
