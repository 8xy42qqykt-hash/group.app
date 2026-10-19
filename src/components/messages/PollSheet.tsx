import React, { useState } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { CustomToggle } from '../common/CustomToggle';
import { Trash } from '@phosphor-icons/react';

interface PollSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (question: string, options: string[], multiple: boolean) => Promise<void>;
}

export const PollSheet: React.FC<PollSheetProps> = ({
  isOpen,
  onClose,
  onCreatePoll,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [multiple, setMultiple] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (options.length < 8) {
        setOptions([...options, '']);
      }
    }
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = question.trim();
    const cleanOpts = options.map((o) => o.trim()).filter(Boolean);
    if (!cleanQ || cleanOpts.length < 2) return;

    setLoading(true);
    await onCreatePoll(cleanQ, cleanOpts, multiple);
    setLoading(false);
    setQuestion('');
    setOptions(['', '']);
    setMultiple(false);
    onClose();
  };

  const canSubmit = question.trim() && options.filter((o) => o.trim()).length >= 2;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="text-sm font-semibold text-slate-900 dark:text-white px-1">
          Create a Poll
        </div>
        <div>
          <input
            type="text"
            autoFocus
            placeholder="Ask question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full h-11 px-4 rounded-[16px] bg-white/10 text-white placeholder:text-slate-400 text-sm border border-white/[0.08]"
          />
        </div>
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="flex-1 h-10 px-3.5 rounded-[14px] bg-white/10 text-white placeholder:text-slate-400 text-sm border border-white/[0.08]"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 active-press cursor-pointer"
                >
                  <Trash size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 8 && (
          <button
            type="button"
            onClick={() => setOptions([...options, ''])}
            className="text-xs font-semibold text-[#007AFF] dark:text-[#3A76F0] self-start py-1 active-press cursor-pointer"
          >
            + Add option
          </button>
        )}
        <div className="py-0.5">
          <CustomToggle
            checked={multiple}
            onChange={setMultiple}
            label="Multiple answers"
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full h-11 mt-1 mb-3 rounded-[20px] bg-[#007AFF] dark:bg-[#0A84FF] text-white font-semibold text-sm flex items-center justify-center active-press cursor-pointer disabled:opacity-40 shadow-sm"
        >
          {loading ? 'Creating...' : 'Create Poll'}
        </button>
      </form>
    </BottomSheet>
  );
};
