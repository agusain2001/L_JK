"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorld, worldRequest } from "./WorldContext";
export default function RecipientAccess({ token }: { token: string }) {
  const { data, refresh } = useWorld();
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    try {
      await worldRequest(
        token ? "/api/world/invitations" : "/api/auth/sign-in/email",
        "POST",
        token
          ? { token, name: form.get("name"), password: form.get("password") }
          : { email: form.get("email"), password: form.get("password") },
      );
      await refresh();
      router.push("/world");
      router.refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="world-access world-reading">
      <span className="handwritten">a little key to a private place</span>
      <h1>
        {data.actor
          ? "Welcome back."
          : token
            ? "Your invitation is waiting."
            : "Step into your little world."}
      </h1>
      {data.actor ? (
        <>
          <p>
            Signed in as {data.actor.name}. Your private keepsakes stay yours.
          </p>
          {data.actor.role === "recipient" && (
            <button
              className="button secondary"
              onClick={() =>
                void (async () => {
                  await worldRequest("/api/auth/sign-out");
                  await refresh();
                  router.refresh();
                })().catch((error) => setError(error.message))
              }
            >
              Sign out
            </button>
          )}
          <p>
            <a href="/admin">Owner studio</a>
          </p>
        </>
      ) : (
        <form action={submit}>
          {token ? (
            <label>
              Your name
              <input name="name" required maxLength={80} autoComplete="name" />
            </label>
          ) : (
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
          )}
          <label>
            Your password
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete={token ? "new-password" : "current-password"}
            />
          </label>
          <button className="button primary" disabled={busy}>
            {busy
              ? "Opening your little world…"
              : token
                ? "Accept my invitation"
                : "Sign in"}
          </button>
          <p>
            New accounts require a personal invitation from the owner. Your
            password is never shared with the owner.
          </p>
        </form>
      )}
      <p role="alert">{error}</p>
    </section>
  );
}
