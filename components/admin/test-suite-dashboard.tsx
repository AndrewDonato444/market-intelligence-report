"use client";

import { useEffect, useState, useCallback } from "react";

interface Snapshot {
  id: string;
  name: string;
  marketName: string;
  propertyCount: number;
  peerMarketCount: number;
  hasXSentiment: boolean;
  isGolden: boolean;
  createdAt: string;
}

interface TestRun {
  id: string;
  snapshotId: string;
  status: "running" | "completed" | "failed";
  layerDurations: { layer1Ms: number; layer2Ms: number; layer3Ms: number } | null;
  error: { layer: number; message: string; agent?: string } | null;
  isDraft: boolean;
  createdAt: string;
}

export function TestSuiteDashboard() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningSnapshotId, setRunningSnapshotId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [snapRes, runsRes] = await Promise.all([
      fetch("/api/admin/test-suite/snapshots"),
      fetch("/api/admin/test-suite/runs"),
    ]);
    if (snapRes.ok) {
      const data = await snapRes.json();
      setSnapshots(data.snapshots);
    }
    if (runsRes.ok) {
      const data = await runsRes.json();
      setRuns(data.runs);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunPipeline = async (snapshotId: string) => {
    setRunningSnapshotId(snapshotId);
    const res = await fetch("/api/admin/test-suite/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshotId }),
    });
    if (res.ok) {
      // Poll for updates
      setTimeout(() => {
        fetchData();
        setRunningSnapshotId(null);
      }, 2000);
    } else {
      setRunningSnapshotId(null);
    }
  };

  const handleToggleGolden = async (snapshotId: string, isGolden: boolean) => {
    await fetch(`/api/admin/test-suite/snapshots/${snapshotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isGolden: !isGolden }),
    });
    fetchData();
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    const res = await fetch(`/api/admin/test-suite/snapshots/${snapshotId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handlePreviewPdf = async (runId: string) => {
    setPdfLoading(runId);
    const res = await fetch(`/api/admin/test-suite/runs/${runId}/pdf`, {
      method: "POST",
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
    setPdfLoading(null);
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Pipeline Test Suite</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pipeline Test Suite</h1>

      {/* Snapshots */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Data Snapshots</h2>
        {snapshots.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No snapshots yet. Import from CLI or save from a completed report.
          </p>
        ) : (
          <div className="space-y-3">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {snap.isGolden && <span title="Golden snapshot">★</span>}
                    <span className="font-medium">{snap.name}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {snap.propertyCount} props | {snap.peerMarketCount} peers
                    {snap.hasXSentiment ? " | X sentiment" : " | No X"}
                    {" | "}
                    {new Date(snap.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRunPipeline(snap.id)}
                    disabled={runningSnapshotId === snap.id}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {runningSnapshotId === snap.id ? "Running..." : "Run Pipeline"}
                  </button>
                  <button
                    onClick={() => handleToggleGolden(snap.id, snap.isGolden)}
                    className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                    title={snap.isGolden ? "Remove golden status" : "Mark as golden"}
                  >
                    {snap.isGolden ? "Ungolden" : "★ Golden"}
                  </button>
                  {!snap.isGolden && (
                    <button
                      onClick={() => handleDeleteSnapshot(snap.id)}
                      className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Runs */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Test Runs</h2>
        {runs.length === 0 ? (
          <p className="text-gray-500 text-sm">No test runs yet.</p>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2 w-28">Run</th>
                  <th className="px-3 py-2 w-28">Status</th>
                  <th className="px-3 py-2 w-20">Duration</th>
                  <th className="px-3 py-2">Error</th>
                  <th className="px-3 py-2 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const totalMs = run.layerDurations
                    ? run.layerDurations.layer1Ms + run.layerDurations.layer2Ms + run.layerDurations.layer3Ms
                    : 0;
                  return (
                    <tr key={run.id} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">
                        {run.id.slice(0, 8)}
                        {run.isDraft && (
                          <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                            draft
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {run.status === "completed" && <span className="text-green-600">✓ Complete</span>}
                        {run.status === "failed" && <span className="text-red-600">✗ Failed</span>}
                        {run.status === "running" && <span className="text-blue-600">● Running</span>}
                      </td>
                      <td className="px-3 py-2">
                        {totalMs > 0 ? `${(totalMs / 1000).toFixed(1)}s` : "—"}
                      </td>
                      <td className="px-3 py-2 text-red-600 text-xs truncate" title={run.error?.message}>
                        {run.error ? `L${run.error.layer}: ${run.error.message.slice(0, 60)}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {run.status === "completed" && (
                          <button
                            onClick={() => handlePreviewPdf(run.id)}
                            disabled={pdfLoading === run.id}
                            className="text-blue-600 hover:underline text-xs whitespace-nowrap"
                          >
                            {pdfLoading === run.id ? "Generating..." : "Preview PDF"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
