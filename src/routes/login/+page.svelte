<!--
  Connect Wallet Page - MetaMask Authentication
-->
<script lang="ts">
	import WalletConnect from '$lib/components/auth/WalletConnect.svelte';
</script>

<svelte:head>
	<title>Connect Wallet - Bench</title>
	<meta name="description" content="Connect your MetaMask wallet to trade on Bench prediction markets powered by Avalanche." />
</svelte:head>

<div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-surface-50 to-brand-50">
	<WalletConnect />
</div>
