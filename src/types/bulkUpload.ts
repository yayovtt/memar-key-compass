
export interface FileWithRelativeClientPath {
  file: File;
  clientName: string;
  pathWithinClientFolder: string;
}

export interface BulkClientFolderUploaderProps {
  onUploadComplete: () => void;
}
