import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowUp,
  Plus,
  Camera,
  Image as ImageIcon,
  ChartBar,
  X,
  CaretLeft,
} from '@phosphor-icons/react';
import { useTrip } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types';
import { ChatBubble } from './ChatBubble';
import { PinnedPolls } from './PinnedPolls';
import { PollSheet } from './PollSheet';
import { CameraModal } from '../common/CameraModal';
import { Avatar } from '../common/Avatar';
import { CustomScrollArea } from '../common/CustomScrollArea';
import { formatMessageDaySeparator } from '../../utils/date';
import { uploadAsset } from '../../lib/supabase';

export const MessagesView: React.FC = () => {
  const {
    currentTrip,
    tripMembers,
    messages,
    polls,
    sendMessage,
    deleteMessage,
    toggleReaction,
    createPoll,
    votePoll,
    endPoll,
    exitTrip,
  } = useTrip();
  const { user } = useAuth();

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isPollSheetOpen, setIsPollSheetOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Virtual keyboard tracking for mobile
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setIsKeyboardOpen(true);
    const vv = window.visualViewport;
    if (vv) {
      const diff = window.innerHeight - vv.height;
      if (diff > 40) {
        setKeyboardHeight(diff);
      }
    }
    setTimeout(scrollToBottom, 60);
  };

  const handleBlur = () => {
    setTimeout(() => {
      const vv = window.visualViewport;
      if (!vv || window.innerHeight - vv.height <= 40) {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
      }
    }, 120);
  };

  // Track visualViewport for iOS and mobile keyboard changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const diff = window.innerHeight - vv.height;
      const isOpen = diff > 40;
      setIsKeyboardOpen(isOpen);
      setKeyboardHeight(isOpen ? diff : 0);
      if (isOpen) {
        setTimeout(scrollToBottom, 60);
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);
    window.addEventListener('resize', handleViewportChange);

    handleViewportChange();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollH = textarea.scrollHeight;
      const newHeight = Math.min(scrollH, 120);
      textarea.style.height = `${Math.max(36, newHeight)}px`;
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }
    const replyId = replyingTo?.id;
    setReplyingTo(null);
    await sendMessage(clean, undefined, replyId);
    setTimeout(scrollToBottom, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setIsPlusMenuOpen(false);
    try {
      const url = await uploadAsset(file, 'chat');
      const replyId = replyingTo?.id;
      setReplyingTo(null);
      await sendMessage('', url, replyId);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.warn('Image upload error:', err);
    } finally {
      setUploadingImage(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleCameraCapture = async (blob: Blob) => {
    setUploadingImage(true);
    setIsCameraOpen(false);
    try {
      const url = await uploadAsset(blob, 'chat');
      const replyId = replyingTo?.id;
      setReplyingTo(null);
      await sendMessage('', url, replyId);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.warn('Camera upload error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDoubleTapHeart = (messageId: string) => {
    toggleReaction(messageId, 'Heart');
  };

  // Group messages logic (within 3 minutes)
  const messageGroups: {
    message: Message;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    showDaySeparator: boolean;
    dayLabel: string;
  }[] = [];

  for (let i = 0; i < messages.length; i++) {
    const curr = messages[i];
    const prev = messages[i - 1];
    const next = messages[i + 1];

    const currDate = new Date(curr.created_at).toDateString();
    const prevDate = prev ? new Date(prev.created_at).toDateString() : null;
    const showDaySeparator = currDate !== prevDate;
    const dayLabel = formatMessageDaySeparator(curr.created_at);

    const isPrevSame =
      prev &&
      prev.user_id === curr.user_id &&
      !showDaySeparator &&
      Math.abs(new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()) < 180000;

    const nextDate = next ? new Date(next.created_at).toDateString() : null;
    const isNextSame =
      next &&
      next.user_id === curr.user_id &&
      currDate === nextDate &&
      Math.abs(new Date(next.created_at).getTime() - new Date(curr.created_at).getTime()) < 180000;

    messageGroups.push({
      message: curr,
      isFirstInGroup: !isPrevSame,
      isLastInGroup: !isNextSame,
      showDaySeparator,
      dayLabel,
    });
  }

  const hasOpenPolls = polls.some((p) => !p.is_closed);

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto relative bg-[#f2f2f7] dark:bg-black overflow-hidden select-none">
      {/* Translucent blurred top bar with trip picture stack & centered trip name (NO ARROW) - tall enough to never overflow */}
      <header
        style={{
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}
        className="shrink-0 min-h-[4.25rem] pt-[max(0.6rem,env(safe-area-inset-top))] pb-2.5 px-3.5 flex items-center justify-between z-20 bg-white/75 dark:bg-[#1c1c1e]/75 border-b border-black/[0.06] dark:border-white/[0.08] select-none transition-colors"
      >
        {/* Left: Back to Trips */}
        <button
          type="button"
          onClick={exitTrip}
          className="flex items-center gap-0.5 text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] active-press cursor-pointer py-1 pr-1 -ml-1"
          title="Exit to My Trips"
        >
          <CaretLeft size={16} weight="bold" />
          <span>Trips</span>
        </button>

        {/* Center: Group Picture Stack and Trip Name strictly WITHOUT any arrow */}
        <div className="flex flex-col items-center justify-center">
          {/* Overlapping member avatars stack */}
          <div className="flex -space-x-2 items-center justify-center mb-1">
            {tripMembers.length > 0 ? (
              tripMembers.slice(0, 3).map((m, idx) => (
                <div
                  key={m.user_id}
                  className="rounded-full ring-2 ring-white dark:ring-[#1c1c1e] overflow-hidden"
                  style={{ zIndex: 10 - idx }}
                >
                  <Avatar
                    name={m.profile?.display_name}
                    avatarUrl={m.profile?.avatar_url}
                    color={m.profile?.color}
                    size={24}
                  />
                </div>
              ))
            ) : (
              <Avatar
                name={currentTrip?.name || 'Trip'}
                color="#007AFF"
                size={24}
              />
            )}
          </div>

          {/* Centered trip name without arrow */}
          <span className="text-[13px] font-semibold text-slate-900 dark:text-white max-w-[170px] truncate leading-tight text-center">
            {currentTrip?.name || 'Trip'}
          </span>
        </div>

        {/* Right side invite code chip */}
        <div className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 px-1">
          {currentTrip?.invite_code}
        </div>
      </header>

      {/* Floating Pinned Polls Overlay (Positioned over message field, below header) */}
      <PinnedPolls
        polls={polls}
        onVote={votePoll}
        onEndPoll={endPoll}
      />

      {/* Messages Scroll Area - starts from the top with generous clearance so messages never go under the input bar */}
      <CustomScrollArea scrollRef={scrollRef} className="flex-1 px-3">
        <div
          className={`flex flex-col justify-start min-h-full ${hasOpenPolls ? 'pt-24' : 'pt-3'}`}
          style={{
            paddingBottom: isKeyboardOpen
              ? `${Math.max(keyboardHeight, 0) + 72}px`
              : 'calc(env(safe-area-inset-bottom, 0px) + 6.5rem)',
          }}
        >
          {messageGroups.map(({ message, isFirstInGroup, isLastInGroup, showDaySeparator, dayLabel }) => {
            const replyMsg = message.reply_to
              ? messages.find((m) => m.id === message.reply_to)
              : null;

            return (
              <React.Fragment key={message.id}>
                {showDaySeparator && (
                  <div className="flex justify-center my-3 animate-calm-fade-in">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 select-none">
                      {dayLabel}
                    </span>
                  </div>
                )}
                <ChatBubble
                  message={message}
                  isOwn={user ? message.user_id === user.id : false}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  currentUserId={user?.id}
                  onDoubleTapHeart={handleDoubleTapHeart}
                  onReact={(mId, kind) => toggleReaction(mId, kind)}
                  onReply={(m) => setReplyingTo(m)}
                  onDelete={deleteMessage}
                  replyMessage={replyMsg}
                />
              </React.Fragment>
            );
          })}
        </div>
      </CustomScrollArea>

      {/* Reply Banner */}
      {replyingTo && (
        <div
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            bottom: isKeyboardOpen
              ? `${Math.max(keyboardHeight, 0) + 60}px`
              : 'calc(env(safe-area-inset-bottom, 0px) + 7.25rem)',
          }}
          className="absolute left-3 right-3 z-30 px-4 py-2 flex items-center justify-between bg-white/85 dark:bg-[#202024]/85 border border-black/[0.06] dark:border-white/[0.08] rounded-[18px] text-xs text-slate-800 dark:text-slate-200 shadow-md animate-spring-in transition-[bottom] duration-150 ease-out"
        >
          <div className="truncate pr-2">
            <span className="font-semibold text-[#007AFF] dark:text-[#0A84FF] mr-1">
              Replying to {replyingTo.sender?.display_name || 'Member'}:
            </span>
            <span className="truncate opacity-80">{replyingTo.content}</span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="w-6 h-6 flex items-center justify-center text-slate-400 active:scale-95 cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Floating Message Input & Expand Menu Container (NO background panel behind them) */}
      <div
        style={{
          bottom: isKeyboardOpen
            ? `${Math.max(keyboardHeight, 0) + 8}px`
            : 'calc(env(safe-area-inset-bottom, 0px) + 3.75rem)',
        }}
        className="absolute left-3 right-3 z-30 pointer-events-auto transition-[bottom] duration-150 ease-out"
      >
        <input
          type="file"
          ref={photoInputRef}
          accept="image/*"
          onChange={handleImageFile}
          className="hidden"
        />

        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          {/* Floating Plus Toggle Button */}
          <button
            type="button"
            disabled={uploadingImage}
            onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
            style={{
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-black/[0.06] dark:border-white/[0.08] active-press shrink-0 transition-colors ${
              isPlusMenuOpen
                ? 'bg-black/15 dark:bg-white/25 text-slate-900 dark:text-white'
                : 'bg-white/85 dark:bg-[#222226]/85 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-[#2a2a2e]'
            }`}
          >
            <Plus
              size={19}
              weight="bold"
              className={`transition-transform duration-200 ${isPlusMenuOpen ? 'rotate-45' : ''}`}
            />
          </button>

          {/* Plus Menu Popup - Floating glass menu with dim border */}
          {isPlusMenuOpen && (
            <>
              <div
                onClick={() => setIsPlusMenuOpen(false)}
                className="fixed inset-0 z-30 bg-transparent"
              />
              <div
                style={{
                  backdropFilter: 'blur(30px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(190%)',
                  backgroundColor: 'rgba(24, 24, 28, 0.70)',
                }}
                className="absolute left-0 bottom-12 z-40 w-44 border border-white/[0.12] rounded-[22px] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] origin-bottom-left"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setIsCameraOpen(true);
                  }}
                  className="w-full h-10 px-3 rounded-[16px] flex items-center gap-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 cursor-pointer transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 dark:bg-blue-400/15 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF]">
                    <Camera size={14} weight="bold" />
                  </div>
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    photoInputRef.current?.click();
                  }}
                  className="w-full h-10 px-3 rounded-[16px] flex items-center gap-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 cursor-pointer transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-400/15 flex items-center justify-center text-emerald-500">
                    <ImageIcon size={14} weight="bold" />
                  </div>
                  <span>Photos</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setIsPollSheetOpen(true);
                  }}
                  className="w-full h-10 px-3 rounded-[16px] flex items-center gap-3 text-xs font-semibold text-slate-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 cursor-pointer transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 dark:bg-amber-400/15 flex items-center justify-center text-amber-500">
                    <ChartBar size={14} weight="bold" />
                  </div>
                  <span>Poll</span>
                </button>
              </div>
            </>
          )}

          {/* Floating Pill Input Box - Centered vertically so text sits slightly downwards */}
          <div
            style={{
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            }}
            className="flex-1 min-w-0 flex items-center min-h-[40px] bg-white/85 dark:bg-[#222226]/85 border border-black/[0.06] dark:border-white/[0.08] rounded-[22px] px-3.5 py-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200 ease-out"
          >
            <textarea
              ref={textareaRef}
              id="chat-message-input"
              name="message"
              rows={1}
              inputMode="text"
              autoCapitalize="sentences"
              autoCorrect="on"
              spellCheck={true}
              enterKeyHint="send"
              placeholder="Message"
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-[16px] resize-none outline-none pt-2 pb-1.5 leading-[1.35] max-h-32 overflow-y-auto transition-[height] duration-150 ease-out"
              style={{ minHeight: '36px', height: '36px' }}
            />
          </div>

          {/* Send Button that smoothly expands next to the input field as the input shortens */}
          <div
            className={`shrink-0 flex items-center justify-center transition-all duration-250 ease-out ${
              inputText.trim()
                ? 'w-10 opacity-100 scale-100 translate-x-0'
                : 'w-0 opacity-0 scale-50 translate-x-2 pointer-events-none'
            }`}
          >
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white flex items-center justify-center cursor-pointer shadow-md active:scale-90 transition-transform"
            >
              <ArrowUp size={18} weight="bold" />
            </button>
          </div>
        </form>
      </div>

      {/* Poll Creation Bottom Sheet */}
      <PollSheet
        isOpen={isPollSheetOpen}
        onClose={() => setIsPollSheetOpen(false)}
        onCreatePoll={createPoll}
      />

      {/* In-app Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
