import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const baseContentSchema = z.object({
  title: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  cover: z.string().optional(),
  tags: z.array(z.string()).optional()
})

const postSchema = baseContentSchema.extend({})

const chatterSchema = baseContentSchema.extend({
  mood: z.string().optional()
})

const momentSchema = z.object({
  date: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  images: z.array(z.string()).optional()
})

const aboutSchema = baseContentSchema.extend({})

export default defineContentConfig({
  collections: {
    posts: defineCollection({
      type: 'page',
      source: 'posts/*.md',
      schema: postSchema
    }),
    chatters: defineCollection({
      type: 'page',
      source: 'chatters/*.md',
      schema: chatterSchema
    }),
    moments: defineCollection({
      type: 'page',
      source: 'moments/*.md',
      schema: momentSchema
    }),
    about: defineCollection({
      type: 'page',
      source: 'about/*.md',
      schema: aboutSchema
    })
  }
})
