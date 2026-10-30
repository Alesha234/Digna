import { z } from "zod";

export const BillScanUploadSchema = z
  .object({
    fileName: z
      .string()
      .trim()
      .min(1, "Use a JPG, PNG, or WebP photo.")
      .max(100, "Use a JPG, PNG, or WebP photo.")
      .regex(/\.(?:jpg|jpeg|png|webp)$/i, "Use a JPG, PNG, or WebP photo."),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp"], {
      message: "Use a JPG, PNG, or WebP photo.",
    }),
    sizeBytes: z
      .number()
      .int()
      .min(1024, "Use a photo under 10 MB.")
      .max(10485760, "Use a photo under 10 MB."),
    width: z.number().int().min(100).max(8000).optional(),
    height: z.number().int().min(100).max(8000).optional(),
    testMode: z
      .literal(true, { message: "Demo runs in test mode only." })
      .optional(),
  })
  .strict();

export type BillScanUploadInput = z.infer<typeof BillScanUploadSchema>;
