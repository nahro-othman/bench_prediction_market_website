<!--
  OptionRow Component
  
  Displays a single option within a market card.
  Shows:
  - Option label (e.g., "Ronaldo", "Spain")
  - Current probability (e.g., "25%")
  - YES/NO betting buttons
  
  Props:
  - option: The MarketOption data
  - onBet: Callback when user clicks YES or NO
-->
<script lang="ts">
	import type { MarketOption, BetSide } from '$lib/types';
	import { formatProbability } from '$lib/utils';

	interface Props {
		option: MarketOption;
		onBet: (optionId: string, side: BetSide) => void;
		disabled?: boolean;
	}

	let { option, onBet, disabled = false }: Props = $props();
</script>

<div class="flex items-center justify-between py-3 px-1 border-b border-surface-100 last:border-b-0">
	<!-- Option label -->
	<div class="flex-1 min-w-0">
		<span class="text-surface-900 font-medium truncate block">
			{option.label}
		</span>
	</div>

	<!-- Probability display -->
	<div class="flex-shrink-0 mx-4">
		<span class="text-lg font-bold text-surface-700">
			{formatProbability(option.probability)}
		</span>
	</div>

	<!-- YES/NO buttons -->
	<div class="flex flex-col space-y-1.5">
		<button
			onclick={() => onBet(option.id, 'yes')}
			disabled={disabled}
			class="btn-yes min-w-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
		>
			Yes
		</button>
		<button
			onclick={() => onBet(option.id, 'no')}
			disabled={disabled}
			class="btn-no min-w-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
		>
			No
		</button>
	</div>
</div>


