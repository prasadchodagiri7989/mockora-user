import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  ArrowLeft, 
  BookOpen, 
  RefreshCw, 
  Check, 
  X, 
  HelpCircle,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function TestSummary() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'incorrect' | 'unanswered'
  const [isRegeneratingAI, setIsRegeneratingAI] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get(`/attempts/${attemptId}`);
        if (res.data.success) {
          const att = res.data.attempt;
          setAttempt(att);

          // Trigger celebratory confetti if score >= 70%
          if (att.accuracyPercentage >= 70) {
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#4F46E5', '#10B981', '#F59E0B', '#6366F1'],
            });
          }
        }
      } catch (err) {
        console.error('Failed to load attempt summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [attemptId]);

  const handleRegenerateAI = async () => {
    setIsRegeneratingAI(true);
    try {
      const res = await api.post(`/attempts/${attemptId}/ai-review`);
      if (res.data.success) {
        setAttempt(prev => ({ ...prev, aiReview: res.data.aiReview }));
      }
    } catch (err) {
      console.error('Error refreshing AI review:', err);
    } finally {
      setIsRegeneratingAI(false);
    }
  };

  if (loading || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Synthesizing Performance Diagnostics & AI Review...
          </p>
        </div>
      </div>
    );
  }

  const answers = attempt.answers || [];
  const aiReview = attempt.aiReview || {};

  const filteredAnswers = answers.filter((ans) => {
    if (filter === 'correct') return ans.isCorrect;
    if (filter === 'incorrect') return !ans.isCorrect && ans.selectedOption !== -1 && ans.selectedOption !== undefined;
    if (filter === 'unanswered') return ans.selectedOption === -1 || ans.selectedOption === undefined;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <Link
            to="/mock-tests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Examination Hub</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Attempt Performance Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {attempt.testId?.title || 'Mock Test'} • Submitted on {new Date(attempt.submittedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/test-taking/${attempt.testId?._id}`}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
          >
            Retake Test
          </Link>
        </div>
      </div>

      {/* 1. High-Level Performance KPI Scorecard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Score</span>
            <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {attempt.score} <span className="text-base text-slate-400 font-normal">/ {attempt.totalMarks}</span>
            </p>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              Scaled Exam Marks
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Accuracy Rate</span>
            <Award className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {attempt.accuracyPercentage}%
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {attempt.correctCount} Correct of {attempt.answers?.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Time Spent</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {Math.max(1, Math.round(attempt.timeSpentSeconds / 60))} <span className="text-base text-slate-400 font-normal">mins</span>
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {attempt.timeSpentSeconds} seconds total
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Question Tally</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs">
            <span className="font-bold text-emerald-600">{attempt.correctCount} Right</span>
            <span>•</span>
            <span className="font-bold text-rose-600">{attempt.incorrectCount} Wrong</span>
            <span>•</span>
            <span className="font-bold text-slate-400">{attempt.unansweredCount} Left</span>
          </div>
        </div>
      </div>

      {/* 2. AI Review Section (Section 7 from Master Prompt) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/30">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-white">
                  AI Performance Review & Study Plan
                </h3>
                <p className="text-xs text-indigo-200">
                  Automated concept deficiency diagnostics & personalized study roadmap
                </p>
              </div>
            </div>

            <button
              onClick={handleRegenerateAI}
              disabled={isRegeneratingAI}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-800/80 hover:bg-indigo-700 text-xs font-semibold text-indigo-200 border border-indigo-600/50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingAI ? 'animate-spin' : ''}`} />
              <span>{isRegeneratingAI ? 'Refreshing...' : 'Re-run AI Analysis'}</span>
            </button>
          </div>

          {/* AI Executive Summary Paragraph */}
          <div className="bg-indigo-900/40 rounded-2xl p-5 border border-indigo-500/20 leading-relaxed text-sm text-indigo-100">
            {aiReview.summaryText || 'Reviewing your test execution patterns...'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weak Areas List */}
            <div className="bg-black/20 rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Identified Weak Sub-Topics</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                {(aiReview.weakAreas && aiReview.weakAreas.length > 0) ? (
                  aiReview.weakAreas.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">No major weaknesses identified.</li>
                )}
              </ul>
            </div>

            {/* Suggested Topics to Revise */}
            <div className="bg-black/20 rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Suggested Revision Roadmap</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                {(aiReview.suggestedTopics && aiReview.suggestedTopics.length > 0) ? (
                  aiReview.suggestedTopics.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">Maintain current revision schedule.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Recommended Resources */}
          {aiReview.recommendedResources?.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block mb-2">
                Recommended Study Resources for this Test:
              </span>
              <div className="flex flex-wrap gap-2">
                {aiReview.recommendedResources.map((rec, i) => (
                  <Link
                    key={i}
                    to="/resources"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-xs font-medium text-indigo-200 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{rec}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Decorative background gradients */}
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* 3. Detailed Question-by-Question Breakdown */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Question-by-Question Detailed Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review your answers against the correct choices and official explanations
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {['all', 'correct', 'incorrect', 'unanswered'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  filter === f
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f} ({
                  f === 'all' ? answers.length :
                  f === 'correct' ? attempt.correctCount :
                  f === 'incorrect' ? attempt.incorrectCount :
                  attempt.unansweredCount
                })
              </button>
            ))}
          </div>
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {filteredAnswers.map((ans, idx) => {
            const q = ans.questionId || {};
            const isAnswered = ans.selectedOption !== -1 && ans.selectedOption !== undefined;
            const isCorrect = ans.isCorrect;
            const correctOpt = q.correctOptionIndex;

            return (
              <div
                key={ans._id || idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isCorrect ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                      !isAnswered ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}>
                      {isCorrect ? <Check className="w-4 h-4" /> : !isAnswered ? '—' : <X className="w-4 h-4" />}
                    </div>

                    <div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {q.subject || 'Section'} • {q.topic || 'Concept'}
                      </span>
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                    !isAnswered ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' :
                    'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                  }`}>
                    {isCorrect ? `+${q.marks || 4} Marks` : !isAnswered ? '0 Marks (Skipped)' : `-${q.negativeMarks || 1} Marks`}
                  </span>
                </div>

                {/* Question Statement */}
                <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                  {q.text}
                </p>

                {/* Code snippet if present */}
                {q.codeSnippet && (
                  <div className="rounded-2xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto border border-slate-800">
                    <pre>{q.codeSnippet}</pre>
                  </div>
                )}

                {/* Options List with comparative highlighting */}
                <div className="space-y-2 pt-2">
                  {q.options?.map((opt, optIdx) => {
                    const isUserChoice = ans.selectedOption === optIdx;
                    const isRightAnswer = optIdx === correctOpt;

                    let optionBorder = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300';

                    if (isRightAnswer) {
                      optionBorder = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold';
                    } else if (isUserChoice && !isCorrect) {
                      optionBorder = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-between text-xs transition ${optionBorder}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span>{opt}</span>
                        </div>

                        <div className="flex items-center gap-2 font-bold">
                          {isUserChoice && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px]">
                              Your Choice
                            </span>
                          )}
                          {isRightAnswer && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px]">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="rounded-2xl p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs leading-relaxed">
                    <p className="font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                      Concept Explanation:
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
