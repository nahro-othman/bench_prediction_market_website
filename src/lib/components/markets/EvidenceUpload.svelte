<script lang="ts">
  import { onMount } from "svelte";
  import { collection, query, where, getDocs } from "firebase/firestore";
  import { getFirebaseFirestore } from "$lib/firebase";
  import { walletStore } from "$lib/services/web3/auth";
  import { browser } from "$app/environment";

  let { marketId, marketTitle }: { marketId: string; marketTitle: string } =
    $props();

  let hasPosition = $state(false);
  let isUploading = $state(false);
  let uploadSuccess = $state("");
  let uploadError = $state("");
  let userPosition = $state<any>(null);
  let uploadedImages = $state<string[]>([]);
  let isOpen = $state(false);

  // Check if user has a position in this market
  $effect(() => {
    if (browser && $walletStore.isConnected && marketId) {
      checkUserPosition();
    }
  });

  async function checkUserPosition() {
    const db = getFirebaseFirestore();
    const positionsRef = collection(db, "positions");
    const q = query(
      positionsRef,
      where("walletAddress", "==", $walletStore.address),
      where("marketId", "==", marketId)
    );

    try {
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        hasPosition = true;
        userPosition = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        uploadedImages = userPosition.evidenceImages || [];
      }
    } catch (error) {
      console.error("Error checking position:", error);
    }
  }

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      uploadError = "Please select an image file";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      uploadError = "Image must be less than 5MB";
      return;
    }

    isUploading = true;
    uploadError = "";
    uploadSuccess = "";

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Data = reader.result as string;

        // Upload to Firebase Storage
        const fileName = `evidence/${marketId}/${userPosition.id}/${Date.now()}_${file.name}`;

        const { uploadToFirebaseStorage } = await import("$lib/firebase");
        const downloadURL = await uploadToFirebaseStorage(
          fileName,
          base64Data,
          file.type
        );

        // Update position document with image URL
        const { doc, updateDoc, arrayUnion } = await import(
          "firebase/firestore"
        );
        const db = getFirebaseFirestore();
        const positionRef = doc(db, "positions", userPosition.id);

        await updateDoc(positionRef, {
          evidenceImages: arrayUnion(downloadURL),
          lastUpdated: new Date().toISOString(),
        });

        uploadedImages = [...uploadedImages, downloadURL];
        uploadSuccess = "Image uploaded successfully!";
        isUploading = false;

        // Clear success message after 3 seconds
        setTimeout(() => {
          uploadSuccess = "";
        }, 3000);

        // Reset file input
        target.value = "";
      };

      reader.onerror = () => {
        uploadError = "Failed to read file";
        isUploading = false;
      };
    } catch (error: any) {
      console.error("Upload error:", error);
      uploadError = error.message || "Failed to upload image";
      isUploading = false;
    }
  }

  async function deleteImage(imageUrl: string) {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const { doc, updateDoc, arrayRemove } = await import(
        "firebase/firestore"
      );
      const db = getFirebaseFirestore();
      const positionRef = doc(db, "positions", userPosition.id);

      await updateDoc(positionRef, {
        evidenceImages: arrayRemove(imageUrl),
      });

      uploadedImages = uploadedImages.filter((img) => img !== imageUrl);
      uploadSuccess = "Image deleted successfully!";

      setTimeout(() => {
        uploadSuccess = "";
      }, 3000);
    } catch (error: any) {
      uploadError = "Failed to delete image";
    }
  }
</script>

{#if browser && $walletStore.isConnected && hasPosition}
  <div class="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-surface-900">Evidence Upload</h3>
        <p class="text-sm text-surface-500 mt-1">
          You participated in this market. Upload evidence to support your
          position.
        </p>
      </div>
      <button
        onclick={() => (isOpen = !isOpen)}
        class="text-brand-600 hover:text-brand-700 text-sm font-medium"
      >
        {isOpen ? "Hide" : "Show"}
      </button>
    </div>

    {#if isOpen}
      <div class="space-y-4">
        <!-- Upload Section -->
        <div
          class="border-2 border-dashed border-surface-200 rounded-lg p-6 text-center"
        >
          <input
            type="file"
            accept="image/*"
            onchange={handleFileSelect}
            disabled={isUploading}
            id="evidence-upload"
            class="hidden"
          />

          <label
            for="evidence-upload"
            class={`cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <svg
              class="w-12 h-12 mx-auto text-surface-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>

            {#if isUploading}
              <p class="text-sm text-surface-600">Uploading...</p>
            {:else}
              <p class="text-sm text-surface-600 mb-1">
                <span class="text-brand-600 font-medium">Click to upload</span> or
                drag and drop
              </p>
              <p class="text-xs text-surface-500">PNG, JPG, GIF up to 5MB</p>
            {/if}
          </label>
        </div>

        <!-- Success/Error Messages -->
        {#if uploadSuccess}
          <div
            class="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2"
          >
            <svg
              class="w-5 h-5 text-green-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <p class="text-sm text-green-800">{uploadSuccess}</p>
          </div>
        {/if}

        {#if uploadError}
          <div
            class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"
          >
            <svg
              class="w-5 h-5 text-red-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <p class="text-sm text-red-800">{uploadError}</p>
          </div>
        {/if}

        <!-- Uploaded Images Gallery -->
        {#if uploadedImages.length > 0}
          <div>
            <h4 class="text-sm font-medium text-surface-700 mb-3">
              Your Evidence ({uploadedImages.length})
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {#each uploadedImages as imageUrl, index}
                <div class="relative group">
                  <img
                    src={imageUrl}
                    alt="Evidence {index + 1}"
                    class="w-full h-32 object-cover rounded-lg border border-surface-200"
                  />
                  <button
                    onclick={() => deleteImage(imageUrl)}
                    class="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete image"
                  >
                    <svg
                      class="w-4 h-4"
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
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="absolute bottom-2 right-2 bg-white text-surface-700 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    title="View full size"
                  >
                    <svg
                      class="w-4 h-4"
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
                  </a>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-xs text-blue-800">
            <strong>Note:</strong> Uploaded images are visible to admins and will
            be reviewed when settling the market. Only upload relevant evidence that
            supports your position.
          </p>
        </div>
      </div>
    {/if}
  </div>
{/if}








