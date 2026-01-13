"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Loader2 } from "lucide-react";
import { updateBusinessPartnerTags } from "@/actions/business-partners";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { BusinessPartnerWithStats } from "@/types/businessPartners";

interface Props {
  partner: BusinessPartnerWithStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BusinessPartnerTagsSheet({
  partner,
  open,
  onOpenChange,
}: Props) {
  const [tags, setTags] = useState<string[]>(partner?.tags ?? []);
  const [newTag, setNewTag] = useState("");

  const { execute, isPending } = useAction(updateBusinessPartnerTags, {
    onSuccess: () => {
      toast.success("Etiquetas actualizadas correctamente");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error al actualizar las etiquetas");
    },
  });

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!partner) return;
    execute({ partnerId: partner.id!, tags });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Gestionar Etiquetas</SheetTitle>
          <SheetDescription>
            Añade o elimina etiquetas para{" "}
            <strong>{partner?.businessName}</strong>.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Tag Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Nueva etiqueta..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button size="icon" onClick={handleAddTag} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Tags List */}
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No hay etiquetas asignadas.
              </p>
            ) : (
              tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="px-2 py-1 gap-1 text-xs uppercase font-medium"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
