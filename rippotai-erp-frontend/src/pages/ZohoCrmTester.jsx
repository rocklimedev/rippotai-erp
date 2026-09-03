"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Code2,
  Database,
  FileJson,
  Globe,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings2,
  Trash2,
  Users,
  Building2,
  XCircle,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// -- environments --------------------------------------------------------
const ENVIRONMENTS = [
  {
    id: "local",
    label: "Local",
    apiBase: "http://localhost:5000/api/v1",
    callbackUrl: "http://localhost:5000/api/v1/zoho/oauth/callback",
  },
  {
    id: "prod",
    label: "Prod",
    apiBase: "https://erp-api.rippotaiarchitecture.com/api/v1",
    callbackUrl:
      "https://erp-api.rippotaiarchitecture.com/api/v1/auth/zoho/callback",
  },
];

// Bigin's module set differs from CRM: no Leads, "Companies" instead of
// Accounts, "Pipelines" instead of Deals, and no Quotes/Sales_Orders/
// Purchase_Orders/Invoices/Vendors/Campaigns.
const MODULES = [
  "Contacts",
  "Companies",
  "Pipelines",
  "Tasks",
  "Events",
  "Calls",
  "Products",
];

const DEFAULT_CREATE_DATA = {
  Contacts: {
    First_Name: "Test",
    Last_Name: "Contact",
    Email: "test@example.com",
    Phone: "9999999999",
  },

  Companies: {
    Company_Name: "Rocklime Test Company",
    Phone: "9999999999",
  },

  Pipelines: {
    Deal_Name: "Test Bigin Pipeline",
    Stage: "Qualification",
    Amount: 10000,
  },

  Tasks: {
    Subject: "Follow up call",
    Status: "Not Started",
  },

  Events: {
    Event_Title: "Intro call",
    Venue: "Zoom",
  },
};

function prettyJson(value) {
  if (value === undefined || value === null) return "";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Invalid JSON body.");
  }
}

function StatusBadge({ status }) {
  if (status === "success") {
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Success
      </Badge>
    );
  }

  if (status === "error") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3.5 w-3.5" />
        Error
      </Badge>
    );
  }

  if (status === "loading") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Running
      </Badge>
    );
  }

  return <Badge variant="outline">Ready</Badge>;
}

export default function ZohoBiginTestConsole() {
  const [envId, setEnvId] = useState(ENVIRONMENTS[0].id);
  const env = ENVIRONMENTS.find((e) => e.id === envId) ?? ENVIRONMENTS[0];
  const apiBaseUrl = env.apiBase;

  const [ownerKey, setOwnerKey] = useState("");

  const [module, setModule] = useState("Contacts");
  const [recordId, setRecordId] = useState("");

  const [createBody, setCreateBody] = useState(
    prettyJson(DEFAULT_CREATE_DATA.Contacts),
  );

  const [updateBody, setUpdateBody] = useState(
    prettyJson({
      Phone: "8888888888",
    }),
  );

  const [searchParams, setSearchParams] = useState({
    email: "",
    phone: "",
    word: "",
    criteria: "",
  });

  const [response, setResponse] = useState(null);
  const [responseMeta, setResponseMeta] = useState(null);

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const [activeOperation, setActiveOperation] = useState("records");

  const selectedDefaultData = useMemo(() => {
    return (
      DEFAULT_CREATE_DATA[module] || {
        First_Name: "Test",
        Last_Name: "Record",
      }
    );
  }, [module]);

  function changeModule(value) {
    setModule(value);

    const defaultData = DEFAULT_CREATE_DATA[value] || selectedDefaultData;

    setCreateBody(prettyJson(defaultData));
  }

  function changeEnv(value) {
    setEnvId(value);
    resetResponse();
  }

  async function request(path, options = {}) {
    if (!ownerKey.trim()) {
      throw new Error("Enter the Zoho ownerKey first.");
    }

    setStatus("loading");
    setError("");
    setResponse(null);
    setResponseMeta(null);

    const startedAt = performance.now();

    try {
      const res = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });

      const duration = Math.round(performance.now() - startedAt);

      const contentType = res.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data?.message ||
                data?.error ||
                data?.errors?.[0]?.message ||
                `Request failed with HTTP ${res.status}`,
        );
      }

      setStatus("success");

      setResponse(data);

      setResponseMeta({
        status: res.status,
        duration,
        endpoint: path,
      });

      return data;
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Something went wrong.");
      throw err;
    }
  }

  async function runGetRecords() {
    setActiveOperation("records");

    await request(
      `/zoho/bigin/${encodeURIComponent(ownerKey)}/modules/${encodeURIComponent(
        module,
      )}`,
    );
  }

  async function runGetRecord() {
    setActiveOperation("record");

    if (!recordId.trim()) {
      setError("Enter a record ID.");
      return;
    }

    await request(
      `/zoho/bigin/${encodeURIComponent(ownerKey)}/modules/${encodeURIComponent(
        module,
      )}/${encodeURIComponent(recordId)}`,
    );
  }

  async function runCreate() {
    setActiveOperation("create");

    try {
      const body = parseJson(createBody);

      await request(
        `/zoho/bigin/${encodeURIComponent(ownerKey)}/modules/${encodeURIComponent(
          module,
        )}`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    } catch (err) {
      if (err.message === "Invalid JSON body.") {
        setStatus("error");
        setError(err.message);
      }
    }
  }

  async function runUpdate() {
    setActiveOperation("update");

    if (!recordId.trim()) {
      setError("Enter a record ID.");
      return;
    }

    try {
      const body = parseJson(updateBody);

      await request(
        `/zoho/bigin/${encodeURIComponent(ownerKey)}/modules/${encodeURIComponent(
          module,
        )}/${encodeURIComponent(recordId)}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
      );
    } catch (err) {
      if (err.message === "Invalid JSON body.") {
        setStatus("error");
        setError(err.message);
      }
    }
  }

  async function runDelete() {
    setActiveOperation("delete");

    if (!recordId.trim()) {
      setError("Enter a record ID.");
      return;
    }

    const confirmed = window.confirm(`Delete ${module} record ${recordId}?`);

    if (!confirmed) return;

    await request(
      `/zoho/bigin/${encodeURIComponent(ownerKey)}/modules/${encodeURIComponent(
        module,
      )}/${encodeURIComponent(recordId)}`,
      {
        method: "DELETE",
      },
    );
  }

  async function runSearch() {
    setActiveOperation("search");

    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value?.trim()) {
        params.set(key, value.trim());
      }
    });

    await request(
      `/zoho/bigin/${encodeURIComponent(ownerKey)}/modules/${encodeURIComponent(
        module,
      )}/search?${params.toString()}`,
    );
  }

  async function runModules() {
    setActiveOperation("modules");

    await request(
      `/zoho/bigin/${encodeURIComponent(ownerKey)}/settings/modules`,
    );
  }

  async function runFields() {
    setActiveOperation("fields");

    await request(
      `/zoho/bigin/${encodeURIComponent(ownerKey)}/settings/fields?module=${encodeURIComponent(
        module,
      )}`,
    );
  }

  async function runUsers() {
    setActiveOperation("users");

    await request(`/zoho/bigin/${encodeURIComponent(ownerKey)}/users`);
  }

  async function runOrg() {
    setActiveOperation("org");

    await request(`/zoho/bigin/${encodeURIComponent(ownerKey)}/org`);
  }

  async function copyResponse() {
    if (!response) return;

    await navigator.clipboard.writeText(prettyJson(response));
  }

  function resetResponse() {
    setResponse(null);
    setResponseMeta(null);
    setError("");
    setStatus("idle");
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted">
                <Globe className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Zoho Bigin Test Console
                </h1>

                <p className="text-sm text-muted-foreground">
                  Test your NestJS Zoho Bigin integration directly from the UI.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={status} />

            <Button variant="outline" size="sm" onClick={resetResponse}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {/* CONNECTION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Zoho Connection
            </CardTitle>

            <CardDescription>
              Enter the ownerKey used by your backend to locate the Zoho OAuth
              token.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="space-y-2">
                <Label>Owner Key</Label>

                <Input
                  value={ownerKey}
                  onChange={(e) => setOwnerKey(e.target.value)}
                  placeholder="e.g. rocklime"
                />
              </div>

              <div className="space-y-2">
                <Label>Environment</Label>

                <Select value={envId} onValueChange={changeEnv}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2 truncate">
                      <Server className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>

                  <SelectContent>
                    {ENVIRONMENTS.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3">
              <Badge variant="outline" className="h-8 px-3 font-mono text-xs">
                API: {apiBaseUrl}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* MAIN */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* LEFT */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Bigin Records
                </CardTitle>

                <CardDescription>
                  Test CRUD operations against any Zoho Bigin module.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Module</Label>

                    <Select value={module} onValueChange={changeModule}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {MODULES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Record ID</Label>

                    <Input
                      value={recordId}
                      onChange={(e) => setRecordId(e.target.value)}
                      placeholder="Zoho record ID"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <Button
                    onClick={runGetRecords}
                    disabled={status === "loading"}
                    variant="outline"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    List
                  </Button>

                  <Button
                    onClick={runGetRecord}
                    disabled={status === "loading"}
                    variant="outline"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Get
                  </Button>

                  <Button onClick={runCreate} disabled={status === "loading"}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </Button>

                  <Button
                    onClick={runUpdate}
                    disabled={status === "loading"}
                    variant="secondary"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update
                  </Button>

                  <Button
                    onClick={runDelete}
                    disabled={status === "loading"}
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CREATE / UPDATE */}
            <Card>
              <CardHeader>
                <CardTitle>Request Body</CardTitle>

                <CardDescription>
                  JSON sent directly to your NestJS Bigin endpoint.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="create">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Create</TabsTrigger>

                    <TabsTrigger value="update">Update</TabsTrigger>
                  </TabsList>

                  <TabsContent value="create" className="mt-4">
                    <Textarea
                      value={createBody}
                      onChange={(e) => setCreateBody(e.target.value)}
                      className="min-h-[260px] font-mono text-xs"
                      spellCheck={false}
                    />

                    <div className="mt-3 flex justify-end">
                      <Button
                        onClick={runCreate}
                        disabled={status === "loading"}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Create {module}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="update" className="mt-4">
                    <Textarea
                      value={updateBody}
                      onChange={(e) => setUpdateBody(e.target.value)}
                      className="min-h-[260px] font-mono text-xs"
                      spellCheck={false}
                    />

                    <div className="mt-3 flex justify-end">
                      <Button
                        onClick={runUpdate}
                        disabled={status === "loading"}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Update {module}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* SEARCH */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Records
                </CardTitle>

                <CardDescription>
                  Test the Zoho Bigin search endpoint.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Email</Label>

                    <Input
                      value={searchParams.email}
                      onChange={(e) =>
                        setSearchParams((p) => ({
                          ...p,
                          email: e.target.value,
                        }))
                      }
                      placeholder="test@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>

                    <Input
                      value={searchParams.phone}
                      onChange={(e) =>
                        setSearchParams((p) => ({
                          ...p,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="9999999999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Word</Label>

                    <Input
                      value={searchParams.word}
                      onChange={(e) =>
                        setSearchParams((p) => ({
                          ...p,
                          word: e.target.value,
                        }))
                      }
                      placeholder="Rocklime"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Criteria</Label>

                    <Input
                      value={searchParams.criteria}
                      onChange={(e) =>
                        setSearchParams((p) => ({
                          ...p,
                          criteria: e.target.value,
                        }))
                      }
                      placeholder="(Email:equals:test@example.com)"
                    />
                  </div>
                </div>

                <Button onClick={runSearch} disabled={status === "loading"}>
                  <Search className="mr-2 h-4 w-4" />
                  Search {module}
                </Button>
              </CardContent>
            </Card>

            {/* ADMIN / METADATA */}
            <Card>
              <CardHeader>
                <CardTitle>Bigin Metadata & Admin</CardTitle>

                <CardDescription>
                  Verify that the OAuth token has access to Bigin settings,
                  users and organization information.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={runModules}
                    disabled={status === "loading"}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Get Modules
                  </Button>

                  <Button
                    variant="outline"
                    onClick={runFields}
                    disabled={status === "loading"}
                  >
                    <Code2 className="mr-2 h-4 w-4" />
                    Get Fields
                  </Button>

                  <Button
                    variant="outline"
                    onClick={runUsers}
                    disabled={status === "loading"}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Get Users
                  </Button>

                  <Button
                    variant="outline"
                    onClick={runOrg}
                    disabled={status === "loading"}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Get Organization
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* RESPONSE */}
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileJson className="h-5 w-5" />
                      API Response
                    </CardTitle>

                    <CardDescription>
                      Raw response returned by your NestJS backend.
                    </CardDescription>
                  </div>

                  {response && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copyResponse}
                      title="Copy response"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />

                    <AlertTitle>Request Failed</AlertTitle>

                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {responseMeta && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="outline">HTTP {responseMeta.status}</Badge>

                    <Badge variant="outline">{responseMeta.duration} ms</Badge>

                    <Badge variant="secondary" className="font-mono">
                      {activeOperation}
                    </Badge>
                  </div>
                )}

                {!response && !error && status !== "loading" && (
                  <div className="flex min-h-[650px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Activity className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <h3 className="font-medium">No API response yet</h3>

                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Select a module and run any operation from the left panel.
                    </p>
                  </div>
                )}

                {status === "loading" && (
                  <div className="flex min-h-[650px] flex-col items-center justify-center rounded-lg border border-dashed">
                    <Loader2 className="mb-4 h-8 w-8 animate-spin" />

                    <p className="font-medium">Calling Zoho Bigin...</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Operation: {activeOperation}
                    </p>
                  </div>
                )}

                {response && status !== "loading" && (
                  <ScrollArea className="h-[650px] rounded-lg border">
                    <pre className="p-4 font-mono text-xs leading-6">
                      {prettyJson(response)}
                    </pre>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
