"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageSquare, Send } from "lucide-react";
import { feedTypeLabels } from "@/lib/constants";
import { relativeTime } from "@/lib/utils";
import type { FeedPostView } from "@/types/app";
import { Panel } from "@/components/ui/panel";

export function FeedPostCard({ post }: { post: FeedPostView }) {
  const router = useRouter();
  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
            <span>{feedTypeLabels[post.type]}</span>
            <span>{relativeTime(post.createdAt)}</span>
          </div>
          {post.title ? (
            <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
              {post.title}
            </h3>
          ) : null}
          {post.author ? (
            <p className="mt-2 text-sm text-slate-300">
              {post.author.name} · @{post.author.username}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-base leading-7 text-slate-100">{post.content}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setFeedback(null);
              const nextLiked = !liked;
              setLiked(nextLiked);
              setLikesCount((count) => count + (nextLiked ? 1 : -1));

              const response = await fetch("/api/feed/likes", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ postId: post.id })
              });

              if (!response.ok) {
                setLiked((value) => !value);
                setLikesCount((count) => count + (liked ? 1 : -1));
                setFeedback("Nao foi possivel curtir agora.");
              }
            })
          }
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
            liked ? "bg-rose-400/15 text-rose-200" : "bg-white/5 text-slate-200"
          }`}
        >
          <Heart className="h-4 w-4" />
          {likesCount}
        </button>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200">
          <MessageSquare className="h-4 w-4" />
          {post.commentsCount}
        </span>
      </div>

      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);
          const content = String(formData.get("content") ?? "").trim();

          if (!content) {
            setFeedback("Escreva um comentario antes de enviar.");
            return;
          }

          startTransition(async () => {
            setFeedback(null);
            const response = await fetch("/api/feed/comments", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                postId: post.id,
                content
              })
            });

            if (!response.ok) {
              setFeedback("Falha ao comentar.");
              return;
            }

            form.reset();
            setFeedback("Comentario enviado.");
            router.refresh();
          });
        }}
        className="mt-5 flex gap-3"
      >
        <input
          name="content"
          placeholder="Responder com emoji, zoeira ou analise..."
          className="flex-1 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-accent-300 px-4 py-3 font-semibold text-slate-950"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {feedback ? <p className="mt-3 text-sm text-brand-100">{feedback}</p> : null}

      {post.comments?.length ? (
        <div className="mt-5 space-y-3">
          {post.comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <p className="text-sm font-semibold">
                {comment.author.name} · @{comment.author.username}
              </p>
              <p className="mt-2 text-sm text-slate-200">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
