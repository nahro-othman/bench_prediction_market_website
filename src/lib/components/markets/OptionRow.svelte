<!--
  OptionRow Component
  
  Displays a single option within a market card.
  Shows:
  - Option label (e.g., "Ronaldo", "Spain")
  - Current probability with visual bar
  - YES/NO betting buttons
  
  Props:
  - option: The MarketOption data
  - onBet: Callback when user clicks YES or NO
  - index: Optional index for color variation
-->
<script lang="ts">
	import type { MarketOption, BetSide } from '$lib/types';
	import { formatProbability } from '$lib/utils';

	interface Props {
		option: MarketOption;
		onBet: (optionId: string, side: BetSide) => void;
		disabled?: boolean;
		index?: number;
	}

	let { option, onBet, disabled = false, index = 0 }: Props = $props();
	
	// Get color based on index for visual variety
	const colorClasses = [
		'from-blue-500 to-blue-600',
		'from-purple-500 to-purple-600',
		'from-green-500 to-green-600',
		'from-orange-500 to-orange-600',
		'from-pink-500 to-pink-600',
		'from-teal-500 to-teal-600',
	];
	const barColor = colorClasses[index % colorClasses.length];
</script>

<div class="flex items-center justify-between p-3 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors">
	<!-- Label and probability -->
	<div class="flex-1 flex items-center gap-3 min-w-0">
		<span class="text-sm font-semibold text-surface-900 truncate">
			{option.label}
		</span>
		<span class="text-lg font-bold text-surface-800 tabular-nums">
			{formatProbability(option.probability)}
		</span>
	</div>

	<!-- YES/NO buttons -->
	<div class="flex gap-2 ml-3">
		<button
			onclick={() => onBet(option.id, 'yes')}
			disabled={disabled}
			class="px-4 py-1.5 bg-yes hover:bg-yes-dark text-white text-xs font-bold rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
		>
			YES
		</button>
		<button
			onclick={() => onBet(option.id, 'no')}
			disabled={disabled}
			class="px-4 py-1.5 bg-no hover:bg-no-dark text-white text-xs font-bold rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
		>
			NO
		</button>
	</div>
</div>


