// `/` is gated in middleware.ts only. Duplicating redirect() here caused odd loops behind some VPS/proxy setups.
export default function Home() {
  return null;
}
