"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ImageUploader({
  restaurantId,
  folder,
  inputName,
  initialUrl,
  onUploaded,
}: {
  restaurantId: string;
  folder: string;
  inputName?: string;
  initialUrl: string | null;
  onUploaded?: (url: string) => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${restaurantId}/${folder}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(path, file, { upsert: true });

    setUploading(false);

    if (uploadError) {
      setError(`Falha ao enviar imagem: ${uploadError.message}`);
      return;
    }

    const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
    setUrl(data.publicUrl);
    onUploaded?.(data.publicUrl);
  }

  return (
    <div>
      <div
        className="admin-image-preview"
        style={url ? { backgroundImage: `url(${url})` } : undefined}
      />
      {inputName && <input type="hidden" name={inputName} value={url ?? ""} readOnly />}
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
      {uploading && <div className="admin-hint">Enviando...</div>}
      {error && (
        <div className="admin-hint" style={{ color: "#dc2626" }}>
          {error}
        </div>
      )}
    </div>
  );
}
