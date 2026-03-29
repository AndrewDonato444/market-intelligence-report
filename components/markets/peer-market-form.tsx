"use client";

import { useState } from "react";

interface PeerMarket {
  name: string;
  geography: { city: string; state: string };
}

interface PeerMarketFormProps {
  marketId: string;
  initialPeers: PeerMarket[];
}

export function PeerMarketForm({ marketId, initialPeers }: PeerMarketFormProps) {
  const [peers, setPeers] = useState<PeerMarket[]>(initialPeers);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addPeer = () => {
    setPeers((prev) => [
      ...prev,
      { name: "", geography: { city: "", state: "" } },
    ]);
  };

  const removePeer = (index: number) => {
    setPeers((prev) => prev.filter((_, i) => i !== index));
    // Clear errors for removed peer
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`peer_${index}`];
      return next;
    });
  };

  const updatePeer = (
    index: number,
    field: "city" | "state" | "name",
    value: string
  ) => {
    setPeers((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        if (field === "name") return { ...p, name: value };
        return {
          ...p,
          geography: { ...p.geography, [field]: value },
        };
      })
    );
    if (errors[`peer_${index}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`peer_${index}`];
        return next;
      });
    }
  };

  const handleSave = async () => {
    // Client-side validation
    const newErrors: Record<string, string> = {};
    peers.forEach((peer, i) => {
      if (!peer.geography.city.trim() || !peer.geography.state.trim()) {
        newErrors[`peer_${i}`] = "City and state are required";
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/markets/${marketId}/peers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peerMarkets: peers.map((p) => ({
            name:
              p.name.trim() ||
              `${p.geography.city.trim()}, ${p.geography.state.trim()}`,
            geography: {
              city: p.geography.city.trim(),
              state: p.geography.state.trim(),
            },
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setMessage({
          type: "error",
          text: data.error || "Failed to save peer markets",
        });
        return;
      }

      setMessage({ type: "success", text: "Peer markets saved" });
    } catch {
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-app-accent)] focus:border-transparent";

  return (
    <div className="bg-[var(--color-app-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-app-text)]">
        Peer Markets
      </h2>
      <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] mt-1">
        Add comparable luxury markets for competitive analysis.
      </p>
      <div className="w-12 h-0.5 bg-[var(--color-app-accent)] mt-3 mb-6" />

      {peers.length === 0 && (
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-tertiary)] mb-4">
          No peer markets added yet. Add markets to compare against.
        </p>
      )}

      <div className="space-y-3">
        {peers.map((peer, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <input
                type="text"
                value={peer.name}
                onChange={(e) => updatePeer(i, "name", e.target.value)}
                className={inputClass}
                placeholder="Name (optional)"
              />
              <input
                type="text"
                value={peer.geography.city}
                onChange={(e) => updatePeer(i, "city", e.target.value)}
                className={`${inputClass} ${errors[`peer_${i}`] ? "border-[var(--color-error)]" : ""}`}
                placeholder="City *"
              />
              <input
                type="text"
                value={peer.geography.state}
                onChange={(e) => updatePeer(i, "state", e.target.value)}
                className={`${inputClass} ${errors[`peer_${i}`] ? "border-[var(--color-error)]" : ""}`}
                placeholder="State *"
              />
            </div>
            <button
              type="button"
              onClick={() => removePeer(i)}
              className="px-2 py-2 text-[var(--color-app-text-tertiary)] hover:text-[var(--color-error)] transition-colors"
              aria-label={`Remove peer market ${i + 1}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {errors[`peer_${i}`] && (
              <p className="text-xs text-[var(--color-error)] col-span-full">
                {errors[`peer_${i}`]}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addPeer}
        className="mt-4 px-4 py-2 border border-dashed border-[var(--color-app-border)] rounded-[var(--radius-sm)] font-[family-name:var(--font-body)] text-sm text-[var(--color-app-text-secondary)] hover:border-[var(--color-app-accent)] hover:text-[var(--color-app-accent)] transition-colors w-full"
      >
        + Add Peer Market
      </button>

      {message && (
        <p
          className={`mt-4 font-[family-name:var(--font-body)] text-sm ${
            message.type === "success"
              ? "text-[var(--color-success)]"
              : "text-[var(--color-error)]"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[var(--color-app-accent)] hover:bg-[var(--color-app-accent-hover)] text-[var(--color-app-surface)] font-[family-name:var(--font-body)] font-semibold text-sm rounded-[var(--radius-sm)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Peer Markets"}
        </button>
      </div>
    </div>
  );
}
