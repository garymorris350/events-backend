import { z } from "zod";

/** Reusable bits */
const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid ISO datetime");
const nonEmpty = (min: number) => z.string().trim().min(min);

/** Event */
export const EventSchema = z.object({
  title: nonEmpty(3),
  description: nonEmpty(10),
  location: nonEmpty(2),
  start: isoDate,
  end: isoDate,
  // We’ll normalize isPaid from priceType, but still allow it to come in:
  isPaid: z.boolean().optional().default(false),
  priceType: z.enum(["free", "fixed", "pay_what_you_feel"]).default("free"),
  pricePence: z.coerce.number().int().positive().optional().nullable(), // required if fixed
  capacity: z.coerce.number().int().positive().optional().nullable(),

  /** New: optional TMDb movie ID */
  movieId: z.string().trim().optional().nullable(),
})
.superRefine((data, ctx) => {
  // end after start
  const startMs = Date.parse(data.start);
  const endMs = Date.parse(data.end);
  if (!(endMs > startMs)) {
    ctx.addIssue({
      path: ["end"],
      code: z.ZodIssueCode.custom,
      message: "end must be after start",
    });
  }

  // price rules
  if (data.priceType === "fixed") {
    if (data.pricePence == null) {
      ctx.addIssue({
        path: ["pricePence"],
        code: z.ZodIssueCode.custom,
        message: "pricePence is required for fixed price events",
      });
    }
  } else {
    if (data.priceType === "free" && data.pricePence != null) {
      ctx.addIssue({
        path: ["pricePence"],
        code: z.ZodIssueCode.custom,
        message: "pricePence must be omitted for free events",
      });
    }
  }
})
.transform((data) => {
  // normalize isPaid from priceType
  const isPaid = data.priceType !== "free";
  return { ...data, isPaid };
});

export type EventInput = z.infer<typeof EventSchema>;

/** Signup */
export const SignupSchema = z.object({
  eventId: nonEmpty(1),
  name: nonEmpty(2),
  email: z.string().email(),
  amountPence: z.coerce.number().int().positive().optional(),
});

export type SignupInput = z.infer<typeof SignupSchema>;
