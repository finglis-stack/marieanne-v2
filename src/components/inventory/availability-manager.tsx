"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Clock } from 'lucide-react';

interface TimeRange {
  start: string;
  end: string;
}

interface DayAvailability {
  enabled: boolean;
  allDay: boolean;
  timeRanges: TimeRange[];
}

interface Availability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
}

interface AvailabilityManagerProps {
  availability: Availability;
  onChange: (availability: Availability) => void;
}

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
] as const;

export const AvailabilityManager = ({ availability, onChange }: AvailabilityManagerProps) => {
  const handleDayToggle = (day: keyof Availability) => {
    onChange({
      ...availability,
      [day]: {
        ...availability[day],
        enabled: !availability[day].enabled,
      },
    });
  };

  const handleAllDayToggle = (day: keyof Availability) => {
    onChange({
      ...availability,
      [day]: {
        ...availability[day],
        allDay: !availability[day].allDay,
        timeRanges: !availability[day].allDay ? [] : availability[day].timeRanges,
      },
    });
  };

  const handleAddTimeRange = (day: keyof Availability) => {
    onChange({
      ...availability,
      [day]: {
        ...availability[day],
        timeRanges: [
          ...availability[day].timeRanges,
          { start: '09:00', end: '17:00' },
        ],
      },
    });
  };

  const handleRemoveTimeRange = (day: keyof Availability, index: number) => {
    onChange({
      ...availability,
      [day]: {
        ...availability[day],
        timeRanges: availability[day].timeRanges.filter((_, i) => i !== index),
      },
    });
  };

  const handleTimeRangeChange = (
    day: keyof Availability,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const newTimeRanges = [...availability[day].timeRanges];
    newTimeRanges[index] = {
      ...newTimeRanges[index],
      [field]: value,
    };
    onChange({
      ...availability,
      [day]: {
        ...availability[day],
        timeRanges: newTimeRanges,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Disponibilité (Heure EST)</h3>
      </div>

      {DAYS.map(({ key, label }) => (
        <Card key={key} className="backdrop-blur-xl bg-slate-900/60 border-blue-500/20 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={availability[key].enabled}
                  onCheckedChange={() => handleDayToggle(key)}
                />
                <Label className="text-white font-medium">{label}</Label>
              </div>
              {availability[key].enabled && (
                <div className="flex items-center gap-2">
                  <Label className="text-gray-400 text-sm">Toute la journée</Label>
                  <Switch
                    checked={availability[key].allDay}
                    onCheckedChange={() => handleAllDayToggle(key)}
                  />
                </div>
              )}
            </div>

            {availability[key].enabled && !availability[key].allDay && (
              <div className="space-y-2 ml-8">
                {availability[key].timeRanges.map((range, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={range.start}
                      onChange={(e) => handleTimeRangeChange(key, index, 'start', e.target.value)}
                      className="bg-slate-900/50 border-blue-500/50 text-white w-32"
                    />
                    <span className="text-gray-400">à</span>
                    <Input
                      type="time"
                      value={range.end}
                      onChange={(e) => handleTimeRangeChange(key, index, 'end', e.target.value)}
                      className="bg-slate-900/50 border-blue-500/50 text-white w-32"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveTimeRange(key, index)}
                      className="bg-slate-900/50 border-red-500/50 hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddTimeRange(key)}
                  className="bg-slate-900/50 border-blue-500/50 hover:bg-blue-500/20 text-blue-400"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Ajouter une plage horaire
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};