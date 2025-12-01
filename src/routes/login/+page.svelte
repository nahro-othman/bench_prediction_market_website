<!--
  Login Page using SvelteFire
-->
<script lang="ts">
	import { SignedIn } from 'sveltefire';
	import { AuthForm } from '$lib/components';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
</script>

<svelte:head>
	<title>Log In - Bench</title>
	<meta name="description" content="Sign in to your Bench account to access football prediction markets." />
</svelte:head>

{#if browser}
	<SignedIn>
		{@const _ = goto('/')}
	</SignedIn>
{/if}

<div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
	<AuthForm mode="login" />
</div>
