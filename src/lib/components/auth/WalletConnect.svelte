<!--
  Wallet Connect Component
  
  MetaMask and Core wallet connection for Avalanche network
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import {
    connectWallet,
    isMetaMaskInstalled,
    isCoreWalletInstalled,
    autoConnectWallet,
    setupWalletListeners,
    walletStore,
    switchToAvalanche,
    type WalletType,
  } from "$lib/services/web3/auth";

  let loading = $state(false);
  let error = $state("");
  let showNetworkError = $state(false);
  let selectedWallet = $state<WalletType | null>(null);

  onMount(async () => {
    if (browser) {
      // Setup listeners for wallet changes
      setupWalletListeners();

      // Try to auto-connect if previously connected
      await autoConnectWallet();

      // If already connected, redirect to home
      if ($walletStore.isConnected) {
        goto("/");
      }
    }
  });

  async function handleConnect(walletType: WalletType) {
    error = "";
    showNetworkError = false;
    loading = true;
    selectedWallet = walletType;

    try {
      if (walletType === "metamask" && !isMetaMaskInstalled()) {
        error =
          "MetaMask is not installed. Please install MetaMask to continue.";
        loading = false;
        return;
      }

      if (walletType === "core" && !isCoreWalletInstalled()) {
        error =
          "Core wallet is not installed. Please install Core wallet to continue.";
        loading = false;
        return;
      }

      await connectWallet(walletType);

      // Redirect to home on successful connection
      goto("/");
    } catch (err: any) {
      console.error("Connection error:", err);

      if (err.message?.includes("network")) {
        showNetworkError = true;
        error = "Please switch to Avalanche Fuji Testnet";
      } else {
        error = err.message || "Failed to connect wallet. Please try again.";
      }
    } finally {
      loading = false;
    }
  }

  async function handleSwitchNetwork() {
    error = "";
    showNetworkError = false;
    loading = true;

    try {
      await switchToAvalanche(selectedWallet || undefined);
      await connectWallet(selectedWallet || "metamask");
      goto("/");
    } catch (err: any) {
      error = err.message || "Failed to switch network";
    } finally {
      loading = false;
    }
  }

  function openMetaMaskDownload() {
    window.open("https://metamask.io/download/", "_blank");
  }

  function openCoreDownload() {
    window.open("https://core.app/", "_blank");
  }
</script>

<div class="w-full max-w-md mx-auto">
  <div class="bg-white rounded-xl shadow-lg p-8 border border-surface-200">
    <!-- Header -->
    <div class="text-center mb-8">
      <div
        class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center"
      >
        <svg
          class="w-12 h-12 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-surface-900 mb-2">
        Connect Your Wallet
      </h2>
      <p class="text-surface-600">
        Choose your wallet to start trading on Avalanche
      </p>
    </div>

    <!-- Wallet Not Installed Warnings -->
    {#if browser && !isMetaMaskInstalled() && !isCoreWalletInstalled()}
      <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p class="font-semibold text-orange-900 mb-1">Wallet Required</p>
            <p class="text-sm text-orange-800 mb-3">
              You need to install MetaMask or Core wallet to use this
              application.
            </p>
            <div class="flex gap-2">
              <button
                onclick={openMetaMaskDownload}
                class="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Install MetaMask
                <svg
                  class="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>
              <button
                onclick={openCoreDownload}
                class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Install Core
                <svg
                  class="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Error Message -->
    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-sm text-red-800">{error}</p>
        </div>
      </div>
    {/if}

    <!-- Network Error with Switch Button -->
    {#if showNetworkError}
      <button
        onclick={handleSwitchNetwork}
        disabled={loading}
        class="w-full btn bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if loading}
          <span class="inline-block animate-spin mr-2">⏳</span>
          Switching Network...
        {:else}
          Switch to Avalanche Network
        {/if}
      </button>
    {/if}

    <!-- Connect Buttons -->
    <div class="space-y-3">
      <!-- MetaMask Button -->
      <button
        onclick={() => handleConnect("metamask")}
        disabled={loading ||
          (browser && !isMetaMaskInstalled()) ||
          (loading && selectedWallet !== "metamask")}
        class="w-full btn bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
      >
        {#if loading && selectedWallet === "metamask"}
          <span class="inline-flex items-center">
            <span class="inline-block animate-spin mr-2">⏳</span>
            Connecting...
          </span>
        {:else}
          <span class="inline-flex items-center justify-center gap-3">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
            </svg>
            Connect with MetaMask
          </span>
        {/if}
      </button>

      <!-- Core Wallet Button -->
      <button
        onclick={() => handleConnect("core")}
        disabled={loading ||
          (browser && !isCoreWalletInstalled()) ||
          (loading && selectedWallet !== "core")}
        class="w-full btn bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
      >
        {#if loading && selectedWallet === "core"}
          <span class="inline-flex items-center">
            <span class="inline-block animate-spin mr-2">⏳</span>
            Connecting...
          </span>
        {:else}
          <span class="inline-flex items-center justify-center gap-3">
            <svg
              class="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
            Connect with Core
          </span>
        {/if}
      </button>
    </div>

    <!-- Info -->
    <div class="mt-6 pt-6 border-t border-surface-200">
      <h3 class="font-semibold text-surface-900 mb-3 flex items-center gap-2">
        <svg
          class="w-5 h-5 text-brand-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Why Crypto Wallets?
      </h3>
      <ul class="space-y-2 text-sm text-surface-600">
        <li class="flex items-start gap-2">
          <svg
            class="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Secure wallet connection to Avalanche blockchain</span>
        </li>
        <li class="flex items-start gap-2">
          <svg
            class="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Trade with real AVAX on prediction markets</span>
        </li>
        <li class="flex items-start gap-2">
          <svg
            class="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Your keys, your funds - fully decentralized</span>
        </li>
        <li class="flex items-start gap-2">
          <svg
            class="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Choose between MetaMask or Core - both work perfectly!</span>
        </li>
      </ul>
    </div>

    <!-- Network Info -->
  </div>
</div>
