<script lang="ts">
  import { onMount } from "svelte";
  import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
  } from "firebase/firestore";
  import { getFirebaseFirestore } from "$lib/firebase";
  import { browser } from "$app/environment";

  // Props using Svelte 5 runes
  let { marketId, options = [] }: { marketId: string; options: any[] } =
    $props();

  let chartData = $state<
    Array<{
      timestamp: Date;
      optionVolumes: { [optionId: string]: number };
    }>
  >([]);
  let optionLabels = $state<{ [optionId: string]: string }>({});
  let maxVolume = $state(0);
  let totalBets = $state(0);
  let isLoading = $state(true);

  // Load betting activity over time
  $effect(() => {
    if (browser && marketId && options.length > 0) {
      loadBettingActivity();
    }
  });

  async function loadBettingActivity() {
    isLoading = true;
    try {
      const db = getFirebaseFirestore();
      const positionsRef = collection(db, "positions");
      const q = query(
        positionsRef,
        where("marketId", "==", marketId),
        orderBy("createdAt", "asc")
      );

      const snapshot = await getDocs(q);
      const positions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      totalBets = positions.length;

      // Build option labels map
      const labels: { [optionId: string]: string } = {};
      options.forEach((opt) => {
        labels[opt.id] = opt.label || "Unknown Option";
      });
      optionLabels = labels;

      // Build time-series data for each option
      const dataPoints: typeof chartData = [];
      const optionVolumes: { [optionId: string]: number } = {};

      // Initialize all options to 0
      options.forEach((opt) => {
        optionVolumes[opt.id] = 0;
      });

      positions.forEach((position: any) => {
        const timestamp = position.createdAt?.toDate() || new Date();
        const stake = parseFloat(position.stake) || 0;
        const optionId = position.optionId;

        // Update the cumulative volume for this option
        optionVolumes[optionId] = (optionVolumes[optionId] || 0) + stake;

        // Take a snapshot of current volumes
        dataPoints.push({
          timestamp,
          optionVolumes: { ...optionVolumes },
        });
      });

      chartData = dataPoints;

      // Calculate max volume across all options for scaling
      maxVolume = Math.max(
        ...Object.values(
          dataPoints.length > 0
            ? dataPoints[dataPoints.length - 1].optionVolumes
            : { default: 0 }
        )
      );
    } catch (error) {
      console.error("Error loading betting activity:", error);
    } finally {
      isLoading = false;
    }
  }

  function formatVolume(volume: number): string {
    return volume.toFixed(2);
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getOptionColor(index: number): string {
    const colors = [
      "#f97316", // orange
      "#3b82f6", // blue
      "#a855f7", // purple
      "#ec4899", // pink
      "#14b8a6", // teal
      "#eab308", // yellow
    ];
    return colors[index % colors.length];
  }

  // Calculate SVG path for line chart for a specific option
  function getLinePath(data: typeof chartData, optionId: string): string {
    if (data.length === 0) return "";

    const width = 800;
    const height = 200;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 10;
    const paddingBottom = 10;

    const xScale = (index: number) =>
      paddingLeft +
      (index / (data.length - 1 || 1)) * (width - paddingLeft - paddingRight);
    const yScale = (value: number) =>
      paddingTop +
      (height - paddingTop - paddingBottom) -
      (value / (maxVolume || 1)) * (height - paddingTop - paddingBottom);

    // Find first data point where this option has volume
    let startIndex = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i].optionVolumes[optionId] > 0) {
        startIndex = i;
        break;
      }
    }

    let path = `M ${xScale(startIndex)} ${yScale(data[startIndex].optionVolumes[optionId] || 0)}`;

    for (let i = startIndex + 1; i < data.length; i++) {
      const x = xScale(i);
      const y = yScale(data[i].optionVolumes[optionId] || 0);
      path += ` L ${x} ${y}`;
    }

    return path;
  }

  // Calculate total volume from options
  let totalVolume = $state(0);
  $effect(() => {
    if (options && options.length > 0) {
      totalVolume = options.reduce((sum, opt) => {
        return sum + (opt.yesVolume || 0) + (opt.noVolume || 0);
      }, 0);
    }
  });
</script>

<div class="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
  <div class="mb-4">
    <h3 class="text-lg font-semibold text-surface-900">
      Betting Activity Over Time
    </h3>
    <p class="text-sm text-surface-500 mt-1">Cumulative volume chart</p>
  </div>

  {#if isLoading}
    <div class="text-center py-12 text-surface-400">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"
      ></div>
      <p class="text-sm mt-2">Loading activity...</p>
    </div>
  {:else if chartData.length === 0}
    <div class="text-center py-12 text-surface-400">
      <svg
        class="w-12 h-12 mx-auto mb-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
        />
      </svg>
      <p class="text-sm">No betting activity yet</p>
      <p class="text-xs text-surface-400 mt-1">Place the first bet!</p>
    </div>
  {:else}
    <!-- Line Chart -->
    <div class="mb-6 bg-surface-50 rounded-lg p-4">
      <svg
        viewBox="0 0 800 220"
        class="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Grid lines -->
        <g class="grid-lines" stroke="#e5e7eb" stroke-width="1" opacity="0.5">
          {#each [0, 0.25, 0.5, 0.75, 1] as tick}
            {@const y = 10 + (200 - 10 - 10) * (1 - tick)}
            <line x1="60" y1={y} x2="780" y2={y} stroke-dasharray="4,4" />
          {/each}
        </g>

        <!-- Y-axis labels -->
        <g class="y-axis-labels" fill="#6b7280" font-size="11">
          {#each [0, 0.25, 0.5, 0.75, 1] as tick}
            {@const y = 10 + (200 - 10 - 10) * (1 - tick)}
            <text x="5" y={y + 4} text-anchor="start">
              {formatVolume(maxVolume * tick)}
            </text>
          {/each}
        </g>

        <!-- Y-axis line -->
        <line
          x1="60"
          y1="10"
          x2="60"
          y2="200"
          stroke="#9ca3af"
          stroke-width="1"
        />

        <!-- X-axis line -->
        <line
          x1="60"
          y1="200"
          x2="780"
          y2="200"
          stroke="#9ca3af"
          stroke-width="1"
        />

        <!-- Draw lines for each option -->
        {#each options as option, optionIndex}
          {@const color = getOptionColor(optionIndex)}
          {@const hasVolume = chartData.some(
            (d) => (d.optionVolumes[option.id] || 0) > 0
          )}

          {#if hasVolume}
            <!-- Line path for this option -->
            <path
              d={getLinePath(chartData, option.id)}
              fill="none"
              stroke={color}
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity="0.9"
            />

            <!-- Data points for this option -->
            {#each chartData as point, i}
              {@const volume = point.optionVolumes[option.id] || 0}
              {#if volume > 0}
                {@const width = 800}
                {@const height = 200}
                {@const paddingLeft = 60}
                {@const paddingRight = 20}
                {@const paddingTop = 10}
                {@const paddingBottom = 10}
                {@const x =
                  paddingLeft +
                  (i / (chartData.length - 1 || 1)) *
                    (width - paddingLeft - paddingRight)}
                {@const y =
                  paddingTop +
                  (height - paddingTop - paddingBottom) -
                  (volume / (maxVolume || 1)) *
                    (height - paddingTop - paddingBottom)}

                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill={color}
                  stroke="white"
                  stroke-width="1.5"
                >
                  <title
                    >{option.label}: {formatDate(point.timestamp)} - {formatVolume(
                      volume
                    )} AVAX</title
                  >
                </circle>
              {/if}
            {/each}
          {/if}
        {/each}
      </svg>

      <!-- X-axis labels -->
      <div class="flex justify-between mt-2 px-4 text-xs text-surface-500">
        {#if chartData.length > 0}
          <span>{formatDate(chartData[0].timestamp)}</span>
          {#if chartData.length > 1}
            <span>{formatDate(chartData[chartData.length - 1].timestamp)}</span>
          {/if}
        {/if}
      </div>
    </div>

    <!-- Legend -->
    <div class="mb-6 flex flex-wrap gap-4 justify-center">
      {#each options as option, i}
        {@const finalVolume =
          chartData.length > 0
            ? chartData[chartData.length - 1].optionVolumes[option.id] || 0
            : 0}
        {#if finalVolume > 0}
          <div
            class="flex items-center gap-2 px-3 py-2 bg-surface-50 rounded-lg"
          >
            <div
              class="w-3 h-3 rounded-full"
              style={`background-color: ${getOptionColor(i)}`}
            ></div>
            <span class="text-sm font-medium text-surface-700"
              >{option.label}</span
            >
            <span class="text-xs text-surface-500"
              >{formatVolume(finalVolume)} AVAX</span
            >
          </div>
        {/if}
      {/each}
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-surface-50 rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-brand-600">
          {formatVolume(
            chartData.length > 0
              ? Object.values(
                  chartData[chartData.length - 1].optionVolumes
                ).reduce((sum, v) => sum + v, 0)
              : 0
          )}
        </p>
        <p class="text-xs text-surface-500 mt-1">Total Volume (AVAX)</p>
      </div>
      <div class="bg-surface-50 rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-surface-900">{totalBets}</p>
        <p class="text-xs text-surface-500 mt-1">Total Bets</p>
      </div>
      <div class="bg-surface-50 rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-surface-900">{options.length}</p>
        <p class="text-xs text-surface-500 mt-1">Options</p>
      </div>
    </div>

    <!-- Option Breakdown -->
    {#if options.length > 0 && totalVolume > 0}
      <div class="mt-6 pt-4 border-t border-surface-200">
        <h4 class="text-sm font-semibold text-surface-700 mb-3">
          Volume by Option
        </h4>
        <div class="space-y-2">
          {#each options as option, i}
            {@const volume = (option.yesVolume || 0) + (option.noVolume || 0)}
            {@const percentage =
              totalVolume > 0 ? (volume / totalVolume) * 100 : 0}
            {#if volume > 0}
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    style={`background-color: ${getOptionColor(i)}`}
                  ></div>
                  <span class="text-surface-700">{option.label}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-semibold text-surface-900"
                    >{formatVolume(volume)} AVAX</span
                  >
                  <span class="text-surface-500 text-xs"
                    >{percentage.toFixed(1)}%</span
                  >
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>


