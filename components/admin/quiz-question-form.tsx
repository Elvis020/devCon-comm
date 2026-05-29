'use client';

import { useState } from 'react';
import { Question } from '@/types';
import { DEFAULT_TIME_LIMIT, DEFAULT_POINTS } from '@/lib/constants';

interface QuizQuestionFormProps {
  question?: Question;
  onSubmit: (data: {
    question_text: string;
    options: string[];
    correct_index: number;
    time_limit_seconds: number;
    points: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export function QuizQuestionForm({ question, onSubmit, onCancel }: QuizQuestionFormProps) {
  const [questionText, setQuestionText] = useState(question?.question_text || '');
  const [options, setOptions] = useState<string[]>(
    question?.options || ['', '', '', '']
  );
  const [correctIndex, setCorrectIndex] = useState(question?.correct_index ?? 0);
  const [timeLimit, setTimeLimit] = useState(question?.time_limit_seconds || DEFAULT_TIME_LIMIT);
  const [points, setPoints] = useState(question?.points || DEFAULT_POINTS);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all options are filled
    if (options.some(opt => !opt.trim())) {
      alert('All 4 options must be filled in');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        question_text: questionText,
        options,
        correct_index: correctIndex,
        time_limit_seconds: timeLimit,
        points,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const optionColors = [
    'bg-red-900/20 border-red-400/30 text-white placeholder:text-red-400/50',
    'bg-blue-900/20 border-blue-400/30 text-white placeholder:text-blue-400/50',
    'bg-yellow-900/20 border-yellow-400/30 text-white placeholder:text-yellow-400/50',
    'bg-green-900/20 border-green-400/30 text-white placeholder:text-green-400/50',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="question_text" className="block text-xs font-mono font-bold text-dc-yellow mb-2 uppercase">
          Question Text *
        </label>
        <textarea
          id="question_text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          required
          rows={3}
          placeholder="e.g., What does CSS stand for?"
          className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 text-white px-4 py-3 font-mono focus:border-dc-yellow focus:outline-none transition-colors resize-none placeholder:text-dc-gray"
        />
      </div>

      <div>
        <label className="block text-xs font-mono font-bold text-dc-yellow mb-2 uppercase">
          Answer Options * (select the correct answer)
        </label>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="radio"
                name="correct_answer"
                checked={correctIndex === index}
                onChange={() => setCorrectIndex(index)}
                className="w-5 h-5 accent-dc-yellow cursor-pointer"
              />
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[index] = e.target.value;
                  setOptions(newOptions);
                }}
                required
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                className={`flex-1 border-2 px-4 py-3 font-mono focus:border-dc-yellow focus:outline-none transition-colors ${optionColors[index]}`}
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-dc-gray font-mono mt-2">
          Select the radio button to mark the correct answer
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="time_limit" className="block text-xs font-mono font-bold text-dc-yellow mb-2 uppercase">
            Time Limit (seconds)
          </label>
          <input
            type="number"
            id="time_limit"
            value={timeLimit}
            onChange={(e) => setTimeLimit(parseInt(e.target.value))}
            min="5"
            max="60"
            required
            className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 text-white px-4 py-3 font-mono focus:border-dc-yellow focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label htmlFor="points" className="block text-xs font-mono font-bold text-dc-yellow mb-2 uppercase">
            Base Points
          </label>
          <input
            type="number"
            id="points"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value))}
            min="100"
            max="5000"
            step="100"
            required
            className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 text-white px-4 py-3 font-mono focus:border-dc-yellow focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="bg-dc-yellow text-dc-dark px-6 py-3 font-bold font-mono hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
        >
          {submitting ? 'SAVING...' : question ? 'UPDATE QUESTION' : 'ADD QUESTION'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-dc-dark-2 border-2 border-dc-dark-3 text-white px-6 py-3 font-bold font-mono hover:border-dc-yellow/30 transition-colors uppercase tracking-wide"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
