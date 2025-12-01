<!--
  BetDialog Component
  
  Modal dialog for placing a bet on a market option.
  Shows:
  - Option details and current probability
  - Stake input with validation
  - Potential payout calculation
  - Current balance
  
  Props:
  - isOpen: Whether the dialog is visible
  - market: The market being bet on
  - option: The option being bet on
  - side: "yes" or "no"
  - balance: User's current balance
  - onConfirm: Callback when bet is confirmed
  - onClose: Callback to close the dialog
-->
<script lang="ts">
	import type { MarketWithOptions, MarketOption, BetSide } from '$lib/types';
	import { formatProbability, formatCredits, calculatePotentialPayout } from '$lib/utils';

	interface Props {
		isOpen: boolean;
		market: MarketWithOptions | null;
		option: MarketOption | null;
		side: BetSide;
		balance: number;
		onConfirm: (stake: number) => void;
		onClose: () => void;
		loading?: boolean;
	}

	let { isOpen, market, option, side, balance, onConfirm, onClose, loading = false }: Props = $props();

	let stakeInput = $state('');
	let stake = $derived(parseFloat(stakeInput) || 0);
	let error = $derived(validateStake(stake));
	let potentialPayout = $derived(
		option ? calculatePotentialPayout(stake, option.probability, side) : 0
	);

	function validateStake(value: number): string | null {
		if (value <= 0) return 'Enter a stake amount';
		if (value > balance) return 'Insufficient balance';
		if (!Number.isFinite(value)) return 'Invalid amount';
		return null;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!error && stake > 0) {
			onConfirm(stake);
		}
	}

	function handleClose() {
		stakeInput = '';
		onClose();
	}

	// Quick stake buttons
	const quickStakes = [10, 25, 50, 100];
</script>

{#if isOpen && market && option}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
		onclick={handleClose}
		onkeydown={(e) => e.key === 'Escape' && handleClose()}
	>
		<!-- Dialog -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div 
			class="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
			tabindex="-1"
		>
			<!-- Header -->
			<div class="p-6 border-b border-surface-100">
				<div class="flex items-start justify-between">
					<div>
						<h2 id="dialog-title" class="text-lg font-semibold text-surface-900">
							Place Bet
						</h2>
						<p class="text-sm text-surface-500 mt-1">
							{market.title}
						</p>
					</div>
					<button 
						onclick={handleClose}
						class="text-surface-400 hover:text-surface-600 p-1"
						aria-label="Close dialog"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Content -->
			<form onsubmit={handleSubmit} class="p-6 space-y-6">
				<!-- Bet details -->
				<div class="bg-surface-50 rounded-xl p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm text-surface-500">Option</p>
							<p class="font-semibold text-surface-900">{option.label}</p>
						</div>
						<div class="text-right">
							<p class="text-sm text-surface-500">Probability</p>
							<p class="font-semibold text-surface-900">{formatProbability(option.probability)}</p>
						</div>
					</div>
					<div class="mt-3 pt-3 border-t border-surface-200">
						<p class="text-sm text-surface-500">Your prediction</p>
						<span class={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
							side === 'yes' 
								? 'bg-yes-light text-yes-dark' 
								: 'bg-no-light text-no-dark'
						}`}>
							{side === 'yes' ? 'YES' : 'NO'} – This will happen
						</span>
					</div>
				</div>

				<!-- Stake input -->
				<div>
					<label for="stake" class="label">
						Stake amount
					</label>
					<div class="relative">
						<input
							type="number"
							id="stake"
							bind:value={stakeInput}
							placeholder="0"
							min="1"
							max={balance}
							step="1"
							class="input pr-16 text-lg"
							disabled={loading}
						/>
						<span class="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 text-sm">
							credits
						</span>
					</div>

					<!-- Quick stake buttons -->
					<div class="flex gap-2 mt-2">
						{#each quickStakes as amount}
							<button
								type="button"
								onclick={() => stakeInput = Math.min(amount, balance).toString()}
								class="flex-1 py-1.5 px-3 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors disabled:opacity-50"
								disabled={loading || amount > balance}
							>
								{amount}
							</button>
						{/each}
						<button
							type="button"
							onclick={() => stakeInput = balance.toString()}
							class="flex-1 py-1.5 px-3 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50"
							disabled={loading}
						>
							Max
						</button>
					</div>

					<!-- Error message -->
					{#if error && stakeInput}
						<p class="text-sm text-no mt-2">{error}</p>
					{/if}
				</div>

				<!-- Payout preview -->
				<div class="bg-surface-50 rounded-xl p-4">
					<div class="flex justify-between items-center">
						<span class="text-surface-600">Your balance</span>
						<span class="font-medium text-surface-900">{formatCredits(balance)} credits</span>
					</div>
					<div class="flex justify-between items-center mt-2">
						<span class="text-surface-600">Potential payout</span>
						<span class="font-bold text-brand-600">
							{stake > 0 ? formatCredits(Math.round(potentialPayout)) : '–'} credits
						</span>
					</div>
					{#if stake > 0}
						<p class="text-xs text-surface-400 mt-2">
							If your prediction is correct, you win {formatCredits(Math.round(potentialPayout - stake))} credits profit
						</p>
					{/if}
				</div>

				<!-- Submit button -->
				<button
					type="submit"
					disabled={!!error || stake <= 0 || loading}
					class={`w-full py-3 px-6 rounded-button font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
						side === 'yes' 
							? 'bg-yes hover:bg-yes-dark' 
							: 'bg-no hover:bg-no-dark'
					}`}
				>
					{#if loading}
						<span class="flex items-center justify-center space-x-2">
							<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span>Placing bet...</span>
						</span>
					{:else}
						Place {side === 'yes' ? 'YES' : 'NO'} bet for {stake > 0 ? formatCredits(stake) : 0} credits
					{/if}
				</button>
			</form>
		</div>
	</div>
{/if}

