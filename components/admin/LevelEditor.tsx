"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const TopicEditor = dynamic(() => import("./TopicEditor"), { ssr: false });
import type {
  Level,
  Module,
  Topic,
  TopicVideo,
  TopicMaterial,
  TopicAssignment,
  TopicPractice,
} from "@/types/curriculum";

const TABS = ["Basic Info", "Videos", "Materials", "Assignments", "Practice", "Publish"] as const;
const MATERIAL_TYPES = ["pdf", "doc", "docx", "link", "text"] as const;
const PRACTICE_TYPES = ["mcq", "writing", "speaking", "short_answer", "fill_blank"] as const;
const SUBMISSION_TYPES = ["text", "file", "url"] as const;

interface LevelEditorProps {
  initialLevels: Level[];
}

export default function LevelEditor({ initialLevels }: LevelEditorProps) {
  const [levels, setLevels] = useState<Level[]>(initialLevels);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string>(initialLevels[0]?.code ?? "a1");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Basic Info");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [modal, setModal] = useState<
    | { type: "module"; module?: Module }
    | { type: "topic"; topic?: Topic; moduleId: string }
    | { type: "video"; video?: TopicVideo }
    | { type: "material"; material?: TopicMaterial }
    | { type: "assignment"; assignment?: TopicAssignment }
    | { type: "practice"; practice?: TopicPractice }
    | null
  >(null);

  // ── Load from Supabase on mount ──
  useEffect(() => {
    fetch("/api/admin/curriculum")
      .then((r) => r.json())
      .then((json) => {
        if (json.levels?.length > 0) {
          setLevels(json.levels);
          setSelectedCode(json.levels[0]?.code ?? "a1");
        }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const level = levels.find((l) => l.code === selectedCode) ?? levels[0];
  const module = level?.modules.find((m) => m.id === selectedModuleId);
  const topic = module?.topics.find((t) => t.id === selectedTopicId);

  useEffect(() => {
    if (level && !selectedModuleId && level.modules.length > 0) {
      setSelectedModuleId(level.modules[0].id);
      setSelectedTopicId(level.modules[0].topics[0]?.id ?? null);
    } else if (level && level.modules.length === 0) {
      setSelectedModuleId(null);
      setSelectedTopicId(null);
    }
  }, [level, selectedModuleId]);

  const showStatus = (type: "success" | "error", msg: string) => {
    setStatus(type);
    setStatusMsg(msg);
    setTimeout(() => setStatus("idle"), 3000);
  };

  const updateLevels = (updater: (prev: Level[]) => Level[]) => {
    setLevels(updater);
  };

  const getLevel = () => levels.find((l) => l.code === selectedCode)!;
  const getModule = () => getLevel().modules.find((m) => m.id === selectedModuleId)!;
  const getTopic = () => getModule()?.topics.find((t) => t.id === selectedTopicId);

  // ── Level basic info (local state only — persisted by Save button) ──
  const updateLevel = (patch: Partial<Level>) => {
    updateLevels((prev) =>
      prev.map((l) => (l.code === selectedCode ? { ...l, ...patch } : l))
    );
  };

  // ── Save level to Supabase ──
  const saveLevel = async (overridePatch?: Partial<Level>) => {
    const base = getLevel();
    const lvl = overridePatch ? { ...base, ...overridePatch } : base;
    if (overridePatch) updateLevel(overridePatch);

    const res = await fetch(`/api/admin/curriculum/levels/${lvl.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: lvl.title,
        subtitle: lvl.subtitle,
        description: lvl.description,
        overview: lvl.overview,
        duration: lvl.duration,
        levelGoals: lvl.levelGoals,
        isPublished: lvl.isPublished,
      }),
    });

    if (res.ok) {
      showStatus("success", "Saved!");
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Save failed.");
    }
  };

  // ── Module CRUD ──
  const addModule = async (data: { title: string; description?: string }) => {
    const lvl = getLevel();
    const res = await fetch("/api/admin/curriculum/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        levelId: lvl.id,
        title: data.title,
        description: data.description ?? null,
        sortOrder: lvl.modules.length,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.id) {
      const newModule: Module = {
        id: json.id,
        levelId: lvl.id,
        title: data.title,
        description: data.description,
        order: lvl.modules.length,
        topics: [],
      };
      updateLevels((prev) =>
        prev.map((l) =>
          l.code === selectedCode ? { ...l, modules: [...l.modules, newModule] } : l
        )
      );
      setSelectedModuleId(json.id);
      setSelectedTopicId(null);
    } else {
      showStatus("error", json.error || "Failed to add module.");
    }
    setModal(null);
  };

  const updateModule = async (id: string, patch: Partial<Module>) => {
    const res = await fetch(`/api/admin/curriculum/modules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: patch.title, description: patch.description ?? null }),
    });
    if (res.ok) {
      updateLevels((prev) =>
        prev.map((l) =>
          l.code === selectedCode
            ? { ...l, modules: l.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)) }
            : l
        )
      );
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to update module.");
    }
    setModal(null);
  };

  const deleteModule = async (id: string) => {
    const remaining = getLevel().modules.filter((m) => m.id !== id);
    const res = await fetch(`/api/admin/curriculum/modules/${id}`, { method: "DELETE" });
    if (res.ok) {
      updateLevels((prev) =>
        prev.map((l) =>
          l.code === selectedCode ? { ...l, modules: l.modules.filter((m) => m.id !== id) } : l
        )
      );
      if (selectedModuleId === id) {
        setSelectedModuleId(remaining[0]?.id ?? null);
        setSelectedTopicId(remaining[0]?.topics[0]?.id ?? null);
      }
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to delete module.");
    }
    setModal(null);
  };

  // ── Topic CRUD ──
  const addTopic = async (data: Partial<Topic>) => {
    const mod = getModule();
    const res = await fetch("/api/admin/curriculum/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: mod.id,
        title: data.title ?? "New topic",
        description: data.description ?? null,
        objectives: data.objectives ?? [],
        estimatedDuration: data.estimatedDuration ?? null,
        isPreview: data.isPreview ?? false,
        sortOrder: mod.topics.length,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.id) {
      const newTopic: Topic = {
        id: json.id,
        moduleId: mod.id,
        title: data.title ?? "New topic",
        description: data.description,
        objectives: data.objectives,
        estimatedDuration: data.estimatedDuration,
        isPreview: data.isPreview ?? false,
        order: mod.topics.length,
        videos: [],
        materials: [],
        assignments: [],
        practice: [],
      };
      updateLevels((prev) =>
        prev.map((l) =>
          l.code === selectedCode
            ? {
                ...l,
                modules: l.modules.map((m) =>
                  m.id === mod.id ? { ...m, topics: [...m.topics, newTopic] } : m
                ),
              }
            : l
        )
      );
      setSelectedTopicId(json.id);
    } else {
      showStatus("error", json.error || "Failed to add topic.");
    }
    setModal(null);
  };

  const updateTopic = async (id: string, patch: Partial<Topic>) => {
    const mod = getModule();
    const res = await fetch(`/api/admin/curriculum/topics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: patch.title,
        description: patch.description ?? null,
        objectives: patch.objectives ?? [],
        estimatedDuration: patch.estimatedDuration ?? null,
        isPreview: patch.isPreview ?? false,
      }),
    });
    if (res.ok) {
      updateLevels((prev) =>
        prev.map((l) =>
          l.code === selectedCode
            ? {
                ...l,
                modules: l.modules.map((m) =>
                  m.id === mod.id
                    ? { ...m, topics: m.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)) }
                    : m
                ),
              }
            : l
        )
      );
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to update topic.");
    }
    setModal(null);
  };

  const deleteTopic = async (id: string) => {
    const mod = getModule();
    const remaining = mod.topics.filter((t) => t.id !== id);
    const res = await fetch(`/api/admin/curriculum/topics/${id}`, { method: "DELETE" });
    if (res.ok) {
      updateLevels((prev) =>
        prev.map((l) =>
          l.code === selectedCode
            ? {
                ...l,
                modules: l.modules.map((m) =>
                  m.id === mod.id ? { ...m, topics: m.topics.filter((t) => t.id !== id) } : m
                ),
              }
            : l
        )
      );
      if (selectedTopicId === id) {
        setSelectedTopicId(remaining[0]?.id ?? null);
      }
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to delete topic.");
    }
    setModal(null);
  };

  // ── Module / Topic publish toggle ──
  const toggleModulePublish = async (id: string, currentValue: boolean) => {
    const newValue = !currentValue;
    const res = await fetch(`/api/admin/curriculum/modules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: newValue }),
    });
    if (res.ok) {
      updateLevels((prev) =>
        prev.map((l) =>
          l.code === selectedCode
            ? {
                ...l,
                modules: l.modules.map((m) =>
                  m.id === id ? { ...m, isPublished: newValue } : m
                ),
              }
            : l
        )
      );
      showStatus("success", newValue ? "Module published." : "Module unpublished.");
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to update publish state.");
    }
  };

  const toggleTopicPublish = async (id: string, currentValue: boolean) => {
    const mod = getModule();
    const newValue = !currentValue;
    const res = await fetch(`/api/admin/curriculum/topics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: newValue }),
    });
    if (res.ok) {
      updateLevels((prev) =>
        prev.map((l) =>
          l.code === selectedCode
            ? {
                ...l,
                modules: l.modules.map((m) =>
                  m.id === mod.id
                    ? {
                        ...m,
                        topics: m.topics.map((t) =>
                          t.id === id ? { ...t, isPublished: newValue } : t
                        ),
                      }
                    : m
                ),
              }
            : l
        )
      );
      showStatus("success", newValue ? "Topic published." : "Topic unpublished.");
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to update publish state.");
    }
  };

  // ── Level-array state updater (for content stored at level_id level) ──
  function updateLevelArray<K extends "videos" | "materials" | "assignments" | "practice">(
    key: K,
    value: Level[K]
  ) {
    updateLevels((prev) =>
      prev.map((l) => (l.code === selectedCode ? { ...l, [key]: value } : l))
    );
  }

  // ── Videos (stored with level_id in DB) ──
  const addVideo = async (data: { title: string; url: string; description?: string }) => {
    const lvl = getLevel();
    const res = await fetch("/api/admin/curriculum/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        levelId: lvl.id,
        title: data.title,
        url: data.url,
        sortOrder: lvl.videos.length,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.id) {
      updateLevelArray("videos", [...lvl.videos, { id: json.id, title: data.title, url: data.url, order: lvl.videos.length }]);
      showStatus("success", "Saved!");
    } else {
      showStatus("error", json.error || "Failed to add video.");
    }
    setModal(null);
  };

  const updateVideo = async (id: string, patch: Partial<TopicVideo>) => {
    const lvl = getLevel();
    const res = await fetch(`/api/admin/curriculum/videos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: patch.title, url: patch.url }),
    });
    if (res.ok) {
      updateLevelArray("videos", lvl.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)));
      showStatus("success", "Saved!");
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to update video.");
    }
    setModal(null);
  };

  const deleteVideo = async (id: string) => {
    const lvl = getLevel();
    const res = await fetch(`/api/admin/curriculum/videos/${id}`, { method: "DELETE" });
    if (res.ok) {
      updateLevelArray("videos", lvl.videos.filter((v) => v.id !== id));
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to delete video.");
    }
    setModal(null);
  };

  // ── Materials (stored with level_id in DB) ──
  const addMaterial = async (data: Partial<TopicMaterial>) => {
    const lvl = getLevel();
    const res = await fetch("/api/admin/curriculum/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        levelId: lvl.id,
        title: data.title ?? "New material",
        type: data.type ?? "pdf",
        publicUrl: data.publicUrl ?? null,
        sortOrder: lvl.materials.length,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.id) {
      updateLevelArray("materials", [...lvl.materials, {
        id: json.id,
        title: data.title ?? "New material",
        type: (data.type as TopicMaterial["type"]) ?? "pdf",
        publicUrl: data.publicUrl ?? null,
        contentText: null,
        order: lvl.materials.length,
      }]);
      showStatus("success", "Saved!");
    } else {
      showStatus("error", json.error || "Failed to add material.");
    }
    setModal(null);
  };

  const updateMaterial = async (id: string, patch: Partial<TopicMaterial>) => {
    const lvl = getLevel();
    const res = await fetch(`/api/admin/curriculum/materials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: patch.title, type: patch.type, publicUrl: patch.publicUrl ?? null }),
    });
    if (res.ok) {
      updateLevelArray("materials", lvl.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)));
      showStatus("success", "Saved!");
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to update material.");
    }
    setModal(null);
  };

  const deleteMaterial = async (id: string) => {
    const lvl = getLevel();
    const res = await fetch(`/api/admin/curriculum/materials/${id}`, { method: "DELETE" });
    if (res.ok) {
      updateLevelArray("materials", lvl.materials.filter((m) => m.id !== id));
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to delete material.");
    }
    setModal(null);
  };

  // ── Assignments (stored with level_id in DB) ──
  const addAssignment = async (data: Partial<TopicAssignment>) => {
    const lvl = getLevel();
    const res = await fetch("/api/admin/curriculum/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        levelId: lvl.id,
        title: data.title ?? "New assignment",
        instructions: data.instructions ?? "",
        dueNote: data.dueNote ?? null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.id) {
      updateLevelArray("assignments", [...lvl.assignments, {
        id: json.id,
        title: data.title ?? "New assignment",
        instructions: data.instructions ?? "",
        dueNote: data.dueNote,
        order: lvl.assignments.length,
      }]);
      showStatus("success", "Saved!");
    } else {
      showStatus("error", json.error || "Failed to add assignment.");
    }
    setModal(null);
  };

  const updateAssignment = async (id: string, patch: Partial<TopicAssignment>) => {
    const lvl = getLevel();
    const res = await fetch(`/api/admin/curriculum/assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: patch.title, instructions: patch.instructions, dueNote: patch.dueNote ?? null }),
    });
    if (res.ok) {
      updateLevelArray("assignments", lvl.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)));
      showStatus("success", "Saved!");
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to update assignment.");
    }
    setModal(null);
  };

  const deleteAssignment = async (id: string) => {
    const lvl = getLevel();
    const res = await fetch(`/api/admin/curriculum/assignments/${id}`, { method: "DELETE" });
    if (res.ok) {
      updateLevelArray("assignments", lvl.assignments.filter((a) => a.id !== id));
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to delete assignment.");
    }
    setModal(null);
  };

  // ── Practice (stored with level_id in DB) ──
  const addPractice = async (data: Partial<TopicPractice>) => {
    const lvl = getLevel();
    const res = await fetch("/api/admin/curriculum/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        levelId: lvl.id,
        title: data.title ?? "New practice",
        type: data.type ?? "mcq",
        instructions: data.instructions ?? null,
        content: data.content ?? null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.id) {
      updateLevelArray("practice", [...lvl.practice, {
        id: json.id,
        title: data.title ?? "New practice",
        type: (data.type as TopicPractice["type"]) ?? "mcq",
        instructions: data.instructions,
        content: data.content,
        order: lvl.practice.length,
      }]);
      showStatus("success", "Saved!");
    } else {
      showStatus("error", json.error || "Failed to add practice.");
    }
    setModal(null);
  };

  const updatePractice = async (id: string, patch: Partial<TopicPractice>) => {
    const lvl = getLevel();
    const res = await fetch(`/api/admin/curriculum/practice/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: patch.title, type: patch.type, instructions: patch.instructions ?? null, content: patch.content ?? null }),
    });
    if (res.ok) {
      updateLevelArray("practice", lvl.practice.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      showStatus("success", "Saved!");
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to update practice.");
    }
    setModal(null);
  };

  const deletePractice = async (id: string) => {
    const lvl = getLevel();
    const res = await fetch(`/api/admin/curriculum/practice/${id}`, { method: "DELETE" });
    if (res.ok) {
      updateLevelArray("practice", lvl.practice.filter((p) => p.id !== id));
    } else {
      const json = await res.json().catch(() => ({}));
      showStatus("error", json.error || "Failed to delete practice.");
    }
    setModal(null);
  };

  // ── Reload from DB ──
  const resetToInitial = async () => {
    setLoadingData(true);
    try {
      const json = await fetch("/api/admin/curriculum").then((r) => r.json());
      if (json.levels?.length > 0) {
        setLevels(json.levels);
        showStatus("success", "Reloaded from database.");
      } else {
        setLevels(initialLevels);
        showStatus("success", "Reloaded.");
      }
    } catch {
      setLevels(initialLevels);
      showStatus("error", "Could not reload.");
    } finally {
      setLoadingData(false);
    }
  };

  if (loadingData) {
    return <p className="mt-6 text-slate-600">Loading curriculum from database…</p>;
  }

  if (!level) {
    return <p className="text-slate-600">No levels found.</p>;
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Row: Levels | Modules | Topics */}
      <div className="flex flex-wrap gap-4 lg:flex-nowrap">
      {/* Left: Levels */}
      <div className="w-full shrink-0 rounded-xl border border-slate-200 bg-white p-4 lg:w-40">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Levels</h3>
        <div className="space-y-1">
          {levels.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setSelectedCode(l.code);
                setSelectedModuleId(l.modules[0]?.id ?? null);
                setSelectedTopicId(l.modules[0]?.topics[0]?.id ?? null);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                selectedCode === l.code
                  ? "bg-amber-100 text-amber-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Middle: Modules */}
      <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Modules</h3>
          <button
            type="button"
            onClick={() => setModal({ type: "module" })}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
          >
            + Add module
          </button>
        </div>
        {level.modules.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No modules. Add one to get started.</p>
        ) : (
          <div className="mt-3 space-y-1">
            {level.modules.map((m) => (
              <div
                key={m.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  selectedModuleId === m.id ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModuleId(m.id);
                    setSelectedTopicId(m.topics[0]?.id ?? null);
                  }}
                  className="flex-1 text-left text-sm min-w-0 truncate"
                >
                  <span className={m.isPublished === false ? "text-slate-400 italic" : ""}>
                    {m.title}
                  </span>
                  {m.isPublished === false && (
                    <span className="ml-1 rounded bg-slate-200 px-1 text-xs text-slate-500">Draft</span>
                  )}
                </button>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleModulePublish(m.id, m.isPublished !== false)}
                    className={`rounded p-1 transition-colors ${
                      m.isPublished === false
                        ? "text-slate-300 hover:bg-emerald-100 hover:text-emerald-600"
                        : "text-emerald-500 hover:bg-slate-200 hover:text-slate-600"
                    }`}
                    title={m.isPublished === false ? "Publish module" : "Unpublish module"}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {m.isPublished === false ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ type: "module", module: m })}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteModule(m.id)}
                    className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Topics */}
      <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Topics</h3>
          {module && (
            <button
              type="button"
              onClick={() => setModal({ type: "topic", moduleId: module.id })}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
            >
              + Add topic
            </button>
          )}
        </div>
        {!module ? (
          <p className="mt-3 text-sm text-slate-500">Select a module.</p>
        ) : module.topics.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No topics. Add one to get started.</p>
        ) : (
          <div className="mt-3 space-y-1">
            {module.topics.map((t) => (
              <div
                key={t.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  selectedTopicId === t.id ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedTopicId(t.id)}
                  className="flex-1 text-left text-sm min-w-0 truncate"
                >
                  <span className={t.isPublished === false ? "text-slate-400 italic" : ""}>
                    {t.title}
                  </span>
                  {t.isPreview && (
                    <span className="ml-1 rounded bg-amber-100 px-1 text-xs text-amber-800">
                      Preview
                    </span>
                  )}
                  {t.isPublished === false && (
                    <span className="ml-1 rounded bg-slate-200 px-1 text-xs text-slate-500">Draft</span>
                  )}
                </button>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleTopicPublish(t.id, t.isPublished !== false)}
                    className={`rounded p-1 transition-colors ${
                      t.isPublished === false
                        ? "text-slate-300 hover:bg-emerald-100 hover:text-emerald-600"
                        : "text-emerald-500 hover:bg-slate-200 hover:text-slate-600"
                    }`}
                    title={t.isPublished === false ? "Publish topic" : "Unpublish topic"}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {t.isPublished === false ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ type: "topic", topic: t, moduleId: module.id })}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTopic(t.id)}
                    className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* TopicEditor — shown below when a topic is selected */}
      {selectedTopicId && topic && (
        <div className="w-full">
          <TopicEditor
            topicId={selectedTopicId}
            topicTitle={topic.title}
            levelId={level?.id ?? ""}
            onClose={() => setSelectedTopicId(null)}
          />
        </div>
      )}

      {/* Bottom: Tabs + content */}
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                activeTab === tab
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "Basic Info" && (
            <BasicInfoTab
              level={level}
              onUpdate={updateLevel}
              status={status}
            />
          )}
          {activeTab === "Videos" && (
            <ContentTab
              title="Videos"
              items={level.videos}
              onAdd={() => setModal({ type: "video" })}
              onEdit={(v) => setModal({ type: "video", video: v })}
              onDelete={(id) => deleteVideo(id)}
              renderItem={(v) => (
                <span>
                  {v.title}
                  <span className="ml-1 text-xs text-slate-400">{v.url.slice(0, 40)}…</span>
                </span>
              )}
            />
          )}
          {activeTab === "Materials" && (
            <ContentTab
              title="Materials"
              items={level.materials}
              onAdd={() => setModal({ type: "material" })}
              onEdit={(m) => setModal({ type: "material", material: m })}
              onDelete={(id) => deleteMaterial(id)}
              renderItem={(m) => (
                <span>
                  {m.title}
                  <span className="ml-1 rounded bg-slate-200 px-1 text-xs">{m.type}</span>
                </span>
              )}
            />
          )}
          {activeTab === "Assignments" && (
            <ContentTab
              title="Assignments"
              items={level.assignments}
              onAdd={() => setModal({ type: "assignment" })}
              onEdit={(a) => setModal({ type: "assignment", assignment: a })}
              onDelete={(id) => deleteAssignment(id)}
              renderItem={(a) => <span>{a.title}</span>}
            />
          )}
          {activeTab === "Practice" && (
            <ContentTab
              title="Practice"
              items={level.practice}
              onAdd={() => setModal({ type: "practice" })}
              onEdit={(p) => setModal({ type: "practice", practice: p })}
              onDelete={(id) => deletePractice(id)}
              renderItem={(p) => (
                <span>
                  {p.title}
                  <span className="ml-1 rounded bg-slate-200 px-1 text-xs">{p.type}</span>
                </span>
              )}
            />
          )}
          {activeTab === "Publish" && (
            <PublishTab level={level} onUpdate={updateLevel} onSave={saveLevel} />
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => saveLevel()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Save
          </button>
          <button
            type="button"
            onClick={resetToInitial}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reload from database
          </button>
          {status !== "idle" && (
            <span
              className={`self-center text-sm ${
                status === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {statusMsg}
            </span>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "module" && (
        <ModuleModal
          module={modal.module}
          onSave={(data) => (modal.module ? updateModule(modal.module.id, data) : addModule(data))}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "topic" && (
        <TopicModal
          topic={modal.topic}
          onSave={(data) =>
            modal.topic ? updateTopic(modal.topic.id, data) : addTopic(data)
          }
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "video" && (
        <VideoModal
          video={modal.video}
          onSave={(data) =>
            modal.video ? updateVideo(modal.video.id, data) : addVideo(data)
          }
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "material" && (
        <MaterialModal
          material={modal.material}
          onSave={(data) =>
            modal.material ? updateMaterial(modal.material.id, data) : addMaterial(data)
          }
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "assignment" && (
        <AssignmentModal
          assignment={modal.assignment}
          onSave={(data) =>
            modal.assignment ? updateAssignment(modal.assignment.id, data) : addAssignment(data)
          }
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "practice" && (
        <PracticeModal
          practice={modal.practice}
          onSave={(data) =>
            modal.practice ? updatePractice(modal.practice.id, data) : addPractice(data)
          }
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───

function BasicInfoTab({
  level,
  onUpdate,
}: {
  level: Level;
  onUpdate: (p: Partial<Level>) => void;
  status: string;
}) {
  const [form, setForm] = useState({
    title: level.title,
    subtitle: level.subtitle ?? "",
    description: level.description,
    overview: level.overview ?? "",
    duration: level.duration ?? "",
    levelGoals: (level.levelGoals ?? []).join("\n"),
  });

  useEffect(() => {
    setForm({
      title: level.title,
      subtitle: level.subtitle ?? "",
      description: level.description,
      overview: level.overview ?? "",
      duration: level.duration ?? "",
      levelGoals: (level.levelGoals ?? []).join("\n"),
    });
  }, [level.id]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          onBlur={() => onUpdate({ title: form.title })}
          className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Subtitle</label>
        <input
          type="text"
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          onBlur={() => onUpdate({ subtitle: form.subtitle || null })}
          className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          onBlur={() => onUpdate({ description: form.description })}
          rows={3}
          className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Overview</label>
        <textarea
          value={form.overview}
          onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))}
          onBlur={() => onUpdate({ overview: form.overview || null })}
          rows={3}
          className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Duration</label>
        <input
          type="text"
          value={form.duration}
          onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
          onBlur={() => onUpdate({ duration: form.duration || null })}
          placeholder="e.g. 8-10 weeks"
          className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Level goals (one per line)</label>
        <textarea
          value={form.levelGoals}
          onChange={(e) => setForm((f) => ({ ...f, levelGoals: e.target.value }))}
          onBlur={() =>
            onUpdate({
              levelGoals: form.levelGoals
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          rows={4}
          placeholder="Goal 1&#10;Goal 2"
          className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

function PublishTab({
  level,
  onUpdate,
  onSave,
}: {
  level: Level;
  onUpdate: (p: Partial<Level>) => void;
  onSave: (p: Partial<Level>) => void;
}) {
  return (
    <div>
      <p className="text-slate-600">
        Status:{" "}
        <strong className={level.isPublished ? "text-green-600" : "text-slate-600"}>
          {level.isPublished ? "Published" : "Draft"}
        </strong>
      </p>
      <button
        type="button"
        onClick={() => {
          const newPublished = !level.isPublished;
          onUpdate({ isPublished: newPublished });
          onSave({ isPublished: newPublished });
        }}
        className="mt-3 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
      >
        {level.isPublished ? "Unpublish" : "Publish"}
      </button>
    </div>
  );
}

function ContentTab<T extends { id: string }>({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  renderItem,
}: {
  title: string;
  items: T[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        <button
          type="button"
          onClick={onAdd}
          className="rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600"
        >
          + Add
        </button>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No items. Click Add to create one.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
            >
              {renderItem(item)}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Modals ───

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModuleModal({
  module,
  onSave,
  onClose,
}: {
  module?: Module;
  onSave: (d: { title: string; description?: string }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(module?.title ?? "");
  const [description, setDescription] = useState(module?.description ?? "");

  return (
    <Modal title={module ? "Edit module" : "Add module"} onClose={onClose}>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (title.trim()) onSave({ title: title.trim(), description: description.trim() || undefined });
            }}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TopicModal({
  topic,
  onSave,
  onClose,
}: {
  topic?: Topic;
  onSave: (d: Partial<Topic>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(topic?.title ?? "");
  const [description, setDescription] = useState(topic?.description ?? "");
  const [objectives, setObjectives] = useState((topic?.objectives ?? []).join("\n"));
  const [estimatedDuration, setEstimatedDuration] = useState(topic?.estimatedDuration ?? "");
  const [isPreview, setIsPreview] = useState(topic?.isPreview ?? false);

  return (
    <Modal title={topic ? "Edit topic" : "Add topic"} onClose={onClose}>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Objectives (one per line)</label>
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Estimated duration</label>
          <input
            type="text"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            placeholder="e.g. 30 min"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="preview"
            checked={isPreview}
            onChange={(e) => setIsPreview(e.target.checked)}
          />
          <label htmlFor="preview" className="text-sm">Preview lesson</label>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onSave({
                title: title.trim(),
                description: description.trim() || undefined,
                objectives: objectives.split("\n").map((s) => s.trim()).filter(Boolean),
                estimatedDuration: estimatedDuration.trim() || undefined,
                isPreview,
              })
            }
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Save
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

function VideoModal({
  video,
  onSave,
  onClose,
}: {
  video?: TopicVideo;
  onSave: (d: { title: string; url: string; description?: string }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(video?.title ?? "");
  const [url, setUrl] = useState(video?.url ?? "");
  const [description, setDescription] = useState(video?.description ?? "");

  return (
    <Modal title={video ? "Edit video" : "Add video"} onClose={onClose}>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">YouTube URL *</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/embed/VIDEO_ID"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (title.trim() && url.trim())
                onSave({ title: title.trim(), url: url.trim(), description: description.trim() || undefined });
            }}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Save
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MaterialModal({
  material,
  onSave,
  onClose,
}: {
  material?: TopicMaterial;
  onSave: (d: Partial<TopicMaterial>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(material?.title ?? "");
  const [description, setDescription] = useState(material?.description ?? "");
  const [type, setType] = useState<TopicMaterial["type"]>(material?.type ?? "pdf");
  const [publicUrl, setPublicUrl] = useState(material?.publicUrl ?? "");
  const [contentText, setContentText] = useState(material?.contentText ?? "");

  return (
    <Modal title={material ? "Edit material" : "Add material"} onClose={onClose}>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TopicMaterial["type"])}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {MATERIAL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        {(type === "pdf" || type === "doc" || type === "docx" || type === "link") && (
          <div>
            <label className="block text-sm font-medium text-slate-700">URL</label>
            <input
              type="url"
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        )}
        {type === "text" && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Content</label>
            <textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onSave({
                title: title.trim(),
                description: description.trim() || undefined,
                type,
                publicUrl: publicUrl.trim() || undefined,
                contentText: type === "text" ? contentText : undefined,
              })
            }
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Save
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AssignmentModal({
  assignment,
  onSave,
  onClose,
}: {
  assignment?: TopicAssignment;
  onSave: (d: Partial<TopicAssignment>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [instructions, setInstructions] = useState(assignment?.instructions ?? "");
  const [dueNote, setDueNote] = useState(assignment?.dueNote ?? "");
  const [submissionType, setSubmissionType] = useState<TopicAssignment["submissionType"]>(
    assignment?.submissionType ?? "text"
  );
  const [score, setScore] = useState(assignment?.score?.toString() ?? "");

  return (
    <Modal title={assignment ? "Edit assignment" : "Add assignment"} onClose={onClose}>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Instructions *</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Due note</label>
          <input
            type="text"
            value={dueNote}
            onChange={(e) => setDueNote(e.target.value)}
            placeholder="e.g. Due in 1 week"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Submission type</label>
          <select
            value={submissionType}
            onChange={(e) => setSubmissionType(e.target.value as TopicAssignment["submissionType"])}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {SUBMISSION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Score (optional)</label>
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onSave({
                title: title.trim(),
                instructions: instructions.trim(),
                dueNote: dueNote.trim() || undefined,
                submissionType,
                score: score ? Number(score) : undefined,
              })
            }
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Save
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PracticeModal({
  practice,
  onSave,
  onClose,
}: {
  practice?: TopicPractice;
  onSave: (d: Partial<TopicPractice>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(practice?.title ?? "");
  const [type, setType] = useState<TopicPractice["type"]>(practice?.type ?? "mcq");
  const [instructions, setInstructions] = useState(practice?.instructions ?? "");
  const [content, setContent] = useState(practice?.content ?? "");

  return (
    <Modal title={practice ? "Edit practice" : "Add practice"} onClose={onClose}>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TopicPractice["type"])}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {PRACTICE_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="e.g. MCQ options, fill-in-blank template"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onSave({
                title: title.trim(),
                type,
                instructions: instructions.trim() || undefined,
                content: content.trim() || undefined,
              })
            }
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Save
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
