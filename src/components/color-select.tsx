import { useState } from 'react';
import { Button } from './ui/button';
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogTrigger,
    DialogTitle,
    DialogContent,
    DialogFooter,
    DialogClose,
} from './ui/dialog';
import Circle from '@uiw/react-color-circle';

interface ColorSelectProps {
    curve: string;
    hex: string;
    setHex: (hex: string) => void;
}

export const ColorSelect = ({ curve, hex, setHex }: ColorSelectProps) => {
    const [tempHex, setTempHex] = useState(hex);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant={'outline'}
                    className='font-bold border-2 transition-all duration-200'
                    style={{
                        borderColor: hex,
                        color: hex,
                        boxShadow: `inset 0 0 10px ${hex}60, 0 0 10px ${hex}30`,
                    }}
                >
                    <span>Color</span>
                </Button>
            </DialogTrigger>
            <DialogContent className='w-80'>
                <DialogHeader>
                    <DialogTitle>{curve === 'demand' ? 'Demand Curve' : 'Supply Curve'}</DialogTitle>
                    <DialogDescription>Pick a display color</DialogDescription>
                    <div className='flex justify-center my-4'>
                        <Circle
                            colors={['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3']}
                            color={tempHex}
                            onChange={(color) => setTempHex(color.hex)}
                            pointProps={{
                                style: {
                                    width: '35px',
                                    height: '35px',
                                    borderRadius: '30%',
                                },
                            }}
                        />
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant='outline'>Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button type='submit' onClick={() => setHex(tempHex)}>
                                Apply
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
};
