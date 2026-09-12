import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import FigureSequenceQuestion from '../../components/FigureSequenceQuestion';
import { 
  Target, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  Filter, 
  Sparkles,
  BookOpen,
  Layers,
  ChevronRight,
  ArrowLeft,
  Zap,
  Flame,
  Award,
  FileText,
  CheckSquare,
  Code2, 
  Stethoscope, 
  Atom, 
  Microscope, 
  Languages, 
  Briefcase
} from 'lucide-react';
import { CardSkeleton } from '../../components/SkeletonLoader';

const iconMap = {
  Code2,
  Stethoscope,
  Atom,
  Microscope,
  Languages,
  Briefcase,
  BookOpen,
};

// Practice drill types definition
const PRACTICE_TYPES = [
  {
    id: 'topic_drill',
    title: 'Topic & Concept Drill',
    description: 'Untimed, deep-dive practice focused on mastering fundamental concepts with instant step-by-step explanations.',
    icon: BookOpen,
    tag: 'Foundations',
    color: 'from-blue-500 to-indigo-600',
    mode: 'mcq'
  },
  {
    id: 'high_yield',
    title: 'High-Yield MCQ Speed Drill',
    description: 'Rapid-fire high-frequency examination questions to test recall, speed, and question recognition under pressure.',
    icon: Zap,
    tag: 'Speed & Recall',
    color: 'from-amber-500 to-orange-600',
    mode: 'mcq'
  },
  {
    id: 'exam_simulation',
    title: 'Exam Rigor Simulation Drill',
    description: 'Challenging questions calibrated strictly to current official examination weightage and negative markings.',
    icon: Award,
    tag: 'Advanced Rigor',
    color: 'from-rose-500 to-purple-600',
    mode: 'exam'
  },
  {
    id: 'passage_numerical',
    title: 'Passage & Numerical Drill',
    description: 'Case studies, data interpretation passages, and exact numerical value problems for deep problem-solving.',
    icon: FileText,
    tag: 'Problem Solving',
    color: 'from-emerald-500 to-teal-600',
    mode: 'mcq'
  }
];

export default function Practice() {
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Navigation hierarchy: null (Category Grid) -> selectedCategory (Drill Selection) -> activeDrill (Practice Runner)
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeDrill, setActiveDrill] = useState(null);

  // Question Runner State
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Session Statistics
  const [sessionStats, setSessionStats] = useState({
    attempted: 0,
    correct: 0,
    streak: 0,
  });

  // Current Question State
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedMultiOptions, setSelectedMultiOptions] = useState([]);
  const [blankAnswer, setBlankAnswer] = useState('');
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // 1. Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Failed to load practice categories:', err);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  // 2. Fetch questions when drill is selected
  useEffect(() => {
    if (!selectedCategory || !activeDrill) return;

    const fetchPractice = async () => {
      setLoadingQuestions(true);
      try {
        const query = new URLSearchParams();
        query.append('categoryId', selectedCategory._id);
        query.append('mode', activeDrill.mode);
        if (difficultyFilter !== 'all') {
          query.append('difficulty', difficultyFilter);
        }

        const res = await api.get(`/practice/questions?${query.toString()}`);
        if (res.data.success) {
          setQuestions(res.data.questions || []);
          setCurrentIndex(0);
          resetAnswerState();
        }
      } catch (err) {
        console.error('Failed to load practice questions:', err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchPractice();
  }, [selectedCategory, activeDrill, difficultyFilter]);

  const resetAnswerState = () => {
    setSelectedOption(null);
    setSelectedMultiOptions([]);
    setBlankAnswer('');
    setIsAnswerRevealed(false);
  };

  const currentQ = questions[currentIndex];
  let figureData = null;
  if (currentQ?.passageSnippet) {
    try {
      const parsedPassage = JSON.parse(currentQ.passageSnippet);
      if (parsedPassage?.type === 'figure_sequence') figureData = parsedPassage;
    } catch {
      figureData = null;
    }
  }

  // Evaluate Single MCQ
  const handleSelectOption = (index) => {
    if (isAnswerRevealed) return;
    setSelectedOption(index);
    setIsAnswerRevealed(true);

    const isRight = index === currentQ.correctOptionIndex;
    setSessionStats(prev => ({
      attempted: prev.attempted + 1,
      correct: prev.correct + (isRight ? 1 : 0),
      streak: isRight ? prev.streak + 1 : 0,
    }));
  };

  // Evaluate Multi-Option
  const handleToggleMulti = (index) => {
    if (isAnswerRevealed) return;
    setSelectedMultiOptions(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleRevealMulti = () => {
    if (isAnswerRevealed || !currentQ) return;
    setIsAnswerRevealed(true);
    const correctIndices = currentQ.correctOptionIndices || [currentQ.correctOptionIndex];
    const isRight = 
      selectedMultiOptions.length === correctIndices.length &&
      selectedMultiOptions.every(val => correctIndices.includes(val));

    setSessionStats(prev => ({
      attempted: prev.attempted + 1,
      correct: prev.correct + (isRight ? 1 : 0),
      streak: isRight ? prev.streak + 1 : 0,
    }));
  };

  // Evaluate Blank Answer
  const handleRevealBlank = () => {
    if (isAnswerRevealed || !currentQ) return;
    setIsAnswerRevealed(true);
    const expected = (currentQ.blankAnswer || '').trim().toLowerCase();
    const actual = blankAnswer.trim().toLowerCase();
    const isRight = expected.length > 0 && actual === expected;

    setSessionStats(prev => ({
      attempted: prev.attempted + 1,
      correct: prev.correct + (isRight ? 1 : 0),
      streak: isRight ? prev.streak + 1 : 0,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetAnswerState();
    }
  };

  const handleResetSession = () => {
    setSessionStats({ attempted: 0, correct: 0, streak: 0 });
    setCurrentIndex(0);
    resetAnswerState();
  };

  const accuracy = sessionStats.attempted > 0
    ? Math.round((sessionStats.correct / sessionStats.attempted) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Practice Arena
            </span>
            {selectedCategory && (
              <>
                <span className="text-slate-400">/</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {selectedCategory.name}
                </span>
              </>
            )}
            {activeDrill && (
              <>
                <span className="text-slate-400">/</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {activeDrill.title}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {!selectedCategory 
              ? 'Choose Practice Category' 
              : !activeDrill 
                ? `${selectedCategory.name} Practice Modes` 
                : activeDrill.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {!selectedCategory 
              ? 'Select any examination category to access tailored practice drills and problem types.'
              : !activeDrill 
                ? 'Select a specialized drill format designed for speed, topic mastery, or deep problem-solving.'
                : 'Zero time pressure. Instant solution & concept explanation immediately after every answer.'}
          </p>
        </div>

        {/* Back Buttons */}
        <div className="flex items-center gap-2">
          {activeDrill && (
            <button
              onClick={() => {
                setActiveDrill(null);
                setQuestions([]);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All {selectedCategory?.name} Drills</span>
            </button>
          )}
          {selectedCategory && !activeDrill && (
            <button
              onClick={() => {
                setSelectedCategory(null);
                setActiveDrill(null);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Categories</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: CATEGORY SELECTION (Matching Mock Test Categories) */}
      {!selectedCategory && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Examination Categories
            </h2>
            <span className="text-xs text-slate-400">
              {categories.length} Categories Available
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
                    onClick={() => setSelectedCategory(cat)}
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
                      <span>View Practice Drills</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DIFFERENT TYPES OF PRACTICE FOR THE SELECTED CATEGORY */}
      {selectedCategory && !activeDrill && (
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
                  {selectedCategory.name} Practice Drills
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a practice drill type below to target specific skills.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRACTICE_TYPES.map((drill) => {
              const DrillIcon = drill.icon;
              return (
                <div
                  key={drill.id}
                  onClick={() => setActiveDrill(drill)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/70 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${drill.color} text-white flex items-center justify-center shadow-md`}>
                        <DrillIcon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {drill.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {drill.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {drill.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition">
                    <span>Start This Drill</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: ACTIVE PRACTICE DRILL RUNNER */}
      {selectedCategory && activeDrill && (
        <div className="space-y-6">
          {/* Running Session Score Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Accuracy</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  {accuracy}%
                </p>
              </div>
              <div className="h-10 w-[1px] bg-indigo-700/60 hidden sm:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Attempted</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">
                  {sessionStats.correct} <span className="text-xs font-normal text-indigo-300">/ {sessionStats.attempted}</span>
                </p>
              </div>
              <div className="h-10 w-[1px] bg-indigo-700/60 hidden sm:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Current Streak</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                  {sessionStats.streak} 🔥
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleResetSession}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-800/80 hover:bg-indigo-700 text-xs font-semibold text-indigo-200 border border-indigo-600/40 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Drill</span>
              </button>
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Filter className="w-4 h-4" />
              <span>Filter Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {questions.length} Drill Questions
            </span>
          </div>

          {/* Question Display */}
          {loadingQuestions ? (
            <CardSkeleton />
          ) : !currentQ ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No practice questions found for this drill.
              </h3>
              <p className="text-xs text-slate-400 mt-1">Try switching difficulty or select another drill.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Metadata tags */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {currentQ.subject} • {currentQ.topic}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  currentQ.difficulty === 'Hard' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50' :
                  currentQ.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50' :
                  'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                }`}>
                  {currentQ.difficulty}
                </span>
              </div>

              {/* Passage snippet if present */}
              {currentQ.passageSnippet && !figureData && (
                <div className="rounded-2xl bg-indigo-50/40 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700 p-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Passage Context</span>
                  </div>
                  <div className="whitespace-pre-line italic">
                    {currentQ.passageSnippet}
                  </div>
                </div>
              )}

              {/* Question Text */}
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                {currentQ.text}
              </h2>

              {figureData && (
                <FigureSequenceQuestion
                  figureData={figureData}
                  selectedOptionIndex={selectedOption}
                  onOptionSelect={handleSelectOption}
                />
              )}

              {/* Code snippet if present */}
              {currentQ.codeSnippet && (
                <div className="rounded-2xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto border border-slate-800">
                  <pre>{currentQ.codeSnippet}</pre>
                </div>
              )}

              {/* Question Form based on questionType */}
              {currentQ.questionType === 'blank' ? (
                <div className="space-y-4 pt-2">
                  <input
                    type="text"
                    disabled={isAnswerRevealed}
                    value={blankAnswer}
                    onChange={(e) => setBlankAnswer(e.target.value)}
                    placeholder="Type your final answer..."
                    className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {!isAnswerRevealed && (
                    <button
                      onClick={handleRevealBlank}
                      disabled={!blankAnswer.trim()}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs block"
                    >
                      Check Answer
                    </button>
                  )}
                  {isAnswerRevealed && (
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-900 dark:text-indigo-300">
                      Expected Answer: <strong>{currentQ.blankAnswer}</strong>
                    </div>
                  )}
                </div>
              ) : currentQ.questionType === 'multiple' ? (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Select all that apply:
                  </p>
                  {currentQ.options?.map((option, index) => {
                    const isChecked = selectedMultiOptions.includes(index);
                    const correctIndices = currentQ.correctOptionIndices || [currentQ.correctOptionIndex];
                    const isCorrect = correctIndices.includes(index);

                    let optionStyle = 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700';

                    if (isAnswerRevealed) {
                      if (isCorrect) {
                        optionStyle = 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                      } else if (isChecked && !isCorrect) {
                        optionStyle = 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold';
                      }
                    } else if (isChecked) {
                      optionStyle = 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30';
                    }

                    return (
                      <div
                        key={index}
                        onClick={() => handleToggleMulti(index)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isChecked ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {isChecked ? <CheckSquare className="w-4 h-4" /> : String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-sm">{option}</span>
                        </div>
                      </div>
                    );
                  })}

                  {!isAnswerRevealed && (
                    <button
                      onClick={handleRevealMulti}
                      disabled={selectedMultiOptions.length === 0}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs"
                    >
                      Verify Selection
                    </button>
                  )}
                </div>
              ) : (
                /* Single Choice MCQ */
                <div className="space-y-3 pt-2">
                  {currentQ.options?.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const isCorrect = index === currentQ.correctOptionIndex;

                    let optionStyle = 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700';

                    if (isAnswerRevealed) {
                      if (isCorrect) {
                        optionStyle = 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold';
                      }
                    }

                    return (
                      <div
                        key={index}
                        onClick={() => handleSelectOption(index)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-sm">{option}</span>
                        </div>

                        {isAnswerRevealed && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        {isAnswerRevealed && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Instant Explanation Box */}
              {isAnswerRevealed && (
                <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>Concept & Solution Explanation</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {currentQ.explanation || 'Refer to fundamental principles and core equations for this syllabus topic.'}
                  </p>
                </div>
              )}

              {/* Bottom Nav Bar */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {isAnswerRevealed ? 'Answer evaluated.' : 'Select an option to evaluate immediately.'}
                </span>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === questions.length - 1}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
