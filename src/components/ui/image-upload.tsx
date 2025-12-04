import { useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from './button'
import { uploadImage, deleteImage, getImageUrl } from '@/libs/storage'

interface ImageUploadProps {
  value?: string | null
  onChange: (path: string | null) => void
  folder: string
  label?: string
  accept?: string
}

export function ImageUpload({
  value,
  onChange,
  folder,
  label = 'Upload Image',
  accept = 'image/*',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const previewUrl = getImageUrl(value)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const filePath = await uploadImage(file, folder)
    setIsUploading(false)

    if (filePath) {
      onChange(filePath)
    }
  }

  const handleRemove = async () => {
    if (!value) return

    setIsDeleting(true)
    const success = await deleteImage(value)
    setIsDeleting(false)

    if (success) {
      onChange(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading || isDeleting}
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                {label}
              </>
            )}
          </Button>
        </label>
        <input
          id="image-upload"
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={isUploading || isDeleting}
          className="hidden"
        />
        {value && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleRemove}
            disabled={isUploading || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
          </Button>
        )}
      </div>

      {previewUrl && (
        <div className="flex items-center gap-3 rounded-md border p-3">
          <img
            src={previewUrl}
            alt="Preview"
            className="size-16 rounded border object-contain p-1"
          />
          <div className="flex-1 space-y-1">
            <p className="text-xs text-muted-foreground break-all">{value}</p>
          </div>
        </div>
      )}
    </div>
  )
}
