// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  runtimeConfig: {
    public: {
      SB_KEY: process.env.SB_KEY,
      SB_URL: process.env.SB_URL
    }
  }
})
