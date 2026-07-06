<script setup lang="ts">
</script>
<template>
  <div class="relative min-h-screen user-select-none">
    <ClientOnly>
      <BackgroundCanvas/>
    </ClientOnly>
    <SiteNavbar/>
    <main class="relative z-10 mx-auto w-full max-w-6xl px-layout-gutter">
      <slot/>
    </main>
    <ClientOnly>
      <CyberCat/>
    </ClientOnly>

    <ClientOnly>
      <MusicDock/>
    </ClientOnly>

    <ClientOnly>
      <ToastHost/>
    </ClientOnly>

    <ClientOnly>
      <PageLoadingOverlay/>
    </ClientOnly>
  </div>
</template>
