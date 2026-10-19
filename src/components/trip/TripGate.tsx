import React, { useState, useEffect } from 'react';
import { useTrip } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { DatePickerModal } from '../common/DatePickerModal';
import { formatTripDate, getTodayDateString } from '../../utils/date';
import { Avatar } from '../common/Avatar';
import { BottomSheet } from '../common/BottomSheet';
import { Plus, Hash, CalendarBlank, SignOut, CaretLeft, CaretRight } from '@phosphor-icons/react';

export const TripGate: React.FC = () => {
  const { createTrip, joinTrip, userTrips, selectTrip, loadUserTrips, isLoadingTrips } = useTrip();
  const { user, profile, signOut } = useAuth();

  // State: whether the "+" popup is open
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<'create' | 'join' | null>(null);

  // Create state
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);

  // Join state
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserTrips();
  }, [loadUserTrips]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await createTrip(name, startDate, endDate);
    setLoading(false);
    if (res.error) {
      alert(res.error);
    } else {
      setActiveForm(null);
      setIsPlusMenuOpen(false);
      setName('');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoinError(null);
    setLoading(true);
    const res = await joinTrip(inviteCode);
    setLoading(false);
    if (res.error) {
      setJoinError(res.error);
    } else {
      setActiveForm(null);
      setIsPlusMenuOpen(false);
      setInviteCode('');
    }
  };

  const openPlusPopup = () => {
    setActiveForm(null);
    setJoinError(null);
    setIsPlusMenuOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-start px-4 pt-10 pb-8 max-w-md mx-auto bg-black text-white select-none pt-safe pb-safe">
      {/* Apple-style Large Title Header */}
      <div className="flex items-end justify-between mb-6 px-1 pt-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Trips
          </h1>
          <span className="text-[13px] font-medium text-slate-400">
            {userTrips.length === 1 ? '1 trip' : `${userTrips.length} trips`}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Apple-style circular blue plus button */}
          <button
            type="button"
            onClick={openPlusPopup}
            className="w-8 h-8 rounded-full bg-[#0A84FF] text-white flex items-center justify-center active-press cursor-pointer shadow-sm hover:bg-[#007AFF] transition-colors"
            title="New Trip"
          >
            <Plus size={18} weight="bold" />
          </button>

          <Avatar
            name={profile?.display_name}
            avatarUrl={profile?.avatar_url}
            color={profile?.color}
            size={32}
          />

          <button
            type="button"
            onClick={signOut}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-white/10 active-press cursor-pointer transition-colors"
            title="Sign out"
          >
            <SignOut size={17} weight="bold" />
          </button>
        </div>
      </div>

      {/* Trips List - Apple Grouped Inset Cards */}
      <div className="flex flex-col gap-2 flex-1">
        {isLoadingTrips && userTrips.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
            Loading trips...
          </div>
        ) : userTrips.length > 0 ? (
          <div className="space-y-2.5">
            {userTrips.map((trip) => {
              const isTripOwner = user && trip.owner_id === user.id;
              return (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => selectTrip(trip)}
                  className="w-full text-left p-4 bg-[#1c1c1e] hover:bg-[#242428] border border-white/[0.08] rounded-[20px] shadow-sm active:scale-[0.99] cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex flex-col gap-1 truncate pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] font-semibold text-white tracking-tight truncate">
                        {trip.name}
                      </span>
                      {isTripOwner && (
                        <span className="text-[10px] font-semibold text-[#0A84FF] bg-[#0A84FF]/15 px-2 py-0.5 rounded-full shrink-0">
                          Owner
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CalendarBlank size={13} weight="regular" />
                      <span>
                        {formatTripDate(trip.start_date)} &ndash; {formatTripDate(trip.end_date)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Code: {trip.invite_code}
                    </div>
                  </div>

                  <CaretRight size={16} weight="bold" className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-20 px-4 text-center rounded-[24px] bg-[#1c1c1e] border border-white/[0.06] mt-2">
            <CalendarBlank size={36} className="mx-auto text-slate-500 mb-2 opacity-80" />
            <h3 className="text-base font-semibold text-white">
              No Trips
            </h3>
            <button
              type="button"
              onClick={openPlusPopup}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A84FF] text-white text-xs font-semibold active-press shadow-sm cursor-pointer hover:bg-[#007AFF] transition-colors"
            >
              <Plus size={15} weight="bold" />
              <span>New Trip</span>
            </button>
          </div>
        )}
      </div>

      {/* Apple-style popup with NO filler text */}
      <BottomSheet
        isOpen={isPlusMenuOpen}
        onClose={() => {
          setIsPlusMenuOpen(false);
          setActiveForm(null);
        }}
      >
        {!activeForm ? (
          <div className="flex flex-col gap-2.5 py-1">
            <button
              type="button"
              onClick={() => setActiveForm('create')}
              className="w-full h-13 px-4 rounded-[18px] bg-white/10 hover:bg-white/15 active-press cursor-pointer border border-white/[0.08] flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0A84FF] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Plus size={18} weight="bold" />
                </div>
                <span className="text-sm font-semibold text-white">
                  Create Trip
                </span>
              </div>
              <CaretRight size={16} weight="bold" className="text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveForm('join')}
              className="w-full h-13 px-4 rounded-[18px] bg-white/10 hover:bg-white/15 active-press cursor-pointer border border-white/[0.08] flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0">
                  <Hash size={18} weight="bold" />
                </div>
                <span className="text-sm font-semibold text-white">
                  Join Trip
                </span>
              </div>
              <CaretRight size={16} weight="bold" className="text-slate-400" />
            </button>
          </div>
        ) : activeForm === 'create' ? (
          <div className="flex flex-col gap-3 py-1">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full active-press cursor-pointer"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
              <h3 className="text-base font-bold text-white">
                Create Trip
              </h3>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 mb-4">
              <input
                type="text"
                autoFocus
                placeholder="Trip Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-[16px] bg-white/10 text-white placeholder:text-slate-500 text-sm outline-none border border-white/[0.08]"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDatePicker('start')}
                  className="w-full h-11 px-3 rounded-[16px] bg-white/10 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 active-press cursor-pointer border border-white/[0.08]"
                >
                  <CalendarBlank size={14} weight="regular" />
                  <span>{formatTripDate(startDate)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDatePicker('end')}
                  className="w-full h-11 px-3 rounded-[16px] bg-white/10 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 active-press cursor-pointer border border-white/[0.08]"
                >
                  <CalendarBlank size={14} weight="regular" />
                  <span>{formatTripDate(endDate)}</span>
                </button>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveForm(null)}
                  className="flex-1 h-11 rounded-[18px] bg-white/10 text-slate-300 font-semibold text-xs flex items-center justify-center active-press cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 h-11 rounded-[18px] bg-[#0A84FF] disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center active-press cursor-pointer shadow-sm"
                >
                  {loading ? 'Creating...' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-1">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full active-press cursor-pointer"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
              <h3 className="text-base font-bold text-white">
                Join Trip
              </h3>
            </div>

            <form onSubmit={handleJoin} className="space-y-3 mb-4">
              <input
                type="text"
                autoFocus
                maxLength={6}
                placeholder="Invite Code (e.g. ABCXYZ)"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setJoinError(null);
                }}
                required
                className="w-full h-12 px-4 rounded-[16px] bg-white/10 text-white placeholder:text-slate-500 text-center font-bold tracking-widest text-lg outline-none border border-white/[0.08]"
              />

              {joinError && (
                <div className="text-xs text-red-400 text-center py-2 px-3 bg-red-500/15 rounded-[14px]">
                  {joinError}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveForm(null)}
                  className="flex-1 h-11 rounded-[18px] bg-white/10 text-slate-300 font-semibold text-xs flex items-center justify-center active-press cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || inviteCode.trim().length !== 6}
                  className="flex-1 h-11 rounded-[18px] bg-[#0A84FF] disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center active-press cursor-pointer shadow-sm"
                >
                  {loading ? 'Joining...' : 'Join Trip'}
                </button>
              </div>
            </form>
          </div>
        )}
      </BottomSheet>

      {/* Date Pickers */}
      <DatePickerModal
        isOpen={activeDatePicker === 'start'}
        onClose={() => setActiveDatePicker(null)}
        selectedDate={startDate}
        onSelectDate={(d) => {
          setStartDate(d);
          if (d > endDate) setEndDate(d);
        }}
      />
      <DatePickerModal
        isOpen={activeDatePicker === 'end'}
        onClose={() => setActiveDatePicker(null)}
        selectedDate={endDate}
        onSelectDate={(d) => {
          setEndDate(d);
          if (d < startDate) setStartDate(d);
        }}
      />
    </div>
  );
};
