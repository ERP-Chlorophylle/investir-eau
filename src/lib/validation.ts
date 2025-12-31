import { z } from "zod";

export const step1Schema = z.object({
  codePostal: z
    .string()
    .min(5, "Le code postal doit contenir 5 chiffres")
    .max(5, "Le code postal doit contenir 5 chiffres")
    .regex(/^\d{5}$/, "Format invalide"),
  surfaceToiture: z
    .number({ required_error: "Surface requise" })
    .min(10, "Minimum 10 m²")
    .max(1000, "Maximum 1000 m²"),
  typeToiture: z.string().min(1, "Sélectionnez un type de toiture"),
});

export const step2Schema = z.object({
  wcEnabled: z.boolean().default(false),
  wcPersonnes: z.number().min(1).max(20).optional(),

  jardinEnabled: z.boolean().default(false),
  jardinSurface: z.number().min(1).max(5000).optional(),

  autoEnabled: z.boolean().default(false),
  autoLavagesMois: z.number().min(1).max(30).optional(),

  piscineEnabled: z.boolean().default(false),
  piscineSurface: z.number().min(1).max(200).optional(),
});

export const step3Schema = z.object({
  prixEau: z.number().min(2.5).max(8).default(5),
  horizonAnnees: z.number().min(5).max(20).default(10),
});

export const step4Schema = z.object({
  email: z.string().email("Email invalide"),
  rgpdConsent: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter la politique de confidentialité" }),
  }),
  newsletterOptIn: z.boolean().default(false),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;

export type SimulationFormData = Step1Data & Step2Data & Step3Data & Step4Data;
