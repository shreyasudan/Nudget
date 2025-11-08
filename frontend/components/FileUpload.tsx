'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { transactionService } from '@/lib/api';

interface FileUploadProps {
  onUploadComplete: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const response = await transactionService.uploadFile(file);
      setMessage(`Success! ${response.data.message}`);
      onUploadComplete();
    } catch (error: any) {
      setMessage(`Error: ${error.response?.data?.detail || 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <label className="relative cursor-pointer">
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
        <div className={`flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : 'Upload Transactions'}
        </div>
      </label>
      {message && (
        <p className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}