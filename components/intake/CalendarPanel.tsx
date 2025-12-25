'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  defaultStaffOptions,
  defaultMeetingTypes,
  defaultLocations,
  monthNames,
  dayNames,
} from '@/lib/intake-constants'
import { ChevronLeft, ChevronRight, Check, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Staff {
  id: string
  name: string
}

interface CalendarPanelProps {
  selectedStaff: Staff | null
  setSelectedStaff: (staff: Staff | null) => void
  meetingType: string
  setMeetingType: (type: string) => void
  meetingLocation: string
  setMeetingLocation: (location: string) => void
  selectedDate: number | null
  setSelectedDate: (date: number | null) => void
  selectedTime: string | null
  setSelectedTime: (time: string | null) => void
  calendarStep: 'staff' | 'details' | 'date' | 'time'
  setCalendarStep: (step: 'staff' | 'details' | 'date' | 'time') => void
  availableSlots?: Record<string, string[]>
  slotsLoading?: boolean
}

export function CalendarPanel({
  selectedStaff,
  setSelectedStaff,
  meetingType,
  setMeetingType,
  meetingLocation,
  setMeetingLocation,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  calendarStep,
  setCalendarStep,
  availableSlots = {},
  slotsLoading = false,
}: CalendarPanelProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const staffOptions = defaultStaffOptions
  const meetingTypes = defaultMeetingTypes
  const locations = defaultLocations

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    return { daysInMonth, startingDay }
  }

  const isDateAvailable = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = date.getDay()

    // Check if date is in the past or weekend
    if (date < today || dayOfWeek === 0 || dayOfWeek === 6) {
      return false
    }

    // Check if we have slots for this date
    if (Object.keys(availableSlots).length > 0) {
      return availableSlots[dateStr] && availableSlots[dateStr].length > 0
    }

    // If no slots loaded yet, show as potentially available
    return true
  }

  const getTimeSlotsForDate = () => {
    if (!selectedDate) return []

    // selectedDate is now a timestamp, extract date components
    const dateObj = new Date(selectedDate)
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`

    if (availableSlots[dateStr]) {
      return availableSlots[dateStr]
    }

    // Default time slots if API hasn't loaded
    return ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00']
  }

  const formatTimeSlot = (time: string, includeTimezone = false) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return includeTimezone ? `${hour12}:${minutes} ${ampm} EST` : `${hour12}:${minutes} ${ampm}`
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return ''
    // selectedDate is now a timestamp
    const date = new Date(selectedDate)
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
    return `${dayName}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const renderCalendarDays = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth)
    const days: React.ReactNode[] = []
    const today = new Date()
    const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear()

    // Check if selectedDate matches the current month being viewed
    const selectedDateObj = selectedDate ? new Date(selectedDate) : null
    const isSelectedInCurrentMonth = selectedDateObj &&
      selectedDateObj.getMonth() === currentMonth.getMonth() &&
      selectedDateObj.getFullYear() === currentMonth.getFullYear()

    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const available = isDateAvailable(day)
      const isToday = isCurrentMonth && day === today.getDate()
      const isSelected = isSelectedInCurrentMonth && selectedDateObj?.getDate() === day

      // Create full timestamp when clicking a date
      const handleDateClick = () => {
        if (available) {
          const fullDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
          setSelectedDate(fullDate.getTime())
        }
      }

      days.push(
        <button
          key={day}
          type="button"
          disabled={!available}
          onClick={handleDateClick}
          className={cn(
            'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all',
            available ? 'cursor-pointer hover:bg-blue-50 text-blue-600' : 'text-gray-300 cursor-not-allowed',
            isToday && 'bg-blue-100 text-blue-800',
            isSelected && 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {day}
        </button>
      )
    }

    return days
  }

  // Staff Selection Step
  if (calendarStep === 'staff') {
    return (
      <Card className="w-[420px] flex-shrink-0 h-fit">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Appointment</h3>
          <p className="text-sm text-gray-500 mb-6">Select a team member to book with</p>

          <div className="grid grid-cols-2 gap-3">
            {staffOptions.map((staff) => (
              <button
                key={staff.id}
                type="button"
                onClick={() => {
                  setSelectedStaff(staff)
                  setCalendarStep('details')
                }}
                className={cn(
                  'flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 transition-all',
                  selectedStaff?.id === staff.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                )}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {staff.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">{staff.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Meeting Details Step
  if (calendarStep === 'details') {
    return (
      <Card className="w-[420px] flex-shrink-0 h-fit">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCalendarStep('staff')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedStaff?.name}</h3>
              <span className="text-sm text-gray-500">Meeting Details</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Meeting Type <span className="text-red-500">*</span>
              </Label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select meeting type..." />
                </SelectTrigger>
                <SelectContent>
                  {meetingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                Location <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={meetingLocation}
                onValueChange={setMeetingLocation}
                className="mt-2 space-y-2"
              >
                {locations.map((loc) => (
                  <div key={loc.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={loc.id} id={loc.id} />
                    <Label htmlFor={loc.id} className="font-normal cursor-pointer">
                      {loc.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {meetingType && meetingLocation && (
              <Button
                type="button"
                className="w-full mt-4"
                onClick={() => setCalendarStep('date')}
              >
                Continue to Date Selection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Date Selection Step
  if (calendarStep === 'date') {
    return (
      <Card className="w-[420px] flex-shrink-0 h-fit">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCalendarStep('details')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedStaff?.name}</h3>
              <span className="text-sm text-gray-500">
                {meetingType} - {locations.find(l => l.id === meetingLocation)?.name}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-5">
            <Button type="button" variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-base font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <Button type="button" variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {slotsLoading && (
            <div className="text-center py-2 text-gray-500 text-sm">
              Loading availability...
            </div>
          )}

          <div className="mb-5">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
          </div>

          {selectedDate && (
            <Button
              type="button"
              className="w-full"
              onClick={() => setCalendarStep('time')}
            >
              Continue
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Time Selection Step
  if (calendarStep === 'time') {
    const timeSlots = getTimeSlotsForDate()

    return (
      <Card className="w-[420px] flex-shrink-0 h-fit">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCalendarStep('date')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{formatSelectedDate()}</h3>
              <span className="text-sm text-gray-500">Select a time (EST)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto mb-4">
            {timeSlots.length > 0 ? (
              timeSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    'py-3 px-4 text-sm font-medium rounded-lg border transition-all',
                    selectedTime === time
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  )}
                >
                  {formatTimeSlot(time)}
                </button>
              ))
            ) : (
              <div className="col-span-2 text-center text-gray-500 py-5">
                No available times for this date
              </div>
            )}
          </div>

          {selectedTime && (
            <div className="flex items-center gap-2.5 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
              <Check className="h-5 w-5 flex-shrink-0" />
              <span>
                {formatTimeSlot(selectedTime, true)} with {selectedStaff?.name}
                <br />
                <small className="opacity-80">
                  {meetingType} - {locations.find(l => l.id === meetingLocation)?.name}
                </small>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}
