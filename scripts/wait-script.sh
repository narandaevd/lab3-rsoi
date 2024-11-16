#!/usr/bin/env bash

IFS="," read -ra PORTS <<<"$WAIT_PORTS"
path=$(dirname "$0")
ssh_host=${1:-${SSH_HOST}}

PIDs=()
for port in "${PORTS[@]}"; do
  "$path"/wait-for.sh -t 120 "http://$ssh_host:$port/manage/health" -- echo "Host $ssh_host:$port is active" &
  PIDs+=($!)
done

for pid in "${PIDs[@]}"; do
  if ! wait "${pid}"; then
    exit 1
  fi
done
