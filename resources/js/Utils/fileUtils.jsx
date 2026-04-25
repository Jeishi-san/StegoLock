import { FileText, File, Image as ImageIcon, Video, Music, Archive } from 'lucide-react';

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
};

export const formatDateTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(d);
};

export const getFileIcon = (type) => {
  if (type.includes('pdf') || type.includes('word') || type.includes('document') ||
      type.includes('sheet') || type.includes('excel') || type.includes('presentation') ||
      type.includes('powerpoint') || type.includes('text')) return FileText;
  if (type.includes('image')) return ImageIcon;
  if (type.includes('video')) return Video;
  if (type.includes('audio')) return Music;
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return Archive;
  return File;
};

export const getFileColor = (type) => {
  if (type.includes('pdf')) return 'text-red-600 bg-red-50';
  if (type.includes('word') || type.includes('document')) return 'text-blue-600 bg-blue-50';
  if (type.includes('sheet') || type.includes('excel')) return 'text-green-600 bg-green-50';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'text-orange-600 bg-orange-50';
  if (type.includes('image')) return 'text-purple-600 bg-purple-50';
  if (type.includes('video')) return 'text-pink-600 bg-pink-50';
  if (type.includes('audio')) return 'text-indigo-600 bg-indigo-50';
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'text-yellow-600 bg-yellow-50';
  if (type.includes('text')) return 'text-gray-600 bg-gray-50';
  return 'text-gray-600 bg-gray-50';
};

export const getOwnerDisplay = (owner, currentUserEmail) => {
  return owner === 'me' ? currentUserEmail : owner;
};

export const categorizeDocuments = (documents) => {
  const categories = {
    documents: { size: 0, count: 0, label: 'Documents', color: 'blue' },
    images: { size: 0, count: 0, label: 'Images', color: 'purple' },
    videos: { size: 0, count: 0, label: 'Videos', color: 'pink' },
    audio: { size: 0, count: 0, label: 'Audio', color: 'indigo' },
    archives: { size: 0, count: 0, label: 'Archives', color: 'yellow' },
    other: { size: 0, count: 0, label: 'Other', color: 'gray' }
  };

  documents.forEach(doc => {
    const type = doc.file_type?.toLowerCase() || '';
    const size = parseInt(doc.in_cloud_size || doc.original_size || 0);

    if (type.includes('pdf') || type.includes('word') || type.includes('document') || type.includes('text') || type.includes('txt')) {
      categories.documents.size += size;
      categories.documents.count++;
    } else if (type.includes('image')) {
      categories.images.size += size;
      categories.images.count++;
    } else if (type.includes('video')) {
      categories.videos.size += size;
      categories.videos.count++;
    } else if (type.includes('audio')) {
      categories.audio.size += size;
      categories.audio.count++;
    } else if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('archive')) {
      categories.archives.size += size;
      categories.archives.count++;
    } else {
      categories.other.size += size;
      categories.other.count++;
    }
  });

  return categories;
};

export const sortDocuments = (documents, sortBy) => {
  return [...documents].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.filename.localeCompare(b.filename);
      case 'name-desc':
        return b.filename.localeCompare(a.filename);
      case 'date-newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'date-oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'size-largest':
        return (b.in_cloud_size || b.original_size) - (a.in_cloud_size || a.original_size);
      case 'size-smallest':
        return (a.in_cloud_size || a.original_size) - (b.in_cloud_size || b.original_size);
      default:
        return 0;
    }
  });
};
