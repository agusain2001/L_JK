export function claimAudio(id: string) {
  window.dispatchEvent(new CustomEvent("for-you:audio", { detail: id }));
}
export function pauseAudio() {
  window.dispatchEvent(new CustomEvent("for-you:audio", { detail: null }));
}
