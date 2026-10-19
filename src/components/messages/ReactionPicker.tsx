import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smiley,
  HandsClapping,
  Question,
  ArrowBendUpLeft,
  Copy,
  Trash,
} from '@phosphor-icons/react';
import { Message, Reaction } from '../../types';
import { PollResultMessage } from './PollResultMessage';

interface ReactionPickerProps {
  message: Message;
  isOwnMessage: boolean;
  bubbleRect: DOMRect | null;
  currentReaction?: Reaction['kind'] | null;
  onReact: (kind: Reaction['kind']) => void;
  onReply: () => void;
  onCopy: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

const REACTION_ICONS: { kind: Reaction['kind']; Icon: React.ComponentType<any> }[] = [
  { kind: 'Heart', Icon: Heart },
  { kind: 'ThumbsUp', Icon: ThumbsUp },
  { kind: 'ThumbsDown', Icon: ThumbsDown },
  { kind: 'Smiley', Icon: Smiley },
  { kind: 'HandsClapping', Icon: HandsClapping },
  { kind: 'Question', Icon: Question },
];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  message,
  isOwnMessage,
  bubbleRect,
  currentReaction,
  onReact,
  onReply,
  onCopy,
  onDelete,
  onClose,
}) => {
  const isPollResult = message.type === 'poll_result' && message.metadata;
  const isImageOnly = message.type === 'image' && Boolean(message.image_url);

  // Position calculations: open at on-screen position, slide smoothly if popups don't fit
  const windowH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const windowW = typeof window !== 'undefined' ? window.innerWidth : 400;

  const reactionBarHeight = 46;
  const gap = 10;
  const menuHeight = isOwnMessage && onDelete ? 134 : 90;

  const bubbleHeight = bubbleRect ? bubbleRect.height : 60;
  const originalBubbleTop = bubbleRect ? bubbleRect.top : (windowH - bubbleHeight) / 2;

  // Minimum top for bubble so reaction bar fits above it with comfortable safety margin
  const minBubbleTop = reactionBarHeight + gap + 16;
  // Maximum top for bubble so action menu fits below it with comfortable safety margin
  const maxBubbleTop = windowH - menuHeight - gap - bubbleHeight - 16;

  let targetBubbleTop = originalBubbleTop;
  if (targetBubbleTop < minBubbleTop) {
    targetBubbleTop = minBubbleTop;
  }
  if (targetBubbleTop > maxBubbleTop) {
    targetBubbleTop = Math.max(minBubbleTop, maxBubbleTop);
  }

  // How far the bubble must travel from its original position on screen
  const initialOffset = originalBubbleTop - targetBubbleTop;
  const clusterTop = targetBubbleTop - reactionBarHeight - gap;

  // Cluster width and horizontal position
  const clusterWidth = bubbleRect
    ? Math.min(windowW - 24, Math.max(bubbleRect.width, 240))
    : Math.min(windowW - 24, 320);

  let targetLeft = bubbleRect
    ? (isOwnMessage ? bubbleRect.right - clusterWidth : bubbleRect.left)
    : (windowW - clusterWidth) / 2;

  targetLeft = Math.max(12, Math.min(windowW - clusterWidth - 12, targetLeft));

  // Slide animation state
  const [hasSlid, setHasSlid] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setHasSlid(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const content = (
    <div className="fixed inset-0 z-[9998] select-none">
      {/* Blurred & dimmed backdrop that blurs everything behind the opened message */}
      <div
        onClick={onClose}
        style={{
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
        }}
        className="fixed inset-0 transition-opacity duration-200"
      />

      {/* Lifted message cluster with sliding animation to fit reaction bar and action menu */}
      <div
        style={{
          top: `${clusterTop}px`,
          left: `${targetLeft}px`,
          width: `${clusterWidth}px`,
          transform: hasSlid ? 'translateY(0) scale(1)' : `translateY(${initialOffset}px) scale(0.98)`,
          transition: 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`absolute z-[9999] flex flex-col ${
          isOwnMessage ? 'items-end' : 'items-start'
        } gap-2.5`}
      >
        {/* Reaction Bar: ALWAYS ON TOP of message */}
        <div
          style={{
            backdropFilter: 'blur(30px) saturate(190%)',
            WebkitBackdropFilter: 'blur(30px) saturate(190%)',
            backgroundColor: 'rgba(24, 24, 28, 0.75)',
          }}
          className="h-11 px-2.5 flex items-center gap-1 border border-white/[0.12] rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.5)] pointer-events-auto"
        >
          {REACTION_ICONS.map(({ kind, Icon }) => {
            const isSelected = currentReaction === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  onReact(kind);
                  onClose();
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-125 ${
                  isSelected
                    ? 'bg-[#0A84FF] text-white scale-110 shadow-sm'
                    : 'text-slate-200 hover:scale-115 active:scale-90 hover:bg-white/10'
                }`}
              >
                <Icon size={18} weight={isSelected ? 'fill' : 'regular'} />
              </button>
            );
          })}
        </div>

        {/* Lifted Message Box: Exactly matches chat bubble visual, NO emoji/trophy in poll object */}
        <div className="w-full pointer-events-none">
          {isImageOnly ? (
            <div className="flex flex-col items-center gap-1.5">
              <img
                src={message.image_url!}
                alt="Attachment"
                className="rounded-[20px] max-h-72 w-auto mx-auto object-cover shadow-2xl block"
              />
              {message.content && (
                <p className="text-sm px-2 text-white text-center whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>
          ) : isPollResult ? (
            <div
              className={`p-3.5 rounded-[20px] shadow-2xl text-white ${
                isOwnMessage
                  ? 'bg-[#0A84FF] rounded-br-[5px]'
                  : 'bg-[#262629] rounded-bl-[5px]'
              }`}
            >
              <PollResultMessage metadata={message.metadata} isOwn={isOwnMessage} />
            </div>
          ) : (
            <div
              className={`px-4 py-2.5 text-[15px] leading-[1.38] rounded-[20px] shadow-2xl ${
                isOwnMessage
                  ? 'bg-[#0A84FF] text-white rounded-br-[5px]'
                  : 'bg-[#262629] text-white rounded-bl-[5px]'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          )}
        </div>

        {/* Action Menu: ALWAYS UNDER the message, straight dividers */}
        <div
          style={{
            backdropFilter: 'blur(30px) saturate(190%)',
            WebkitBackdropFilter: 'blur(30px) saturate(190%)',
            backgroundColor: 'rgba(24, 24, 28, 0.75)',
          }}
          className="w-48 border border-white/[0.12] rounded-[20px] p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.5)] flex flex-col pointer-events-auto"
        >
          <button
            type="button"
            onClick={() => {
              onReply();
              onClose();
            }}
            className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-semibold text-slate-100 hover:bg-white/10 active:scale-98 cursor-pointer rounded-[14px] transition-colors"
          >
            <span>Reply</span>
            <ArrowBendUpLeft size={16} weight="bold" className="text-slate-400" />
          </button>

          {/* Straight 1px divider */}
          <div className="h-[1px] w-full bg-white/[0.10] my-0.5" />

          <button
            type="button"
            onClick={() => {
              onCopy();
              onClose();
            }}
            className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-semibold text-slate-100 hover:bg-white/10 active:scale-98 cursor-pointer rounded-[14px] transition-colors"
          >
            <span>Copy</span>
            <Copy size={16} weight="bold" className="text-slate-400" />
          </button>

          {isOwnMessage && onDelete && (
            <>
              {/* Straight 1px divider */}
              <div className="h-[1px] w-full bg-white/[0.10] my-0.5" />

              <button
                type="button"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-semibold text-red-400 hover:bg-red-500/15 active:scale-98 cursor-pointer rounded-[14px] transition-colors"
              >
                <span>Delete</span>
                <Trash size={16} weight="bold" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
