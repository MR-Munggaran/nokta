import { z } from "zod";

// ─── CREDENTIAL ───────────────────────────────────────────────────────────────

export const credentialDataSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  url:      z.string().url("URL tidak valid").optional().or(z.literal("")),
  notes:    z.string().optional(),
});

// ─── DOCUMENT ─────────────────────────────────────────────────────────────────

export const documentDataSchema = z.object({
  number: z.string().min(1, "Nomor wajib diisi"),
  issuer: z.string().min(1, "Penerbit wajib diisi"),
  expiry: z.string().optional(),
  notes:  z.string().optional(),
});

// ─── NOTE ─────────────────────────────────────────────────────────────────────

export const noteDataSchema = z.object({
  content: z.string().min(1, "Isi catatan wajib diisi"),
});

// ─── VAULT ITEM (CREATE) ──────────────────────────────────────────────────────

export const createVaultItemSchema = z.discriminatedUnion("type", [
  z.object({
    type:   z.literal("credential"),
    name:   z.string().min(1, "Nama wajib diisi"),
    shared: z.boolean().default(false),
    data:   credentialDataSchema,
  }),
  z.object({
    type:   z.literal("document"),
    name:   z.string().min(1, "Nama wajib diisi"),
    shared: z.boolean().default(false),
    data:   documentDataSchema,
  }),
  z.object({
    type:   z.literal("note"),
    name:   z.string().min(1, "Nama wajib diisi"),
    shared: z.boolean().default(false),
    data:   noteDataSchema,
  }),
]);

export const updateVaultItemSchema = createVaultItemSchema.and(
  z.object({ id: z.number() })
);

// ─── INFERRED TYPES ───────────────────────────────────────────────────────────

export type CredentialData = z.infer<typeof credentialDataSchema>;
export type DocumentData   = z.infer<typeof documentDataSchema>;
export type NoteData       = z.infer<typeof noteDataSchema>;
export type CreateVaultItemInput = z.infer<typeof createVaultItemSchema>;
export type UpdateVaultItemInput = z.infer<typeof updateVaultItemSchema>;