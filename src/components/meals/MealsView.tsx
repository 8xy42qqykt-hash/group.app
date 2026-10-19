import React, { useState, useMemo, useRef } from 'react';
import { Plus, Heart, CookingPot, ShoppingCart, Trash, Check } from '@phosphor-icons/react';
import { useTrip } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { Meal } from '../../types';
import { TripDaySelector } from '../common/TripDaySelector';
import { BottomSheet } from '../common/BottomSheet';
import { Avatar } from '../common/Avatar';
import { getInitialTripDate } from '../../utils/date';
import { CollapsingHeaderLayout } from '../common/CollapsingHeaderLayout';

export const MealsView: React.FC = () => {
  const { currentTrip, meals, addMeal, toggleMealVote, assignCooking, sendMealToGroceries, deleteMeal } = useTrip();
  const { user } = useAuth();

  const initialDate = useMemo(() => {
    if (!currentTrip) return '';
    return getInitialTripDate(currentTrip.start_date, currentTrip.end_date);
  }, [currentTrip]);

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);

  // Separate Popups as requested: Add Meal Popup & Add Slot Popup (no creating new slot at same time)
  const [isAddMealSheetOpen, setIsAddMealSheetOpen] = useState(false);
  const [isAddSlotSheetOpen, setIsAddSlotSheetOpen] = useState(false);

  const [mealNameInput, setMealNameInput] = useState('');
  const [selectedSlotForMeal, setSelectedSlotForMeal] = useState('');
  const [newSlotInput, setNewSlotInput] = useState('');

  const [actionMeal, setActionMeal] = useState<Meal | null>(null);

  // User-created custom slots for this trip
  const [customSlotsByDate, setCustomSlotsByDate] = useState<Record<string, string[]>>({});

  const daysWithMeals = useMemo(() => {
    return new Set(meals.map((m) => m.date));
  }, [meals]);

  if (!currentTrip) return null;

  const dayMeals = meals.filter((m) => m.date === selectedDate);
  const slotsFromData = Array.from(new Set(dayMeals.map((m) => m.slot)));
  const customSlots = customSlotsByDate[selectedDate] || [];

  // Strictly NO ready-made slots! Only user-created slots for this day!
  const activeDaySlots = Array.from(new Set([...slotsFromData, ...customSlots]));

  const openAddSlot = () => {
    setNewSlotInput('');
    setIsAddSlotSheetOpen(true);
  };

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlot = newSlotInput.trim();
    if (!cleanSlot) return;

    if (!activeDaySlots.includes(cleanSlot)) {
      setCustomSlotsByDate((prev) => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] || []), cleanSlot],
      }));
    }
    setNewSlotInput('');
    setIsAddSlotSheetOpen(false);
  };

  const openAddMeal = (presetSlot?: string) => {
    const slotToUse = presetSlot || activeDaySlots[0] || 'Meal';
    setSelectedSlotForMeal(slotToUse);
    setMealNameInput('');
    setIsAddMealSheetOpen(true);
  };

  const handleCreateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = mealNameInput.trim();
    if (!cleanName) return;

    const targetSlot = selectedSlotForMeal || activeDaySlots[0] || 'Meal';

    // If slot didn't exist yet, ensure it's recorded
    if (!activeDaySlots.includes(targetSlot)) {
      setCustomSlotsByDate((prev) => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] || []), targetSlot],
      }));
    }

    await addMeal(selectedDate, targetSlot, cleanName);
    setMealNameInput('');
    setIsAddMealSheetOpen(false);
  };

  return (
    <CollapsingHeaderLayout
      title="Meals"
      headerSubContent={
        <div className="flex items-center justify-between pb-1 pt-0.5 gap-2">
          <TripDaySelector
            startDate={currentTrip.start_date}
            endDate={currentTrip.end_date}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            daysWithItems={daysWithMeals}
          />

          {/* Two separate top buttons: Add Slot & Add Meal */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={openAddSlot}
              className="text-xs font-semibold text-slate-200 active-press cursor-pointer flex items-center gap-1 py-1.5 px-2.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors border border-white/[0.06]"
            >
              <Plus size={13} weight="bold" />
              <span>Slot</span>
            </button>

            <button
              type="button"
              onClick={() => openAddMeal()}
              className="text-xs font-semibold text-white active-press cursor-pointer flex items-center gap-1 py-1.5 px-3 rounded-full bg-[#0A84FF] shadow-sm hover:bg-[#007AFF] transition-colors"
            >
              <Plus size={13} weight="bold" />
              <span>Meal</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {activeDaySlots.length > 0 ? (
          activeDaySlots.map((slot) => {
            const slotMeals = dayMeals.filter((m) => m.slot === slot);
            return (
              <div key={slot} className="space-y-1 animate-spring-in">
                <div className="flex items-center justify-between px-2 pt-0.5">
                  {/* NO uppercase */}
                  <span className="text-[12px] font-semibold text-slate-400">
                    {slot}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAddMeal(slot)}
                    className="text-xs font-semibold text-[#0A84FF] active-press cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus size={13} weight="bold" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Clean list with subtle dividing line */}
                <div className="divide-y divide-white/[0.06] overflow-hidden">
                  {slotMeals.length > 0 ? (
                    slotMeals.map((meal) => {
                      const votes = meal.votes || [];
                      const hasVoted = user ? votes.includes(user.id) : false;
                      const isCook = user ? meal.cook_user_id === user.id : false;
                      return (
                        <MealItemRow
                          key={meal.id}
                          meal={meal}
                          hasVoted={hasVoted}
                          voteCount={votes.length}
                          isCook={isCook}
                          onTapVote={() => toggleMealVote(meal.id)}
                          onLongPress={() => setActionMeal(meal)}
                        />
                      );
                    })
                  ) : (
                    <div
                      onClick={() => openAddMeal(slot)}
                      className="px-3 py-2 text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors flex items-center justify-between"
                    >
                      <span>No meals added yet</span>
                      <span className="text-[#0A84FF] font-medium">+ Add item</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center animate-spring-in">
            <p className="text-sm font-semibold text-white">
              No meal slots yet for this day
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Add your slots first (like Breakfast, Dinner, BBQ), then add meals.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={openAddSlot}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold active-press border border-white/[0.08] cursor-pointer"
              >
                <Plus size={15} weight="bold" />
                <span>Add Slot</span>
              </button>
              <button
                type="button"
                onClick={() => openAddMeal()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0A84FF] text-white text-xs font-semibold active-press shadow-sm cursor-pointer"
              >
                <Plus size={15} weight="bold" />
                <span>Add Meal</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Separate Add Slot Popup with blurred frosted glass background & bottom margin */}
      <BottomSheet isOpen={isAddSlotSheetOpen} onClose={() => setIsAddSlotSheetOpen(false)}>
        <form onSubmit={handleCreateSlot} className="flex flex-col gap-3.5 py-1">
          <div className="px-1">
            <h3 className="text-base font-bold text-white">Add Meal Slot</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Create a custom slot for {selectedDate}.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 px-1">
              Slot Name
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Breakfast, Lunch, Dinner, Late Snack..."
              value={newSlotInput}
              onChange={(e) => setNewSlotInput(e.target.value)}
              className="w-full h-11 px-4 rounded-[16px] bg-white/10 text-white placeholder:text-slate-500 text-sm outline-none border border-white/[0.08]"
            />
          </div>

          {/* Quick Slot Suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Dessert', 'BBQ'].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setNewSlotInput(suggestion)}
                className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300 hover:bg-white/15 active-press cursor-pointer border border-white/[0.06]"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="pt-2 mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddSlotSheetOpen(false)}
              className="flex-1 h-11 rounded-[18px] bg-white/10 text-slate-300 font-semibold text-xs flex items-center justify-center active-press cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newSlotInput.trim()}
              className="flex-1 h-11 rounded-[18px] bg-[#0A84FF] disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center active-press cursor-pointer shadow-sm"
            >
              Create Slot
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Separate Add Meal Popup with blurred frosted glass background & bottom margin */}
      <BottomSheet isOpen={isAddMealSheetOpen} onClose={() => setIsAddMealSheetOpen(false)}>
        <form onSubmit={handleCreateMeal} className="flex flex-col gap-3.5 py-1">
          <div className="px-1">
            <h3 className="text-base font-bold text-white">Add Meal</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Add a meal to an existing slot.
            </p>
          </div>

          {/* Slot Picker from existing slots */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 px-1">
              Select Slot
            </label>
            {activeDaySlots.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {activeDaySlots.map((slot) => {
                  const isSelected = selectedSlotForMeal === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlotForMeal(slot)}
                      className={`text-xs px-3 py-1.5 rounded-[12px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#0A84FF] text-white shadow-sm'
                          : 'bg-white/10 text-slate-300 hover:bg-white/15 border border-white/[0.06]'
                      }`}
                    >
                      {isSelected && <Check size={12} weight="bold" />}
                      <span>{slot}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Slot name (e.g. Dinner)"
                value={selectedSlotForMeal}
                onChange={(e) => setSelectedSlotForMeal(e.target.value)}
                className="w-full h-11 px-4 rounded-[16px] bg-white/10 text-white placeholder:text-slate-500 text-sm outline-none border border-white/[0.08]"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 px-1">
              Meal Name
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Homemade Tacos, Pasta Carbonara..."
              value={mealNameInput}
              onChange={(e) => setMealNameInput(e.target.value)}
              className="w-full h-11 px-4 rounded-[16px] bg-white/10 text-white placeholder:text-slate-500 text-sm outline-none border border-white/[0.08]"
            />
          </div>

          <div className="pt-2 mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddMealSheetOpen(false)}
              className="flex-1 h-11 rounded-[18px] bg-white/10 text-slate-300 font-semibold text-xs flex items-center justify-center active-press cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!mealNameInput.trim()}
              className="flex-1 h-11 rounded-[18px] bg-[#0A84FF] disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center active-press cursor-pointer shadow-sm"
            >
              Save Meal
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Meal Long-Press Action Sheet */}
      <BottomSheet isOpen={Boolean(actionMeal)} onClose={() => setActionMeal(null)}>
        {actionMeal && (
          <div className="flex flex-col gap-2 pb-5">
            <div className="px-1 pb-1">
              <span className="text-[11px] text-slate-400">
                {actionMeal.slot}
              </span>
              <h3 className="text-base font-bold text-white">
                {actionMeal.name}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                assignCooking(actionMeal.id);
                setActionMeal(null);
              }}
              className="h-11 px-4 rounded-[18px] bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-between active-press cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <CookingPot size={16} weight="bold" className="text-[#0A84FF]" />
                <span>{actionMeal.cook_user_id === user?.id ? "I'm not cooking this" : "I'll cook this"}</span>
              </span>
              {actionMeal.cook && (
                <span className="text-[11px] text-slate-400">
                  Cook: {actionMeal.cook.display_name}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                sendMealToGroceries(actionMeal.name);
                setActionMeal(null);
              }}
              className="h-11 px-4 rounded-[18px] bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-between active-press cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart size={16} weight="bold" className="text-emerald-400" />
                <span>Send to Groceries</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                deleteMeal(actionMeal.id);
                setActionMeal(null);
              }}
              className="h-11 px-4 rounded-[18px] bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-xs flex items-center justify-between active-press cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <Trash size={16} weight="bold" />
                <span>Delete Meal</span>
              </span>
            </button>
          </div>
        )}
      </BottomSheet>
    </CollapsingHeaderLayout>
  );
};

interface MealItemRowProps {
  meal: Meal;
  hasVoted: boolean;
  voteCount: number;
  isCook: boolean;
  onTapVote: () => void;
  onLongPress: () => void;
}

const MealItemRow: React.FC<MealItemRowProps> = ({
  meal,
  hasVoted,
  voteCount,
  isCook,
  onTapVote,
  onLongPress,
}) => {
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
    pressTimer.current = setTimeout(() => {
      onLongPress();
    }, 450);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="flex items-center justify-between py-2 px-2.5 bg-black hover:bg-white/5 active:bg-white/10 transition-colors select-none cursor-pointer"
    >
      <div className="flex items-center gap-2.5 flex-1 pr-2 truncate">
        <span className="text-[13px] font-medium text-white truncate">
          {meal.name}
        </span>
        {meal.cook && (
          <div className="flex items-center gap-1 bg-[#0A84FF]/15 px-2 py-0.5 rounded-full shrink-0">
            <Avatar
              name={meal.cook.display_name}
              avatarUrl={meal.cook.avatar_url}
              color={meal.cook.color}
              size={14}
            />
            <span className="text-[10px] font-semibold text-[#0A84FF]">
              {isCook ? 'You' : meal.cook.display_name}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTapVote();
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold active-press cursor-pointer transition-colors ${
          hasVoted
            ? 'bg-rose-500/15 text-rose-400'
            : 'text-slate-400 hover:bg-white/10'
        }`}
      >
        <Heart size={14} weight={hasVoted ? 'fill' : 'regular'} />
        {voteCount > 0 && <span>{voteCount}</span>}
      </button>
    </div>
  );
};
