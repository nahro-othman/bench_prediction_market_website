<!--
  Connect Wallet Page - MetaMask Authentication
  (Same as login - wallet connection serves both purposes)
-->
<script lang="ts">
	import WalletConnect from '$lib/components/auth/WalletConnect.svelte';
</script>

<svelte:head>
	<title>Get Started - Bench</title>
	<meta name="description" content="Connect your MetaMask wallet to start trading on Bench prediction markets powered by Avalanche." />
</svelte:head>

<div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-surface-50 to-brand-50">
	<WalletConnect />
</div>
