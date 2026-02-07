import { FileText, File, Image as ImageIcon, Video, Music, Archive } from "lucide-react";

export const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

export const getFileIcon = (type) => {
  if (
    type.includes("pdf") ||
    type.includes("word") ||
    type.includes("document") ||
    type.includes("sheet") ||
    type.includes("excel") ||
    type.includes("presentation") ||
    type.includes("powerpoint") ||
    type.includes("text")
  )
    return FileText;

  if (type.includes("image")) return ImageIcon;
  if (type.includes("video")) return Video;
  if (type.includes("audio")) return Music;
  if (type.includes("zip") || type.includes("rar") || type.includes("7z"))
    return Archive;

  return File;
};

export const getFileColor = (type) => {
  if (type.includes("pdf")) return "text-red-600 bg-red-50";
  if (type.includes("word") || type.includes("document"))
    return "text-blue-600 bg-blue-50";
  if (type.includes("sheet") || type.includes("excel"))
    return "text-green-600 bg-green-50";
  if (type.includes("presentation") || type.includes("powerpoint"))
    return "text-orange-600 bg-orange-50";
  if (type.includes("image"))
    return "text-purple-600 bg-purple-50";
  if (type.includes("video"))
    return "text-pink-600 bg-pink-50";
  if (type.includes("audio"))
    return "text-indigo-600 bg-indigo-50";
  if (type.includes("zip") || type.includes("rar") || type.includes("7z"))
    return "text-yellow-600 bg-yellow-50";
  if (type.includes("text"))
    return "text-gray-600 bg-gray-50";

  return "text-gray-600 bg-gray-50";
};

export const getOwnerDisplay = (owner, currentUserEmail) => {
  return owner === "me" ? currentUserEmail : owner;
};
