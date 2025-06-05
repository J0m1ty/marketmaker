import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

interface ClearDialogProps {
    confirmSource: 'new' | 'clear';
    showConfirmDialog: boolean;
    setShowConfirmDialog: (show: boolean) => void;
    resetData: () => void;
}

export const ClearDialog = ({
    confirmSource,
    showConfirmDialog,
    setShowConfirmDialog,
    resetData,
}: ClearDialogProps) => {
    return (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{confirmSource === 'new' ? 'Start new?' : 'Clear spreadsheet?'}</DialogTitle>
                    <DialogDescription>
                        This will permanently delete all your current market data and cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant='outline' onClick={() => setShowConfirmDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant='destructive'
                        onClick={() => {
                            resetData();
                            setShowConfirmDialog(false);
                        }}
                    >
                        Clear Data
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
