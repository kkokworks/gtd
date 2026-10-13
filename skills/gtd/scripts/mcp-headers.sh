#!/bin/sh
# Claude Code 와 gtd 스크립트가 Mindwtr MCP 에 붙을 때 부르는 headersHelper 입니다. 토큰은 키체인에만 둡니다.
token=$(security find-generic-password -s mindwtr-mcp -a "$USER" -w) || exit 1
printf '{"Authorization":"Bearer %s"}\n' "$token"
