"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveWhatsappSettings } from "@/features/admin/site-settings-actions";

type Connection = "number" | "link";
type Position = "bottom-right" | "bottom-left";
type Size = "sm" | "md" | "lg";

export function WhatsappSettingsForm({
  initial,
}: {
  initial: {
    enabled: boolean;
    connection: Connection;
    number: string;
    link: string;
    message: string;
    position: Position;
    size: Size;
    animation: boolean;
  };
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [connection, setConnection] = useState<Connection>(initial.connection);
  const [number, setNumber] = useState(initial.number);
  const [link, setLink] = useState(initial.link);
  const [message, setMessage] = useState(initial.message);
  const [position, setPosition] = useState<Position>(initial.position);
  const [size, setSize] = useState<Size>(initial.size);
  const [animation, setAnimation] = useState(initial.animation);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await saveWhatsappSettings({
      whatsapp_enabled: enabled,
      whatsapp_connection: connection,
      whatsapp_number: number,
      whatsapp_link: link,
      whatsapp_message: message,
      whatsapp_position: position,
      whatsapp_size: size,
      whatsapp_animation: animation,
    });
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    toast.success("WhatsApp settings saved. It's live on the site now.");
    router.refresh();
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      {/* Enable / disable */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            Show WhatsApp button
          </p>
          <p className="text-xs text-muted-foreground">
            Display a floating WhatsApp button on every page.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {/* Connection type */}
      <div className="space-y-2">
        <Label>Connection type</Label>
        <Select
          value={connection}
          onValueChange={(v) => setConnection(v as Connection)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">WhatsApp Number</SelectItem>
            <SelectItem value="link">WhatsApp Link</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Only one is used at a time.
        </p>
      </div>

      {/* Number or link */}
      {connection === "number" ? (
        <div className="space-y-2">
          <Label htmlFor="wa-number">WhatsApp number</Label>
          <Input
            id="wa-number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="+8801712345678"
            inputMode="tel"
          />
          <p className="text-xs text-muted-foreground">
            Include the country code. Example: +8801712345678
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="wa-link">WhatsApp link</Label>
          <Input
            id="wa-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://wa.me/8801712345678 or https://chat.whatsapp.com/…"
            inputMode="url"
          />
        </div>
      )}

      {/* Default message */}
      <div className="space-y-2">
        <Label htmlFor="wa-message">Default message</Label>
        <Textarea
          id="wa-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hello! I want to know more about MCA."
        />
        <p className="text-xs text-muted-foreground">
          Pre-filled when a visitor opens the chat. Not applied to group-invite
          links.
        </p>
      </div>

      {/* Position + size */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Button position</Label>
          <Select
            value={position}
            onValueChange={(v) => setPosition(v as Position)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-right">Bottom Right (Default)</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Button size</Label>
          <Select value={size} onValueChange={(v) => setSize(v as Size)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Animation */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium text-foreground">Show animation</p>
          <p className="text-xs text-muted-foreground">
            Gentle floating motion (respects reduced-motion settings).
          </p>
        </div>
        <Switch checked={animation} onCheckedChange={setAnimation} />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}
