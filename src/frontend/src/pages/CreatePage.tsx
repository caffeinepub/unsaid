import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Ghost, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CreatePostError } from "../backend.d";
import { BottomNav } from "../components/BottomNav";
import { useCreatePost, useGetCategories } from "../hooks/useQueries";

export function CreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const { data: categories } = useGetCategories();
  const createPost = useCreatePost();

  const activeCategories = categories?.filter((c) => c.isActive) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const result = await createPost.mutateAsync({
      title: title.trim(),
      content: content.trim(),
      category: categoryId && categoryId !== "none" ? BigInt(categoryId) : null,
    });

    if (result.__kind__ === "ok") {
      toast.success("Your post has been shared anonymously.", {
        style: {
          background: "oklch(0.16 0.01 285)",
          border: "1px solid oklch(0.25 0.015 285)",
          color: "oklch(0.94 0.005 285)",
        },
      });
      navigate({ to: "/post/$id", params: { id: String(result.ok.id) } });
    } else {
      const errorMessages: Record<string, string> = {
        [CreatePostError.bannedIp]: "Your device has been restricted.",
        [CreatePostError.contentBlocked]:
          "Your post contains blocked content. Please revise.",
        [CreatePostError.internalError]:
          "Something went wrong. Please try again.",
      };
      toast.error(
        errorMessages[result.err] ?? "Failed to post. Please try again.",
        {
          style: {
            background: "oklch(0.16 0.01 285)",
            border: "1px solid oklch(0.62 0.22 22 / 0.4)",
            color: "oklch(0.94 0.005 285)",
          },
        },
      );
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.1_0.005_285)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[oklch(0.1_0.005_285/0.95)] backdrop-blur-md border-b border-[oklch(0.22_0.012_285)]">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/", search: { tab: "trending" } })}
            className="w-9 h-9 rounded-xl bg-[oklch(0.18_0.01_285)] border border-[oklch(0.25_0.015_285)] flex items-center justify-center text-[oklch(0.7_0.01_285)] hover:text-[oklch(0.9_0.01_285)] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Ghost
              size={16}
              className="text-[oklch(0.55_0.22_285)]"
              strokeWidth={1.5}
            />
            <span className="font-display font-semibold text-[oklch(0.88_0.005_285)]">
              New Post
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[480px] mx-auto px-4 pt-6 pb-safe">
        {/* Anonymity notice */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[oklch(0.65_0.22_285/0.08)] border border-[oklch(0.65_0.22_285/0.2)] mb-6">
          <Ghost
            size={16}
            className="text-[oklch(0.65_0.22_285)] shrink-0"
            strokeWidth={1.5}
          />
          <p className="text-xs text-[oklch(0.65_0.22_285)]">
            Fully anonymous · no account · no tracking
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="post-title"
              className="text-[oklch(0.78_0.01_285)] text-sm font-semibold"
            >
              Title <span className="text-[oklch(0.62_0.22_22)]">*</span>
            </Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder="What's on your mind?"
              className="bg-[oklch(0.16_0.008_285)] border-[oklch(0.28_0.015_285)] text-[oklch(0.94_0.005_285)] placeholder:text-[oklch(0.38_0.01_285)] focus-visible:ring-[oklch(0.65_0.22_285/0.5)] min-h-[48px] text-base"
              required
              maxLength={200}
              data-ocid="create.title.input"
            />
            <div className="flex justify-between text-xs text-[oklch(0.4_0.01_285)]">
              <span>Be concise and clear</span>
              <span>{title.length}/200</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="post-content"
              className="text-[oklch(0.78_0.01_285)] text-sm font-semibold"
            >
              Description <span className="text-[oklch(0.62_0.22_22)]">*</span>
            </Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 2000))}
              placeholder="Share your full thoughts here. The more context, the better the discussion."
              className="bg-[oklch(0.16_0.008_285)] border-[oklch(0.28_0.015_285)] text-[oklch(0.94_0.005_285)] placeholder:text-[oklch(0.38_0.01_285)] focus-visible:ring-[oklch(0.65_0.22_285/0.5)] min-h-[180px] resize-none text-base leading-relaxed"
              required
              maxLength={2000}
              data-ocid="create.content.textarea"
            />
            <div className="flex justify-between text-xs text-[oklch(0.4_0.01_285)]">
              <span>Min 10 characters recommended</span>
              <span>{content.length}/2000</span>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <Label className="text-[oklch(0.78_0.01_285)] text-sm font-semibold">
              Category{" "}
              <span className="text-[oklch(0.42_0.01_285)] font-normal">
                (optional)
              </span>
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger
                className="bg-[oklch(0.16_0.008_285)] border-[oklch(0.28_0.015_285)] text-[oklch(0.94_0.005_285)] focus:ring-[oklch(0.65_0.22_285/0.5)] min-h-[48px] text-base"
                data-ocid="create.category.select"
              >
                <SelectValue
                  placeholder="Select a category"
                  className="text-[oklch(0.38_0.01_285)]"
                />
              </SelectTrigger>
              <SelectContent className="bg-[oklch(0.18_0.01_285)] border-[oklch(0.28_0.015_285)]">
                <SelectItem
                  value="none"
                  className="text-[oklch(0.65_0.01_285)] focus:bg-[oklch(0.22_0.01_285)]"
                >
                  No category
                </SelectItem>
                {activeCategories.map((cat) => (
                  <SelectItem
                    key={String(cat.id)}
                    value={String(cat.id)}
                    className="text-[oklch(0.88_0.005_285)] focus:bg-[oklch(0.22_0.01_285)]"
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={createPost.isPending || !title.trim() || !content.trim()}
            className="min-h-[52px] bg-[oklch(0.65_0.22_285)] hover:bg-[oklch(0.70_0.22_285)] text-white font-bold text-base rounded-xl shadow-glow-sm disabled:opacity-50 disabled:shadow-none transition-all mt-2"
            data-ocid="create.submit_button"
          >
            {createPost.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Posting anonymously...
              </>
            ) : (
              "Post Anonymously"
            )}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
