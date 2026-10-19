import React, { useRef, useState } from 'react';
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smiley,
  HandsClapping,
  Question,
  Trophy,
} from '@phosphor-icons/react';
import { Message, Reaction } from '../../types';
import { Avatar } from '../common/Avatar';
import { ReactionPicker } from './ReactionPicker';
import { PollResultMessage } from './PollResultMessage';
import { formatMessageTime } from '../../utils/date';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  currentUserId?: string;
  onDoubleTapHeart: (messageId: string) => void;
  onReact: (messageId: string, kind: Reaction['kind']) => void;
  onReply: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  replyMessage?: Message | null;
}

const REACTION_ICON_MAP: Record<Reaction['kind'], React.ComponentType<any>> = {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smiley,
  HandsClapping,
  Question,
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isOwn,
  isFirstInGroup,
  isLastInGroup,
  currentUserId,
  onDoubleTapHeart,
  onReact,
  onReply,
  onDelete,
  replyMessage,
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [bubbleRect, setBubbleRect] = useState<DOMRect | null>(null);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Gesture handling: double-tap (<300ms) & long-press (320ms)
  const lastTapTimeRef = useRef<number>(0);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const didLongPressRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    didLongPressRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    pressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      if (bubbleRef.current) {
        setBubbleRect(bubbleRef.current.getBoundingClientRect());
      }
      setShowReactionPicker(true);
    }, 320);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 8 || dy > 8) {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (didLongPressRef.current) {
      return;
    }
    const now = Date.now();
    const timeDiff = now - lastTapTimeRef.current;
    if (timeDiff < 300) {
      onDoubleTapHeart(message.id);
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const copyContent = () => {
    navigator.clipboard.writeText(message.content || message.image_url || '');
  };

  // Group reactions by kind
  const groupedReactions: { kind: Reaction['kind']; count: number; userHasReacted: boolean }[] = [];
  let userCurrentReaction: Reaction['kind'] | null = null;
  if (message.reactions && message.reactions.length > 0) {
    const map = new Map<Reaction['kind'], { count: number; userHasReacted: boolean }>();
    for (const r of message.reactions) {
      const existing = map.get(r.kind) || { count: 0, userHasReacted: false };
      existing.count += 1;
      if (r.user_id === currentUserId) {
        existing.userHasReacted = true;
        userCurrentReaction = r.kind;
      }
      map.set(r.kind, existing);
    }
    for (const [kind, data] of map.entries()) {
      groupedReactions.push({ kind, count: data.count, userHasReacted: data.userHasReacted });
    }
  }

  const isPollResult = message.type === 'poll_result' && message.metadata;
  const isImageOnly = message.type === 'image' && Boolean(message.image_url);

  // Clean rounded bubbles with only the sender's bottom corner less rounded (no extra tails)
  const getBubbleRadiusClasses = () => {
    if (isImageOnly) return 'rounded-[20px]';
    if (isOwn) {
      return 'rounded-[20px] rounded-br-[5px]';
    } else {
      return 'rounded-[20px] rounded-bl-[5px]';
    }
  };

  return (
    <div
      className={`relative flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${
        isFirstInGroup ? 'mt-2.5' : 'mt-[2px]'
      } select-none`}
    >
      {/* Sender name for others (first bubble of group only) */}
      {!isOwn && isFirstInGroup && (
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 ml-9 mb-1">
          {message.sender?.display_name || 'Member'}
        </span>
      )}

      {/* Row containing avatar NEXT to bubble */}
      <div className={`relative flex items-end gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <div className="w-7 h-7 shrink-0 flex items-end">
            {isLastInGroup ? (
              <Avatar
                name={message.sender?.display_name}
                avatarUrl={message.sender?.avatar_url}
                color={message.sender?.color}
                size={28}
              />
            ) : (
              <div className="w-7 h-7" />
            )}
          </div>
        )}

        <div className="relative flex flex-col">
          {/* Reaction Picker overlay */}
          {showReactionPicker && (
            <ReactionPicker
              message={message}
              isOwnMessage={isOwn}
              bubbleRect={bubbleRect}
              currentReaction={userCurrentReaction}
              onReact={(kind) => onReact(message.id, kind)}
              onReply={() => onReply(message)}
              onCopy={copyContent}
              onDelete={isOwn && onDelete ? () => onDelete(message.id) : undefined}
              onClose={() => setShowReactionPicker(false)}
            />
          )}

          {/* Double tap heart spring pop animation */}
          {showHeartPop && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-ping">
              <Heart size={44} weight="fill" className="text-red-500 drop-shadow-md" />
            </div>
          )}

          {/* Image Bubble */}
          {isImageOnly ? (
            <div
              ref={bubbleRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onContextMenu={handleContextMenu}
              className="chat-bubble-touch active:scale-[0.98] cursor-pointer relative bg-transparent p-0 transition-transform flex flex-col gap-1.5"
            >
              {replyMessage && (
                <div className="mb-1 px-3 py-1 rounded-[14px] text-xs bg-black/10 dark:bg-white/10 text-slate-800 dark:text-slate-200">
                  <div className="font-semibold text-[10px] opacity-75">
                    {replyMessage.sender?.display_name || 'Member'}
                  </div>
                  <div className="truncate text-[11px]">{replyMessage.content}</div>
                </div>
              )}
              <img
                src={message.image_url!}
                alt="Attachment"
                className="rounded-[20px] max-h-72 w-auto object-cover select-none shadow-sm block"
              />
              {message.content && (
                <p className="text-sm px-1 text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>
          ) : (
            <div className="relative">
              <div
                ref={bubbleRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onContextMenu={handleContextMenu}
                className={`chat-bubble-touch active:scale-[0.98] cursor-pointer relative px-3.5 py-2 text-[15px] leading-[1.38] transition-transform ${getBubbleRadiusClasses()} ${
                  isOwn
                    ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-2xs'
                    : 'bg-[#E9E9EB] dark:bg-[#262629] text-black dark:text-white shadow-2xs'
                }`}
              >
                {/* Reply Preview */}
                {replyMessage && (
                  <div
                    className={`mb-1.5 px-2.5 py-1 rounded-[14px] text-xs ${
                      isOwn
                        ? 'bg-black/15 text-white/90'
                        : 'bg-black/5 dark:bg-white/10 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-[10px] opacity-75">
                      {replyMessage.sender?.display_name || 'Member'}
                    </div>
                    <div className="truncate text-[11px]">{replyMessage.content}</div>
                  </div>
                )}

                {/* Poll Result Message in Chat Log */}
                {isPollResult ? (
                  <PollResultMessage metadata={message.metadata} isOwn={isOwn} />
                ) : (
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Circular Glass Badge on TOP CORNER of bubble */}
          {groupedReactions.length > 0 && (
            <div
              className={`absolute -top-2.5 z-20 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/10 select-none animate-calm-fade-in ${
                isOwn ? '-left-2' : '-right-2'
              }`}
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
            >
              {groupedReactions.slice(0, 2).map(({ kind, count, userHasReacted }) => {
                const Icon = REACTION_ICON_MAP[kind];
                return (
                  <span
                    key={kind}
                    className="flex items-center gap-0.5 text-slate-800 dark:text-slate-900"
                  >
                    <Icon
                      size={13}
                      weight={userHasReacted ? 'fill' : 'regular'}
                      className={userHasReacted ? 'text-[#007AFF]' : 'text-slate-800'}
                    />
                    {count > 1 && (
                      <span className="text-[10px] font-bold text-slate-700">
                        {count}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sent time outside bubble */}
      {isLastInGroup && (
        <span
          className={`text-[10px] text-slate-400 dark:text-slate-500 mt-1 ${
            isOwn ? 'mr-1' : 'ml-9'
          }`}
        >
          {formatMessageTime(message.created_at)}
        </span>
      )}
    </div>
  );
};
