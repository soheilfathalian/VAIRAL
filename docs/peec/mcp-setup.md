# Connecting the Peec MCP

The Peec MCP server lets AI assistants (Claude Code, Cursor, Windsurf, VS Code with Copilot) call Peec's data layer directly through tool use.

## Server details

| | |
|---|---|
| URL | `https://api.peec.ai/mcp` |
| Transport | Streamable HTTP |
| Auth | OAuth 2.0 (browser consent flow) |
| Prerequisites | Active Peec account with at least one project |

## Claude Code

```sh
claude mcp add peec-ai --transport http https://api.peec.ai/mcp
```

> The official docs say `--transport streamable-http` but the CLI flag is just `http` — it uses the streamable-HTTP transport under the hood.

After running the command, the server registers but stays unauthenticated. To authenticate:

```
/mcp
```

…in Claude Code. Find `peec-ai` in the panel, hit **Authenticate**. A browser tab opens to Peec's consent screen. Approve, the tab closes, and the status flips to `✓ Connected`. From that point all 27 tools are callable in this session.

## Cursor / Windsurf / VS Code

The Peec MCP works with any MCP-compatible client. The setup pattern is identical:

1. Configure the client with the server URL and `streamable-http` transport
2. Trigger the OAuth flow on first tool use
3. Approve in browser

Refer to your client's MCP integration docs for the exact JSON config snippet.

## API key vs OAuth

The MCP server **only accepts OAuth**. API keys (the `skc-` ones from the Peec dashboard) won't work against `https://api.peec.ai/mcp`. They're rejected with `invalid_token`.

If you need key-based auth (CI, backend, automation), use the [REST API](./rest-api.md) directly. Same data, just different surface.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Tools don't show up after adding the server | Restart Claude Code; the tool list is fetched on session start |
| OAuth tab opens but never returns | Clear cookies for `api.peec.ai`, re-authenticate |
| Tools return "no projects found" | Verify your Peec account has at least one active project |
| Persistent auth failures | Email support@peec.ai |

## Why use MCP instead of REST

- **No key management** — OAuth handles credentials
- **Native slash-command workflows** — see [mcp-prompts.md](./mcp-prompts.md)
- **Confirmation prompts on writes** — destructive ops (`delete_*`) require explicit OK
- **Conversational** — you can ask "what's our biggest competitor gap this week?" and the model picks the right tool

For a hackathon demo, MCP is the right surface. For a production backend, REST is.
