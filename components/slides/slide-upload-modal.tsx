'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';

interface SlideUploadModalProps {
  talkId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SlideUploadModal({ talkId, onClose, onSuccess }: SlideUploadModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [slideUrl, setSlideUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const response = await fetch(`/api/talks/${talkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides_url: slideUrl }),
      });

      if (response.ok) {
        showToast('Slides URL uploaded successfully', 'success');
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to upload slides URL', 'error');
      }
    } catch (error) {
      showToast('Failed to upload slides URL', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/talks/${talkId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        showToast('Slides file uploaded successfully', 'success');
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to upload slides file', 'error');
      }
    } catch (error) {
      showToast('Failed to upload slides file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size on client side
      const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
      if (!allowedTypes.includes(file.type)) {
        showToast('File must be PDF, PPT, or PPTX', 'error');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        showToast('File size must not exceed 50MB', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dc-dark-1 border-2 border-dc-yellow w-full max-w-2xl relative">
        {/* Corner decorations */}
        <div className="absolute top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-dc-yellow/30" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-r-2 border-t-2 border-dc-yellow/30" />

        {/* Header */}
        <div className="bg-dc-dark-2 border-b-2 border-dc-yellow p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white font-mono flex items-center gap-3">
            <span className="text-dc-yellow">↑</span> UPLOAD_SLIDES
          </h2>
          <button
            onClick={onClose}
            className="text-dc-gray hover:text-white font-mono text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-dc-dark-3">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 px-6 py-4 font-mono font-bold uppercase transition-colors ${
              activeTab === 'url'
                ? 'bg-dc-dark-2 text-dc-yellow border-b-2 border-dc-yellow'
                : 'bg-dc-dark-1 text-dc-gray hover:text-white'
            }`}
          >
            PASTE URL
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 px-6 py-4 font-mono font-bold uppercase transition-colors ${
              activeTab === 'file'
                ? 'bg-dc-dark-2 text-dc-yellow border-b-2 border-dc-yellow'
                : 'bg-dc-dark-1 text-dc-gray hover:text-white'
            }`}
          >
            UPLOAD FILE
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'url' ? (
            <form onSubmit={handleUrlSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-mono text-dc-gray-light mb-2">
                  SLIDES URL <span className="text-dc-yellow">*</span>
                </label>
                <input
                  type="url"
                  value={slideUrl}
                  onChange={(e) => setSlideUrl(e.target.value)}
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 px-4 py-3 text-white font-mono focus:border-dc-yellow focus:outline-none"
                />
                <p className="text-xs text-dc-gray font-mono mt-2">
                  Google Drive, Dropbox, or any public URL
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-dc-dark-2 border-2 border-dc-dark-3 text-dc-gray font-mono font-bold uppercase hover:text-white hover:border-dc-yellow/50 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={uploading || !slideUrl}
                  className="px-6 py-2 bg-dc-yellow text-dc-dark font-mono font-bold uppercase hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'UPLOADING...' : 'SUBMIT URL'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFileSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-mono text-dc-gray-light mb-2">
                  SELECT FILE <span className="text-dc-yellow">*</span>
                </label>
                <div className="border-2 border-dashed border-dc-dark-3 bg-dc-dark-2 p-8 text-center hover:border-dc-yellow/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="cursor-pointer block"
                  >
                    {selectedFile ? (
                      <div>
                        <p className="text-dc-yellow font-mono font-bold mb-2">
                          ✓ {selectedFile.name}
                        </p>
                        <p className="text-dc-gray text-sm font-mono">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <p className="text-dc-gray-light text-xs font-mono mt-2">
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white font-mono font-bold mb-2">
                          Click to browse or drag and drop
                        </p>
                        <p className="text-dc-gray text-sm font-mono">
                          PDF, PPT, PPTX • Max 50MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-dc-dark-2 border-2 border-dc-dark-3 text-dc-gray font-mono font-bold uppercase hover:text-white hover:border-dc-yellow/50 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-6 py-2 bg-dc-yellow text-dc-dark font-mono font-bold uppercase hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'UPLOADING...' : 'UPLOAD FILE'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
