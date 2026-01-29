import type { Meta, StoryObj } from '@storybook/react'
import { Toaster } from './toaster'
import { useToast } from '../../hooks/use-toast'
import { ToastAction } from './toast'

const meta = {
    title: 'UI/Toast',
    component: Toaster,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

function ToastDemo() {
    const { toast } = useToast()

    return (
        <div className="flex flex-col gap-4">
            <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                onClick={() => {
                    toast({
                        title: "Scheduled: Catch up ",
                        description: "Friday, February 10, 2023 at 5:57 PM",
                    })
                }}
            >
                Show Toast
            </button>

            <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                onClick={() => {
                    toast({
                        variant: "destructive",
                        title: "Uh oh! Something went wrong.",
                        description: "There was a problem with your request.",
                        action: (
                            <ToastAction altText="Try again">Try again</ToastAction>
                        ),
                    })
                }}
            >
                Show Error Toast
            </button>

            <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                onClick={() => {
                    toast({
                        variant: "success",
                        title: "Success!",
                        description: "Your action was completed successfully.",
                    })
                }}
            >
                Show Success Toast
            </button>
        </div>
    )
}

export const Default: Story = {
    render: () => <ToastDemo />,
}
