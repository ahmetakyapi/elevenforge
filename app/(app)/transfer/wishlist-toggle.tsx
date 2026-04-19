"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleWishlist } from "./wishlist-actions";

/**
 * Star/bookmark toggle on a listing card. Optimistic UI: flips state
 * locally on click, reverts on server failure. Used inside the
 * extra-actions row.
 */
export function WishlistToggle({
  playerId,
  initial,
}: {
  playerId: string;
  initial: boolean;
}) {
  const [watching, setWatching] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={(e) => {
        e.stopPropagation();
        const prev = watching;
        setWatching(!prev);
        startTransition(async () => {
          const res = await toggleWishlist({ playerId });
          // toggleWishlist always succeeds (no error branch); only revert
          // on a thrown exception, caught by startTransition.
          setWatching(res.watching);
        });
      }}
      disabled={pending}
      title={watching ? "İzleme listesinden çıkar" : "İzleme listesine ekle"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: watching ? "var(--gold)" : "var(--muted)",
      }}
    >
      {watching ? (
        <BookmarkCheck size={12} strokeWidth={1.6} />
      ) : (
        <Bookmark size={12} strokeWidth={1.6} />
      )}
      {watching ? "İzliyorsun" : "İzle"}
    </button>
  );
}
