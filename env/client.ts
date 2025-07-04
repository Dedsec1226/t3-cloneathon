// https://env.t3.gg/docs/nextjs#create-your-schema
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const clientEnv = createEnv({
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string().min(1).optional(),
  },
      runtimeEnv: {
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },
})

