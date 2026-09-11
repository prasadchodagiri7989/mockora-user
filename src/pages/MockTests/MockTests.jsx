import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { 
  Code2, 
  Stethoscope, 
  Atom, 
  Microscope, 
  Languages, 
  Briefcase, 
  BookOpen, 
  Clock, 
  Trophy, 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  ChevronRight, 
  BarChart2, 
  Layers,
  Tag,
  AlertCircle
} from 'lucide-react';

const iconMap = {
  Code2,
  Stethoscope,
  Atom,
  Microscope,
  Languages,
  Briefcase,
  BookOpen,
};

export default function MockTests() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tests, setTests] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingTests, setLoadingTests] = useState(false);

  // Level 3 Modal state
  const [selectedTest, setSelectedTest] = useState(null);
  const [previousAttempts, setPreviousAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load Categories with mock tests present on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories?onlyWithTests=true');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  // Handle category selection
  const handleSelectCategory = async (cat) => {
    setSelectedCategory(cat);
    setLoadingTests(true);
    try {
      const res = await api.get(`/tests?categoryId=${cat._id}&status=published`);
      if (res.data.success) {
        setTests(res.data.tests);
      }
    } catch (err) {
      console.error('Error fetching tests for category:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  // Handle test detail modal
  const handleOpenTestModal = async (test) => {
    setSelectedTest(test);
    setLoadingAttempts(true);
    try {
      const res = await api.get(`/attempts?testId=${test._id}`);
      if (res.data.success) {
        setPreviousAttempts(res.data.attempts);
      }
    } catch (err) {
      console.error('Error fetching previous attempts:', err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  // If URL contains ?open=:id, open that test directly
  useEffect(() => {
    const openTestId = searchParams.get('open');
    if (openTestId && !selectedTest) {
      api.get(`/tests/${openTestId}`).then(res => {
        if (res.data.success) {
          handleOpenTestModal(res.data.test);
        }
      }).catch(console.error);
    }
  }, [searchParams]);

  const handleStartTest = (testId) => {
    navigate(`/test-taking/${testId}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Universal Mock Examination Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Simulate actual testing conditions with full-length timed tests, negative markings, and instant AI analytics.
          </p>
        </div>

        {selectedCategory && (
          <button
            onClick={() => {
              setSelectedCategory(null);
              setTests([]);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Categories</span>
          </button>
        )}
      </div>

      {/* LEVEL 1: Category Grid */}
      {!selectedCategory && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Choose an Examination Stream
            </h2>
            <span className="text-xs text-slate-400">
              {categories.length} Streams Active
            </span>
          </div>

          {loadingCats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => {
                const IconComponent = iconMap[cat.icon] || BookOpen;
                return (
                  <div
                    key={cat._id}
                    onClick={() => handleSelectCategory(cat)}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/70 dark:hover:border-indigo-500/70 rounded-3xl p-6 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20"
                          style={{ backgroundColor: cat.color || '#4F46E5' }}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {cat.testCount || 0} Tests
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition">
                      <span>Browse Tests</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LEVEL 2: Test List in Selected Category */}
      {selectedCategory && (
        <div className="space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: selectedCategory.color || '#4F46E5' }}
              >
                {React.createElement(iconMap[selectedCategory.icon] || BookOpen, { className: 'w-5 h-5' })}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedCategory.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {tests.length} mock tests available for immediate simulation
                </p>
              </div>
            </div>
          </div>

          {loadingTests ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No mock tests published yet for this category.
              </p>
              <p className="text-xs text-slate-400 mt-1">Check back soon or try another stream.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tests.map((test) => (
                <div
                  key={test._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        test.difficulty === 'Hard' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' :
                        test.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' :
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                      }`}>
                        {test.difficulty} Difficulty
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {test.timing?.enabled ? `${test.timing.duration} Mins` : 'Untimed'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                      {test.description}
                    </p>

                    {test.tags && test.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {test.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-x-3">
                      <span><strong>{test.questionCount || test.questions?.length || 0}</strong> Questions</span>
                      <span>•</span>
                      <span><strong>{test.attemptCount || 0}</strong> Taken</span>
                    </div>

                    <button
                      onClick={() => handleOpenTestModal(test)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LEVEL 3: Test Detail Modal */}
      {selectedTest && (
        <Modal
          isOpen={!!selectedTest}
          onClose={() => {
            setSelectedTest(null);
            setPreviousAttempts([]);
          }}
          title={selectedTest.title}
          subtitle={`Stream: ${selectedTest.categoryId?.name || 'Examination'}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Test Specifications Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {selectedTest.description || 'Standard full syllabus examination simulator.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Questions</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedTest.questions?.length || selectedTest.questionCount || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Time Limit</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedTest.timing?.enabled ? `${selectedTest.timing.duration} mins` : 'No Limit'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Marks</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedTest.totalMarks || 100}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Difficulty</span>
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                    {selectedTest.difficulty || 'Medium'}
                  </span>
                </div>
              </div>
            </div>

            {/* Test Instructions */}
            {selectedTest.instructions && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4">
                <h5 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Examination Instructions & Rules
                </h5>
                <div className="text-xs text-amber-800/90 dark:text-amber-300/90 whitespace-pre-line leading-relaxed font-normal">
                  {selectedTest.instructions}
                </div>
              </div>
            )}

            {/* CTA Button: Start Mock Test */}
            <div>
              <button
                onClick={() => handleStartTest(selectedTest._id)}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition transform active:scale-[0.99]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Mock Test</span>
              </button>
            </div>

            {/* Previous Attempts Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Your Previous Attempts ({previousAttempts.length})
                </h4>
              </div>

              {loadingAttempts ? (
                <div className="space-y-2">
                  <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
              ) : previousAttempts.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  You haven't attempted this test yet. Click above to begin!
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {previousAttempts.map((att) => (
                    <div
                      key={att._id}
                      onClick={() => navigate(`/test-summary/${att._id}`)}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Score: {att.score} / {att.totalMarks}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            ({att.accuracyPercentage}% Accuracy)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {new Date(att.createdAt).toLocaleString()} • {Math.round((att.timeSpentSeconds || 0) / 60)} mins taken
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition">
                        <span>Summary & AI Review</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
