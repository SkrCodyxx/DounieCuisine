export type UploadResponse = { id: number } | { mediaAsset: { id: number } };

export async function uploadMedia(file: File, endpoint: string = "/api/admin/upload-media"): Promise<number> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    let msg = "Upload failed";
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
    } catch {}
    throw new Error(msg);
  }

  const data: UploadResponse = await res.json();
  const id = (data as any)?.mediaAsset?.id ?? (data as any)?.id;
  if (!id) throw new Error("Invalid upload response: missing id");
  return id;
}
