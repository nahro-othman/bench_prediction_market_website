<!--
  Navbar Component with Wallet Authentication
  
  Shows connected wallet and balance from Firestore
-->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import {
    walletStore,
    disconnectWallet,
    autoConnectWallet,
  } from "$lib/services/web3/auth";

  let isMenuOpen = $state(false);

  onMount(async () => {
    if (browser) {
      // Try to auto-connect
      await autoConnectWallet();
    }
  });

  async function handleDisconnect() {
    disconnectWallet();
    goto("/");
    isMenuOpen = false;
  }

  function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function formatAVAX(amount: string | null): string {
    if (!amount) return "0.00";
    return parseFloat(amount).toFixed(2);
  }
</script>

<nav class="bg-white border-b border-surface-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <!-- Logo and main nav -->
      <div class="flex items-center">
        <!-- Logo -->
        <a href="/" class="flex items-center space-x-2">
          <img src="/Bench%20Logo.svg" alt="Bench Logo" class="h-8 w-auto" />
        </a>

        <!-- Desktop nav links -->
        <div class="hidden sm:ml-8 sm:flex sm:space-x-6">
          <a
            href="/"
            class="text-surface-600 hover:text-surface-900 px-3 py-2 text-sm font-medium transition-colors"
          >
            Markets
          </a>
          {#if browser && $walletStore.isConnected}
            <a
              href="/account"
              class="text-surface-600 hover:text-surface-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              My Account
            </a>
          {/if}
        </div>
      </div>

      <!-- Right side: wallet connection -->
      <div class="flex items-center space-x-4">
        {#if browser && $walletStore.isConnected}
          <!-- Connected: show balance and wallet -->
          <div class="flex items-center space-x-4">
            <!-- AVAX Balance -->
            <div
              class="hidden sm:flex items-center space-x-2 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200"
            >
              <svg
                class="w-4 h-4 text-orange-600"
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
              <span class="text-sm font-semibold text-orange-900"
                >{formatAVAX($walletStore.balance)} AVAX</span
              >
            </div>

            <!-- Wallet dropdown -->
            <div class="relative">
              <button
                onclick={() => (isMenuOpen = !isMenuOpen)}
                class="flex items-center space-x-2 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-lg border border-brand-200 transition-colors"
              >
                <div
                  class="w-6 h-6 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center"
                >
                  <svg
                    class="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <span
                  class="text-sm font-medium text-surface-900 hidden md:block"
                >
                  {formatAddress($walletStore.address || "")}
                </span>
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
                  class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50 border border-surface-200"
                >
                  <div class="px-4 py-3 border-b border-surface-100">
                    <p class="text-xs text-surface-500 mb-1">Wallet Address</p>
                    <p class="text-sm font-mono text-surface-900 truncate">
                      {$walletStore.address}
                    </p>
                  </div>

                  <!-- Mobile balance -->
                  <div class="sm:hidden px-4 py-2 border-b border-surface-100">
                    <div class="flex justify-between items-center">
                      <p class="text-xs text-surface-500">AVAX Balance</p>
                      <p class="text-sm font-semibold text-orange-600">
                        {formatAVAX($walletStore.balance)} AVAX
                      </p>
                    </div>
                  </div>

                  <a
                    href="/account"
                    class="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-50"
                    onclick={() => (isMenuOpen = false)}
                  >
                    <div class="flex items-center gap-2">
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      My Account
                    </div>
                  </a>
                  <a
                    href="/admin"
                    class="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-50"
                    onclick={() => (isMenuOpen = false)}
                  >
                    <div class="flex items-center gap-2">
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Admin
                    </div>
                  </a>
                  <button
                    onclick={handleDisconnect}
                    class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Disconnect
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <!-- Not connected: show connect button -->
          <div class="flex items-center space-x-3">
            <a
              href="/login"
              class="btn bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Connect Wallet
            </a>
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
