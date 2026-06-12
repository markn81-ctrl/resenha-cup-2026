import { CardsEdge, CardsRange, PredictionOutcome } from "@prisma/client";
import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const signUpSchema = credentialsSchema.extend({
  name: z.string().min(2),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  acceptTerms: z.literal(true)
});

export const predictionInputSchema = z.object({
  matchId: z.string().cuid(),
  outcome: z.nativeEnum(PredictionOutcome),
  score: z.object({
    home: z.number().min(0).max(20),
    away: z.number().min(0).max(20)
  }),
  scorers: z.array(z.string().min(1).max(40)).max(2),
  cardsEdge: z.nativeEnum(CardsEdge),
  cardsRange: z.nativeEnum(CardsRange)
});

export const postSchema = z.object({
  content: z.string().min(2).max(500),
  title: z.string().min(2).max(80).optional()
});

export const commentSchema = z.object({
  postId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
  content: z.string().min(1).max(300)
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(240).optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal(""))
});

export const resultSimulationSchema = z.object({
  matchId: z.string().cuid(),
  score: z.object({
    home: z.number().int().min(0).max(20),
    away: z.number().int().min(0).max(20)
  }),
  scorers: z.array(z.string().trim().min(1).max(40)).max(20),
  cardsEdge: z.nativeEnum(CardsEdge),
  cardsRange: z.nativeEnum(CardsRange)
});

export const adminPlayerUpdateSchema = z.object({
  playerId: z.string().cuid(),
  name: z.string().trim().min(2).max(80)
});
