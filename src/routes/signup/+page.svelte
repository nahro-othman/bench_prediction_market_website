<!--
  Sign Up Page using SvelteFire
-->
<script lang="ts">
	import { SignedIn } from 'sveltefire';
	import { AuthForm } from '$lib/components';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
</script>

<svelte:head>
	<title>Sign Up - Bench</title>
	<meta name="description" content="Create your free Bench account and start predicting football outcomes today." />
</svelte:head>

{#if browser}
	<SignedIn>
		{@const _ = goto('/')}
	</SignedIn>
{/if}

<div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
	<AuthForm mode="signup" />
</div>
