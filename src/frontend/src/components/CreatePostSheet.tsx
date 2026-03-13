import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { Ghost, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreatePostError } from "../backend.d";
import { useCreatePost, useGetCategories } from "../hooks/useQueries";

interface CreatePostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostSheet({ open, onOpenChange }: CreatePostSheetProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const { data: categories } = useGetCategories();
  const createPost = useCreatePost();

  const activeCategories = categories?.filter((c) => c.isActive) ?? [];
  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setContent("");
      setCategoryId("");
    }
  }, [open]);

  const toastStyle = (isError = false) => ({
    style: {
      background: "oklch(0.16 0.01 285)",
      border: `1px solid ${isError ? "oklch(0.62 0.22 22 / 0.4)" : "oklch(0.25 0.015 285)"}`,
      color: "oklch(0.94 0.005 285)",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      const result = await createPost.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        category:
          categoryId && categoryId !== "none" ? BigInt(categoryId) : null,
      });

      if (result.__kind__ === "ok") {
        toast.success("Your post has been shared anonymously.", toastStyle());
        setTitle("");
        setContent("");
        setCategoryId("");
        onOpenChange(false);
        navigate({ to: "/post/$id", params: { id: String(result.ok.id) } });
      } else {
        const errorMessages: Record<string, string> = {
          [CreatePostError.bannedIp]: "Your device has been restricted.",
          [CreatePostError.contentBlocked]:
            "Your post contains blocked content. Please revise.",
          [CreatePostError.rateLimitExceeded]:
            "You're posting too fast. Please wait a moment.",
          [CreatePostError.internalError]:
            "Something went wrong. Please try again.",
        };
        toast.error(
          errorMessages[result.err] ?? "Failed to post. Please try again.",
          toastStyle(true),
        );
      }
    } catch {
      toast.error(
        "Could not connect. Please check your connection and try again.",
        toastStyle(true),
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="border-t-0 rounded-t-2xl max-h-[92vh] overflow-y-auto p-0"
        style={{
          background: "oklch(0.13 0.009 285)",
          borderTop: "1px solid oklch(0.26 0.016 285)",
        }}
      >
        <div
          className="relative px-5 pt-5 pb-4 overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% 120%, oklch(0.65 0.22 285 / 0.12) 0%, transparent 70%)",
            borderBottom: "1px solid oklch(0.22 0.012 285 / 0.6)",
          }}
        >
          <div
            className="w-8 h-1 rounded-full bg-[oklch(0.32_0.01_285)] mx-auto mb-4"
            aria-hidden="true"
          />
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.65 0.22 285 / 0.25), oklch(0.55 0.20 300 / 0.15))",
                border: "1px solid oklch(0.65 0.22 285 / 0.3)",
              }}
            >
              <Ghost
                size={18}
                className="text-[oklch(0.72_0.22_285)]"
                strokeWidth={1.6}
              />
            </div>
            <div>
              <SheetTitle className="font-display font-bold text-[oklch(0.96_0.005_285)] text-[18px] leading-none tracking-[-0.02em]">
                New Post
              </SheetTitle>
              <p className="text-[12px] text-[oklch(0.5_0.01_285)] mt-0.5">
                Anonymous · no account · no trace
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-0 px-5 pt-4 pb-8"
        >
          <div className="flex flex-col gap-0 mb-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <Label
                htmlFor="create-title"
                className="text-[12px] font-semibold uppercase tracking-widest text-[oklch(0.52_0.01_285)]"
              >
                Title
              </Label>
              <span
                className={`text-[11px] tabular-nums transition-colors ${title.length > 170 ? "text-[oklch(0.65_0.22_22)]" : "text-[oklch(0.38_0.01_285)]"}`}
              >
                {title.length}/200
              </span>
            </div>
            <Input
              id="create-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder="What's on your mind?"
              className="min-h-[48px] text-[15px] text-[oklch(0.96_0.005_285)] placeholder:text-[oklch(0.36_0.01_285)] rounded-xl transition-all duration-150 border-0 outline-none focus-visible:outline-none focus-visible:ring-0"
              style={{
                background: "oklch(0.185 0.011 285)",
                boxShadow: "inset 0 0 0 1px oklch(0.27 0.014 285)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow =
                  "inset 0 0 0 1.5px oklch(0.65 0.22 285 / 0.7), 0 0 0 3px oklch(0.65 0.22 285 / 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow =
                  "inset 0 0 0 1px oklch(0.27 0.014 285)";
              }}
              required
              maxLength={200}
              data-ocid="create.title.input"
            />
          </div>

          <div className="flex flex-col gap-0 mb-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <Label
                htmlFor="create-content"
                className="text-[12px] font-semibold uppercase tracking-widest text-[oklch(0.52_0.01_285)]"
              >
                Description
              </Label>
              <span
                className={`text-[11px] tabular-nums transition-colors ${content.length > 1800 ? "text-[oklch(0.65_0.22_22)]" : "text-[oklch(0.38_0.01_285)]"}`}
              >
                {content.length}/2000
              </span>
            </div>
            <Textarea
              id="create-content"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 2000))}
              placeholder="Share the full story..."
              className="min-h-[120px] text-[15px] leading-relaxed text-[oklch(0.96_0.005_285)] placeholder:text-[oklch(0.36_0.01_285)] rounded-xl resize-none transition-all duration-150 border-0 outline-none focus-visible:outline-none focus-visible:ring-0"
              style={{
                background: "oklch(0.185 0.011 285)",
                boxShadow: "inset 0 0 0 1px oklch(0.27 0.014 285)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow =
                  "inset 0 0 0 1.5px oklch(0.65 0.22 285 / 0.7), 0 0 0 3px oklch(0.65 0.22 285 / 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow =
                  "inset 0 0 0 1px oklch(0.27 0.014 285)";
              }}
              required
              maxLength={2000}
              data-ocid="create.content.textarea"
            />
          </div>

          <div className="flex flex-col gap-0 mb-5">
            <Label className="text-[12px] font-semibold uppercase tracking-widest text-[oklch(0.52_0.01_285)] mb-1.5">
              Category{" "}
              <span className="text-[oklch(0.38_0.01_285)] normal-case tracking-normal font-normal">
                (optional)
              </span>
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger
                className="min-h-[46px] text-[oklch(0.88_0.005_285)] rounded-xl border-0 focus:ring-0 focus:outline-none focus-visible:ring-0 data-[state=open]:outline-none"
                style={{
                  background: "oklch(0.185 0.011 285)",
                  boxShadow: "inset 0 0 0 1px oklch(0.27 0.014 285)",
                }}
                data-ocid="create.category.select"
              >
                <SelectValue
                  placeholder="Choose a category"
                  className="text-[oklch(0.36_0.01_285)]"
                />
              </SelectTrigger>
              <SelectContent
                className="rounded-xl border-0"
                style={{
                  background: "oklch(0.19 0.011 285)",
                  boxShadow:
                    "0 8px 32px oklch(0 0 0 / 0.5), inset 0 0 0 1px oklch(0.28 0.014 285)",
                }}
              >
                <SelectItem
                  value="none"
                  className="text-[oklch(0.65_0.01_285)] focus:bg-[oklch(0.23_0.012_285)] rounded-lg"
                >
                  No category
                </SelectItem>
                {activeCategories.map((cat) => (
                  <SelectItem
                    key={String(cat.id)}
                    value={String(cat.id)}
                    className="text-[oklch(0.88_0.005_285)] focus:bg-[oklch(0.23_0.012_285)] rounded-lg"
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="submit"
            disabled={createPost.isPending || !canSubmit}
            className="min-h-[52px] w-full rounded-xl font-display font-bold text-[15px] tracking-[-0.01em] text-white transition-all duration-150 disabled:opacity-40 active:scale-[0.98]"
            style={{
              background: canSubmit
                ? "linear-gradient(135deg, oklch(0.70 0.22 280), oklch(0.62 0.22 295))"
                : "oklch(0.3 0.01 285)",
              boxShadow: canSubmit
                ? "0 0 16px oklch(0.65 0.22 285 / 0.4), 0 2px 8px oklch(0 0 0 / 0.3)"
                : "none",
            }}
            data-ocid="create.submit_button"
          >
            {createPost.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting…
              </span>
            ) : (
              "Post Anonymously"
            )}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
