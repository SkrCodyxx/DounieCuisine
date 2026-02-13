import SingleUpload from "@/components/upload/SingleUpload";

export interface MediaUploaderProps {
  label: string;
  mediaId?: number | null;
  onMediaChange: (mediaId: number) => void;
  onMediaRemove: () => void;
  accept?: string;
  mediaType?: "image" | "video" | "both";
  description?: string;
}

// Backward-compatible wrapper around new SingleUpload component.
// Use everywhere you previously used MediaUploader; migrate to SingleUpload directly when convenient.
export default function MediaUploader(props: MediaUploaderProps) {
  const computedAccept = props.accept ||
    (props.mediaType === "image"
      ? "image/*"
      : props.mediaType === "video"
        ? "video/*"
        : "image/*,video/*");

  return (
    <SingleUpload
      label={props.label}
      value={props.mediaId || null}
      onChange={(id) => {
        if (id === null) {
          props.onMediaRemove();
        } else {
          props.onMediaChange(id);
        }
      }}
      accept={computedAccept}
      description={props.description}
      enableGallerySelect={true}
      className=""
    />
  );
}
