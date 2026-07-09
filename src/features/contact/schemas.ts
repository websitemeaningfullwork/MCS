import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name.").max(100),
  email: z.string().email("Enter a valid email address.").max(200),
  subject: z.string().min(3, "Please add a short subject.").max(150),
  message: z
    .string()
    .min(10, "Please write at least 10 characters.")
    .max(2000, "Please keep your message under 2000 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;
