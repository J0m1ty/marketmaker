import { useCallback } from "react";
import { useDropzone } from 'react-dropzone';
import { cn } from "@/lib/utils";

interface DropzoneProps {
    className?: string;
}

export const Dropzone = ({ className }: DropzoneProps) => {
    const onDrop = useCallback((files: File[]) => {
        console.log('Dropped files:', files);
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div {...getRootProps()} className={cn("border-2 border-dashed p-10 rounded-2xl", className)}>
            <input {...getInputProps()} />
            {
                isDragActive ?
                    <p>Drop the files here ...</p> :
                    <p>Drag and drop .market files here, or click to select files</p>
            }
        </div>
    )
}