<!--
  Wallet Connect Dialog Component
  
  Modal dialog for connecting MetaMask or Core wallet
-->
<script lang="ts">
  import { browser } from "$app/environment";
  import {
    connectWallet,
    isMetaMaskInstalled,
    isCoreWalletInstalled,
    walletStore,
    switchToAvalanche,
    type WalletType,
  } from "$lib/services/web3/auth";

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen = $bindable(false), onClose }: Props = $props();

  let loading = $state(false);
  let error = $state("");
  let showNetworkError = $state(false);
  let selectedWallet = $state<WalletType | null>(null);

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

      // Close dialog on successful connection
      onClose();
      isOpen = false;
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
      onClose();
      isOpen = false;
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

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
      isOpen = false;
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    onclick={handleBackdropClick}
    role="presentation"
  >
    <!-- Dialog -->
    <div
      class="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => {
        if (e.key === "Escape") {
          onClose();
          isOpen = false;
        }
      }}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 pb-4">
        <h2 class="text-2xl font-bold text-surface-900">Connect Wallet</h2>
        <button
          onclick={() => {
            onClose();
            isOpen = false;
          }}
          class="text-surface-400 hover:text-surface-600 transition-colors p-1"
          aria-label="Close dialog"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Wallet Not Installed Warnings -->
        {#if browser && !isMetaMaskInstalled() && !isCoreWalletInstalled()}
          <div
            class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6"
          >
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
                <p class="font-semibold text-orange-900 mb-1">
                  Wallet Required
                </p>
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
            class="w-full group relative bg-white hover:bg-surface-50 border-2 border-surface-200 hover:border-orange-500 text-surface-900 py-4 rounded-xl font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-surface-200"
          >
            {#if loading && selectedWallet === "metamask"}
              <span class="inline-flex items-center">
                <span class="inline-block animate-spin mr-2">⏳</span>
                Connecting...
              </span>
            {:else}
              <span class="inline-flex items-center justify-center gap-3">
                <!-- MetaMask Icon -->
                <svg
                  class="w-8 h-8"
                  viewBox="0 0 318.6 318.6"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polygon
                    fill="#E2761B"
                    stroke="#E2761B"
                    points="274.1,35.5 174.6,109.4 193,65.8"
                  />
                  <g>
                    <polygon
                      fill="#E4761B"
                      stroke="#E4761B"
                      points="44.4,35.5 143.1,110.1 125.6,65.8"
                    />
                    <polygon
                      fill="#E4761B"
                      stroke="#E4761B"
                      points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"
                    />
                    <polygon
                      fill="#E4761B"
                      stroke="#E4761B"
                      points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8"
                    />
                    <polygon
                      fill="#E4761B"
                      stroke="#E4761B"
                      points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"
                    />
                    <polygon
                      fill="#E4761B"
                      stroke="#E4761B"
                      points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1"
                    />
                    <polygon
                      fill="#E4761B"
                      stroke="#E4761B"
                      points="106.8,247.4 140.6,230.9 111.4,208.1"
                    />
                    <polygon
                      fill="#E4761B"
                      stroke="#E4761B"
                      points="177.9,230.9 211.8,247.4 207.1,208.1"
                    />
                  </g>
                  <g>
                    <polygon
                      fill="#D7C1B3"
                      stroke="#D7C1B3"
                      points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3"
                    />
                    <polygon
                      fill="#D7C1B3"
                      stroke="#D7C1B3"
                      points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9"
                    />
                  </g>
                  <polygon
                    fill="#233447"
                    stroke="#233447"
                    points="138.8,193.5 110.6,185.2 130.5,176.1"
                  />
                  <polygon
                    fill="#233447"
                    stroke="#233447"
                    points="179.7,193.5 188,176.1 208,185.2"
                  />
                  <g>
                    <polygon
                      fill="#CD6116"
                      stroke="#CD6116"
                      points="106.8,247.4 111.6,206.8 80.3,207.7"
                    />
                    <polygon
                      fill="#CD6116"
                      stroke="#CD6116"
                      points="207,206.8 211.8,247.4 238.3,207.7"
                    />
                    <polygon
                      fill="#CD6116"
                      stroke="#CD6116"
                      points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2"
                    />
                    <polygon
                      fill="#CD6116"
                      stroke="#CD6116"
                      points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1"
                    />
                  </g>
                  <g>
                    <polygon
                      fill="#E4751F"
                      stroke="#E4751F"
                      points="87.8,162.1 111.4,208.1 110.6,185.2"
                    />
                    <polygon
                      fill="#E4751F"
                      stroke="#E4751F"
                      points="208.1,185.2 207.1,208.1 230.8,162.1"
                    />
                    <polygon
                      fill="#E4751F"
                      stroke="#E4751F"
                      points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7"
                    />
                    <polygon
                      fill="#E4751F"
                      stroke="#E4751F"
                      points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5"
                    />
                  </g>
                  <polygon
                    fill="#F6851B"
                    stroke="#F6851B"
                    points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208.1,185.2"
                  />
                  <polygon
                    fill="#F6851B"
                    stroke="#F6851B"
                    points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5"
                  />
                  <polygon
                    fill="#C0AD9E"
                    stroke="#C0AD9E"
                    points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4"
                  />
                  <polygon
                    fill="#161616"
                    stroke="#161616"
                    points="177.9,230.9 173.1,227.6 145.4,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253"
                  />
                  <g>
                    <polygon
                      fill="#763D16"
                      stroke="#763D16"
                      points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2"
                    />
                    <polygon
                      fill="#763D16"
                      stroke="#763D16"
                      points="31.8,73.4 40.3,114.2 34.9,118.2 42.9,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5"
                    />
                  </g>
                  <polygon
                    fill="#F6851B"
                    stroke="#F6851B"
                    points="267.2,153.5 214.9,138.2 230.8,162.1 207.1,208.1 238.3,207.7 284.8,207.7"
                  />
                  <polygon
                    fill="#F6851B"
                    stroke="#F6851B"
                    points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.4,208.1 87.8,162.1"
                  />
                  <polygon
                    fill="#F6851B"
                    stroke="#F6851B"
                    points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.3,182.8"
                  />
                </svg>
                MetaMask
              </span>
            {/if}
          </button>

          <!-- Core Wallet Button -->
          <button
            onclick={() => handleConnect("core")}
            disabled={loading ||
              (browser && !isCoreWalletInstalled()) ||
              (loading && selectedWallet !== "core")}
            class="w-full group relative bg-white hover:bg-surface-50 border-2 border-surface-200 hover:border-red-500 text-surface-900 py-4 rounded-xl font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-surface-200"
          >
            {#if loading && selectedWallet === "core"}
              <span class="inline-flex items-center">
                <span class="inline-block animate-spin mr-2">⏳</span>
                Connecting...
              </span>
            {:else}
              <span class="inline-flex items-center justify-center gap-3">
                <!-- Core Wallet Icon -->
                <img src="/core.svg" alt="Core" class="w-8 h-8" />
                Core
              </span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}






