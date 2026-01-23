import React, { useState } from 'react';
import Modal from './components/Modal';
import { config } from './config';
import { Bar } from 'react-chartjs-2';
import { Download, LogIn, LogOut, UserPlus, BarChart2, Lock, Download as DownloadIcon, MessageSquare, Search, X, Loader, RefreshCcw } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { SuggestionForm } from './SuggestionForm.tsx';
import { authenticatedFetch } from './utils/apiClient';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type SentimentResult = {
  sentiment: string;
  count: number;
};

type SearchQuery = {
  subreddit: string;
  subject: string;
  finished: boolean;
};

// Global variable for sentiment results
let sentimentResults: SentimentResult[] = [];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [subreddit, setSubreddit] = useState('');
  const [subject, setSubject] = useState('');
  const [count, setCount] = useState('');
  const [authToken, setAuthToken] = useState<string>('');
  const [refreshToken, setRefreshToken] = useState<string>('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [ingestCounter, setIngestCounter] = useState<number | null>(null);
  const [queryHistory, setQueryHistory] = useState<SearchQuery[]>([]);
  // Add state to trigger re-renders when sentimentResults changes
  const [resultsUpdated, setResultsUpdated] = useState(false);

  const fetchQueryHistory = async () => {
    try {
      const response = await authenticatedFetch(`${config.apiUrl}/comments/`, {
        method: 'GET',
      }, authToken, refreshToken, setAuthToken, setRefreshToken, handleSignOut);

      if (response.ok) {
        const data = await response.json();
        setQueryHistory(data);
      }
    } catch (error) {
      console.error('Error fetching query history:', error);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchQueryHistory();
    }
  }, [isAuthenticated, authToken]);

  const handleSearch = async () => {
    if (subreddit && subject && count) {
      setIsLoading(true);

      try {
        const ingestResponse = await authenticatedFetch(`${config.apiUrl}/ingest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subreddit,
            subject,
            count
          })
        }, authToken, refreshToken, setAuthToken, setRefreshToken, handleSignOut);

        if (!ingestResponse.ok) {
          throw new Error('Failed to ingest data');
        }

        const ingestData = await ingestResponse.json();
        setIngestCounter(ingestData.counter);

        await fetchAggregation(subreddit, subject);
        await fetchQueryHistory();

      } catch (error) {
        console.error('Error during search:', error);
        setModalMessage('An error occurred during search. Please try again.');
        setShowModal(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchAggregation = async (sub: string, subjt: string) => {
    try {
      const aggregateResponse = await authenticatedFetch(`${config.apiUrl}/comments/aggregate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: subjt,
          subreddit: sub
        })
      }, authToken, refreshToken, setAuthToken, setRefreshToken, handleSignOut);

      if (!aggregateResponse.ok) {
        throw new Error('Failed to aggregate comments');
      }

      const aggregateData = await aggregateResponse.json();
      sentimentResults = aggregateData;
      setResultsUpdated(!resultsUpdated);
    } catch (error) {
      console.error('Error fetching aggregation:', error);
      throw error;
    }
  };

  const handleSelectQuery = async (query: SearchQuery) => {
    setSubreddit(query.subreddit);
    setSubject(query.subject);
    setIsLoading(true);
    try {
      await fetchAggregation(query.subreddit, query.subject);
    } catch (error) {
      setModalMessage('Failed to load results for selected query.');
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchQueryHistory();
      if (subreddit && subject) {
        await fetchAggregation(subreddit, subject);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      setModalMessage('Passwords do not match!');
      setShowModal(true);

      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('username', email.split('@')[0]); // Using email prefix as username
      formData.append('password', password);
      formData.append('email', email);

      const response = await fetch(`${config.apiUrl}/create_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });
      console.log('Response:', response);
      if (response.ok) {
        setIsAuthenticated(true);
        setShowAuth(false);
      } else {
        const error = await response.text();
        setModalMessage(`Failed to create user: ${error}`);
        setShowModal(true);

      }
    } catch (error) {
      setModalMessage('Error creating user. Please try again.');
      setShowModal(true);

      console.error('Error:', error);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('email', email);
      formData.append('password', password);

      const response = await fetch(`${config.apiUrl}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Store both access and refresh tokens
        setAuthToken(data.access);
        setRefreshToken(data.refresh);
        setIsAuthenticated(true);
        setShowAuth(false);
      } else {
        setModalMessage('Invalid credentials!');
        setShowModal(true);

      }
    } catch (error) {
      setModalMessage('Error signing in. Please try again.');
      setShowModal(true);

      console.error('Error:', error);
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setShowAuth(false);
    setEmail('');
    setPassword('');
    setPasswordConfirm(''); // Clear password confirmation
    setRefreshToken('');
    setQueryHistory([]);
  };


  const downloadExcelFromAPI = async () => {
    try {
      const response = await authenticatedFetch(`${config.apiUrl}/comments/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subreddit,
          subject
        })
      }, authToken, refreshToken, setAuthToken, setRefreshToken, handleSignOut);

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sentiment_data.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setModalMessage('Failed to download Excel file');
      setShowModal(true);

    }
  };

  // Dynamically generate chart data from sentiment results
  const chartData = {
    labels: sentimentResults.map(item => item.sentiment),
    datasets: [
      {
        label: 'Sentiment Distribution',
        data: sentimentResults.map(item => item.count),
        backgroundColor: sentimentResults.map((_, index) => {
          // Generate colors dynamically based on index
          const colors = [
            'rgba(75, 192, 192, 0.6)',   // Teal
            'rgba(255, 99, 132, 0.6)',   // Pink
            'rgba(54, 162, 235, 0.6)',    // Blue
            'rgba(255, 206, 86, 0.6)',    // Yellow
            'rgba(153, 102, 255, 0.6)',   // Purple
          ];
          return colors[index % colors.length];
        }),
        borderColor: sentimentResults.map((_, index) => {
          const colors = [
            'rgb(75, 192, 192)',   // Teal
            'rgb(255, 99, 132)',   // Pink
            'rgb(54, 162, 235)',    // Blue
            'rgb(255, 206, 86)',    // Yellow
            'rgb(153, 102, 255)',   // Purple
          ];
          return colors[index % colors.length];
        }),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sentiment Analysis',
      },
    },
  };

  if (showSuggestion) {
    return <SuggestionForm onBack={() => setShowSuggestion(false)} />;
  }

  if (!isAuthenticated && !showAuth) {
    return (
      <>
        {showModal && (
          <Modal
            message={modalMessage}
            type="error"
            onClose={() => setShowModal(false)}
          />
        )}
        <div className="min-h-screen bg-[#DAE0E6]">
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Sentiment Analysis</span>
                <span className="block text-[#FF4500]">Made Simple</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Analyze, visualize, and understand sentiment patterns with our powerful dashboard. Get started today and unlock valuable insights from your data.
              </p>
              <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center space-x-4 md:mt-8">
                <div className="rounded-md shadow">
                  <button
                    onClick={() => {
                      setShowAuth(true);
                      setAuthMode('signin');
                    }}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#FF4500] hover:bg-[#FF5722] md:py-4 md:text-lg md:px-10"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </button>
                </div>
                <div className="rounded-md shadow">
                  <button
                    onClick={() => {
                      setShowAuth(true);
                      setAuthMode('signup');
                    }}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#0079D3] hover:bg-[#0066B2] md:py-4 md:text-lg md:px-10"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center p-6 bg-[#F8F9FA] rounded-lg hover:border hover:border-[#FF4500] transition-all">
                  <div className="p-3 bg-[#FFE9E2] rounded-full">
                    <BarChart2 className="w-6 h-6 text-[#FF4500]" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Visual Analytics</h3>
                  <p className="mt-2 text-center text-gray-600">
                    Interactive charts and visualizations to help you understand sentiment patterns.
                  </p>
                </div>

                <div className="flex flex-col items-center p-6 bg-[#F8F9FA] rounded-lg hover:border hover:border-[#FF4500] transition-all">
                  <div className="p-3 bg-[#FFE9E2] rounded-full">
                    <Lock className="w-6 h-6 text-[#FF4500]" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Secure Access</h3>
                  <p className="mt-2 text-center text-gray-600">
                    Your data is protected with enterprise-grade security and authentication.
                  </p>
                </div>

                <div className="flex flex-col items-center p-6 bg-[#F8F9FA] rounded-lg hover:border hover:border-[#FF4500] transition-all">
                  <div className="p-3 bg-[#FFE9E2] rounded-full">
                    <DownloadIcon className="w-6 h-6 text-[#FF4500]" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Export Data</h3>
                  <p className="mt-2 text-center text-gray-600">
                    Download your sentiment analysis data in Excel format for further analysis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated && showAuth) {
    return (
      <>
        {showModal && (
          <Modal
            message={modalMessage}
            type="error"
            onClose={() => setShowModal(false)}
          />
        )}
        <div className="min-h-screen bg-[#DAE0E6]">
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </h2>
                <button
                  onClick={() => setShowAuth(false)}
                  className="text-[#FF4500] hover:text-[#FF5722]"
                >
                  Back to Home
                </button>
              </div>
              <form className="space-y-4" onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF4500] focus:ring focus:ring-[#FFE9E2] focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF4500] focus:ring focus:ring-[#FFE9E2] focus:ring-opacity-50"
                  />
                </div>
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF4500] focus:ring focus:ring-[#FFE9E2] focus:ring-opacity-50"
                    />
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-[#FF4500] text-white rounded-md hover:bg-[#FF5722]"
                  >
                    {authMode === 'signin' ? (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    className="text-[#FF4500] hover:text-[#FF5722]"
                  >
                    {authMode === 'signin' ? 'Need an account?' : 'Already have an account?'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {showModal && (
        <Modal
          message={modalMessage}
          type="error"
          onClose={() => setShowModal(false)}
        />
      )}
      <div className="min-h-screen bg-[#DAE0E6]">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Sentiment Analysis Dashboard</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowSuggestion(true)}
                className="flex items-center px-4 py-2 bg-[#0079D3] text-white rounded-md hover:bg-[#0066B2]"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Feedback
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 bg-[#FF4500] text-white rounded-md hover:bg-[#FF5722]"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subreddit</label>
                <input
                  type="text"
                  value={subreddit}
                  onChange={(e) => setSubreddit(e.target.value)}
                  placeholder="e.g., r/programming"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reddit Post Count</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="Enter count"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end mb-6 space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-[#FF4500] text-white rounded-md hover:bg-[#FF5722] disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </button>
            </div>

            {ingestCounter !== null && (
              <div className="mb-6 p-4 bg-green-100 rounded-lg">
                <p className="text-green-800 font-medium">Successfully ingested {ingestCounter} comments</p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Query History</h2>
              <div className="space-y-3">
                {queryHistory.map((query, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectQuery(query)}
                    className="flex items-center justify-between bg-[#F8F9FA] p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        r/{query.subreddit} - {query.subject}
                      </p>
                      <p className="text-xs text-gray-500">
                        Status: {query.finished ? 'Finished' : 'In Progress'}
                      </p>
                    </div>
                  </div>
                ))}
                {queryHistory.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No query history yet</p>
                )}
              </div>
            </div>

            {sentimentResults.length > 0 && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Sentiment Results</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sentimentResults.map((result, index) => (
                      <div key={index} className="bg-[#F8F9FA] p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900">{result.sentiment}</h3>
                        <p className="text-2xl font-bold text-[#FF4500]">{result.count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <Bar data={chartData} options={chartOptions} />
                </div>

                <button
                  onClick={downloadExcelFromAPI}
                  className="flex items-center px-4 py-2 bg-[#0079D3] text-white rounded-md hover:bg-[#0066B2]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Excel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
