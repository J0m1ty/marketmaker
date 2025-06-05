import { Skeleton } from './ui/skeleton';

interface LoadingFallbackProps {
    variant?: 'default' | 'table';
}

export const LoadingFallback = ({ variant = 'default' }: LoadingFallbackProps) => {
    if (variant === 'table') {
        return (
            <div className='flex flex-col w-full h-full p-6 space-y-4'>
                <div className='flex justify-between items-center'>
                    <Skeleton className='h-8 w-48' />
                    <Skeleton className='h-8 w-24' />
                </div>
                <div className='space-y-2'>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className='h-12 w-full' />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className='flex flex-col w-full h-full p-6 space-y-4'>
            <Skeleton className='h-12 w-full' />
            <div className='grid grid-cols-3 gap-4'>
                <Skeleton className='h-32 w-full' />
                <Skeleton className='h-32 w-full' />
                <Skeleton className='h-32 w-full' />
            </div>
            <Skeleton className='h-64 w-full' />
        </div>
    );
};
