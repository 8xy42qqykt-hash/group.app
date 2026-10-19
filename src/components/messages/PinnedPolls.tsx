import React, { useState } from 'react';
import { CaretDown, Check, Trophy } from '@phosphor-icons/react';
import { Poll } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

interface PinnedPollsProps {
  polls: Poll[];
  onVote: (pollId: string, optionId: string) => Promise<void>;
  onEndPoll: (pollId: string) => Promise<void>;
}

export const PinnedPolls: React.FC<PinnedPollsProps> = ({
  polls,
  onVote,
  onEndPoll,
}) => {
  const { user } = useAuth();
  const openPolls = polls.filter((p) => !p.is_closed);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedOptionVotersId, setExpandedOptionVotersId] = useState<string | null>(null);
  const [endingPollId, setEndingPollId] = useState<string | null>(null);

  if (openPolls.length === 0) return null;

  const activeIndex = Math.min(currentIndex, openPolls.length - 1);
  const poll = openPolls[activeIndex];
  const isCreator = user && poll.creator_id === user.id;
  const totalVotes = poll.total_votes || 0;

  // Find max votes to identify winner(s)
  let maxVotes = 0;
  for (const opt of poll.options) {
    if ((opt.votes_count || 0) > maxVotes) {
      maxVotes = opt.votes_count || 0;
    }
  }

  const handleEnd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setEndingPollId(poll.id);
    await onEndPoll(poll.id);
    setEndingPollId(null);
  };

  const toggleShowVoters = (optId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedOptionVotersId((prev) => (prev === optId ? null : optId));
  };

  return (
    <>
      {/* Backdrop overlay when poll is expanded */}
      {isExpanded && (
        <div
          onClick={() => {
            setIsExpanded(false);
            setExpandedOptionVotersId(null);
          }}
          className="fixed inset-0 z-25 bg-black/20 backdrop-blur-xs pointer-events-auto transition-opacity duration-250"
        />
      )}

      {/* Floating Overlay container - Positioned on top of message field, NOT on top of top bar */}
      <div className="absolute top-14 left-0 right-0 z-30 pointer-events-none px-3 pt-2">
        <div
          style={{
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
          className="pointer-events-auto w-full max-w-md mx-auto bg-white/85 dark:bg-[#202024]/85 border border-black/[0.06] dark:border-white/[0.08] rounded-[22px] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out select-none"
        >
          {/* Header Bar */}
          <div
            onClick={() => {
              setIsExpanded(!isExpanded);
              setExpandedOptionVotersId(null);
            }}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex-1 pr-2 truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {poll.question}
                </span>
              </div>

              {/* Thin preview bar */}
              <div className="w-full h-1 bg-black/5 dark:bg-white/10 rounded-full mt-1.5 flex overflow-hidden">
                {poll.options.map((opt) => {
                  const count = opt.votes_count || 0;
                  const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                  if (pct <= 0) return null;
                  const isWinning = count === maxVotes && maxVotes > 0;
                  return (
                    <div
                      key={opt.id}
                      style={{ width: `${pct}%` }}
                      className={`h-full transition-all duration-300 ${
                        isWinning
                          ? 'bg-[#007AFF] dark:bg-[#0A84FF]'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-slate-400">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </span>
              <CaretDown
                size={14}
                weight="bold"
                className={`transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : ''}`}
              />
            </div>
          </div>

          {/* Swipe dots if multiple open polls */}
          {openPolls.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {openPolls.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === activeIndex
                      ? 'w-4 bg-[#007AFF] dark:bg-[#0A84FF]'
                      : 'w-1.5 bg-black/15 dark:bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Smoothly Animated Expanded Voting Options */}
          <div
            className={`transition-all duration-300 ease-out overflow-hidden ${
              isExpanded ? 'max-h-[60vh] opacity-100 mt-2.5 pt-1.5' : 'max-h-0 opacity-0 mt-0 pt-0'
            }`}
          >
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-0.5">
              {poll.options.map((opt) => {
                const count = opt.votes_count || 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const hasVoted = Boolean(opt.has_voted);
                const isWinning = totalVotes > 0 && count === maxVotes && maxVotes > 0;
                const isLosing = totalVotes > 0 && !isWinning;
                const isVotersOpen = expandedOptionVotersId === opt.id;
                const voters = opt.voters || [];

                return (
                  <div key={opt.id} className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onVote(poll.id, opt.id)}
                      className={`relative w-full min-h-[42px] rounded-[16px] overflow-hidden px-3.5 py-1.5 flex items-center justify-between text-left active:scale-[0.99] cursor-pointer transition-all ${
                        isLosing
                          ? 'bg-black/5 dark:bg-white/5 opacity-70'
                          : 'bg-black/5 dark:bg-white/10'
                      }`}
                    >
                      {/* Bar fill */}
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-300 ease-out ${
                          isWinning
                            ? 'bg-[#007AFF]/20 dark:bg-[#0A84FF]/25'
                            : 'bg-slate-300/40 dark:bg-white/10'
                        }`}
                        style={{ width: `${pct}%` }}
                      />

                      <div className="relative z-10 flex items-center gap-2 flex-1 pr-2 truncate">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                            hasVoted
                              ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                              : 'border border-slate-300 dark:border-white/20'
                          }`}
                        >
                          {hasVoted && <Check size={10} weight="bold" />}
                        </div>

                        <span
                          className={`text-xs truncate ${
                            isWinning
                              ? 'font-bold text-slate-900 dark:text-white'
                              : isLosing
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'font-medium text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {opt.text}
                        </span>
                      </div>

                      {/* Right side: ALL voter profile icons + pct */}
                      <div className="relative z-10 flex items-center gap-2 shrink-0">
                        {voters.length > 0 && (
                          <div
                            onClick={(e) => toggleShowVoters(opt.id, e)}
                            className="flex -space-x-1.5 overflow-hidden p-0.5 rounded-full hover:opacity-80 active:scale-95 transition-transform"
                            title="View all voters"
                          >
                            {voters.map((voter) => (
                              <Avatar
                                key={voter.id}
                                name={voter.display_name}
                                avatarUrl={voter.avatar_url}
                                color={voter.color}
                                size={18}
                              />
                            ))}
                          </div>
                        )}

                        <span
                          className={`text-[11px] font-semibold ${
                            isWinning
                              ? 'text-[#007AFF] dark:text-[#0A84FF]'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                    </button>

                    {/* Expanded Voter Names List */}
                    {isVotersOpen && voters.length > 0 && (
                      <div className="pl-6 pr-2 py-1.5 flex flex-wrap gap-1.5 bg-black/5 dark:bg-white/5 rounded-[12px] animate-calm-fade-in text-[11px]">
                        {voters.map((voter) => (
                          <div key={voter.id} className="flex items-center gap-1 bg-white/70 dark:bg-black/40 px-2 py-0.5 rounded-full shadow-2xs">
                            <Avatar
                              name={voter.display_name}
                              avatarUrl={voter.avatar_url}
                              color={voter.color}
                              size={14}
                            />
                            <span className="text-slate-800 dark:text-slate-200">
                              {voter.display_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total votes footer */}
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-2 mt-1 border-t border-black/5 dark:border-white/5">
              Total votes: {totalVotes}
            </div>

            {/* Creator End Poll action */}
            {isCreator && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleEnd}
                  disabled={endingPollId === poll.id}
                  className="px-3 py-1 rounded-[14px] text-xs font-semibold text-red-500 hover:bg-red-500/10 active:scale-95 cursor-pointer transition-transform"
                >
                  {endingPollId === poll.id ? 'Ending...' : 'End poll'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
