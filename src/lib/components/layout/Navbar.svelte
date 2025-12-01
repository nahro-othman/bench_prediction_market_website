<!--
  Navbar Component using SvelteFire
  
  Uses SvelteFire's SignedIn, SignedOut, and User components
  for reactive authentication state.
-->
<script lang="ts">
  import { SignedIn, SignedOut, User } from "sveltefire";
  import { Doc } from "sveltefire";
  import { signOut } from "firebase/auth";
  import { getFirebaseAuth } from "$lib/firebase";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import type { UserProfile } from "$lib/types";

  let isMenuOpen = $state(false);

  async function handleLogout() {
    if (browser) {
      const auth = getFirebaseAuth();
      await signOut(auth);
      goto("/");
    }
  }

  function formatCredits(amount: number): string {
    return new Intl.NumberFormat("en-US").format(Math.round(amount || 0));
  }
</script>

<nav class="bg-white border-b border-surface-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <!-- Logo and main nav -->
      <div class="flex items-center">
        <!-- Logo -->
        <a href="/" class="flex items-center space-x-2">
          <div
            class="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center"
          >
            <span class="text-white font-bold text-lg">B</span>
          </div>
          <span class="text-xl font-bold text-surface-900">Bench</span>
        </a>

        <!-- Desktop nav links -->
        <div class="hidden sm:ml-8 sm:flex sm:space-x-6">
          <a
            href="/"
            class="text-surface-600 hover:text-surface-900 px-3 py-2 text-sm font-medium transition-colors"
          >
            Markets
          </a>
          {#if browser}
            <SignedIn>
              <a
                href="/account"
                class="text-surface-600 hover:text-surface-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                My Account
              </a>
            </SignedIn>
          {/if}
        </div>
      </div>

      <!-- Right side: auth buttons or user info -->
      <div class="flex items-center space-x-4">
        {#if browser}
          <SignedIn>
            <User let:user>
              <!-- Logged in: show balance and avatar -->
              <div class="flex items-center space-x-4">
                <!-- Balance display using SvelteFire Doc -->
                <Doc ref="users/{user.uid}" let:data={profile}>
                  {#if profile}
                    <div
                      class="hidden sm:flex items-center space-x-1 bg-surface-100 px-4 py-2 rounded-button"
                    >
                      <svg
                        class="w-4 h-4 text-brand-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span class="font-semibold text-surface-900"
                        >{formatCredits(profile.balance)}</span
                      >
                    </div>
                  {/if}
                </Doc>

                <!-- User dropdown -->
                <div class="relative">
                  <button
                    onclick={() => (isMenuOpen = !isMenuOpen)}
                    class="flex items-center space-x-2 focus:outline-none"
                  >
                    {#if user.photoURL}
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        class="w-8 h-8 rounded-full object-cover"
                      />
                    {:else}
                      <div
                        class="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center"
                      >
                        <span class="text-brand-700 font-medium text-sm">
                          {user.displayName?.charAt(0) ||
                            user.email?.charAt(0) ||
                            "?"}
                        </span>
                      </div>
                    {/if}
                    <svg
                      class="w-4 h-4 text-surface-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <!-- Dropdown menu -->
                  {#if isMenuOpen}
                    <div
                      class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-surface-200"
                    >
                      <div class="px-4 py-2 border-b border-surface-100">
                        <p
                          class="text-sm font-medium text-surface-900 truncate"
                        >
                          {user.displayName || "User"}
                        </p>
                        <p class="text-xs text-surface-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <!-- Mobile balance -->
                      <Doc ref="users/{user.uid}" let:data={profile}>
                        {#if profile}
                          <div
                            class="sm:hidden px-4 py-2 border-b border-surface-100"
                          >
                            <p class="text-xs text-surface-500">Balance</p>
                            <p class="text-sm font-semibold text-surface-900">
                              {formatCredits(profile.balance)} credits
                            </p>
                          </div>
                        {/if}
                      </Doc>
                      <a
                        href="/account"
                        class="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-50"
                        onclick={() => (isMenuOpen = false)}
                      >
                        My Account
                      </a>
                      <a
                        href="/admin"
                        class="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-50"
                        onclick={() => (isMenuOpen = false)}
                      >
                        Admin
                      </a>
                      <button
                        onclick={handleLogout}
                        class="w-full text-left px-4 py-2 text-sm text-surface-700 hover:bg-surface-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            </User>
          </SignedIn>

          <SignedOut>
            <!-- Logged out: show auth buttons -->
            <div class="flex items-center space-x-3">
              <a href="/login" class="btn-secondary text-sm"> Log In </a>
              <a href="/signup" class="btn-primary text-sm"> Sign Up </a>
            </div>
          </SignedOut>
        {:else}
          <!-- SSR fallback: show auth buttons -->
          <div class="flex items-center space-x-3">
            <a href="/login" class="btn-secondary text-sm"> Log In </a>
            <a href="/signup" class="btn-primary text-sm"> Sign Up </a>
          </div>
        {/if}
      </div>
    </div>
  </div>
</nav>

<!-- Click outside to close menu -->
{#if isMenuOpen}
  <button
    class="fixed inset-0 z-40 cursor-default"
    onclick={() => (isMenuOpen = false)}
    aria-label="Close menu"
  ></button>
{/if}
