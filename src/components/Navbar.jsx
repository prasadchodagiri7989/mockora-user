import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { 
  Sun, 
  Moon, 
  Search, 
  Menu, 
  LogOut, 
  GraduationCap, 
  Dumbbell, 
  BookOpen, 
  Briefcase,
  X
} from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data.success) {
          setResults(res.data.results);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (path) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const hasAnyResults = results && (
    results.tests?.length > 0 || 
    results.practice?.length > 0 || 
    results.resources?.length > 0 || 
    results.jobs?.length > 0
  );

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left: Mobile toggle & Stream Label */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
            {user?.targetExam || 'Universal Exam Hub'}
          </span>
        </div>
      </div>

      {/* Center: Live Global Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-lg mx-4 sm:mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results) setIsOpen(true); }}
            placeholder="Search mock tests, practice, notes, or career jobs..."
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto animate-in fade-in duration-150">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Searching platform curricula...
              </div>
            ) : !hasAnyResults ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No matching mock tests, practice sets, resources, or jobs found for "{query}".
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-2">
                {/* 1. Mock Tests */}
                {results.tests?.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Mock Tests ({results.tests.length})</span>
                    </span>
                    <div className="space-y-1">
                      {results.tests.map((t) => (
                        <div
                          key={t._id}
                          onClick={() => handleSelectResult(`/mock-tests?open=${t._id}`)}
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.title}</p>
                            <span className="text-[10px] text-slate-400">{t.categoryId?.name} • {t.difficulty}</span>
                          </div>
                          {t.tags?.length > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                              {t.tags[0]}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Practice Questions */}
                {results.practice?.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span>Practice Question Bank ({results.practice.length})</span>
                    </span>
                    <div className="space-y-1">
                      {results.practice.map((p) => (
                        <div
                          key={p._id}
                          onClick={() => handleSelectResult(`/practice?search=${encodeURIComponent(p.subject || '')}`)}
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{p.text}</p>
                          <span className="text-[10px] text-slate-400">{p.subject} • {p.topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Resources */}
                {results.resources?.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Study Resources ({results.resources.length})</span>
                    </span>
                    <div className="space-y-1">
                      {results.resources.map((r) => (
                        <div
                          key={r._id}
                          onClick={() => handleSelectResult(`/resources?search=${encodeURIComponent(r.title)}`)}
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.title}</p>
                            <span className="text-[10px] text-slate-400 uppercase">{r.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Jobs */}
                {results.jobs?.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 mb-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Placements & Careers ({results.jobs.length})</span>
                    </span>
                    <div className="space-y-1">
                      {results.jobs.map((j) => (
                        <div
                          key={j._id}
                          onClick={() => handleSelectResult(`/jobs?search=${encodeURIComponent(j.title)}`)}
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{j.title}</p>
                            <span className="text-[10px] text-slate-400">{j.company} • {j.location}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600">{j.salaryRange}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* User Account / Profile */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-indigo-500/20">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                  Candidate
                </p>
              </div>
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-xs font-semibold px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/30 transition"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
