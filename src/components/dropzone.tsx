import { useDropzone, type FileRejection } from 'react-dropzone';
import { cn } from "@/lib/utils";
import { Upload, FileText } from "lucide-react";
import { toast } from 'sonner';

interface DropzoneProps {
    className?: string;
    onDrop?: (file: File) => void;
}

export const Dropzone = ({ className, onDrop }: DropzoneProps) => {
    const handleDrop = (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        if (rejectedFiles.length > 0) {
            const rejection = rejectedFiles[0];
            const errorCode = rejection.errors[0]?.code;
            
            if (errorCode === 'file-invalid-type') {
                toast.error('Invalid file type. Please upload a CSV file.');
            } else if (errorCode === 'too-many-files') {
                toast.error('Too many files. Please upload only one CSV file.');
            } else {
                toast.error('File upload failed. Please try again.');
            }
            
            return;
        }

        if (acceptedFiles.length > 0) {
            if (!onDrop) {
                console.warn('File cannot be processed.');
                return;
            }

            onDrop(acceptedFiles[0]);
        }
    }

    const { 
        getRootProps, 
        getInputProps, 
        isDragActive,
        isDragAccept, 
        isDragReject 
    } = useDropzone({ 
        onDrop: handleDrop,
        accept: {
            'text/csv': []
        },
        multiple: false,
    });

    

    return (
        <div 
            {...getRootProps()} 
            className={cn(
                "relative border-2 border-dashed p-10 rounded-2xl transition-all duration-200 cursor-pointer group",
                "hover:border-primary/50 hover:bg-muted/30",
                isDragActive && "border-primary bg-primary/5 scale-[1.01]",
                isDragActive && isDragAccept && "border-purple-500 bg-purple-50 dark:bg-purple-950/10",
                isDragActive && isDragReject && "border-red-500 bg-red-50 dark:bg-red-950/20",
                className
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className={cn(
                    "p-4 rounded-full",
                    "bg-muted",
                    isDragActive && "bg-primary/10",
                    isDragActive && isDragAccept && "bg-purple-100 dark:bg-purple-900/50",
                    isDragActive && isDragReject && "bg-red-100 dark:bg-red-900/30"
                )}>
                    {isDragActive ? (
                        <FileText className={cn(
                            "h-8 w-8",
                            isDragActive && isDragAccept && "text-purple-600 dark:text-purple-400",
                            isDragActive && isDragReject && "text-red-600",
                            isDragActive && !isDragAccept && !isDragReject && "text-primary"
                        )} />
                    ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                </div>
                
                <div className="space-y-2 min-h-[4rem] flex flex-col justify-center">
                    <p className={cn(
                        "text-lg",
                        isDragActive && isDragAccept && "text-purple-600 dark:text-purple-400",
                        isDragActive && isDragReject && "text-red-600",
                        isDragActive && !isDragAccept && !isDragReject && "text-primary",
                        !isDragActive && "text-foreground"
                    )}>
                        {isDragActive ? (
                            isDragReject 
                                ? "Cannot upload these file(s)"
                                : "Drop your file here!"
                        ) : (
                            <>Upload a <span className="font-mono">.csv</span> market file</>
                        )}
                    </p>
                    <p className={cn(
                        "text-sm text-muted-foreground",
                        isDragActive && "opacity-0"
                    )}>
                        Click to browse or drag and drop your file here
                    </p>
                </div>
            </div>
        </div>
    )
}