import {Bot, Send} from 'lucide-react';
import {useState} from 'react';

interface ChatMessage {
  role: 'user' | 'tutor';
  text: string;
}

interface AITutorPanelProps {
  token: string;
  languageName: string;
  lessonTitle: string;
  lessonSummary: string;
  exercisePrompt: string;
  studentCode: string;
}

const QUICK_QUESTIONS = [
  'Explain this concept in simple words',
  'What should I check first in my code?',
  'Why is this syntax needed here?',
];

export function AITutorPanel({
  token,
  languageName,
  lessonTitle,
  lessonSummary,
  exercisePrompt,
  studentCode,
}: AITutorPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'tutor',
      text: `Hi! I'm your ${languageName} Learning Tutor. Ask me anything about "${lessonTitle}" or paste a question about your attempt—I'll help you understand the concept without giving away the answer.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askTutor = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    setError(null);
    setMessages((prev) => [...prev, {role: 'user', text: trimmed}]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          languageName,
          lessonTitle,
          lessonSummary,
          exercisePrompt,
          studentCode,
          question: trimmed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not reach the AI Tutor.');
        return;
      }
      setMessages((prev) => [...prev, {role: 'tutor', text: data.reply}]);
    } catch {
      setError('Network error reaching the AI Tutor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askTutor(input);
  };

  return (
    <section className="studio-surface rounded-2xl border p-6">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              AI Study Guide
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explains concepts &amp; guides your thinking without spoiling answers
            </p>
          </div>
        </div>
      </div>

      {/* Quick Starter Prompts */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={loading}
            onClick={() => askTutor(q)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Conversation History */}
      <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`rounded-xl px-4 py-3 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'ml-6 bg-blue-600 text-white'
                : 'mr-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200'
            }`}
          >
            <p className="mb-1 font-semibold opacity-80">
              {msg.role === 'user' ? 'You' : 'Learning HQ Tutor'}
            </p>
            <p className="whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
        {loading && (
          <div className="mr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
            Thinking through a helpful hint...
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3.5 py-2 text-xs font-medium text-red-700 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask what a keyword does or how to approach the exercise..."
          aria-label="Ask AI Tutor a question"
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </section>
  );
}
