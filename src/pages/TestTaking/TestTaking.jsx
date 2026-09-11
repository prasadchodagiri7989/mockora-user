import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { 
  Clock, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Maximize2,
  Minimize2,
  FileText,
  CheckSquare,
  Square
} from 'lucide-react';

export default function TestTaking() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  // answers: { [qId]: { selectedOption: number, selectedOptions: number[], blankAnswer: string, markedForReview: boolean, timeSpent: number } }
  const [answers, setAnswers] = useState({});
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const [totalSeconds, setTotalSeconds] = useState(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null); // for per-question timing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timerRef = useRef(null);
  const qTimerRef = useRef(null);

  // Request browser Fullscreen mode on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        // May fail if user hasn't interacted yet, fallback button is provided
        console.log('Fullscreen request deferred to user interaction:', err);
      }
    };
    enterFullscreen();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  };

  // Fetch test details for taking (sanitized questions)
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await api.get(`/tests/${testId}?mode=taking`);
        if (res.data.success) {
          const fetchedTest = res.data.test;
          setTest(fetchedTest);

          // Initialize timing
          if (fetchedTest.timing?.enabled && fetchedTest.timing?.duration > 0) {
            const sec = fetchedTest.timing.duration * 60;
            setTimeLeft(sec);
            setTotalSeconds(sec);
          }

          // Initialize empty answers
          const initialAnswers = {};
          (fetchedTest.questions || []).forEach(q => {
            initialAnswers[q._id] = {
              selectedOption: -1,
              selectedOptions: [],
              blankAnswer: '',
              markedForReview: false,
              timeSpent: 0,
            };
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        console.error('Failed to load test:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId]);

  // Handle Per-Question Timer if mode is 'perQuestion'
  useEffect(() => {
    if (!test || test.timing?.mode !== 'perQuestion' || isSubmitting) return;

    const currentQ = test.questions?.[currentIndex];
    if (!currentQ) return;

    const qDuration = currentQ.timeLimitSeconds || test.timing?.defaultQuestionTime || 60;
    setQuestionTimeLeft(qDuration);

    if (qTimerRef.current) clearInterval(qTimerRef.current);

    qTimerRef.current = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(qTimerRef.current);
          // Advance to next question or auto submit if last
          if (currentIndex < (test.questions?.length || 1) - 1) {
            setCurrentIndex(i => i + 1);
          } else {
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (qTimerRef.current) clearInterval(qTimerRef.current);
    };
  }, [currentIndex, test, isSubmitting]);

  // Overall Countdown timer countdown & auto-submit
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, isSubmitting]);

  // Auto submit on time out
  const handleAutoSubmit = () => {
    if (!isSubmitting) {
      alert('Time is up! Your mock test is being automatically submitted.');
      submitTest();
    }
  };

  // Option selection for single MCQ
  const handleSelectOption = (optionIndex) => {
    const currentQ = test.questions[currentIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        selectedOption: optionIndex,
      },
    }));
  };

  // Option toggle for multi-answer
  const handleToggleMultiOption = (optionIndex) => {
    const currentQ = test.questions[currentIndex];
    const existing = prevAnswers => {
      const currentList = prevAnswers[currentQ._id]?.selectedOptions || [];
      if (currentList.includes(optionIndex)) {
        return currentList.filter(i => i !== optionIndex);
      } else {
        return [...currentList, optionIndex].sort((a, b) => a - b);
      }
    };

    setAnswers(prev => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        selectedOptions: existing(prev),
      },
    }));
  };

  // Blank text input
  const handleBlankChange = (val) => {
    const currentQ = test.questions[currentIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        blankAnswer: val,
      },
    }));
  };

  // Clear answer
  const handleClearAnswer = () => {
    const currentQ = test.questions[currentIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        selectedOption: -1,
        selectedOptions: [],
        blankAnswer: '',
      },
    }));
  };

  // Toggle marked for review
  const handleToggleReview = () => {
    const currentQ = test.questions[currentIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        markedForReview: !prev[currentQ._id]?.markedForReview,
      },
    }));
  };

  // Format Time Helper
  const formatTime = (seconds) => {
    if (seconds === null) return 'Untimed';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Dynamic timer color shift based on remaining time percentage
  const getTimerColorClass = () => {
    if (timeLeft === null || !totalSeconds) return 'text-slate-700 dark:text-slate-300';
    const pct = (timeLeft / totalSeconds) * 100;
    if (pct < 20) return 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-900 animate-pulse';
    if (pct < 50) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-900';
    return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-900';
  };

  // Submit test to backend
  const submitTest = async () => {
    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        selectedOption: ans.selectedOption,
        selectedOptions: ans.selectedOptions || [],
        blankAnswer: ans.blankAnswer || '',
        markedForReview: ans.markedForReview,
        timeSpent: ans.timeSpent || 0,
      }));

      const elapsed = totalSeconds ? (totalSeconds - (timeLeft || 0)) : Math.round((Date.now() - startedAt) / 1000);

      const res = await api.post('/attempts/submit', {
        testId: test._id,
        answers: formattedAnswers,
        timeSpentSeconds: elapsed,
        startedAt: new Date(startedAt),
      });

      if (res.data.success) {
        navigate(`/test-summary/${res.data.attempt._id}`);
      }
    } catch (err) {
      console.error('Error submitting test attempt:', err);
      alert('Failed to submit test: ' + (err.response?.data?.message || err.message));
      setIsSubmitting(false);
    }
  };

  if (loading || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Initializing Secure Exam Session...
          </p>
        </div>
      </div>
    );
  }

  const questions = test.questions || [];
  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ?._id] || { 
    selectedOption: -1, 
    selectedOptions: [], 
    blankAnswer: '', 
    markedForReview: false 
  };

  const isCurrentAnswered = (qId) => {
    const a = answers[qId];
    if (!a) return false;
    if (a.selectedOption !== -1 && a.selectedOption !== undefined) return true;
    if (a.selectedOptions && a.selectedOptions.length > 0) return true;
    if (a.blankAnswer && a.blankAnswer.trim().length > 0) return true;
    return false;
  };

  // Calculate palette status counts
  let answeredCount = 0;
  let markedCount = 0;
  let unansweredCount = 0;

  questions.forEach(q => {
    if (isCurrentAnswered(q._id)) {
      answeredCount += 1;
    } else {
      unansweredCount += 1;
    }
    if (answers[q._id]?.markedForReview) {
      markedCount += 1;
    }
  });

  const qType = currentQ?.questionType || 'single';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors select-none">
      {/* 1. Exam Header Bar */}
      <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            {currentIndex + 1}
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
              {test.title}
            </h2>
            <span className="text-[11px] text-slate-400">
              Question {currentIndex + 1} of {questions.length} • Marks: +{currentQ?.marks || 4} / -{currentQ?.negativeMarks || 1}
            </span>
          </div>
        </div>

        {/* Center: Timers & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Per-Question Timer if applicable */}
          {test.timing?.mode === 'perQuestion' && questionTimeLeft !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Q Time: {formatTime(questionTimeLeft)}</span>
            </div>
          )}

          {/* Main Exam Timer with Color Shift */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-bold transition-all ${getTimerColorClass()}`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* 2. Main Exam Layout: Question Body + Sidebar Palette */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Left / Center: Question Panel */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            {/* Subject and Topic badge */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {currentQ?.subject || 'General'} • {currentQ?.topic || 'Mock Problem'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                  {qType === 'multiple' ? 'Multiple Correct' : qType === 'blank' ? 'Fill in Blank / Numerical' : 'Single Correct'}
                </span>
              </div>

              <button
                onClick={handleToggleReview}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                  currentAnswer.markedForReview
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${currentAnswer.markedForReview ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{currentAnswer.markedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            {/* Passage / Paragraph Snippet block if present */}
            {currentQ?.passageSnippet && (
              <div className="rounded-2xl bg-indigo-50/40 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700 p-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  <FileText className="w-4 h-4" />
                  <span>Reading Passage / Case Context</span>
                </div>
                <div className="whitespace-pre-line italic">
                  {currentQ.passageSnippet}
                </div>
              </div>
            )}

            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
              <span className="font-bold mr-2 text-indigo-600 dark:text-indigo-400">
                Q{currentIndex + 1}.
              </span>
              {currentQ?.text}
            </div>

            {/* Code Snippet block if present */}
            {currentQ?.codeSnippet && (
              <div className="rounded-2xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto border border-slate-800">
                <pre>{currentQ.codeSnippet}</pre>
              </div>
            )}

            {/* Answer Input depending on questionType */}
            {qType === 'blank' ? (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Enter your numerical or exact answer:
                </label>
                <input
                  type="text"
                  value={currentAnswer.blankAnswer || ''}
                  onChange={(e) => handleBlankChange(e.target.value)}
                  placeholder="Type your final answer here..."
                  className="w-full max-w-md px-4 py-3 rounded-xl border-2 border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  Note: Evaluation is case-insensitive and trims trailing whitespace.
                </p>
              </div>
            ) : qType === 'multiple' ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Select all correct options (Multiple Choice):
                </p>
                {currentQ?.options?.map((opt, optIdx) => {
                  const isSelected = (currentAnswer.selectedOptions || []).includes(optIdx);
                  const optionLabel = String.fromCharCode(65 + optIdx);

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleToggleMultiOption(optIdx)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : optionLabel}
                      </div>
                      <span className="text-sm font-medium flex-1">
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single Choice MCQ */
              <div className="space-y-3 pt-2">
                {currentQ?.options?.map((opt, optIdx) => {
                  const isSelected = currentAnswer.selectedOption === optIdx;
                  const optionLabel = String.fromCharCode(65 + optIdx);

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {optionLabel}
                      </div>
                      <span className="text-sm font-medium flex-1">
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Action Controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAnswer}
                disabled={!isCurrentAnswered(currentQ?._id)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Selection</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette Sidebar */}
        <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Question Palette
            </h3>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-400">Review ({markedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="text-slate-600 dark:text-slate-400">Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600 ring-2 ring-indigo-400/50" />
                <span className="text-slate-600 dark:text-slate-400">Active</span>
              </div>
            </div>

            {/* Grid of Numbered Badges */}
            <div className="grid grid-cols-5 gap-2.5 max-h-72 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAnswered = isCurrentAnswered(q._id);
                const isMarked = answers[q._id]?.markedForReview;
                const isCurrent = idx === currentIndex;

                let colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

                if (isCurrent) {
                  colorClasses = 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 shadow-sm';
                } else if (isMarked) {
                  colorClasses = 'bg-amber-500 text-white font-bold';
                } else if (isAnswered) {
                  colorClasses = 'bg-emerald-500 text-white font-bold';
                }

                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl text-xs flex items-center justify-center transition ${colorClasses}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Finalize & Submit Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Submission Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Test Submission"
        subtitle="Review your completion progress before concluding this test"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total Questions:</span>
              <span className="font-bold text-slate-900 dark:text-white">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Answered:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Marked for Review:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{markedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Unanswered:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{unansweredCount}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Once submitted, your responses will be evaluated instantly and our AI review engine will diagnose your performance.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Resume Exam
            </button>
            <button
              onClick={submitTest}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-60 transition"
            >
              {isSubmitting ? 'Evaluating...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
