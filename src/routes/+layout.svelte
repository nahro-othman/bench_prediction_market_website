<!--
  Root Layout with SvelteFire
  
  Uses SvelteFire's FirebaseApp component to provide Firebase context
  to all child components throughout the app.
-->
<script lang="ts">
  import "../app.css";
  import { FirebaseApp } from "sveltefire";
  import {
    getFirebaseAuth,
    getFirebaseFirestore,
    firebaseConfig,
  } from "$lib/firebase";
  import { browser } from "$app/environment";
  import Navbar from "$lib/components/layout/Navbar.svelte";

  let { children } = $props();

  // Only initialize Firebase in the browser
  const auth = browser ? getFirebaseAuth() : null;
  const firestore = browser ? getFirebaseFirestore() : null;
</script>

<div class="min-h-screen flex flex-col">
  {#if browser && auth && firestore}
    <FirebaseApp {auth} {firestore}>
      <Navbar />

      <main class="flex-1">
        {@render children()}
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t border-surface-200 py-8 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            class="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0"
          >
            <div class="flex items-center space-x-2">
              <div
                class="w-6 h-6 bg-gradient-to-br from-brand-500 to-brand-700 rounded-md flex items-center justify-center"
              >
                <span class="text-white font-bold text-xs">B</span>
              </div>
              <span class="text-sm text-surface-500"
                >© 2024 Bench. Demo prediction market.</span
              >
            </div>
            <div class="flex space-x-6 text-sm text-surface-500">
              <span>Football predictions made fun</span>
            </div>
          </div>
        </div>
      </footer>
    </FirebaseApp>
  {:else}
    <!-- SSR fallback / loading state -->
    <Navbar />
    <main class="flex-1">
      {@render children()}
    </main>
    <footer class="bg-white border-t border-surface-200 py-8 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          class="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0"
        >
          <div class="flex items-center space-x-2">
            <div
              class="w-6 h-6 bg-gradient-to-br from-brand-500 to-brand-700 rounded-md flex items-center justify-center"
            >
              <span class="text-white font-bold text-xs">B</span>
            </div>
            <span class="text-sm text-surface-500"
              >© 2025 Bench. prediction market.</span
            >
          </div>
        </div>
      </div>
    </footer>
  {/if}
</div>
