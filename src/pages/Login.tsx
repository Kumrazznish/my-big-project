import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeContext';
import { Brain, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <span className={`text-2xl font-bold transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent' 
                    : 'text-gray-900'
                }`}>
                  LearnAI Pro
                </span>
                <div className="text-xs text-cyan-500 font-medium">Next-Gen Learning</div>
              </div>
            </Link>
            
            <Link 
              to="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                theme === 'dark' 
                  ? 'text-gray-300 hover:text-white hover:bg-slate-800/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold mb-4 transition-colors ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent' 
                : 'text-gray-900'
            }`}>
              Welcome Back
            </h1>
            <p className={`text-xl transition-colors ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Sign in to continue your learning journey
            </p>
          </div>
          
          <div className={`backdrop-blur-xl border rounded-3xl p-8 transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: `${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-white/10 text-white hover:bg-slate-600' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
                  } transition-colors`,
                  formButtonPrimary: "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 transition-all",
                  formFieldInput: `${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-white/10 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } transition-colors`,
                  footerActionLink: "text-cyan-500 hover:text-cyan-400"
                }
              }}
              redirectUrl="/dashboard"
              signUpUrl="/signup"
            />
          </div>
          
          <div className="text-center mt-6">
            <p className={`transition-colors ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-cyan-500 hover:text-cyan-400 font-medium transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;