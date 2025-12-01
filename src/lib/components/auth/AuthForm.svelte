<!--
  AuthForm Component using Firebase Auth directly
  
  Handles email/password and Google sign-in.
-->
<script lang="ts">
  import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile,
  } from "firebase/auth";
  import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
  import { getFirebaseAuth, getFirebaseFirestore } from "$lib/firebase";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";

  interface Props {
    mode: "login" | "signup";
  }

  let { mode }: Props = $props();

  let email = $state("");
  let password = $state("");
  let displayName = $state("");
  let error = $state("");
  let loading = $state(false);

  const INITIAL_BALANCE = 1000;

  async function createUserProfile(
    uid: string,
    userEmail: string,
    userName: string | null,
    photoURL: string | null
  ) {
    if (!browser) return;

    const firestore = getFirebaseFirestore();
    const userRef = doc(firestore, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid,
        email: userEmail,
        displayName: userName,
        photoURL: photoURL,
        balance: INITIAL_BALANCE,
        createdAt: Timestamp.now(),
      });
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!browser) return;

    error = "";
    loading = true;

    try {
      const auth = getFirebaseAuth();

      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        if (displayName && credential.user) {
          await updateProfile(credential.user, { displayName });
        }

        await createUserProfile(
          credential.user.uid,
          credential.user.email || email,
          displayName || null,
          null
        );
      }
      goto("/");
    } catch (err) {
      console.error("Auth error:", err);
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  }

  async function handleGoogleSignIn() {
    if (!browser) return;

    error = "";
    loading = true;

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);

      await createUserProfile(
        credential.user.uid,
        credential.user.email || "",
        credential.user.displayName,
        credential.user.photoURL
      );

      goto("/");
    } catch (err) {
      console.error("Google auth error:", err);
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  }

  function getErrorMessage(err: unknown): string {
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code: string }).code;
      switch (code) {
        case "auth/email-already-in-use":
          return "This email is already registered. Try logging in instead.";
        case "auth/invalid-email":
          return "Please enter a valid email address.";
        case "auth/operation-not-allowed":
          return "Email/password sign-in is not enabled.";
        case "auth/weak-password":
          return "Password should be at least 6 characters.";
        case "auth/user-disabled":
          return "This account has been disabled.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          return "Invalid email or password.";
        case "auth/popup-closed-by-user":
          return "Sign-in popup was closed. Please try again.";
        default:
          return "An error occurred. Please try again.";
      }
    }
    return "An error occurred. Please try again.";
  }
</script>

<div class="w-full max-w-md mx-auto">
  <div class="card">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-surface-900">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p class="text-surface-500 mt-2">
        {mode === "login"
          ? "Sign in to access your predictions"
          : "Start predicting football outcomes today"}
      </p>
    </div>

    <!-- Google sign-in -->
    <button
      onclick={handleGoogleSignIn}
      disabled={loading}
      class="w-full flex items-center justify-center space-x-3 py-3 px-4 border-2 border-surface-200 rounded-button font-medium text-surface-700 hover:bg-surface-50 transition-colors disabled:opacity-50"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span>Continue with Google</span>
    </button>

    <!-- Divider -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-surface-200"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-4 bg-white text-surface-400"
          >or continue with email</span
        >
      </div>
    </div>

    <!-- Email/Password form -->
    <form onsubmit={handleSubmit} class="space-y-4">
      {#if mode === "signup"}
        <div>
          <label for="displayName" class="label">Display name</label>
          <input
            type="text"
            id="displayName"
            bind:value={displayName}
            placeholder="Your name"
            class="input"
            disabled={loading}
          />
        </div>
      {/if}

      <div>
        <label for="email" class="label">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          placeholder="you@example.com"
          required
          class="input"
          disabled={loading}
        />
      </div>

      <div>
        <label for="password" class="label">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          placeholder="••••••••"
          required
          minlength="6"
          class="input"
          disabled={loading}
        />
      </div>

      {#if error}
        <div class="p-3 bg-no-light rounded-lg">
          <p class="text-sm text-no-dark">{error}</p>
        </div>
      {/if}

      <button type="submit" disabled={loading} class="btn-primary w-full">
        {#if loading}
          <svg
            class="animate-spin h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        {/if}
        {mode === "login" ? "Sign In" : "Create Account"}
      </button>
    </form>

    <!-- Footer link -->
    <p class="text-center mt-6 text-sm text-surface-500">
      {#if mode === "login"}
        Don't have an account?
        <a
          href="/signup"
          class="text-brand-600 hover:text-brand-700 font-medium">Sign up</a
        >
      {:else}
        Already have an account?
        <a href="/login" class="text-brand-600 hover:text-brand-700 font-medium"
          >Log in</a
        >
      {/if}
    </p>
  </div>
</div>
