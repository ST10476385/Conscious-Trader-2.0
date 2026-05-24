import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { khanyisa } from "@/api/khanyisaClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Webhook, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ALL_EVENTS = [
  { id: "signal.created", label: "Signal Created", desc: "A new trade signal is generated" },
  { id: "signal.approved", label: "Signal Approved", desc: "A signal is approved for execution" },
  { id: "signal.rejected", label: "Signal Rejected", desc: "A signal is manually rejected" },
  { id: "trade.opened", label: "Trade Opened", desc: "A new trade position is opened" },
  { id: "trade.closed", label: "Trade Closed", desc: "A trade position is closed" },
  { id: "risk.limit_breached", label: "Risk Limit Breached", desc: "A risk threshold is exceeded" },
];

const EMPTY_FORM = { name: "", url: "", secret: "", events: [] };

function StatusBadge({ status }) {
  if (!status) return null;
  const config = {
    success: { icon: CheckCircle2, label: "Success", cls: "text-profit" },
    failed: { icon: XCircle, label: "Failed", cls: "text-loss" },
    pending: { icon: Clock, label: "Pending", cls: "text-warn" },
  }[status];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={cn("flex items-center gap-1 text-[10px] font-medium", config.cls)}>
      <Icon className="w-3 h-3" /> {config.label}
    </span>
  );
}

function WebhookForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [showSecret, setShowSecret] = useState(false);

  const toggleEvent = (eventId) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(eventId) ? f.events.filter((e) => e !== eventId) : [...f.events, eventId],
    }));
  };

  const valid = form.name.trim() && form.url.trim() && form.events.length > 0;

  return (
    <div className="space-y-4 pt-3 border-t border-border mt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Slack Alerts"
            className="bg-secondary border-border h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Endpoint URL</Label>
          <Input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://your-server.com/webhook"
            className="bg-secondary border-border h-8 text-sm font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Secret (optional — for HMAC signature)</Label>
        <div className="relative">
          <Input
            type={showSecret ? "text" : "password"}
            value={form.secret}
            onChange={(e) => setForm({ ...form, secret: e.target.value })}
            placeholder="whsec_..."
            className="bg-secondary border-border h-8 text-sm font-mono pr-9"
          />
          <button
            type="button"
            onClick={() => setShowSecret((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Subscribe to Events</Label>
        <div className="grid grid-cols-2 gap-2">
          {ALL_EVENTS.map((ev) => {
            const active = form.events.includes(ev.id);
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => toggleEvent(ev.id)}
                className={cn(
                  "text-left p-2.5 rounded-lg border transition-all",
                  active ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"
                )}
              >
                <p className="text-xs font-medium text-foreground">{ev.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{ev.desc}</p>
              </button>
            );
          })}
        </div>
        {form.events.length === 0 && (
          <p className="text-[10px] text-loss">Select at least one event.</p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!valid || saving} onClick={() => onSave(form)}>
          {saving ? "Saving..." : "Save Webhook"}
        </Button>
      </div>
    </div>
  );
}

function WebhookRow({ webhook, onDelete, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => khanyisa.entities.Webhook.update(webhook.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      setEditing(false);
      toast.success("Webhook updated");
    },
  });

  return (
    <div className={cn("border rounded-lg transition-all", webhook.enabled ? "border-border" : "border-border/40 opacity-60")}>
      <div className="flex items-center gap-3 p-3">
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Webhook className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">{webhook.name}</p>
            <StatusBadge status={webhook.last_status} />
          </div>
          <p className="text-[11px] text-muted-foreground font-mono truncate">{webhook.url}</p>
          <div className="flex gap-1 flex-wrap mt-1">
            {(webhook.events || []).map((e) => (
              <Badge key={e} variant="outline" className="text-[9px] px-1.5 py-0 border-primary/20 text-primary/70">{e}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Switch
            checked={webhook.enabled !== false}
            onCheckedChange={(v) => onToggle(webhook, v)}
            className="scale-90"
          />
          <button onClick={() => { setExpanded((v) => !v); setEditing(false); }} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(webhook)} className="text-muted-foreground hover:text-loss transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && !editing && (
        <div className="px-3 pb-3">
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      )}

      {editing && (
        <div className="px-3 pb-3">
          <WebhookForm
            initial={{ name: webhook.name, url: webhook.url, secret: webhook.secret || "", events: webhook.events || [] }}
            onSave={(data) => updateMutation.mutate(data)}
            onCancel={() => setEditing(false)}
            saving={updateMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}

export default function WebhooksSection() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: webhooks = [] } = useQuery({
    queryKey: ["webhooks"],
    queryFn: () => khanyisa.entities.Webhook.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => khanyisa.entities.Webhook.create({ ...data, enabled: true, last_status: "pending" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      setShowAdd(false);
      toast.success("Webhook created");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (webhook) => khanyisa.entities.Webhook.delete(webhook.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook deleted");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ webhook, enabled }) => khanyisa.entities.Webhook.update(webhook.id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhooks"] }),
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Outgoing Webhooks</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Send real-time event data to external systems</p>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Webhook
        </Button>
      </div>

      {showAdd && (
        <WebhookForm
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setShowAdd(false)}
          saving={createMutation.isPending}
        />
      )}

      <div className="space-y-2 mt-3">
        {webhooks.length === 0 && !showAdd && (
          <div className="text-center py-8 text-muted-foreground">
            <Webhook className="w-7 h-7 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No webhooks configured</p>
            <p className="text-xs mt-0.5">Add one to push events to external services</p>
          </div>
        )}
        {webhooks.map((wh) => (
          <WebhookRow
            key={wh.id}
            webhook={wh}
            onDelete={(wh) => deleteMutation.mutate(wh)}
            onToggle={(wh, enabled) => toggleMutation.mutate({ webhook: wh, enabled })}
          />
        ))}
      </div>

      {webhooks.length > 0 && (
        <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground">
            <span className="text-foreground font-medium">Payload format:</span> Each webhook receives a JSON POST with{" "}
            <code className="font-mono text-primary">{"{ event, timestamp, data }"}</code> fields. Use the secret to verify requests via{" "}
            <code className="font-mono text-primary">X-Webhook-Signature</code> header.
          </p>
        </div>
      )}
    </div>
  );
}