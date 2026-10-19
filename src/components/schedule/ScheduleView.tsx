import React, { useState, useMemo } from 'react';
import { Check, Trash } from '@phosphor-icons/react';
import { useTrip } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { EventItem, Profile } from '../../types';
import { TripDaySelector } from '../common/TripDaySelector';
import { BottomSheet } from '../common/BottomSheet';
import { Avatar } from '../common/Avatar';
import { getInitialTripDate, formatTime24 } from '../../utils/date';
import { CollapsingHeaderLayout } from '../common/CollapsingHeaderLayout';
import { handleEnterKeyNavigation } from '../../utils/formNavigation';

export const ScheduleView: React.FC = () => {
  const { currentTrip, events, tripMembers, addEvent, toggleEventAttendance, editEvent, deleteEvent } = useTrip();
  const { user, profile } = useAuth();

  const initialDate = useMemo(() => {
    if (!currentTrip) return '';
    return getInitialTripDate(currentTrip.start_date, currentTrip.end_date);
  }, [currentTrip]);

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [quickAdd, setQuickAdd] = useState('');

  // Long press / Edit Event state
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const daysWithEvents = useMemo(() => {
    return new Set(events.map((e) => e.date));
  }, [events]);

  if (!currentTrip) return null;

  const dayEvents = events.filter((e) => e.date === selectedDate);
  const anytimeEvents = dayEvents.filter((e) => !e.time);
  const timedEvents = dayEvents
    .filter((e) => Boolean(e.time))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickAdd.trim();
    if (!clean) return;
    setQuickAdd('');
    await addEvent(selectedDate, clean);
  };

  const openEditModal = (item: EventItem) => {
    setEditingEvent(item);
    setEditTitle(item.title);
    setEditTime(item.time || '');
    setEditLocation(item.location || '');
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editTitle.trim()) return;
    await editEvent(editingEvent.id, {
      title: editTitle.trim(),
      time: editTime.trim() || null,
      location: editLocation.trim() || null,
      notes: editNotes.trim() || null,
    });
    setEditingEvent(null);
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    await deleteEvent(editingEvent.id);
    setEditingEvent(null);
  };

  const getMemberProfile = (userId: string, evt?: EventItem): Profile => {
    if (user && userId === user.id && profile) {
      return profile;
    }
    if (evt?.attendee_profiles) {
      const found = evt.attendee_profiles.find((p) => p.id === userId);
      if (found) return found;
    }
    const tm = tripMembers.find((m) => m.user_id === userId);
    if (tm?.profile) return tm.profile;

    return {
      id: userId,
      display_name: 'Member',
      color: '#007AFF',
      avatar_url: null,
    };
  };

  return (
    <CollapsingHeaderLayout
      title="Schedule"
      headerSubContent={
        <div>
          <div className="flex items-center justify-between pb-1 pt-0.5">
            <TripDaySelector
              startDate={currentTrip.start_date}
              endDate={currentTrip.end_date}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              daysWithItems={daysWithEvents}
            />
          </div>
          <form onSubmit={handleAdd} className="mt-1 mb-1.5">
            <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-[18px] px-3.5 py-1">
              <input
                type="text"
                inputMode="text"
                enterKeyHint="done"
                placeholder="Add event (e.g. 10:00 Ski lesson, 19:30 Dinner)..."
                value={quickAdd}
                onChange={(e) => setQuickAdd(e.target.value)}
                className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-[16px] h-8 outline-none"
              />
              {quickAdd.trim() && (
                <button
                  type="submit"
                  className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] active-press cursor-pointer px-1"
                >
                  Add
                </button>
              )}
            </div>
          </form>
        </div>
      }
    >
      <div className="space-y-3.5 pt-1">
        {/* Anytime group */}
        {anytimeEvents.length > 0 && (
          <div className="space-y-1 animate-spring-in">
            <div className="text-[11px] font-semibold text-slate-400 px-2">
              Anytime
            </div>
            {/* Clean divided list (NO heavy panel) */}
            <div className="divide-y divide-white/6 overflow-hidden">
              {anytimeEvents.map((evt) => (
                <ScheduleItemRow
                  key={evt.id}
                  event={evt}
                  currentUserId={user?.id}
                  getProfile={(uid) => getMemberProfile(uid, evt)}
                  onToggle={() => toggleEventAttendance(evt.id)}
                  onLongPress={() => openEditModal(evt)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Timed events */}
        {timedEvents.length > 0 && (
          <div className="space-y-1 animate-spring-in">
            <div className="text-[11px] font-semibold text-slate-400 px-2">
              Timeline
            </div>
            {/* Clean divided list (NO heavy panel) */}
            <div className="divide-y divide-black/6 dark:divide-white/6 overflow-hidden">
              {timedEvents.map((evt) => (
                <ScheduleItemRow
                  key={evt.id}
                  event={evt}
                  currentUserId={user?.id}
                  getProfile={(uid) => getMemberProfile(uid, evt)}
                  onToggle={() => toggleEventAttendance(evt.id)}
                  onLongPress={() => openEditModal(evt)}
                />
              ))}
            </div>
          </div>
        )}

        {dayEvents.length === 0 && (
          <div className="py-14 text-center rounded-[20px] bg-black/5 dark:bg-white/5 animate-spring-in mt-2">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              No events scheduled for this day
            </p>
          </div>
        )}
      </div>

      {/* Edit/Delete Event Bottom Sheet with generous bottom margin */}
      <BottomSheet isOpen={Boolean(editingEvent)} onClose={() => setEditingEvent(null)}>
        {editingEvent && (
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
            <div className="text-sm font-semibold text-slate-900 dark:text-white px-1">
              Edit Event
            </div>
            <div>
              <input
                type="text"
                inputMode="text"
                enterKeyHint="next"
                autoCapitalize="sentences"
                placeholder="Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => handleEnterKeyNavigation(e)}
                required
                className="w-full h-11 px-4 rounded-[16px] bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white text-[16px] outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                inputMode="text"
                enterKeyHint="next"
                placeholder="Time (e.g. 14:00)"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                onKeyDown={(e) => handleEnterKeyNavigation(e)}
                className="w-full h-11 px-4 rounded-[16px] bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white text-[16px] outline-none"
              />
              <input
                type="text"
                inputMode="text"
                enterKeyHint="next"
                autoCapitalize="words"
                placeholder="Location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                onKeyDown={(e) => handleEnterKeyNavigation(e)}
                className="w-full h-11 px-4 rounded-[16px] bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white text-[16px] outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                inputMode="text"
                enterKeyHint="done"
                autoCapitalize="sentences"
                placeholder="Notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                onKeyDown={(e) => handleEnterKeyNavigation(e)}
                className="w-full h-11 px-4 rounded-[16px] bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white text-[16px] outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-2 mb-5">
              <button
                type="button"
                onClick={handleDelete}
                className="h-11 px-4 rounded-[16px] bg-red-500/10 text-red-500 font-semibold text-xs active-press cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash size={16} weight="bold" />
                <span>Delete</span>
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-[16px] bg-[#007AFF] dark:bg-[#0A84FF] text-white font-semibold text-sm active-press cursor-pointer shadow-sm transition-transform"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </BottomSheet>
    </CollapsingHeaderLayout>
  );
};

interface ScheduleItemRowProps {
  event: EventItem;
  currentUserId?: string;
  getProfile: (userId: string) => Profile;
  onToggle: () => void;
  onLongPress: () => void;
}

const ScheduleItemRow: React.FC<ScheduleItemRowProps> = ({
  event,
  currentUserId,
  getProfile,
  onToggle,
  onLongPress,
}) => {
  const isAttending = currentUserId && (event.attendees || []).includes(currentUserId);
  const attendees = event.attendees || [];
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isMovedRef = React.useRef(false);
  const startPosRef = React.useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    isMovedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      if (!isMovedRef.current) {
        onLongPress();
      }
    }, 400);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 8 || dy > 8) {
      isMovedRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      className="flex items-center justify-between min-h-[44px] px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 rounded-[14px] cursor-pointer select-none transition-colors animate-spring-in"
    >
      <div className="flex flex-col flex-1 pr-2 truncate">
        <div className="flex items-center gap-2">
          {event.time && (
            <span className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] shrink-0">
              {formatTime24(event.time)}
            </span>
          )}
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {event.title}
          </span>
        </div>
        {(event.location || event.notes) && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {event.location}
            {event.location && event.notes && ' • '}
            {event.notes}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {attendees.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden">
            {attendees.slice(0, 3).map((uid) => {
              const prof = getProfile(uid);
              return (
                <Avatar
                  key={uid}
                  name={prof.display_name}
                  avatarUrl={prof.avatar_url}
                  color={prof.color}
                  size={20}
                />
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer ${
            isAttending
              ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-xs'
              : 'border border-slate-300 dark:border-white/20 text-transparent hover:border-slate-400'
          }`}
          title="Going"
        >
          <Check size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
};
