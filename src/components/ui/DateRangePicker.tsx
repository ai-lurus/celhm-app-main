'use client'

import React, { useState, useEffect } from 'react'
import { DateRange } from 'react-date-range'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import * as Popover from '@radix-ui/react-popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'

interface DateRangePickerProps {
    className?: string
    from?: string
    to?: string
    onRangeChange: (from: string, to: string) => void
}

export function DateRangePicker({
    className,
    from,
    to,
    onRangeChange,
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [state, setState] = useState([
        {
            startDate: from ? new Date(from + 'T12:00:00') : new Date(),
            endDate: to ? new Date(to + 'T12:00:00') : new Date(),
            key: 'selection'
        }
    ])

    useEffect(() => {
        if (from && to) {
            setState([{
                startDate: new Date(from + 'T12:00:00'),
                endDate: new Date(to + 'T12:00:00'),
                key: 'selection'
            }])
        }
    }, [from, to])

    const handleSelect = (item: any) => {
        const selection = item.selection
        setState([selection])

        if (selection.startDate && selection.endDate && selection.startDate !== selection.endDate) {
            onRangeChange(
                format(selection.startDate, 'yyyy-MM-dd'),
                format(selection.endDate, 'yyyy-MM-dd')
            )
            // No cerramos automáticamente para permitir ajustar si es necesario, 
            // o podrías elegir cerrarlo aquí.
        }
    }

    const displayText = from && to
        ? `${format(new Date(from + 'T12:00:00'), "dd/MM/yyyy")} – ${format(new Date(to + 'T12:00:00'), "dd/MM/yyyy")}`
        : "Seleccionar periodo"

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
                <Popover.Trigger asChild>
                    <button
                        className={cn(
                            "w-full justify-start text-left font-normal border border-border bg-card hover:bg-muted transition-colors rounded-md p-2 flex flex-col gap-0.5",
                            (!from || !to) && "text-muted-foreground"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">{displayText}</span>
                        </div>
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        className="z-50 w-auto bg-card p-0 border border-border rounded-lg shadow-xl outline-none animate-in fade-in-0 mt-2"
                        align="start"
                    >
                        <DateRange
                            editableDateInputs={true}
                            onChange={handleSelect}
                            moveRangeOnFirstSelection={false}
                            ranges={state}
                            locale={es}
                            rangeColors={['#3b82f6']}
                        />
                        <div className="p-2 border-t border-border flex justify-between gap-2">
                            <button
                                onClick={() => {
                                    const resetState = [{
                                        startDate: new Date(),
                                        endDate: new Date(),
                                        key: 'selection'
                                    }]
                                    setState(resetState)
                                    onRangeChange('', '')
                                    setIsOpen(false)
                                }}
                                className="text-muted-foreground hover:text-foreground px-3 py-1 rounded text-sm transition-colors"
                            >
                                Limpiar
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                                Aplicar
                            </button>
                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    )
}
