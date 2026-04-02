import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import type { Student } from '../types';
import { Link } from 'react-router-dom';

export default function PromptPage() {
  const [prompt, setPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Student[]>([]);
  const [message, setMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await api.post('/students/prompt', { prompt });
      setResults(res.data.data.students);
      setMessage(res.data.data.message);
    } catch (error: any) {
      setMessage(error.message || 'Failed to analyze prompt');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary-600/20 rounded-xl">
          <SparklesIcon className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Smart Prompt Query</h2>
          <p className="text-sm text-slate-400">
            Ask EduDash AI to find students using natural language.
          </p>
        </div>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <MagnifyingGlassIcon className={`w-5 h-5 ${isSearching ? 'text-primary-500 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <input
            type="text"
            className="w-full bg-surface-elevated border border-surface-border text-slate-100 text-lg rounded-2xl p-4 pl-12 pr-32 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
            placeholder="e.g., list all the students who didn't pay fees..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching || !prompt.trim()}
            className="absolute inset-y-2 right-2 px-6 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Thinking...' : 'Ask AI'}
          </button>
        </form>

        {/* Suggested prompts */}
        <div className="mt-4 flex flex-wrap gap-2">
          {['Students who didn\'t pay fees', 'Failing students', 'Class 10-A students'].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setPrompt(suggestion)}
              className="text-xs px-3 py-1.5 rounded-full bg-surface-elevated/50 text-slate-400 hover:text-primary-400 hover:bg-primary-600/10 border border-surface-border/50 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 px-2 text-sm text-primary-300">
              <SparklesIcon className="w-4 h-4" />
              <span>{message}</span>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {results.map((student, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={student.id}
                    className="glass-card p-4 hover:border-primary-500/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/students/${student.id}`} className="font-semibold text-slate-200 hover:text-primary-400 truncate block">
                          {student.user.name}
                        </Link>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{student.admissionNo}</p>
                        <p className="text-xs text-slate-500 mt-1">{student.class?.name || 'No Class Assigned'}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 text-center text-slate-400">
                <p>No students match this criteria.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
