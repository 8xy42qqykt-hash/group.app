import React from 'react';
import { Avatar } from '../common/Avatar';

interface PollResultMessageProps {
  metadata: any;
  isOwn: boolean;
}

export const PollResultMessage: React.FC<PollResultMessageProps> = ({ metadata, isOwn }) => {
  if (!metadata) return null;
  const options = metadata.options || [];
  const totalVotes = metadata.total_votes || 1;

  // Poll name only: strictly NO icons or emojis in the poll object
  const cleanQuestion = metadata.question || 'Poll Results';

  return (
    <div className="flex flex-col gap-2 min-w-[240px] max-w-sm py-1">
      {/* Header: Poll name only, no icons or emojis */}
      <div className="flex items-center justify-between gap-2 border-b border-white/20 dark:border-white/10 pb-1.5">
        <span className="font-bold text-xs truncate text-white">
          {cleanQuestion}
        </span>
        <span className="text-[10px] opacity-75 shrink-0 text-white">
          {metadata.total_votes || 0} {metadata.total_votes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      {/* Options: Thin sliders, percentage above in right, voter pfps on left */}
      <div className="space-y-2.5 mt-1">
        {options.map((opt: any) => {
          const isWinner = opt.text === metadata.winner && opt.votes > 0;
          const pct = Math.round(((opt.votes || 0) / totalVotes) * 100);
          const voters = opt.voters || [];

          return (
            <div key={opt.id} className="space-y-1">
              {/* Top row: Option text + all users that voted pfps on left; percentage above in right */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className={`text-xs truncate text-white ${isWinner ? 'font-bold' : 'font-medium'}`}>
                    {opt.text}
                  </span>

                  {/* Overlapping voter pfps stack */}
                  {voters.length > 0 && (
                    <div className="flex -space-x-1.5 items-center shrink-0">
                      {voters.map((voter: any) => (
                        <div
                          key={voter.id}
                          className={`rounded-full ring-1.5 overflow-hidden ${
                            isOwn ? 'ring-[#0A84FF]' : 'ring-[#262629]'
                          }`}
                        >
                          <Avatar
                            name={voter.display_name}
                            avatarUrl={voter.avatar_url}
                            color={voter.color}
                            size={18}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Percentage number above in right */}
                <span className="text-[11px] font-semibold opacity-90 shrink-0 text-white">
                  {pct}%
                </span>
              </div>

              {/* Thin slider bar - WHITE not yellow */}
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/20">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isWinner
                      ? 'bg-white'
                      : 'bg-white/60'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: strictly NO icons or emojis in the poll object */}
      <div className="pt-1 text-[10px] opacity-75 flex justify-between items-center text-white">
        <span>Ended by {metadata.ended_by || 'Creator'}</span>
        {metadata.winner && metadata.winner !== 'No votes' && (
          <span className="font-semibold">
            Winner: {metadata.winner}
          </span>
        )}
      </div>
    </div>
  );
};
