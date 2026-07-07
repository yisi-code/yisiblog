import tailwindcss from '@tailwindcss/vite'

const defaultSiteUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''

export default defineNuxtConfig({
    compatibilityDate: '2026-06-22',
    devtools: {enabled: process.env.NODE_ENV !== 'production'},
    modules: ['@nuxtjs/mdc', '@pinia/nuxt', '@nuxtjs/color-mode', '@nuxt/eslint'],
    components: [
        {
            path: '~/components',
            pathPrefix: false
        }
    ],
    css: ['katex/dist/katex.min.css', '~/assets/css/main.css'],
    vite: {
        plugins: [tailwindcss()],
        optimizeDeps: {
            include: [
                '@lucide/vue'
            ]
        }
    },
    colorMode: {
        classSuffix: '',
        preference: 'system',
        fallback: 'dark'
    },
    runtimeConfig: {
        adminToken: process.env.ADMIN_TOKEN || '',
        dataCapsule: {
            endpoint: process.env.DATA_CAPSULE_ENDPOINT || '',
            bucket: process.env.DATA_CAPSULE_BUCKET || '',
            accessKeyId: process.env.DATA_CAPSULE_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.DATA_CAPSULE_SECRET_ACCESS_KEY || ''
        },
        githubData: {
            owner: process.env.GITHUB_DATA_OWNER || '',
            repo: process.env.GITHUB_DATA_REPO || '',
            branch: process.env.GITHUB_DATA_BRANCH || 'main',
            token: process.env.GITHUB_DATA_TOKEN || '',
            basePath: process.env.GITHUB_DATA_BASE_PATH || 'public/content-data'
        },
        ai: {
            provider: process.env.AI_PROVIDER || 'deepseek',
            apiKey: process.env.AI_API_KEY || '',
            baseUrl: process.env.AI_BASE_URL || '',
            model: process.env.AI_MODEL || '',
            maxOutputTokens: process.env.AI_MAX_OUTPUT_TOKENS || '150',
            temperature: process.env.AI_TEMPERATURE || '0.85'
        },
        gitalk: {
            clientSecret: process.env.GITALK_CLIENT_SECRET || ''
        },
        public: {
            siteUrl: process.env.NUXT_PUBLIC_SITE_URL || defaultSiteUrl,
            gitalk: {
                clientID: process.env.NUXT_PUBLIC_GITALK_CLIENT_ID || '',
                clientSecretConfigured: Boolean(process.env.GITALK_CLIENT_SECRET),
                repo: process.env.NUXT_PUBLIC_GITALK_REPO || '',
                owner: process.env.NUXT_PUBLIC_GITALK_OWNER || '',
                admin: (process.env.NUXT_PUBLIC_GITALK_ADMIN || '').split(',').map((item) => item.trim()).filter(Boolean)
            }
        }
    },
    routeRules: {
        '/timeline': {redirect: '/posts'}
    },
    nitro: {
        prerender: {
            crawlLinks: false,
            failOnError: false
        },
        publicAssets: [
            {
                dir: 'public',
                baseURL: '/'
            }
        ]
    }
})
