import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getOrCreateRoom, getMessages, addMessage } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    getOrCreateRoom: publicProcedure
      .input(z.object({ slug: z.string().min(1).max(100) }))
      .mutation(async ({ input }) => {
        return await getOrCreateRoom(input.slug);
      }),
    
    getMessages: publicProcedure
      .input(z.object({ roomId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getMessages(input.roomId, input.limit);
      }),
    
    sendMessage: publicProcedure
      .input(z.object({
        roomId: z.number(),
        nickname: z.string().min(1).max(100),
        content: z.string().min(1),
        fontFamily: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await addMessage(input.roomId, input.nickname, input.content, input.fontFamily);
      }),
  }),
});

export type AppRouter = typeof appRouter;
